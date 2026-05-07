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
} from "lucide-react"
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
    toast({
      title: `Case ${c.id.slice(0, 8)}`,
      description: `${c.type} · ${c.priority.toUpperCase()} · ${c.status} · ${c.anonymous ? "Anonymous" : "Identified"} · ${new Date(c.date).toLocaleString()}`,
    })
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
          type: data.incidentType?.[0] ? data.incidentType[0].charAt(0).toUpperCase() + data.incidentType[0].slice(1) : "Other",
          date: data.timestamp?.toDate() || new Date(),
          status: data.status || "pending",
          priority,
          anonymous: data.reportType === "anonymous",
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
              {/* Chat Support Queue */}
              <div className="card-embossed p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-3">
                      <Phone className="h-6 w-6 text-primary" />
                      Chat Support Queue
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {supportRequests.length} user{supportRequests.length === 1 ? "" : "s"} waiting for a human counselor
                    </p>
                  </div>
                </div>

                {supportRequests.length === 0 ? (
                  <div className="recessed py-12 rounded-[2rem] text-center text-muted-foreground">
                    <p className="text-sm font-bold uppercase tracking-widest opacity-50">No pending chat requests</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {supportRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-6 lifted rounded-[2rem] bg-primary/5 border-primary/20"
                      >
                        <div className="flex items-center gap-6">
                          <div className="h-12 w-12 pill lifted-primary flex items-center justify-center shrink-0">
                            <Phone className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-muted-foreground">CHAT: {req.chatId.slice(0, 8)}</span>
                              <Badge className="pill bg-warning text-warning-foreground text-[10px] uppercase font-bold tracking-tighter animate-pulse">Waiting</Badge>
                            </div>
                            <h4 className="text-lg font-bold text-foreground">User {req.userId.slice(0, 8)} needs support</h4>
                            <p className="text-xs text-muted-foreground">Requested {formatTime(req.createdAt)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                          <Button
                            className="pill lifted-primary h-12 px-6 font-bold"
                            onClick={async () => {
                              // Join Chat logic
                              await updateDoc(doc(db, "chats", req.chatId), { 
                                status: "human",
                                respondingOfficerId: user?.uid,
                                respondingOfficerRole: role
                              });
                              await updateDoc(doc(db, "support_requests", req.id), { 
                                status: "joined",
                                joinedBy: user?.uid,
                                joinedAt: serverTimestamp()
                              });
                              router.push(`/chat?id=${req.chatId}`);
                            }}
                          >
                            Join Chat
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
    </div>
  )
}
