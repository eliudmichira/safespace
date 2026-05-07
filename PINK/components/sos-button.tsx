"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
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
      setIsHolding(true)
    }
  }, [isActive])

  const handleHoldEnd = useCallback(() => {
    setIsHolding(false)
    setHoldProgress(0)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isHolding && !isActive) {
      interval = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            setIsHolding(false)
            onTrigger()
            return 0
          }
          return prev + 5
        })
      }, 50)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isHolding, isActive, onTrigger])

  if (isActive) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {/* Pulsing ring animation for active SOS */}
          <div className="absolute inset-0 rounded-full bg-safe/20 animate-ping" />
          <div className="absolute -inset-4 rounded-full bg-safe/10 animate-pulse" />
          
          <button
            onClick={onStandDown}
            className={cn(
              "relative z-10 flex h-48 w-48 md:h-56 md:w-56 flex-col items-center justify-center rounded-full",
              "bg-safe text-safe-foreground shadow-2xl",
              "transition-all duration-300 hover:scale-105 active:scale-95",
              "focus:outline-none focus:ring-4 focus:ring-safe/50"
            )}
          >
            <CheckCircle className="h-16 w-16 md:h-20 md:w-20 mb-2" />
            <span className="text-2xl md:text-3xl font-bold">I AM SAFE</span>
            <span className="text-sm opacity-80 mt-1">Tap to stand down</span>
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-safe font-semibold text-lg">Help is on the way</p>
          <p className="text-muted-foreground text-sm">Authorities have been notified</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Progress ring */}
        {isHolding && (
          <svg 
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] -rotate-90"
          >
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-emergency/30"
            />
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${holdProgress * 3.14} 314`}
              className="text-emergency transition-all duration-100"
            />
          </svg>
        )}
        
        {/* Pulsing effect when holding */}
        {isHolding && (
          <div className="absolute inset-0 rounded-full bg-emergency/20 animate-pulse" />
        )}
        
        <button
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
          className={cn(
            "relative z-10 flex h-48 w-48 md:h-56 md:w-56 flex-col items-center justify-center rounded-full",
            "bg-emergency text-emergency-foreground shadow-2xl",
            "transition-all duration-300",
            isHolding ? "scale-95" : "hover:scale-105 active:scale-95",
            "focus:outline-none focus:ring-4 focus:ring-emergency/50"
          )}
        >
          <AlertTriangle className="h-16 w-16 md:h-20 md:w-20 mb-2" />
          <span className="text-2xl md:text-3xl font-bold">SOS</span>
          <span className="text-sm opacity-80 mt-1">
            {isHolding ? "Keep holding..." : "Hold to activate"}
          </span>
        </button>
      </div>
      
      {/* Silent mode toggle */}
      <button
        onClick={() => setSilentMode(!silentMode)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
          silentMode
            ? "bg-muted text-muted-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {silentMode ? (
          <>
            <VolumeX className="h-4 w-4" />
            Silent Mode On
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4" />
            Silent Mode Off
          </>
        )}
      </button>
      
      <p className="text-center text-muted-foreground text-sm max-w-xs">
        Hold the SOS button for 2 seconds to send an emergency alert to campus security and police
      </p>
    </div>
  )
}
