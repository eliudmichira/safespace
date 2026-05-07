"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { haptics } from "@/lib/haptics"
import { AlertTriangle, Volume2, VolumeX, CheckCircle } from "lucide-react"

interface SOSButtonProps {
  onTrigger: () => void
  onStandDown: () => void
  isActive: boolean
}

export function SOSButton({ onTrigger, onStandDown, isActive }: SOSButtonProps) {
  const [isHolding, setIsHolding] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [silentMode, setSilentMode] = useState(false)

  const handleHoldStart = useCallback(() => {
    if (!isActive) {
      haptics.medium()
      setIsHolding(true)
    }
  }, [isActive])

  const handleHoldEnd = useCallback(() => {
    if (isHolding) haptics.light()
    setIsHolding(false)
    setHoldProgress(0)
  }, [isHolding])

  useEffect(() => {
    if (holdProgress >= 100) {
      haptics.emergency()
      setIsHolding(false)
      setHoldProgress(0)
      onTrigger()
    }
  }, [holdProgress, onTrigger])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isHolding && !isActive) {
      interval = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            return 100
          }
          const next = prev + 5
          if (next % 25 === 0 && next < 100) haptics.tick()
          return next
        })
      }, 50)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isHolding, isActive, onTrigger])

  const handleStandDown = useCallback(() => {
    haptics.success()
    onStandDown()
  }, [onStandDown])

  const handleSilentToggle = useCallback(() => {
    haptics.light()
    setSilentMode((s) => !s)
  }, [])

  if (isActive) {
    return (
      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          {/* Pulsing rings for extreme urgency */}
          <div className="absolute inset-0 rounded-full bg-safe/20 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-safe/10 animate-ping [animation-delay:0.5s]" />
          
          <button
            onClick={handleStandDown}
            className={cn(
              "relative z-10 flex h-56 w-56 flex-col items-center justify-center pill lifted-safe active:scale-90 transition-all duration-500",
              "ring-offset-background focus:outline-none focus:ring-4 focus:ring-safe/50"
            )}
          >
            <CheckCircle className="h-20 w-20 mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            <span className="text-3xl font-black tracking-tighter">I AM SAFE</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-2">End Emergency</span>
          </button>
        </div>
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 pill bg-safe/10 border border-safe/20">
            <span className="h-2 w-2 rounded-full bg-safe animate-pulse" />
            <p className="text-safe font-black text-sm uppercase tracking-widest">Help is En Route</p>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Campus security has been dispatched</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="relative group">
        {/* Progress ring background */}
        <div className="absolute -inset-6 rounded-full recessed opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
        
        {/* Progress ring */}
        {isHolding && (
          <svg 
            className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] -rotate-90 pointer-events-none z-0"
          >
            <circle
              cx="50%"
              cy="50%"
              r="47%"
              fill="none"
              stroke="url(#sos-gradient)"
              strokeWidth="8"
              className="transition-all duration-100"
              strokeDasharray={`${holdProgress * 3.14} 314`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="sos-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--emergency)" />
                <stop offset="100%" stopColor="#ff6b6b" />
              </linearGradient>
            </defs>
          </svg>
        )}
        
        <button
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
          className={cn(
            "relative z-10 flex h-56 w-56 flex-col items-center justify-center pill transition-all duration-500",
            isHolding ? "recessed scale-95" : "lifted-emergency hover:scale-105 active:scale-95",
            "focus:outline-none focus:ring-8 focus:ring-emergency/20"
          )}
        >
          <div className={cn(
            "p-5 pill transition-all duration-500 mb-2",
            isHolding ? "bg-emergency/20 scale-90" : "bg-white/20 shadow-sm"
          )}>
            <AlertTriangle className={cn(
              "h-16 w-16 transition-transform duration-300",
              isHolding ? "scale-90 opacity-80" : "scale-100 opacity-100"
            )} />
          </div>
          <span className="text-4xl font-black tracking-tighter">SOS</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-2">
            {isHolding ? "Keep holding..." : "Hold to activate"}
          </span>
        </button>
      </div>
      
      {/* Silent mode toggle */}
      <button
        onClick={handleSilentToggle}
        className={cn(
          "flex items-center gap-3 px-8 py-4 pill transition-all duration-500 hover:scale-105 active:scale-95",
          silentMode
            ? "recessed text-muted-foreground border-transparent"
            : "lifted text-foreground border border-white/5"
        )}
      >
        <div className={cn(
          "p-2 pill transition-colors duration-300",
          silentMode ? "lifted text-muted-foreground" : "lifted-primary"
        )}>
          {silentMode ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </div>
        <span className="font-black text-xs uppercase tracking-widest">
          {silentMode ? "Silent Mode On" : "Silent Mode Off"}
        </span>
      </button>
      
      <p className="text-center text-muted-foreground text-xs font-medium max-w-[200px] leading-relaxed opacity-60">
        HOLD BUTTON FOR 2 SECONDS TO TRIGGER CAMPUS ALERT
      </p>
    </div>
  )
}
