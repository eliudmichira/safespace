"use client"

import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
  authorUid?: string | null
}

export function ChatMessage({ role, content, timestamp, authorUid }: ChatMessageProps) {
  const isAssistant = role === "assistant"
  const isHumanStaff = isAssistant && !!authorUid

  return (
    <div
      className={cn(
        "flex w-full mb-6",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "flex max-w-[85%] sm:max-w-[75%] gap-3 px-4 py-3 rounded-lg transition-all duration-300",
        isAssistant 
          ? "recessed flex-row items-start" 
          : "lifted-primary flex-row-reverse items-start"
      )}>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm",
            isAssistant 
              ? "bg-primary/20 text-primary" 
              : "bg-white/20 text-white"
          )}
        >
          {isAssistant ? (
            isHumanStaff ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>
        
        <div className="flex-1 space-y-1">
          <div className={cn(
            "flex items-center gap-2",
            isAssistant ? "justify-start" : "justify-end"
          )}>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              isAssistant ? "text-primary/60" : "text-white/60"
            )}>
              {isAssistant ? (isHumanStaff ? "Official Counselor" : "SafeSpace AI") : "You"}
            </span>
            {timestamp && (
              <span className={cn(
                "text-[10px] opacity-40",
                isAssistant ? "text-foreground" : "text-white"
              )}>
                {timestamp.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          <div className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap font-medium",
            isAssistant ? "text-foreground" : "text-white"
          )}>
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}
