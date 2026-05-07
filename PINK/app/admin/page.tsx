"use client"

import { useState } from "react"
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
  XCircle,
  Eye,
  Phone,
  Bell,
  TrendingUp,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data for demonstration
const activeAlerts = [
  {
    id: "SOS-001",
    type: "sos",
    location: "Hostel Block C",
    coordinates: { lat: -1.1004, lng: 37.0144 },
    time: new Date(Date.now() - 5 * 60000),
    status: "active",
    userId: "USR-2341",
  },
  {
    id: "SOS-002",
    type: "sos",
    location: "Library Parking",
    coordinates: { lat: -1.0999, lng: 37.0152 },
    time: new Date(Date.now() - 12 * 60000),
    status: "responding",
    userId: "USR-8762",
  },
]

const recentCases = [
  {
    id: "GBV-20260341",
    type: "Physical Violence",
    date: new Date(Date.now() - 2 * 24 * 60 * 60000),
    status: "investigating",
    priority: "high",
    anonymous: false,
  },
  {
    id: "GBV-20260340",
    type: "Verbal Abuse",
    date: new Date(Date.now() - 3 * 24 * 60 * 60000),
    status: "resolved",
    priority: "medium",
    anonymous: true,
  },
  {
    id: "GBV-20260339",
    type: "Stalking",
    date: new Date(Date.now() - 4 * 24 * 60 * 60000),
    status: "pending",
    priority: "high",
    anonymous: false,
  },
  {
    id: "GBV-20260338",
    type: "Cyber Harassment",
    date: new Date(Date.now() - 5 * 24 * 60 * 60000),
    status: "investigating",
    priority: "medium",
    anonymous: true,
  },
  {
    id: "GBV-20260337",
    type: "Sexual Violence",
    date: new Date(Date.now() - 6 * 24 * 60 * 60000),
    status: "resolved",
    priority: "critical",
    anonymous: false,
  },
]

const stats = {
  totalCases: 156,
  activeCases: 23,
  resolvedThisMonth: 18,
  averageResponseTime: "4.2 min",
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("security")

  const formatTime = (date: Date) => {
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
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                GBV Response System Control Center
              </p>
            </div>
            
            {activeAlerts.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emergency/10 border border-emergency/30 rounded-lg">
                <Bell className="h-5 w-5 text-emergency animate-pulse" />
                <span className="font-medium text-emergency">
                  {activeAlerts.length} Active SOS Alert{activeAlerts.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalCases}</p>
                    <p className="text-xs text-muted-foreground">Total Cases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10 text-warning">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.activeCases}</p>
                    <p className="text-xs text-muted-foreground">Active Cases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-safe/10 text-safe">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.resolvedThisMonth}</p>
                    <p className="text-xs text-muted-foreground">Resolved (Month)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.averageResponseTime}</p>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <Users className="h-4 w-4" />
                GBV Office
              </TabsTrigger>
            </TabsList>

            {/* Security Dashboard */}
            <TabsContent value="security" className="space-y-6 mt-6">
              {/* Active SOS Alerts */}
              <Card className={cn(
                activeAlerts.length > 0 && "border-emergency/50"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className={cn(
                        "h-5 w-5",
                        activeAlerts.length > 0 ? "text-emergency" : "text-muted-foreground"
                      )} />
                      Active SOS Alerts
                    </CardTitle>
                    {activeAlerts.length > 0 && (
                      <Badge variant="destructive" className="animate-pulse">
                        {activeAlerts.length} Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {activeAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-safe/50" />
                      <p>No active SOS alerts</p>
                      <p className="text-sm">All clear</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={cn(
                            "p-4 rounded-lg border-2",
                            alert.status === "active" 
                              ? "border-emergency bg-emergency/5" 
                              : "border-warning bg-warning/5"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getStatusColor(alert.status)}>
                                  {alert.status.toUpperCase()}
                                </Badge>
                                <span className="text-sm font-mono text-muted-foreground">
                                  {alert.id}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-foreground">{alert.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>{formatTime(alert.time)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <Button size="sm" className="gap-2">
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                              <Button size="sm" variant="outline" className="gap-2">
                                <Phone className="h-4 w-4" />
                                Call
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Map Placeholder */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Campus Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="font-medium">Interactive Map View</p>
                      <p className="text-sm">Shows active incidents and patrols</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GBV Admin Dashboard */}
            <TabsContent value="admin" className="space-y-6 mt-6">
              {/* Recent Cases */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Case Management
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </div>
                  <CardDescription>
                    Recent reports and their current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentCases.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            caseItem.status === "resolved" ? "bg-safe" :
                            caseItem.status === "investigating" ? "bg-primary" :
                            "bg-warning"
                          )} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-foreground">{caseItem.id}</span>
                              {caseItem.anonymous && (
                                <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{caseItem.type}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant="outline" 
                            className={cn("capitalize", getPriorityColor(caseItem.priority))}
                          >
                            {caseItem.priority}
                          </Badge>
                          <Badge className={getStatusColor(caseItem.status)}>
                            {caseItem.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Support Tracking */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Support Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Counseling Requested</span>
                        <span className="font-semibold text-foreground">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Legal Aid Requested</span>
                        <span className="font-semibold text-foreground">8</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Medical Support</span>
                        <span className="font-semibold text-foreground">5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Follow-ups Due</span>
                        <span className="font-semibold text-warning">7</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Upcoming Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm font-medium text-foreground">Counseling Session</p>
                        <p className="text-xs text-muted-foreground">Case GBV-20260341 - Today, 2:00 PM</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm font-medium text-foreground">Legal Consultation</p>
                        <p className="text-xs text-muted-foreground">Case GBV-20260339 - Tomorrow, 10:00 AM</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm font-medium text-foreground">Case Review Meeting</p>
                        <p className="text-xs text-muted-foreground">Weekly Review - Friday, 3:00 PM</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
