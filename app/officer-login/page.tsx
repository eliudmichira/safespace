"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ShieldCheck, LogIn } from "lucide-react"
import type { UserRole } from "@/contexts/AuthContext"

const OFFICER_ROLES: UserRole[] = [
  "campus_security",
  "juja_nps",
  "gwo_admin",
]

export default function OfficerLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  const finishOfficerLogin = async (uid: string) => {
    const snap = await getDoc(doc(db, "users", uid))
    const role = (snap.exists() ? (snap.data().role as UserRole) : null) || "survivor"

    if (!OFFICER_ROLES.includes(role)) {
      await signOut(auth)
      toast({
        title: "Not an officer account",
        description: "This portal is for provisioned officers and admins only.",
        variant: "destructive",
      })
      return
    }

    toast({ title: `Signed in as ${role.replace("_", " ")}` })
    router.push(role === "gwo_admin" ? "/admin" : "/officer")
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setBusy(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      await finishOfficerLogin(cred.user.uid)
    } catch (err: any) {
      toast({
        title: "Sign-in failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setBusy(true)
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      await finishOfficerLogin(cred.user.uid)
    } catch (err: any) {
      toast({
        title: "Google sign-in failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-sm mx-auto card-embossed p-8 space-y-6 border-2 border-warning/30">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 pill lifted-primary flex items-center justify-center bg-warning">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Officer Portal</h1>
            <p className="text-sm text-muted-foreground">
              Campus Security · Juja NPS · GWO Admin
            </p>
            <span className="text-[10px] uppercase tracking-widest text-warning font-bold pill recessed px-3 py-1">
              Restricted Access
            </span>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Officer email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 pill recessed bg-transparent text-foreground focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pill recessed bg-transparent text-foreground focus:outline-none"
            />
            <Button
              type="submit"
              disabled={busy}
              className="w-full pill lifted-primary h-12 gap-2"
            >
              <LogIn className="h-4 w-4" />
              {busy ? "..." : "Sign In"}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <GoogleSignInButton
            onClick={google}
            disabled={busy}
            label="Officer Google sign-in"
          />

          <Link
            href="/login"
            className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Not an officer? Survivor sign-in
          </Link>

          <p className="text-[10px] text-center text-muted-foreground/70 leading-relaxed">
            Officer accounts are provisioned by GWO administrators. Contact your
            administrator if you need access.
          </p>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
