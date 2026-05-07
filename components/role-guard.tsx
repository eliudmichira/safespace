"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type UserRole } from "@/contexts/AuthContext"
import { Navigation } from "@/components/navigation"

interface Props {
  allow: UserRole[]
  children: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({ allow, children, redirectTo = "/login" }: Props) {
  const router = useRouter()
  const { user, role, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (!role || !allow.includes(role)) {
      const target =
        role === "campus_security" || role === "juja_nps"
          ? "/officer"
          : role === "gwo_admin"
            ? "/admin"
            : redirectTo
      router.replace(target)
    }
  }, [user, role, loading, allow, redirectTo, router])

  if (loading || !user || !role || !allow.includes(role)) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-sm mx-auto card-embossed p-8 text-center text-sm text-muted-foreground">
            Checking access…
          </div>
        </main>
      </div>
    )
  }

  return <>{children}</>
}
