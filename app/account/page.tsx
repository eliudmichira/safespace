"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  LogOut,
  KeyRound,
  Ghost,
} from "lucide-react"

const ROLE_LABEL: Record<string, string> = {
  survivor: "Survivor",
  campus_security: "Campus Security",
  juja_nps: "Juja NPS",
  gwo_admin: "GWO Admin",
}

export default function AccountPage() {
  const router = useRouter()
  const { user, role, loading, logout } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-sm mx-auto card-embossed p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        </main>
      </div>
    )
  }

  const isAnonymous = user.isAnonymous
  const roleLabel = role ? ROLE_LABEL[role] || role : "Unknown"

  const handleLogout = async () => {
    try {
      await logout()
      toast({ title: "Signed out" })
      router.push("/")
    } catch (err: any) {
      toast({
        title: "Sign-out failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto space-y-6">
          <div className="card-embossed p-8 space-y-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-16 w-16 pill lifted-primary flex items-center justify-center">
                {isAnonymous ? (
                  <Ghost className="h-7 w-7 text-primary-foreground" />
                ) : (
                  <UserIcon className="h-7 w-7 text-primary-foreground" />
                )}
              </div>
              <h1 className="text-2xl font-black tracking-tight">Your Account</h1>
              <p className="text-sm text-muted-foreground">
                {isAnonymous
                  ? "You're using an anonymous session"
                  : "Manage your SafeSpace account"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 pill recessed">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Email
                  </p>
                  <p className="text-sm font-medium truncate">
                    {user.email || (isAnonymous ? "Anonymous" : "—")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 pill recessed">
                <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Role
                  </p>
                  <p className="text-sm font-medium">{roleLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 pill recessed">
                <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    User ID
                  </p>
                  <p className="text-xs font-mono truncate">{user.uid}</p>
                </div>
              </div>
            </div>

            {isAnonymous && (
              <Link
                href="/register"
                className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Want to save your data? Create a survivor account
              </Link>
            )}

            {(role === "campus_security" || role === "juja_nps") && (
              <Link
                href="/officer"
                className="block w-full text-center pill lifted-primary py-3 font-bold text-sm"
              >
                Open Officer Console
              </Link>
            )}
            {role === "gwo_admin" && (
              <Link
                href="/admin"
                className="block w-full text-center pill lifted-primary py-3 font-bold text-sm"
              >
                Open Admin Dashboard
              </Link>
            )}

            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full pill h-12 gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground/70 leading-relaxed px-4">
            SafeSpace keeps your information confidential. Reports and SOS triggers
            are stored securely and only shared with assigned officers.
          </p>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
