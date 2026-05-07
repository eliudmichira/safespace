"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { SOSButton } from "@/components/sos-button"
import { QuickActions } from "@/components/quick-actions"
import { StatusCard } from "@/components/status-card"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function HomePage() {
  const [sosActive, setSOSActive] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [sosStartTime, setSOSStartTime] = useState<Date | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Get user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.log("[v0] Geolocation error:", error.message)
        }
      )
    }
  }, [])

  const handleSOSTrigger = () => {
    setSOSActive(true)
    setSOSStartTime(new Date())
    
    toast({
      title: "SOS Alert Sent",
      description: "Campus security and emergency services have been notified. Help is on the way.",
      variant: "destructive",
    })

    // Simulate sending alerts
    console.log("[v0] SOS triggered with location:", location)
  }

  const handleStandDown = () => {
    setSOSActive(false)
    setSOSStartTime(null)
    
    toast({
      title: "SOS Deactivated",
      description: "Stand down confirmed. All parties have been notified that you are safe.",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {sosActive ? "Help is on the way" : "You are protected"}
            </h1>
            <p className="text-muted-foreground">
              {sosActive 
                ? "Stay calm. Authorities have been notified."
                : "JKUAT Campus Emergency Response System"
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
          <div className="flex justify-center py-8">
            <SOSButton
              onTrigger={handleSOSTrigger}
              onStandDown={handleStandDown}
              isActive={sosActive}
            />
          </div>

          {/* Quick Actions */}
          {!sosActive && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
              <QuickActions />
            </div>
          )}

          {/* Emergency Numbers */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-3">Emergency Contacts</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Campus Security</p>
                <a href="tel:0720000000" className="font-medium text-primary hover:underline">
                  0720 000 000
                </a>
              </div>
              <div>
                <p className="text-muted-foreground">Police Emergency</p>
                <a href="tel:999" className="font-medium text-primary hover:underline">
                  999 / 112
                </a>
              </div>
              <div>
                <p className="text-muted-foreground">GBV Hotline</p>
                <a href="tel:0800720990" className="font-medium text-primary hover:underline">
                  0800 720 990
                </a>
              </div>
              <div>
                <p className="text-muted-foreground">Health Center</p>
                <a href="tel:0720111111" className="font-medium text-primary hover:underline">
                  0720 111 111
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Toaster />
    </div>
  )
}
