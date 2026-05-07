"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface Location {
  lat: number
  lng: number
  timestamp: Date
}

interface LiveMapProps {
  currentLocation: Location | null
  trail: Location[]
  isTracking: boolean
}

export function LiveMap({ currentLocation, trail, isTracking }: LiveMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        const { width, height } = canvasRef.current.parentElement.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    // Draw grid - Subtle navy grid
    ctx.strokeStyle = "rgba(30, 58, 138, 0.08)"
    ctx.lineWidth = 1
    const gridSize = 40
    
    for (let x = 0; x < dimensions.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, dimensions.height)
      ctx.stroke()
    }
    
    for (let y = 0; y < dimensions.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(dimensions.width, y)
      ctx.stroke()
    }

    if (!currentLocation) return

    // Calculate center point
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2

    // Draw trail - Navy blue color
    if (trail.length > 1) {
      ctx.strokeStyle = "rgba(30, 58, 138, 0.6)"
      ctx.lineWidth = 3
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()

      trail.forEach((point, index) => {
        // Convert lat/lng difference to pixels (simplified)
        const dx = (point.lng - currentLocation.lng) * 10000
        const dy = (point.lat - currentLocation.lat) * -10000

        const x = centerX + dx
        const y = centerY + dy

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()
    }

    // Draw current location marker
    // Outer ring (pulsing effect simulated with gradient) - Pink accent
    if (isTracking) {
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30)
      gradient.addColorStop(0, "rgba(236, 72, 153, 0.4)")
      gradient.addColorStop(1, "rgba(236, 72, 153, 0)")
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, 30, 0, Math.PI * 2)
      ctx.fill()
    }

    // Inner marker - Pink when tracking, Navy when paused
    ctx.fillStyle = isTracking ? "#ec4899" : "#1e3a8a"
    ctx.beginPath()
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2)
    ctx.fill()

    // White center
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2)
    ctx.fill()

  }, [currentLocation, trail, isTracking, dimensions])

  return (
    <div className="relative w-full h-full bg-muted/30 rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
      
      {/* Map overlay info */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
        <div className={cn(
          "flex items-center gap-2",
          isTracking ? "text-safe" : "text-muted-foreground"
        )}>
          <div className={cn(
            "h-2 w-2 rounded-full",
            isTracking ? "bg-safe animate-pulse" : "bg-muted-foreground"
          )} />
          {isTracking ? "Live Tracking Active" : "Tracking Paused"}
        </div>
      </div>

      {currentLocation && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
          <p className="text-muted-foreground">Current Position</p>
          <p className="font-mono text-foreground">
            {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </p>
        </div>
      )}

      {!currentLocation && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Waiting for location...</p>
            <p className="text-xs mt-1">Please enable location services</p>
          </div>
        </div>
      )}
    </div>
  )
}
