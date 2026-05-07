"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Shield, MapPin, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusCardProps {
  isActive: boolean
  location?: { lat: number; lng: number } | null
  startTime?: Date | null
}

export function StatusCard({ isActive, location, startTime }: StatusCardProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className={cn(
      "card-embossed p-6 transition-all duration-500 overflow-hidden relative",
      isActive ? "border-safe/20" : ""
    )}>
      {/* Background Glow for active SOS */}
      {isActive && (
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-safe/10 blur-[100px] rounded-full" />
      )}

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-4 w-4 rounded-full shadow-[0_0_15px_rgba(var(--safe),0.5)] transition-all duration-500",
            isActive ? "bg-safe animate-pulse scale-110" : "bg-muted-foreground/30 shadow-none"
          )} />
          <span className={cn(
            "font-black text-sm tracking-[0.15em] uppercase",
            isActive ? "text-safe" : "text-muted-foreground/60"
          )}>
            {isActive ? "SOS ACTIVE" : "MONITORING"}
          </span>
        </div>
        <div className={cn(
          "p-3 pill transition-all duration-300",
          isActive ? "lifted-safe border-safe/30 text-white dark:text-safe-foreground" : "lifted text-muted-foreground"
        )}>
          <Shield className={cn(
            "h-6 w-6",
            isActive ? "animate-pulse" : ""
          )} />
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className={cn(
          "flex items-center gap-4 px-5 py-4 pill transition-all duration-300",
          isActive ? "bg-safe/10 border border-safe/20" : "recessed"
        )}>
          <div className={cn(
            "p-2 pill",
            isActive ? "lifted-safe text-white dark:text-safe-foreground" : "lifted text-primary"
          )}>
            <MapPin className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-1">
              Current Location
            </span>
            <span className={cn(
              "text-sm font-bold tracking-tight",
              isActive ? "text-safe" : "text-foreground"
            )}>
              {location 
                ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                : "Locating precision signal..."
              }
            </span>
          </div>
        </div>
        
        {isActive && startTime && (
          <div className="flex items-center gap-4 px-5 py-4 pill bg-safe/20 border border-safe/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-2 pill lifted-safe text-white dark:text-safe-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-1">
                Emergency Time
              </span>
              <span className={cn(
                "text-sm font-bold tracking-tight",
                isActive ? "text-safe" : "text-foreground"
              )}>
                Alert triggered at {formatTime(startTime)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
