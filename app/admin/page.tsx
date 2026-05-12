"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Shield,
  FileText,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  Eye,
  Phone,
  BookOpen,
  Image as ImageIcon,
  Download,
  ExternalLink,
  X,
  Calendar,
  EyeOff,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, serverTimestamp, where } from "firebase/firestore"

const AdminMap = dynamic(() => import("@/components/admin-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
      Loading map...
    </div>
  ),
})

function formatAvgMinutes(ms: number) {
  if (!isFinite(ms) || ms <= 0) return "—"
  const minutes = ms / 60000
  if (minutes < 1) return "<1 min"
  if (minutes < 60) return `${minutes.toFixed(1)} min`
  return `${(minutes / 60).toFixed(1)} hr`
}

const ADMIN_ROLES = ["gwo_admin"] as const

export default function AdminDashboard() {
  const router = useRouter()
  const { user, role, loading } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("security")
  const [selectedCase, setSelectedCase] = useState<any | null>(null)

  const handleExport = () => {
    const rows = [
      ["Case ID", "Type", "Priority", "Status", "Anonymous", "Date"],
      ...recentCases.map((c) => [
        c.id,
        c.type,
        c.priority,
        c.status,
        c.anonymous ? "yes" : "no",
        new Date(c.date).toISOString(),
      ]),
    ]
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `safespace-cases-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: "Export ready", description: `${recentCases.length} case(s) exported.` })
  }

  const showCase = (c: any) => {
    setSelectedCase(c)
  }

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (!role || !ADMIN_ROLES.includes(role as any)) {
      router.replace(
        role === "campus_security" || role === "juja_nps" ? "/officer" : "/login",
      )
    }
  }, [user, role, loading, router])
  const [activeAlerts, setActiveAlerts] = useState<any[]>([])
  const [recentCases, setRecentCases] = useState<any[]>([])
  const [supportRequests, setSupportRequests] = useState<any[]>([])
  const [allSOS, setAllSOS] = useState<any[]>([])
  const [officers, setOfficers] = useState<Record<string, { role: string; email?: string }>>({})
  // Combined stats derived from both Reports and SOS alerts
  const stats = useMemo(() => {
    const totalReports = recentCases.length
    const totalSOS = allSOS.length
    
    const activeReports = recentCases.filter(c => c.status !== "resolved").length
    const activeSOS = allSOS.filter(s => s.status !== "resolved").length
    
    const resolvedReports = recentCases.filter(c => c.status === "resolved").length
    const resolvedSOS = allSOS.filter(s => s.status === "resolved").length
    
    // Average response time for SOS alerts
    const resolvedSOSWithTime = allSOS.filter(a => a.resolvedAt && a.time)
    const avgMs = resolvedSOSWithTime.length
      ? resolvedSOSWithTime.reduce((sum, a) => sum + (a.resolvedAt!.getTime() - a.time.getTime()), 0) / resolvedSOSWithTime.length
      : 0

    return {
      totalCases: totalReports + totalSOS,
      activeCases: activeReports + activeSOS,
      resolved: resolvedReports + resolvedSOS,
      averageResponseTime: formatAvgMinutes(avgMs),
    }
  }, [recentCases, allSOS])

  useEffect(() => {
    // Subscribe to Active SOS Alerts
    const sosQuery = query(collection(db, "active_sos"), orderBy("timestamp", "desc"))
    const unsubscribeSOS = onSnapshot(sosQuery, (snapshot) => {
      const all = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          type: "sos",
          location: data.currentLocation
            ? `${data.currentLocation.lat.toFixed(4)}, ${data.currentLocation.lng.toFixed(4)}`
            : "Unknown Location",
          time: data.timestamp?.toDate() || new Date(),
          resolvedAt: data.resolvedAt?.toDate() || null,
          respondedAt: data.respondedAt?.toDate() || null,
          status: data.status || "active",
          userId: data.userId || "Unknown",
          respondingOfficerId: data.respondingOfficerId || null,
          respondingOfficerRole: data.respondingOfficerRole || null,
          resolvedBy: data.resolvedBy || null,
        }
      })
      setActiveAlerts(all.filter(a => a.status !== "resolved"))
      setAllSOS(all)
    })

    // Subscribe to Reports
    const reportsQuery = query(collection(db, "reports"), orderBy("timestamp", "desc"))
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      const cases = snapshot.docs.map(doc => {
        const data = doc.data()
        // Determine priority based on incident type
        let priority = "medium"
        if (data.incidentType?.includes("physical") || data.incidentType?.includes("sexual")) priority = "critical"
        else if (data.incidentType?.includes("stalking")) priority = "high"

        return {
          id: doc.id,
          ...data,
          type: data.incidentType?.[0] ? data.incidentType[0].charAt(0).toUpperCase() + data.incidentType[0].slice(1) : "Other",
          date: data.timestamp?.toDate() || new Date(),
          status: data.status || "pending",
          priority,
          anonymous: data.reportType === "anonymous",
          evidenceUrls: data.evidenceUrls || [],
        }
      })
      setRecentCases(cases)
    })

    // Subscribe to officer users for responder name resolution
    const officersQuery = query(
      collection(db, "users"),
      where("role", "in", ["campus_security", "juja_nps", "gwo_admin"]),
    )
    const unsubscribeOfficers = onSnapshot(officersQuery, (snap) => {
      const map: Record<string, { role: string; email?: string }> = {}
      snap.docs.forEach((d) => {
        const data = d.data() as any
        map[d.id] = { role: data.role, email: data.email }
      })
      setOfficers(map)
    })

    // Subscribe to Support Requests (Chat handoffs)
    const supportQuery = query(collection(db, "support_requests"), where("status", "==", "pending"))
    const unsubscribeSupport = onSnapshot(supportQuery, (snapshot) => {
      const reqs = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          chatId: data.chatId,
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          status: data.status,
        }
      })
      setSupportRequests(reqs)
    })

    return () => {
      unsubscribeSOS()
      unsubscribeReports()
      unsubscribeOfficers()
      unsubscribeSupport()
    }
  }, [])

  const mapAlerts = useMemo(() => {
    return activeAlerts
      .map((a) => {
        const m = /^([-\d.]+),\s*([-\d.]+)$/.exec(a.location)
        if (!m) return null
        return {
          id: a.id,
          lat: parseFloat(m[1]),
          lng: parseFloat(m[2]),
          userId: a.userId,
          time: a.time,
          status: a.status,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [activeAlerts])

  const formatTime = (date: Date) => {
    if (!date) return ""
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emergency text-emergency-foreground"
      case "responding":
        return "bg-warning text-warning-foreground"
      case "resolved":
        return "bg-safe text-safe-foreground"
      case "investigating":
        return "bg-primary text-primary-foreground"
      case "pending":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-emergency text-emergency"
      case "high":
        return "border-warning text-warning"
      case "medium":
        return "border-primary text-primary"
      default:
        return "border-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Gender Welfare Response System Control Center
              </p>
            </div>
            
            {activeAlerts.length > 0 && (
              <div className="flex items-center gap-3 px-6 py-3 lifted border-emergency/20 rounded-full bg-emergency/5">
                <div className="h-3 w-3 bg-emergency rounded-full animate-ping" />
                <span className="font-bold text-emergency">
                  {activeAlerts.length} Active SOS Alert{activeAlerts.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Cases", value: stats.totalCases, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
              { label: "Active Cases", value: stats.activeCases, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
              { label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "text-safe", bg: "bg-safe/10" },
              { label: "Avg Response", value: stats.averageResponseTime, icon: Clock, color: "text-accent", bg: "bg-accent/10" },
            ].map((stat, i) => (
              <div key={i} className="card-embossed p-6 flex flex-col items-center text-center">
                <div className={cn("h-12 w-12 pill lifted flex items-center justify-center mb-3", stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="recessed p-1 rounded-full h-14 max-w-md mx-auto flex">
              <TabsTrigger 
                value="security" 
                className="pill flex-1 h-full data-[state=active]:lifted data-[state=active]:text-primary gap-2 transition-all"
              >
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="admin" 
                className="pill flex-1 h-full data-[state=active]:lifted data-[state=active]:text-primary gap-2 transition-all relative"
              >
                <Users className="h-4 w-4" />
                Gender Welfare Office
                {supportRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-emergency text-white text-[10px] flex items-center justify-center rounded-full border-2 border-background animate-bounce font-black">
                    {supportRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Security Dashboard */}
            <TabsContent value="security" className="space-y-8">
              {/* Active SOS Alerts */}
              <div className="card-embossed p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <AlertTriangle className={cn(
                      "h-6 w-6",
                      activeAlerts.length > 0 ? "text-emergency" : "text-muted-foreground"
                    )} />
                    Active SOS Alerts
                  </h2>
                </div>

                {activeAlerts.length === 0 ? (
                  <div className="recessed py-12 rounded-[2rem] text-center text-muted-foreground">
                    <div className="h-16 w-16 pill lifted mx-auto mb-4 flex items-center justify-center text-safe/50">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-medium">All systems clear</p>
                    <p className="text-sm">No active alerts at this time</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-6 rounded-[2rem] transition-all",
                          alert.status === "active" 
                            ? "lifted border-emergency/30 bg-emergency/5" 
                            : "recessed opacity-80"
                        )}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex-1 flex gap-6 items-center">
                            <div className={cn(
                              "h-14 w-14 pill flex items-center justify-center shrink-0",
                              alert.status === "active" ? "lifted-primary bg-emergency" : "lifted"
                            )}>
                              <AlertTriangle className="h-7 w-7 text-white" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                  {alert.id}
                                </span>
                                <Badge className={cn("pill", getStatusColor(alert.status))}>
                                  {alert.status.toUpperCase()}
                                </Badge>
                              </div>
                              <h3 className="text-xl font-bold text-foreground">{alert.location}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" />
                                  {formatTime(alert.time)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Users className="h-4 w-4" />
                                  ID: {alert.userId}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button
                              className="pill lifted-primary h-12 px-6 gap-2 font-bold"
                              onClick={async () => {
                                await updateDoc(doc(db, "active_sos", alert.id), {
                                  status: "resolved",
                                  resolvedAt: serverTimestamp(),
                                  resolvedBy: "officer",
                                })
                                await addDoc(collection(db, "audit_logs"), {
                                  action: "sos.resolved",
                                  incidentId: alert.id,
                                  actorRole: "officer",
                                  timestamp: serverTimestamp(),
                                })
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Officer Response Log */}
              <div className="card-embossed p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    Officer Response Log
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {allSOS.filter((s) => s.respondingOfficerId).length} responded · {allSOS.length} total
                  </span>
                </div>

                {allSOS.length === 0 ? (
                  <div className="recessed py-12 rounded-[2rem] text-center text-muted-foreground text-sm">
                    No SOS incidents yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto recessed rounded-[2rem]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border/50">
                          <th className="text-left px-4 py-3 font-bold">Incident</th>
                          <th className="text-left px-4 py-3 font-bold">Triggered</th>
                          <th className="text-left px-4 py-3 font-bold">Status</th>
                          <th className="text-left px-4 py-3 font-bold">Responder</th>
                          <th className="text-left px-4 py-3 font-bold">Response Time</th>
                          <th className="text-left px-4 py-3 font-bold">Resolved</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSOS.slice(0, 25).map((s) => {
                          const officer = s.respondingOfficerId
                            ? officers[s.respondingOfficerId]
                            : null
                          const officerLabel = officer
                            ? officer.email ||
                              `${officer.role.replace("_", " ")} · ${s.respondingOfficerId.slice(0, 6)}`
                            : s.respondingOfficerId
                              ? `${s.respondingOfficerRole?.replace("_", " ") || "officer"} · ${s.respondingOfficerId.slice(0, 6)}`
                              : null
                          const responseMs =
                            s.respondedAt && s.time
                              ? s.respondedAt.getTime() - s.time.getTime()
                              : null
                          return (
                            <tr
                              key={s.id}
                              className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                            >
                              <td className="px-4 py-3 font-mono text-xs">{s.id.slice(0, 8)}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {formatTime(s.time)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={cn("pill text-[10px]", getStatusColor(s.status))}>
                                  {s.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {officerLabel ? (
                                  <div className="flex flex-col">
                                    <span className="text-xs font-semibold truncate max-w-[180px]">
                                      {officerLabel}
                                    </span>
                                    {officer && (
                                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                        {officer.role.replace("_", " ")}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    Unassigned
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs">
                                {responseMs !== null ? formatAvgMinutes(responseMs) : "—"}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {s.resolvedAt ? formatTime(s.resolvedAt) : "—"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Live Incident Map */}
              <div className="card-embossed p-8">
                <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
                  <MapPin className="h-6 w-6 text-primary" />
                  Campus Response Map
                </h2>
                <div className="h-[400px] recessed rounded-[2rem] overflow-hidden relative">
                  <AdminMap alerts={mapAlerts} />
                </div>
              </div>
            </TabsContent>

            {/* Gender Welfare Office Dashboard */}
            <TabsContent value="admin" className="space-y-8">

              <div className="card-embossed p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-3">
                      <FileText className="h-6 w-6 text-primary" />
                      Active Case Queue
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{stats.activeCases} open investigation{stats.activeCases === 1 ? "" : "s"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleExport}
                    disabled={recentCases.length === 0}
                    className="pill lifted h-10 px-6 font-bold"
                  >
                    Export Report
                  </Button>
                </div>

                {recentCases.length === 0 ? (
                  <div className="recessed py-12 rounded-[2rem] text-center text-muted-foreground">
                    <p className="text-sm">No reports submitted yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {recentCases.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-6 lifted rounded-[2rem] hover:scale-[1.01] transition-transform cursor-pointer group"
                      >
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "h-12 w-12 pill flex items-center justify-center shrink-0",
                            caseItem.status === "resolved" ? "recessed text-safe" : "lifted text-primary"
                          )}>
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-bold text-muted-foreground">{caseItem.id}</span>
                              {caseItem.anonymous && (
                                <Badge className="pill bg-muted/20 text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Anonymous</Badge>
                              )}
                            </div>
                            <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{caseItem.type}</h4>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 mt-4 md:mt-0">
                          <div className="hidden md:block text-right">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Priority</p>
                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", getPriorityColor(caseItem.priority))}>
                              {caseItem.priority.toUpperCase()}
                            </span>
                          </div>
                          <Badge className={cn("pill px-4 h-8", getStatusColor(caseItem.status))}>
                            {caseItem.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => showCase(caseItem)}
                            className="pill lifted h-10 w-10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Toaster />

      {/* Case Details Modal */}
      <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
        <DialogContent showCloseButton={false} className="max-w-[1600px] w-full h-[95vh] overflow-y-auto overflow-x-hidden card-embossed border-none p-0 custom-scrollbar">
          {selectedCase && (
            <div className="flex flex-col">
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20">
                <DialogHeader className="p-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn("h-3 w-3 pill animate-pulse", 
                      selectedCase.status === 'resolved' ? "bg-safe" : 
                      selectedCase.status === 'investigating' ? "bg-warning" : 
                      "bg-emergency"
                    )} />
                    <span className="font-mono text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                      Case #{selectedCase.id.slice(0, 8)}
                    </span>
                  </div>
                  <DialogTitle className="text-4xl font-black tracking-tighter leading-none">{selectedCase.type}</DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-3 bg-black/20 p-2 pill border border-white/5">
                  {["pending", "investigating", "resolved"].map((status) => (
                    <Button
                      key={status}
                      variant="ghost"
                      onClick={async (e) => {
                        e.stopPropagation()
                        await updateDoc(doc(db, "reports", selectedCase.id), { status })
                        setSelectedCase({ ...selectedCase, status })
                        toast({ title: "Status Updated", description: `Case marked as ${status}.` })
                      }}
                      className={cn(
                        "pill h-10 px-6 text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                        selectedCase.status === status 
                          ? "lifted-primary text-white scale-105" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {status}
                    </Button>
                  ))}
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedCase(null)}
                    className="h-10 w-10 pill lifted text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-8 space-y-10">

                <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-16">
                  {/* Main Details & Evidence */}
                  <div className="xl:col-span-1 space-y-16">
                    <section className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-primary flex items-center gap-3">
                          <ImageIcon className="h-8 w-8" />
                          Evidence Gallery
                        </h3>
                        {selectedCase.evidenceUrls && (
                          <Badge variant="outline" className="pill px-6 py-2 font-black text-xs uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
                            {selectedCase.evidenceUrls.length} File{selectedCase.evidenceUrls.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      
                      {selectedCase.evidenceUrls && selectedCase.evidenceUrls.length > 0 ? (
                        <div className="grid grid-cols-1 gap-10">
                          {selectedCase.evidenceUrls.map((url: string, idx: number) => {
                            const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || url.includes("cloudinary");
                            return (
                              <div key={idx} className="group relative">
                                <div className="recessed overflow-hidden rounded-[3rem] aspect-video flex items-center justify-center bg-black/40 hover:bg-black/20 transition-all duration-1000 border border-white/10 shadow-2xl">
                                  {isImage ? (
                                    <img 
                                      src={url} 
                                      alt={`Evidence ${idx + 1}`} 
                                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center gap-6 p-12 text-center">
                                      <div className="h-24 w-24 pill lifted flex items-center justify-center text-primary bg-background">
                                        <FileText className="h-12 w-12" />
                                      </div>
                                      <div>
                                        <p className="text-lg font-black uppercase tracking-widest text-foreground">Attached Document</p>
                                        <p className="text-xs text-muted-foreground mt-1">Click to view or download file</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-6 backdrop-blur-xl">
                                    <p className="text-white text-xl font-black uppercase tracking-[0.3em] translate-y-4 group-hover:translate-y-0 transition-transform duration-500">Evidence #{idx + 1}</p>
                                    <div className="flex items-center gap-6">
                                      <a 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="h-20 w-20 pill lifted-primary flex items-center justify-center text-white hover:scale-110 transition-all shadow-2xl"
                                      >
                                        <ExternalLink className="h-8 w-8" />
                                      </a>
                                      <a 
                                        href={url} 
                                        download 
                                        className="h-20 w-20 pill lifted bg-white flex items-center justify-center text-primary hover:scale-110 transition-all shadow-2xl"
                                      >
                                        <Download className="h-8 w-8" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="recessed py-24 rounded-[4rem] text-center space-y-6 border-2 border-dashed border-white/5 bg-black/10">
                          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/10" />
                          <div className="space-y-1">
                            <p className="text-xl font-black text-muted-foreground uppercase tracking-widest">No Evidence Attached</p>
                            <p className="text-xs text-muted-foreground/60 italic">This reporter did not provide any files.</p>
                          </div>
                        </div>
                      )}
                    </section>

                    <section className="space-y-6 pt-8">
                      <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary/60 flex items-center gap-3 ml-2">
                        <FileText className="h-4 w-4" />
                        Incident Narrative
                      </h3>
                      <div className="recessed p-10 rounded-[3rem] bg-black/10 border border-white/5">
                        <p className="text-xl leading-[1.6] font-medium text-foreground/90 whitespace-pre-wrap tracking-tight">
                          {selectedCase.description || "No description provided."}
                        </p>
                      </div>
                    </section>
                  </div>

                  {/* Sidebar Details */}
                  <div className="space-y-12">
                    <section className="space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary ml-2">Logistics</h3>
                      <div className="recessed p-8 rounded-[3rem] space-y-10 bg-black/5">
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Incident Date & Time</p>
                          <div className="flex items-start gap-5">
                            <div className="h-12 w-12 pill lifted flex items-center justify-center shrink-0 text-primary bg-background">
                              <Calendar className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-xl font-black tracking-tighter leading-none mb-1">
                                {selectedCase.incidentDate || "Unknown Date"}
                              </p>
                              <p className="text-sm font-bold text-muted-foreground">
                                {selectedCase.incidentTime || "Unknown Time"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Location / Venue</p>
                          <div className="flex items-start gap-5">
                            <div className="h-12 w-12 pill lifted flex items-center justify-center shrink-0 text-primary bg-background">
                              <MapPin className="h-6 w-6" />
                            </div>
                            <p className="text-xl font-black tracking-tighter leading-tight">
                              {selectedCase.incidentLocation || "Unknown Location"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary ml-2">Reporter Information</h3>
                      <div className="recessed p-8 rounded-[3rem] space-y-8 bg-black/5">
                        {selectedCase.anonymous ? (
                          <div className="flex flex-col items-center text-center p-4">
                            <div className="h-16 w-16 pill lifted flex items-center justify-center bg-muted/20 mb-4">
                              <EyeOff className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Anonymous Report</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">Identity protected by system</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 pill lifted-primary flex items-center justify-center text-white text-xl font-black">
                                {selectedCase.contactName?.charAt(0) || "U"}
                              </div>
                              <div>
                                <p className="text-lg font-black tracking-tight">{selectedCase.contactName || "Identified User"}</p>
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest">Reporter Profile</p>
                              </div>
                            </div>
                            <div className="space-y-3 pt-2">
                              {selectedCase.contactEmail && (
                                <a href={`mailto:${selectedCase.contactEmail}`} className="flex items-center gap-4 p-4 pill recessed bg-background/50 hover:bg-background transition-colors group">
                                  <div className="h-10 w-10 pill lifted flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <span className="text-sm font-bold truncate">{selectedCase.contactEmail}</span>
                                </a>
                              )}
                              {selectedCase.contactPhone && (
                                <a href={`tel:${selectedCase.contactPhone}`} className="flex items-center gap-4 p-4 pill recessed bg-background/50 hover:bg-background transition-colors group">
                                  <div className="h-10 w-10 pill lifted flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Phone className="h-5 w-5" />
                                  </div>
                                  <span className="text-sm font-bold">{selectedCase.contactPhone}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary ml-2">Involved Parties</h3>
                      <div className="recessed p-8 rounded-[3rem] space-y-8 bg-black/5">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Alleged Perpetrator</p>
                          <div className="p-4 pill recessed bg-background/50">
                            <p className="text-sm font-bold leading-relaxed">{selectedCase.perpetratorInfo || "Not specified"}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Potential Witnesses</p>
                          <div className="p-4 pill recessed bg-background/50">
                            <p className="text-sm font-bold leading-relaxed">{selectedCase.witnessInfo || "Not specified"}</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
