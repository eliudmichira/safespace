"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Shield, LogIn, Ghost } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { loginWithEmail, loginWithGoogle, loginAnonymously } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setBusy(true)
    try {
      await loginWithEmail(email, password)
      toast({ title: "Signed in" })
      router.push("/")
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
      await loginWithGoogle()
      toast({ title: "Signed in with Google" })
      router.push("/")
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

  const anon = async () => {
    setBusy(true)
    try {
      await loginAnonymously()
      toast({ title: "Continuing anonymously" })
      router.push("/")
    } catch (err: any) {
      toast({
        title: "Anonymous sign-in failed",
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
        <div className="max-w-sm mx-auto card-embossed p-8 space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 pill lifted-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Sign In</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back to SafeSpace
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
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

          <GoogleSignInButton onClick={google} disabled={busy} />

          <Button
            type="button"
            onClick={anon}
            disabled={busy}
            variant="outline"
            className="w-full pill h-12 gap-2"
          >
            <Ghost className="h-4 w-4" />
            Continue Anonymously
          </Button>

          <div className="space-y-2 text-center">
            <Link
              href="/register"
              className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              New here? Create a survivor account
            </Link>
            <Link
              href="/officer-login"
              className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Officer or admin? Sign in here
            </Link>
          </div>

          <p className="text-[10px] text-center text-muted-foreground/70 leading-relaxed">
            You can also use the SOS button without signing in — emergency triggers work anonymously.
          </p>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
