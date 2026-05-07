"use client"

import Link from "next/link"
import { MessageCircle, FileText, Phone, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const actions = [
  {
    href: "/chat",
    icon: MessageCircle,
    label: "Talk to AI Counselor",
    description: "24/7 trauma-informed support",
    color: "bg-primary/10 text-primary",
  },
  {
    href: "/report",
    icon: FileText,
    label: "File a Report",
    description: "Anonymous reporting available",
    color: "bg-accent/10 text-accent",
  },
  {
    href: "/tracking",
    icon: MapPin,
    label: "Share Location",
    description: "Let trusted contacts track you",
    color: "bg-warning/10 text-warning",
  },
  {
    href: "tel:999",
    icon: Phone,
    label: "Call Emergency",
    description: "Direct line to police",
    color: "bg-emergency/10 text-emergency",
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link key={action.href} href={action.href}>
            <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border">
              <CardContent className="flex flex-col items-center text-center p-4 md:p-6">
                <div className={`p-3 rounded-xl ${action.color} mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm md:text-base text-foreground mb-1">
                  {action.label}
                </h3>
                <p className="text-xs text-muted-foreground hidden md:block">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
