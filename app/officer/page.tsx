"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"
import { RoleGuard } from "@/components/role-guard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle,
  Phone,
  ExternalLink,
  FileText,
  Radio,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"

const AdminMap = dynamic(() => import("@/components/admin-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
      Loading map…
    </div>
  ),
})

interface SOS {
  id: string
  userId: string
  status: string
  lat: number | null
  lng: number | null
  time: Date
  resolvedAt: Date | null
}

interface Report {
  id: string
  type: string
  priority: "critical" | "high" | "medium"
  status: string
  date: Date
  anonymous: boolean
}

const ROLE_LABEL: Record<string, string> = {
  campus_security: "Campus Security",
  juja_nps: "Juja NPS",
  gwo_admin: "GWO Admin",
}

function formatTime(date: Date) {
  if (!date) return ""
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return date.toLocaleDateString()
}

function priorityFromIncident(incidentType: any): "critical" | "high" | "medium" {
  const types = Array.isArray(incidentType) ? incidentType.join(" ") : String(incidentType || "")
  if (/physical|sexual/i.test(types)) return "critical"
  if (/stalk/i.test(types)) return "high"
  return "medium"
}

export default function OfficerPage() {
  return (
    <RoleGuard allow={["campus_security", "juja_nps", "gwo_admin"]}>
      <OfficerDashboard />
    </RoleGuard>
  )
}

function OfficerDashboard() {
  const { user, role } = useAuth()
  const { toast } = useToast()
  const [activeSOS, setActiveSOS] = useState<SOS[]>([])
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    const sosQ = query(collection(db, "active_sos"), orderBy("timestamp", "desc"))
    const unsubSOS = onSnapshot(sosQ, (snap) => {
      const items: SOS[] = snap.docs.map((d) => {
        const data = d.data() as any
        return {
          id: d.id,
          userId: data.userId || "unknown",
          status: data.status || "active",
          lat: data.currentLocation?.lat ?? null,
          lng: data.currentLocation?.lng ?? null,
          time: data.timestamp?.toDate?.() || new Date(),
          resolvedAt: data.resolvedAt?.toDate?.() || null,
        }
      })
      setActiveSOS(items.filter((i) => i.status !== "resolved"))
    })

    const reportsQ = query(collection(db, "reports"), orderBy("timestamp", "desc"))
    const unsubReports = onSnapshot(reportsQ, (snap) => {
      const items: Report[] = snap.docs.map((d) => {
        const data = d.data() as any
        const firstType = Array.isArray(data.incidentType) ? data.incidentType[0] : data.incidentType
        return {
          id: d.id,
          type: firstType
            ? String(firstType).charAt(0).toUpperCase() + String(firstType).slice(1)
            : "Other",
          priority: priorityFromIncident(data.incidentType),
          status: data.status || "pending",
          date: data.timestamp?.toDate?.() || new Date(),
          anonymous: data.reportType === "anonymous",
        }
      })
      setReports(items.slice(0, 10))
    })

    return () => {
      unsubSOS()
      unsubReports()
    }
  }, [])

  const mapAlerts = useMemo(
    () =>
      activeSOS
        .filter((s) => s.lat !== null && s.lng !== null)
        .map((s) => ({
          id: s.id,
          lat: s.lat as number,
          lng: s.lng as number,
          userId: s.userId,
          time: s.time,
          status: s.status,
        })),
    [activeSOS],
  )

  const respond = async (sos: SOS) => {
    try {
      await updateDoc(doc(db, "active_sos", sos.id), {
        status: "responding",
        respondingOfficerId: user?.uid || null,
        respondingOfficerRole: role || null,
        respondedAt: serverTimestamp(),
      })
      toast({ title: "Marked as responding", description: `SOS ${sos.id.slice(0, 6)}` })
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err?.message || "Try again.",
        variant: "destructive",
      })
    }
  }

  const resolve = async (sos: SOS) => {
    try {
      await updateDoc(doc(db, "active_sos", sos.id), {
        status: "resolved",
        resolvedAt: serverTimestamp(),
        resolvedBy: user?.uid || null,
      })
      toast({ title: "Resolved", description: `SOS ${sos.id.slice(0, 6)}` })
    } catch (err: any) {
      toast({
        title: "Resolve failed",
        description: err?.message || "Try again.",
        variant: "destructive",
      })
    }
  }

  const critical = activeSOS.length
  const pendingReports = reports.filter((r) => r.status !== "resolved").length

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-warning" />
                <h1 className="text-3xl font-black tracking-tight">Officer Console</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Signed in as <span className="font-semibold">{ROLE_LABEL[role || ""] || role}</span>
              </p>
            </div>
            {critical > 0 && (
              <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-emergency/10 border border-emergency/30">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emergency opacity-75 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emergency" />
                </span>
                <span className="font-bold text-emergency text-sm">
                  {critical} active SOS — respond now
                </span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              icon={AlertTriangle}
              label="Active SOS"
              value={critical}
              tone={critical > 0 ? "emergency" : "muted"}
            />
            <StatCard
              icon={FileText}
              label="Open Reports"
              value={pendingReports}
              tone={pendingReports > 0 ? "warning" : "muted"}
            />
            <StatCard
              icon={Radio}
              label="Status"
              value={critical > 0 ? "ALERT" : "Standby"}
              tone={critical > 0 ? "emergency" : "safe"}
            />
          </div>

          {/* Active SOS list */}
          <section className="card-embossed p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-emergency" />
                Active SOS
              </h2>
              <span className="text-xs text-muted-foreground">Live · auto-refreshing</span>
            </div>

            {activeSOS.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No active SOS alerts. You're on standby.
              </div>
            ) : (
              <ul className="space-y-3">
                {activeSOS.map((sos) => (
                  <li
                    key={sos.id}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 pill recessed"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={cn(
                            "uppercase text-[10px]",
                            sos.status === "responding"
                              ? "bg-warning text-warning-foreground"
                              : "bg-emergency text-emergency-foreground",
                          )}
                        >
                          {sos.status}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          {sos.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(sos.time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {sos.lat !== null && sos.lng !== null ? (
                          <a
                            href={`https://www.google.com/maps?q=${sos.lat},${sos.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs hover:text-primary inline-flex items-center gap-1"
                          >
                            {sos.lat.toFixed(5)}, {sos.lng.toFixed(5)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Location unavailable</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {sos.status !== "responding" && (
                        <Button
                          size="sm"
                          onClick={() => respond(sos)}
                          className="pill lifted-primary gap-1.5"
                        >
                          <Radio className="h-3.5 w-3.5" />
                          Respond
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolve(sos)}
                        className="pill gap-1.5"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Resolve
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Map */}
          <section className="card-embossed p-2 overflow-hidden">
            <div className="h-[360px] w-full rounded-2xl overflow-hidden">
              <AdminMap alerts={mapAlerts} />
            </div>
          </section>

          {/* Recent reports */}
          <section className="card-embossed p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Reports
              </h2>
              <Link
                href="/report"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>

            {reports.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No reports yet.
              </div>
            ) : (
              <ul className="divide-y divide-border/50">
                {reports.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{r.type}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase",
                            r.priority === "critical" && "border-emergency text-emergency",
                            r.priority === "high" && "border-warning text-warning",
                            r.priority === "medium" && "border-primary text-primary",
                          )}
                        >
                          {r.priority}
                        </Badge>
                        {r.anonymous && (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            anon
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(r.date)} · {r.status}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {r.id.slice(0, 6)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Emergency contacts */}
          <section className="card-embossed p-6 space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
              Emergency Contacts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ContactRow label="Police Emergency" number="999" />
              <ContactRow label="GBV Hotline" number="1195" />
              <ContactRow label="Childline Kenya" number="116" />
            </div>
          </section>
        </div>
      </main>
      <Toaster />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any
  label: string
  value: number | string
  tone: "emergency" | "warning" | "safe" | "muted"
}) {
  const toneStyles = {
    emergency: "text-emergency bg-emergency/10",
    warning: "text-warning bg-warning/10",
    safe: "text-safe bg-safe/10",
    muted: "text-muted-foreground bg-muted/40",
  }
  return (
    <div className="card-embossed p-5 flex items-center gap-4">
      <div className={cn("h-11 w-11 pill flex items-center justify-center", toneStyles[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-black leading-none">{value}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
          {label}
        </p>
      </div>
    </div>
  )
}

function ContactRow({ label, number }: { label: string; number: string }) {
  return (
    <a
      href={`tel:${number}`}
      className="flex items-center gap-3 px-4 py-3 pill recessed hover:bg-muted/30 transition-colors"
    >
      <div className="h-9 w-9 pill bg-emergency/10 text-emergency flex items-center justify-center shrink-0">
        <Phone className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-sm">{number}</p>
      </div>
    </a>
  )
}
