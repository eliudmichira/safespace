/**
 * Haptic feedback helpers using the Web Vibration API.
 * Silently no-ops on unsupported devices (iOS Safari, desktop).
 *
 * Patterns are tuned for the SafeSpace use case where SOS interactions
 * should feel weighty and unmistakable.
 */

function vibrate(pattern: number | number[]) {
  if (typeof window === "undefined") return
  if (typeof navigator === "undefined") return
  if (typeof navigator.vibrate !== "function") return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}

export const haptics = {
  /** Light tap — generic button presses, toggles, taps. */
  light: () => vibrate(10),
  /** Medium tap — primary action confirmations. */
  medium: () => vibrate(20),
  /** Heavy tap — destructive or high-stakes actions. */
  heavy: () => vibrate(40),
  /** Tick — repeated cue while a long-press is charging. */
  tick: () => vibrate(8),
  /** Success — two short pulses. */
  success: () => vibrate([15, 60, 15]),
  /** Warning — three escalating pulses. */
  warning: () => vibrate([20, 80, 20, 80, 20]),
  /** Emergency — long, unmistakable burst for SOS trigger. */
  emergency: () => vibrate([60, 40, 60, 40, 120]),
  /** Stop any ongoing vibration. */
  stop: () => vibrate(0),
}
