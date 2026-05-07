"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { LiveMap } from "@/components/live-map"
import { Shield, Clock, MapPin, Users, Info } from "lucide-react"
import { db, auth } from "@/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

interface Location {
  lat: number
  lng: number
  timestamp: Date
}

export default function TrackingViewClient() {
  const params = useParams()
  const sessionId = params.id as string
  
  const [sessionData, setSessionData] = useState<any>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [trail, setTrail] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { loginAnonymously } = useAuth()

  useEffect(() => {
    if (!sessionId) return

    const init = async () => {
      if (!auth.currentUser) {
        try {
          await loginAnonymously()
        } catch (e) {
          console.error("Anon login failed", e)
        }
      }

      const sessionRef = doc(db, "tracking_sessions", sessionId)
      const unsub = onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSessionData(data)
          
          if (data.currentLocation) {
            const newLoc = {
              lat: data.currentLocation.lat,
              lng: data.currentLocation.lng,
              timestamp: data.updatedAt?.toDate() || new Date()
            }
            setCurrentLocation(newLoc)
            setTrail(prev => {
              const last = prev[prev.length - 1]
              if (!last || last.lat !== newLoc.lat || last.lng !== newLoc.lng) {
                return [...prev.slice(-100), newLoc]
              }
              return prev
            })
          }
          setLoading(false)
        } else {
          setError("Tracking session not found or has expired.")
          setLoading(false)
        }
      }, (err) => {
        console.error("View error:", err)
        setError("Unable to access tracking data. It may be private.")
        setLoading(false)
      })

      return unsub
    }

    let unsubFn: (() => void) | undefined
    init().then(fn => { unsubFn = fn })

    return () => { if (unsubFn) unsubFn() }
  }, [sessionId, loginAnonymously])

  const formatDuration = () => {
    if (!sessionData?.startedAt) return "0m"
    const start = sessionData.startedAt.toDate()
    const end = sessionData.stoppedAt?.toDate() || new Date()
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
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Viewing Live Location</h1>
              <p className="text-muted-foreground mt-1">
                You are viewing a real-time location shared via SafeSpace
              </p>
            </div>

            {sessionData?.status === 'active' && (
              <div className="flex items-center gap-2 px-4 py-2 pill lifted-primary animate-pulse">
                <span className="h-2 w-2 rounded-full bg-white" />
                <span className="text-sm font-bold">LIVE NOW</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="h-[400px] card-embossed flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-muted-foreground animate-pulse">Connecting to secure stream...</p>
            </div>
          ) : error ? (
            <div className="h-[400px] card-embossed flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="h-16 w-16 pill lifted flex items-center justify-center text-destructive">
                <Info className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold">{error}</h2>
              <p className="text-muted-foreground max-w-sm">
                The tracking session might have been stopped by the user or the link is incorrect.
              </p>
            </div>
          ) : (
            <>
              <div className="card-embossed p-2 overflow-hidden">
                <div className="h-[400px] md:h-[550px] rounded-[1.8rem] overflow-hidden bg-background/50">
                  <LiveMap
                    currentLocation={currentLocation}
                    trail={trail}
                    isTracking={sessionData?.status === 'active'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="recessed p-4 rounded-3xl flex flex-col items-center text-center">
                  <div className={cn(
                    "h-10 w-10 pill flex items-center justify-center mb-2",
                    sessionData?.status === 'active' ? "lifted-primary" : "lifted text-foreground/60"
                  )}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Status</p>
                  <p className={cn(
                    "text-lg font-bold",
                    sessionData?.status === 'active' ? "text-primary" : "text-muted-foreground"
                  )}>
                    {sessionData?.status === 'active' ? "Active" : "Stopped"}
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
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Last Seen</p>
                  <p className="text-sm font-bold text-foreground">
                    {currentLocation?.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="recessed p-4 rounded-3xl flex flex-col items-center text-center">
                  <div className="h-10 w-10 pill lifted flex items-center justify-center mb-2 text-primary font-bold">
                    <Users className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Encryption</p>
                  <p className="text-lg font-bold text-safe">Secure</p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
