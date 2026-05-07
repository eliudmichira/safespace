"use client"

import Link from "next/link"
import { MessageCircle, FileText, Phone, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

const actions = [
  {
    href: "/chat",
    icon: MessageCircle,
    label: "Talk to AI Counselor",
    subtitle: "24/7 Support",
    cardClass: "lifted",
    iconBg:   "bg-primary/20",
    iconColor: "text-primary",
    labelClass: "text-foreground",
    subClass:   "text-muted-foreground",
  },
  {
    href: "/report",
    icon: FileText,
    label: "File a Report",
    subtitle: "Anonymous",
    cardClass: "lifted",
    iconBg:   "bg-warning/20",
    iconColor: "text-warning",
    labelClass: "text-foreground",
    subClass:   "text-muted-foreground",
  },
  {
    href: "/tracking",
    icon: MapPin,
    label: "Share Location",
    subtitle: "Live Tracking",
    cardClass: "lifted",
    iconBg:   "bg-safe/20",
    iconColor: "text-safe",
    labelClass: "text-foreground",
    subClass:   "text-muted-foreground",
  },
  {
    href: "tel:999",
    icon: Phone,
    label: "Call Emergency",
    subtitle: "Direct Line",
    cardClass: "lifted-emergency",
    iconBg:   "bg-white/25",
    iconColor: "text-white",
    labelClass: "text-white",
    subClass:   "text-white/70",
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group block"
          >
            <div
              className={cn(
                "flex flex-col items-start p-5 rounded-[1.75rem] transition-all duration-200 h-full gap-3",
                action.cardClass
              )}
            >
              {/* Icon pill */}
              <div
                className={cn(
                  "h-11 w-11 pill flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-active:scale-95",
                  action.iconBg,
                  // Give the non-emergency icons a recessed look
                  action.cardClass === "lifted" ? "recessed" : ""
                )}
              >
                <Icon className={cn("h-5 w-5", action.iconColor)} />
              </div>

              {/* Text */}
              <div>
                <p className={cn("font-black text-sm leading-tight tracking-tight", action.labelClass)}>
                  {action.label}
                </p>
                <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-70", action.subClass)}>
                  {action.subtitle}
                </p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
