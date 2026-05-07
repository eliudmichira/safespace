"use client"

import { Navigation } from "@/components/navigation"
import {
  BookOpen,
  Phone,
  Scale,
  Heart,
  Building2,
  ExternalLink,
  GraduationCap,
} from "lucide-react"

const SECTIONS = [
  {
    title: "Emergency Hotlines (24/7)",
    icon: Phone,
    color: "text-emergency",
    items: [
      { label: "National GBV Hotline", value: "0800 720 990", href: "tel:0800720990" },
      { label: "Police Emergency", value: "999 / 112", href: "tel:999" },
      { label: "JKUAT Campus Security", value: "0720 000 000", href: "tel:0720000000" },
      { label: "Healthcare / Health Center", value: "0720 111 111", href: "tel:0720111111" },
    ],
  },
  {
    title: "Legal Resources",
    icon: Scale,
    color: "text-warning",
    items: [
      {
        label: "Kenya Sexual Offences Act, 2006",
        value: "Full text — Office of the Attorney General",
        href: "https://www.kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/SexualOffencesAct_No3of2006.pdf",
      },
      {
        label: "Protection Against Domestic Violence Act, 2015",
        value: "Kenya Law",
        href: "https://www.kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/ProtectionAgainstDomesticViolenceAct_2015.pdf",
      },
      {
        label: "FIDA Kenya — Free Legal Aid",
        value: "fida.or.ke",
        href: "https://www.fida.or.ke/",
      },
      {
        label: "COVAW — Coalition on Violence Against Women",
        value: "covaw.or.ke",
        href: "https://covaw.or.ke/",
      },
    ],
  },
  {
    title: "Counseling & Psychosocial Support",
    icon: Heart,
    color: "text-accent",
    items: [
      {
        label: "JKUAT Counseling Center",
        value: "Health Center, 2nd Floor — Mon–Fri 8am–5pm",
      },
      {
        label: "Befrienders Kenya (24/7 listening)",
        value: "+254 722 178 177",
        href: "tel:+254722178177",
      },
      {
        label: "Kenya Red Cross PSS Line",
        value: "1199",
        href: "tel:1199",
      },
    ],
  },
  {
    title: "On-Campus Offices",
    icon: Building2,
    color: "text-primary",
    items: [
      { label: "Gender Welfare Office (GWO)", value: "Admin Block, Room 205" },
      { label: "Legal Aid Clinic", value: "Wednesdays, 2:00–5:00 PM, Law Faculty" },
      { label: "Dean of Students", value: "Admin Block, Ground Floor" },
    ],
  },
  {
    title: "JKUAT Policies",
    icon: GraduationCap,
    color: "text-safe",
    items: [
      {
        label: "JKUAT Sexual Harassment Policy",
        value: "Full policy document",
        href: "https://www.jkuat.ac.ke/about/policies/",
      },
      {
        label: "JKUAT Gender Policy",
        value: "Office of the Vice-Chancellor",
        href: "https://www.jkuat.ac.ke/about/policies/",
      },
      {
        label: "Student Code of Conduct",
        value: "Office of the Dean of Students",
        href: "https://www.jkuat.ac.ke/students/",
      },
    ],
  },
]

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 pill recessed mb-2">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Knowledge Hub
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
              Help, Support & Your Rights
            </h1>
            <p className="text-muted-foreground text-base font-medium px-4">
              Hotlines, legal aid, counseling and JKUAT policies — all in one place.
            </p>
          </div>

          {SECTIONS.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.title} className="card-embossed p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 pill lifted flex items-center justify-center ${section.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-black text-base uppercase tracking-wider">
                    {section.title}
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {section.items.map((item) => {
                    const inner = (
                      <>
                        <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="text-sm font-bold text-foreground flex items-center gap-2">
                          {item.value}
                          {item.href?.startsWith("http") && (
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          )}
                        </span>
                      </>
                    )
                    return item.href ? (
                      <a
                        key={item.label}
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="lifted p-4 rounded-2xl flex flex-col gap-1 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div
                        key={item.label}
                        className="recessed p-4 rounded-2xl flex flex-col gap-1"
                      >
                        {inner}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <p className="text-xs text-center text-muted-foreground/70 px-6">
            If you are in immediate danger, use the SOS button on the home screen or call 999 / 112 right now.
          </p>
        </div>
      </main>
    </div>
  )
}
