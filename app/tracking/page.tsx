"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { LiveMap } from "@/components/live-map"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Play,
  Pause,
  Share2,
  Users,
  Clock,
  MapPin,
  Shield,
  Trash2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { db, auth } from "@/lib/firebase"
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  deleteDoc as deleteSubDoc,
  getDoc,
} from "firebase/firestore"

interface Location {
  lat: number
  lng: number
  timestamp: Date
}

interface SharedContact {
  id: string
  name: string
  phone: string
}

export default function TrackingPage() {
  const [isTracking, setIsTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [trail, setTrail] = useState<Location[]>([])
  const [sharedWith, setSharedWith] = useState<SharedContact[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const { toast } = useToast()
  const { user, loginAnonymously } = useAuth()
  const sessionIdRef = useRef<string | null>(null)

  const ensureUser = useCallback(async () => {
    if (auth.currentUser) return auth.currentUser
    await loginAnonymously()
    return auth.currentUser
  }, [loginAnonymously])

  const updateLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLocation: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date(),
        }
        setCurrentLocation(newLocation)

        if (isTracking) {
          setTrail((prev) => [...prev.slice(-50), newLocation])
          if (sessionIdRef.current) {
            try {
              await updateDoc(doc(db, "tracking_sessions", sessionIdRef.current), {
                currentLocation: { lat: newLocation.lat, lng: newLocation.lng },
                updatedAt: serverTimestamp(),
              })
            } catch (e) {
              console.error("location update failed", e)
            }
          }
        }
      },
      (error) => console.warn("Location error:", error.message),
      { enableHighAccuracy: true }
    )
  }, [isTracking])

  useEffect(() => {
    updateLocation()
    const interval = setInterval(updateLocation, 5000)
    return () => clearInterval(interval)
  }, [updateLocation])

  // Subscribe to shared contacts for the current session
  useEffect(() => {
    if (!sessionIdRef.current) {
      setSharedWith([])
      return
    }
    const q = query(
      collection(db, "tracking_sessions", sessionIdRef.current, "shares"),
      orderBy("createdAt", "asc")
    )
    const unsub = onSnapshot(q, (snap) => {
      setSharedWith(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          phone: d.data().phone,
        }))
      )
    })
    return () => unsub()
  }, [isTracking])

  const handleStartTracking = async () => {
    try {
      const u = await ensureUser()
      if (!u) {
        toast({ title: "Sign-in failed", description: "Could not start tracking." })
        return
      }
      const sessionRef = doc(collection(db, "tracking_sessions"))
      const sessionData = {
        userId: u.uid,
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
        currentLocation: currentLocation
          ? { lat: currentLocation.lat, lng: currentLocation.lng }
          : null,
      }
      await setDoc(sessionRef, sessionData)
      sessionIdRef.current = sessionRef.id
      setIsTracking(true)
      setTrail([])
      toast({
        title: "Tracking Started",
        description: "Your live location is being shared with selected contacts.",
      })
    } catch (error: any) {
      console.error("Failed to start tracking:", error)
      toast({
        title: "Tracking Error",
        description: error.message || "Could not initialize tracking session.",
        variant: "destructive",
      })
    }
  }

  const handleShareLink = async () => {
    if (!sessionIdRef.current) return

    const shareUrl = `${window.location.origin}/tracking/view/${sessionIdRef.current}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Live Tracking - SafeSpace',
          text: 'I am sharing my live location with you via SafeSpace.',
          url: shareUrl,
        })
      } catch (err) {
        console.log('Share failed:', err)
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link Copied",
          description: "Tracking link copied to clipboard.",
        })
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Could not copy link to clipboard.",
          variant: "destructive",
        })
      }
    }
  }

  const handleStopTracking = async () => {
    if (sessionIdRef.current) {
      try {
        await updateDoc(doc(db, "tracking_sessions", sessionIdRef.current), {
          status: "stopped",
          stoppedAt: serverTimestamp(),
        })
      } catch (e) {
        console.error("stop failed", e)
      }
    }
    setIsTracking(false)
    sessionIdRef.current = null
    setSharedWith([])
    toast({ title: "Tracking Stopped" })
  }

  const handleAddShare = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      toast({ title: "Missing info", description: "Enter both name and phone." })
      return
    }
    if (!sessionIdRef.current) {
      toast({ title: "Start tracking first", description: "Begin a session before sharing." })
      return
    }
    try {
      await addDoc(
        collection(db, "tracking_sessions", sessionIdRef.current, "shares"),
        {
          name: contactName.trim(),
          phone: contactPhone.trim(),
          createdAt: serverTimestamp(),
        }
      )
      setContactName("")
      setContactPhone("")
      setShowShareModal(false)
      toast({ title: "Contact added", description: "Location is now shared with them." })
    } catch (error: any) {
      toast({
        title: "Share failed",
        description: "Firestore permission error or network issue.",
        variant: "destructive"
      })
    }
  }

  const handleRemoveShare = async (shareId: string) => {
    if (!sessionIdRef.current) return
    await deleteSubDoc(
      doc(db, "tracking_sessions", sessionIdRef.current, "shares", shareId)
    )
  }

  const handleClearTrail = () => {
    setTrail([])
    toast({ title: "Trail cleared" })
  }

  const formatDuration = () => {
    if (trail.length < 2) return "0m"
    const start = trail[0].timestamp
    const end = trail[trail.length - 1].timestamp
    const minutes = Math.floor((end.getTime() - start.getTime()) / 60000)
    return `${minutes}m`
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Live Tracking</h1>
              <p className="text-muted-foreground mt-1">
                Monitor your location in real-time and share with trusted contacts
              </p>
            </div>

            <div className="flex gap-3">
              {isTracking ? (
                <Button
                  variant="outline"
                  onClick={handleStopTracking}
                  className="pill lifted min-w-[120px] h-12 gap-2 text-foreground border-none"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={handleStartTracking}
                  className="pill lifted-primary min-w-[140px] h-12 gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Tracking
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowShareModal(true)}
                disabled={!isTracking}
                className="pill lifted h-12 w-12 p-0 text-foreground border-none disabled:opacity-50"
                title={isTracking ? "Share Location" : "Start tracking to share"}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="card-embossed p-2 overflow-hidden">
            <div className="h-[400px] md:h-[550px] rounded-[1.8rem] overflow-hidden bg-background/50">
              <LiveMap
                currentLocation={currentLocation}
                trail={trail}
                isTracking={isTracking}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="recessed p-4 rounded-3xl flex flex-col items-center text-center">
              <div className={cn(
                "h-10 w-10 pill flex items-center justify-center mb-2",
                isTracking ? "lifted-primary" : "lifted text-foreground/60"
              )}>
                <Shield className="h-5 w-5" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Status</p>
              <p className={cn(
                "text-lg font-bold",
                isTracking ? "text-primary" : "text-muted-foreground"
              )}>
                {isTracking ? "Active" : "Paused"}
              </p>
            </div>

            <div className="recessed p-4 rounded-3xl flex flex-col items-center text-center">
              <div className="h-10 w-10 pill lifted flex items-center justify-center mb-2 text-primary font-bold">
                <Clock className="h-5 w-5 stroke-[2.5]" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Duration</p>
              <p className="text-lg font-bold text-foreground">{formatDuration()}</p>
            </div>

            <div className="recessed p-4 rounded-3xl flex flex-col items-center text-center">
              <div className="h-10 w-10 pill lifted flex items-center justify-center mb-2 text-primary font-bold">
                <MapPin className="h-5 w-5 stroke-[2.5]" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Points</p>
              <p className="text-lg font-bold text-foreground">{trail.length}</p>
            </div>

            <div className="recessed p-4 rounded-3xl flex flex-col items-center text-center">
              <div className="h-10 w-10 pill lifted flex items-center justify-center mb-2 text-primary font-bold">
                <Users className="h-5 w-5 stroke-[2.5]" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Shared</p>
              <p className="text-lg font-bold text-foreground">{sharedWith.length}</p>
            </div>
          </div>

          {sharedWith.length > 0 && (
            <div className="card-embossed p-6">
              <h2 className="text-xl font-bold mb-4">Shared With</h2>
              <div className="grid gap-3">
                {sharedWith.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 lifted rounded-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 pill lifted-primary flex items-center justify-center text-sm font-bold">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveShare(contact.id)}
                      className="pill hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-4">
            {trail.length > 0 && (
              <Button
                variant="ghost"
                onClick={handleClearTrail}
                className="pill text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Trail History
              </Button>
            )}
          </div>
        </div>
      </main>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card-embossed p-8 max-w-md w-full space-y-5 relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 h-8 w-8 pill lifted flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-xl font-bold">Share Live Location</h2>
            <p className="text-sm text-muted-foreground">
              Add a trusted contact. They'll be associated with this active tracking session.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleShareLink} className="w-full pill lifted h-12 gap-2 text-foreground border-none">
                <Share2 className="h-4 w-4" />
                Share Link Directly
              </Button>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or add to contacts</span></div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Contact name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-3 pill recessed bg-transparent text-foreground focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-3 pill recessed bg-transparent text-foreground focus:outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <Button variant="ghost" onClick={() => setShowShareModal(false)} className="pill">
                  Cancel
                </Button>
                <Button onClick={handleAddShare} className="pill lifted-primary">
                  Add Contact
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  )
}
