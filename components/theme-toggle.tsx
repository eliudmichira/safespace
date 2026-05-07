"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { haptics } from "@/lib/haptics"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <button
      onClick={() => {
        haptics.light()
        setTheme(theme === "light" ? "dark" : "light")
      }}
      className="p-2.5 rounded-full lifted active:recessed transition-all flex items-center justify-center text-muted-foreground hover:text-foreground bg-card shadow-sm border border-border"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
