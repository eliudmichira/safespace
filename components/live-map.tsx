"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

// Import Leaflet CSS
import "leaflet/dist/leaflet.css"

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

// Dynamically import Leaflet components with SSR disabled
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
)

// Sub-component for updating view
const MapUpdater = dynamic(
  () => Promise.resolve(({ center }: { center: [number, number] }) => {
    const { useMap } = require("react-leaflet")
    const map = useMap()
    useEffect(() => {
      map.setView(center)
    }, [center, map])
    return null
  }),
  { ssr: false }
)

export function LiveMap({ currentLocation, trail, isTracking }: LiveMapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    setIsMounted(true)
    // Import Leaflet on client side only
    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default || (leafletModule as any).L || leafletModule;
      
      // Fix for default marker icons
      const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })
      
      if (L.Marker.prototype.options) {
        L.Marker.prototype.options.icon = DefaultIcon
      }
      
      setL(L)
    })
  }, [])

  if (!isMounted || !L) {
    return (
      <div className="relative w-full h-full bg-muted/30 rounded-xl flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Initializing Map...</p>
        </div>
      </div>
    )
  }

  if (!currentLocation) {
    return (
      <div className="relative w-full h-full bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-center p-6 space-y-4 max-w-xs">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <h3 className="text-lg font-bold text-foreground">Waiting for Location</h3>
          <p className="text-sm text-muted-foreground">
            Please enable location services and click "Start Tracking" to see your position on the map.
          </p>
        </div>
      </div>
    )
  }

  const center: [number, number] = [currentLocation.lat, currentLocation.lng]
  const polylinePositions = trail.map(p => [p.lat, p.lng] as [number, number])

  return (
    <div className="relative w-full h-full bg-muted/30 rounded-xl overflow-hidden group">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline 
          positions={polylinePositions} 
          pathOptions={{ color: '#ec4899', weight: 4, opacity: 0.6, lineJoin: 'round', lineCap: 'round' }} 
        />
        <Marker position={center} />
        <MapUpdater center={center} />
      </MapContainer>
      
      {/* Map overlay info */}
      <div className="absolute top-4 left-4 z-[400] bg-background/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-border/50 transition-all group-hover:translate-y-1">
        <div className={cn(
          "flex items-center gap-3",
          isTracking ? "text-primary" : "text-muted-foreground"
        )}>
          <div className={cn(
            "h-3 w-3 rounded-full",
            isTracking ? "bg-primary animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]" : "bg-muted-foreground"
          )} />
          <span className="text-sm font-bold tracking-tight">
            {isTracking ? "LIVE TRACKING" : "TRACKING PAUSED"}
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-[400] bg-background/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-border/50 transition-all group-hover:-translate-y-1">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Current Coordinates</p>
          <p className="font-mono text-sm font-bold text-foreground bg-primary/5 px-2 py-1 rounded-lg">
            {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </p>
        </div>
      </div>

      {/* Decorative pulse effect around map */}
      {isTracking && (
        <div className="absolute inset-0 pointer-events-none border-2 border-primary/20 rounded-xl animate-pulse z-10" />
      )}
    </div>
  )
}
