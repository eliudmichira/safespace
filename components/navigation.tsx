"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Shield,
  MapPin,
  MessageCircle,
  FileText,
  BookOpen,
  LogOut,
} from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { haptics } from "@/lib/haptics"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

const navItems = [
  { href: "/",         label: "Home",      icon: Shield,          activeColor: "text-primary",   activeBg: "bg-primary/15"   },
  { href: "/tracking", label: "Tracking",  icon: MapPin,          activeColor: "text-safe",      activeBg: "bg-safe/15"      },
  { href: "/chat",     label: "Counsel",   icon: MessageCircle,   activeColor: "text-accent",    activeBg: "bg-accent/15"    },
  { href: "/report",   label: "Report",    icon: FileText,        activeColor: "text-warning",   activeBg: "bg-warning/15"   },
  { href: "/resources",label: "Help",      icon: BookOpen,        activeColor: "text-primary",   activeBg: "bg-primary/15"   },
]

export function Navigation() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    haptics.medium()
    await logout()
    router.push("/login")
  }

  return (
    <>
      {/* ── Desktop Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center pill lifted-primary shrink-0">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-black text-foreground tracking-tight">SafeSpace</span>
          </Link>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-1 p-1 recessed pill mr-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 pill transition-all duration-200 text-sm font-bold",
                      isActive
                        ? "lifted-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <ThemeToggle />
            {user && (
              <button 
                onClick={handleLogout}
                className="h-10 w-10 pill lifted flex items-center justify-center text-muted-foreground hover:text-emergency transition-colors"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Navigation ── */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          padding: "0 16px 24px",
          background: "linear-gradient(to top, var(--background) 50%, transparent 100%)",
        }}
      >
        {/* Pill container */}
        <div
          className="mx-auto max-w-[380px] flex items-center justify-between px-2 py-2"
          style={{
            borderRadius: 999,
            background: "var(--card)",
            boxShadow: "var(--lift-neutral-hi), var(--emboss-rim-soft)",
            border: "1px solid var(--border)",
            backdropFilter: "blur(20px)",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => haptics.light()}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-[64px] h-[54px] rounded-3xl transition-all duration-300",
                  isActive
                    ? item.activeColor
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-[48px] h-[28px] rounded-full transition-all duration-300",
                  isActive ? item.activeBg : "bg-transparent"
                )}>
                  <Icon
                    className={cn(
                      "transition-all duration-300",
                      isActive ? "h-[20px] w-[20px]" : "h-5 w-5"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold tracking-wide transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-70"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
