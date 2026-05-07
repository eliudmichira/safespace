"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix the default marker icons (Leaflet expects assets at known URLs).
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const EmergencyIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:32px;height:32px;border-radius:999px;
    background:rgba(220,38,38,0.95);
    border:3px solid white;
    box-shadow:0 0 0 4px rgba(220,38,38,0.35), 0 4px 12px rgba(0,0,0,0.3);
    animation:pulse-ring 1.5s ease-out infinite;
  "></div>
  <style>
    @keyframes pulse-ring {
      0% { box-shadow:0 0 0 0 rgba(220,38,38,0.6), 0 4px 12px rgba(0,0,0,0.3); }
      70% { box-shadow:0 0 0 18px rgba(220,38,38,0), 0 4px 12px rgba(0,0,0,0.3); }
      100% { box-shadow:0 0 0 0 rgba(220,38,38,0), 0 4px 12px rgba(0,0,0,0.3); }
    }
  </style>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

interface Alert {
  id: string
  lat: number
  lng: number
  userId: string
  time: Date
  status: string
}

function FitBounds({ alerts }: { alerts: Alert[] }) {
  const map = useMap()
  useEffect(() => {
    if (alerts.length === 0) return
    if (alerts.length === 1) {
      map.setView([alerts[0].lat, alerts[0].lng], 16)
      return
    }
    const bounds = L.latLngBounds(alerts.map((a) => [a.lat, a.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [alerts, map])
  return null
}

export default function AdminMap({ alerts }: { alerts: Alert[] }) {
  // JKUAT main campus default centre.
  const defaultCentre: [number, number] = [-1.0921, 37.0143]
  const centre: [number, number] = alerts[0]
    ? [alerts[0].lat, alerts[0].lng]
    : defaultCentre

  return (
    <MapContainer
      center={centre}
      zoom={alerts.length ? 16 : 14}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {alerts.map((a) => (
        <Marker key={a.id} position={[a.lat, a.lng]} icon={EmergencyIcon}>
          <Popup>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <strong>SOS — {a.status.toUpperCase()}</strong>
              <br />
              ID: {a.id.slice(0, 8)}
              <br />
              User: {a.userId.slice(0, 8)}
              <br />
              {a.time.toLocaleString()}
            </div>
          </Popup>
        </Marker>
      ))}
      <FitBounds alerts={alerts} />
    </MapContainer>
  )
}
