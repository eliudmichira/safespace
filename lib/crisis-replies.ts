/**
 * Rule-based crisis copy only — no model generation.
 * Plain text only (no markdown asterisks).
 */

import { CAMPUS_SECURITY_DISPLAY } from "@/lib/support-contacts"

const POLICE = "999 or 112"
const GBV = "0800 720 990"
const CAMPUS_SECURITY = CAMPUS_SECURITY_DISPLAY
const GWO = "Gender Welfare Office (GWO), Admin Block, Room 205"

function imminentDanger(blob: string, latest: string): boolean {
  const b = blob.toLowerCase()
  const l = latest.toLowerCase()

  if (
    /\b(kill (myself|me)|suicide|end (it|my life)|don'?t want to live|hurt myself|cut myself)\b/i.test(
      b,
    )
  ) {
    return true
  }
  if (/\b(can'?t breathe|bleeding heavily|unconscious)\b/i.test(b)) {
    return true
  }
  if (/\b(breaking in|broke in|outside (my )?door|following me|chasing me)\b/i.test(b)) {
    return true
  }
  if (/\bthreatening me\b/i.test(b)) {
    return true
  }
  if (/\b(weapon|knife|gun|panga|machete)\b/i.test(b)) {
    return true
  }
  if (/\b(he|she|they)\s+is\s+(here|nearby|outside|inside)\b/i.test(b)) {
    return true
  }
  if (
    /\b(rape|raping|assaulting|attacking)\b/i.test(b) &&
    /\b(now|right now|currently|still|don'?t stop|won'?t stop)\b/i.test(b)
  ) {
    return true
  }
  if (
    /\b(yes|yeah|yep)\b/i.test(l) &&
    /\bnearby\b/i.test(l) &&
    /\b(unsafe|not safe|scared|rape|raped|hurt|danger|him|her|them)\b/i.test(b)
  ) {
    return true
  }
  return false
}

function sexualViolenceDisclosure(text: string): boolean {
  return /\b(rape|raped|gang\s*rape|sexually assault(ed)?|molest(ed)?|defiled)\b/i.test(text)
}

function generalSafetyConcernLatest(latest: string): boolean {
  return /\b(feel(ing)?\s+unsafe|not safe|afraid|scared|threatening me|being followed|stalked)\b/i.test(
    latest,
  )
}

const EMERGENCY_REPLY = `This sounds like an emergency.

If you can do it safely, call police now: ${POLICE}. Use the SOS button on the home screen. Campus security: ${CAMPUS_SECURITY}. National GBV helpline: ${GBV}.

If you cannot speak safely: text or WhatsApp someone you trust with your location, move to a public place if you can, or lock yourself in a room.

You are not alone. When you are safe, you can use the Report section or visit ${GWO} — there is no rush while you are still at risk.`

const SA_DISCLOSURE_REPLY = `I'm really sorry you went through this. What happened is not your fault.

Safety first: If you are in danger right now, use SOS, call ${POLICE}, or campus security ${CAMPUS_SECURITY}.

Medical care: When you can, consider being seen as soon as possible (ideally within 72 hours) at a hospital for your health and, if you choose, documentation such as a P3 form at public facilities.

Reporting: You may report to police when you decide; you do not have to decide immediately. You can also speak in confidence with ${GWO}, or use the in-app Report flow.

Support lines: National GBV ${GBV} (24/7). Emotional support: Befrienders Kenya +254 722 178 177.

What feels most important to focus on next — staying safe tonight, hospital, or how reporting works?`

const GENERAL_SAFETY_REPLY = `Your safety matters.

If you are in immediate danger, use SOS, call police (${POLICE}), or campus security (${CAMPUS_SECURITY}). National GBV helpline: ${GBV}.

If nothing is happening right this second, you can plan next steps: stay with someone you trust, avoid being alone with the person worrying you, and keep the Tracking / location-sharing tools in mind if they help you feel safer.

You can document what happened in the Report section when you're ready, or visit ${GWO}.

What would help most right now — safety planning, or talking through options?`

/** Suicide / weapons / intruder / ongoing assault / proximity-after-distress — uses full recent-user context. */
export function getImminentDangerReply(
  latestUserMessage: string,
  recentUserMessagesConcat: string,
): string | null {
  const blob = recentUserMessagesConcat.trim()
  if (!blob && !latestUserMessage.trim()) return null
  if (!imminentDanger(blob, latestUserMessage)) return null
  return EMERGENCY_REPLY
}

/** One-shot structured blocks: only when the *current* message matches (not whole history). */
export function getStructuredCrisisReply(latestUserMessage: string): string | null {
  const t = latestUserMessage.trim()
  if (!t) return null
  if (sexualViolenceDisclosure(t)) return SA_DISCLOSURE_REPLY
  if (generalSafetyConcernLatest(t)) return GENERAL_SAFETY_REPLY
  return null
}

/** For AI failure fallback: imminent first, then structured on this turn only. */
export function getDeterministicCrisisReply(
  latestUserMessage: string,
  recentUserMessagesConcat: string,
): string | null {
  return (
    getImminentDangerReply(latestUserMessage, recentUserMessagesConcat) ??
    getStructuredCrisisReply(latestUserMessage)
  )
}
