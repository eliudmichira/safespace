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
    <Card className={cn(
      "border-2 transition-colors",
      isActive ? "border-safe bg-safe/5" : "border-border"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-3 w-3 rounded-full",
              isActive ? "bg-safe animate-pulse" : "bg-muted-foreground/30"
            )} />
            <span className={cn(
              "font-medium text-sm",
              isActive ? "text-safe" : "text-muted-foreground"
            )}>
              {isActive ? "SOS Active" : "Monitoring"}
            </span>
          </div>
          <Shield className={cn(
            "h-5 w-5",
            isActive ? "text-safe" : "text-muted-foreground/50"
          )} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {location 
                ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                : "Location unavailable"
              }
            </span>
          </div>
          {isActive && startTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Started at {formatTime(startTime)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
