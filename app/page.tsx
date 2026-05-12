"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { SOSButton } from "@/components/sos-button"
import { QuickActions } from "@/components/quick-actions"
import { StatusCard } from "@/components/status-card"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Phone } from "lucide-react"
import { CAMPUS_SECURITY_DISPLAY, CAMPUS_SECURITY_TEL } from "@/lib/support-contacts"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore"

export default function HomePage() {
  const router = useRouter()
  const [sosActive, setSOSActive] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [sosStartTime, setSOSStartTime] = useState<Date | null>(null)
  const [sosDocId, setSosDocId] = useState<string | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const { toast } = useToast()
  const { user, role, loading, loginAnonymously } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (role === "gwo_admin") router.replace("/admin")
    else if (role === "campus_security" || role === "juja_nps") router.replace("/officer")
  }, [user, role, loading, router])

  useEffect(() => {
    // Get initial user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.log("[SafeSpace] Geolocation error:", error.message)
        }
      )
    }
  }, [])

  // Cleanup location watcher on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  const handleSOSTrigger = async () => {
    try {
      // Ensure user is authenticated before triggering SOS
      if (!user) {
        await loginAnonymously()
      }

      setSOSActive(true)
      setSOSStartTime(new Date())

      // 1. Create a new SOS document in Firestore
      const docRef = await addDoc(collection(db, "active_sos"), {
        userId: user?.uid || "anonymous",
        status: "active",
        timestamp: serverTimestamp(),
        initialLocation: location,
        currentLocation: location,
      })
      setSosDocId(docRef.id)

      // 1b. Fan-out alert_log entries — one row per recipient (per spec 3.6.1).
      const recipients = ["campus_security", "juja_nps", "gwo_admin"] as const
      await Promise.all(
        recipients.map((recipient) =>
          addDoc(collection(db, "alert_logs"), {
            incidentId: docRef.id,
            recipient,
            channel: "dashboard_push",
            status: "delivered",
            createdAt: serverTimestamp(),
          })
        )
      )

      // 2. Start watching live location and update Firestore
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          async (position) => {
            const newLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            setLocation(newLoc)
            
            // Update Firestore with new location
            await updateDoc(doc(db, "active_sos", docRef.id), {
              currentLocation: newLoc,
              lastUpdatedAt: serverTimestamp()
            })
          },
          (error) => console.log("Watch position error:", error.message),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        )
        setWatchId(id)
      }

      toast({
        title: "SOS Alert Sent",
        description: "Campus security and emergency services have been notified. Live tracking started.",
        variant: "destructive",
      })
    } catch (error) {
      console.error("Error triggering SOS:", error)
      toast({
        title: "Error",
        description: "Could not trigger SOS. Please call hotlines directly.",
        variant: "destructive",
      })
      setSOSActive(false)
    }
  }

  const handleStandDown = async () => {
    setSOSActive(false)
    setSOSStartTime(null)
    
    // Stop watching location
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    // Resolve the SOS document — preserve as immutable record (WORM).
    if (sosDocId) {
      try {
        await updateDoc(doc(db, "active_sos", sosDocId), {
          status: "resolved",
          resolvedAt: serverTimestamp(),
          resolvedBy: "survivor_stand_down",
        })
        await addDoc(collection(db, "audit_logs"), {
          actorUid: user?.uid || "anonymous",
          actorRole: "survivor",
          action: "sos.stand_down",
          incidentId: sosDocId,
          timestamp: serverTimestamp(),
        })
        setSosDocId(null)
      } catch (error) {
        console.error("Error standing down:", error)
      }
    }
    
    toast({
      title: "SOS Deactivated",
      description: "Stand down confirmed. All parties have been notified that you are safe.",
    })
  }

  if (loading || !user || role === "gwo_admin" || role === "campus_security" || role === "juja_nps") {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-sm mx-auto card-embossed p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-6 pb-36">
        <div className="max-w-lg mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 pill recessed mb-4">
              <div className="h-2 w-2 rounded-full bg-safe animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">System Online</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter leading-none">
              {sosActive ? "Help is on the way" : "Stay Protected."}
            </h1>
            <p className="text-muted-foreground text-lg font-medium px-8">
              {sosActive 
                ? "Emergency responders have your live location."
                : "JKUAT Campus Emergency Response"
              }
            </p>
          </div>

          {/* Status Card */}
          <StatusCard 
            isActive={sosActive}
            location={location}
            startTime={sosStartTime}
          />

          {/* SOS Button */}
          <div className="flex justify-center py-4">
            <SOSButton
              onTrigger={handleSOSTrigger}
              onStandDown={handleStandDown}
              isActive={sosActive}
            />
          </div>

          {/* Quick Actions */}
          {!sosActive && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Services</h2>
                <div className="h-px flex-1 bg-muted/20 mx-4" />
              </div>
              <QuickActions />
            </div>
          )}

          {/* Emergency Numbers */}
          <div className="card-embossed p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 pill lifted text-primary">
                <Phone className="h-4 w-4" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Hotlines</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Campus Security", display: CAMPUS_SECURITY_DISPLAY, telHref: CAMPUS_SECURITY_TEL },
                { label: "Police Emergency", display: "999 / 112", telHref: "999" },
                { label: "GBV Hotline", display: "0800 720 990", telHref: "0800720990" },
                { label: "Health Center", display: "0720 111 111", telHref: "0720111111" },
              ].map((contact) => (
                <a
                  key={contact.label}
                  href={`tel:${contact.telHref}`}
                  className="lifted p-4 rounded-3xl flex flex-col group hover:scale-[1.02] active:scale-95 transition-all duration-300"
                >
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">
                    {contact.label}
                  </span>
                  <span className="text-xl font-black text-primary group-hover:text-primary/80 transition-colors">
                    {contact.display}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Toaster />
    </div>
  )
}
