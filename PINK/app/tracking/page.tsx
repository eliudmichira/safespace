"use client"

import { useState, useEffect, useCallback } from "react"
import { Navigation } from "@/components/navigation"
import { LiveMap } from "@/components/live-map"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Location {
  lat: number
  lng: number
  timestamp: Date
}

export default function TrackingPage() {
  const [isTracking, setIsTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [trail, setTrail] = useState<Location[]>([])
  const [sharedWith, setSharedWith] = useState<string[]>([])
  const { toast } = useToast()

  const updateLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date(),
          }
          setCurrentLocation(newLocation)
          
          if (isTracking) {
            setTrail((prev) => [...prev.slice(-50), newLocation]) // Keep last 50 points
          }
        },
        (error) => {
          console.log("[v0] Location error:", error.message)
        },
        { enableHighAccuracy: true }
      )
    }
  }, [isTracking])

  useEffect(() => {
    // Initial location fetch
    updateLocation()
    
    // Set up interval for continuous tracking
    const interval = setInterval(updateLocation, 5000)
    return () => clearInterval(interval)
  }, [updateLocation])

  const handleStartTracking = () => {
    setIsTracking(true)
    setTrail([])
    toast({
      title: "Tracking Started",
      description: "Your location is now being monitored.",
    })
  }

  const handleStopTracking = () => {
    setIsTracking(false)
    toast({
      title: "Tracking Stopped",
      description: "Location monitoring has been paused.",
    })
  }

  const handleShareLocation = () => {
    const newContact = `Contact ${sharedWith.length + 1}`
    setSharedWith((prev) => [...prev, newContact])
    toast({
      title: "Location Shared",
      description: `Your live location has been shared with ${newContact}.`,
    })
  }

  const handleClearTrail = () => {
    setTrail([])
    toast({
      title: "Trail Cleared",
      description: "Movement history has been cleared.",
    })
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
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Live Tracking</h1>
              <p className="text-muted-foreground">
                Monitor your location in real-time and share with trusted contacts
              </p>
            </div>
            
            <div className="flex gap-2">
              {isTracking ? (
                <Button 
                  onClick={handleStopTracking}
                  variant="outline"
                  className="gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button 
                  onClick={handleStartTracking}
                  className="gap-2 bg-safe text-safe-foreground hover:bg-safe/90"
                >
                  <Play className="h-4 w-4" />
                  Start Tracking
                </Button>
              )}
              <Button 
                onClick={handleShareLocation}
                variant="outline"
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Map */}
          <Card className="overflow-hidden">
            <div className="h-[400px] md:h-[500px]">
              <LiveMap
                currentLocation={currentLocation}
                trail={trail}
                isTracking={isTracking}
              />
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isTracking ? "bg-safe/10 text-safe" : "bg-muted text-muted-foreground"
                  )}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={cn(
                      "font-semibold",
                      isTracking ? "text-safe" : "text-muted-foreground"
                    )}>
                      {isTracking ? "Active" : "Paused"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold text-foreground">{formatDuration()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Points</p>
                    <p className="font-semibold text-foreground">{trail.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10 text-warning">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shared With</p>
                    <p className="font-semibold text-foreground">{sharedWith.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shared Contacts */}
          {sharedWith.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Shared With</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sharedWith.map((contact, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {contact.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{contact}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSharedWith((prev) => prev.filter((_, i) => i !== index))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clear Trail Button */}
          {trail.length > 0 && (
            <div className="flex justify-center">
              <Button 
                variant="ghost" 
                onClick={handleClearTrail}
                className="text-muted-foreground"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Trail History
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Toaster />
    </div>
  )
}
