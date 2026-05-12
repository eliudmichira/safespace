/**
 * Single source of truth for helplines shown in crisis copy, AI prompt, and UI.
 * Update here only; import elsewhere to avoid drift / hallucinated numbers.
 */
export const CAMPUS_SECURITY_DISPLAY = "067-5870101"
/** E.164 for tel: links (Kenya 067 … → +254 67 …). */
export const CAMPUS_SECURITY_TEL = "+254675870101"

export const SUPPORT_CONTACTS_LINES = [
  "National GBV Hotline: 0800 720 990 (24/7)",
  "Police emergency: 999 or 112",
  `JKUAT Campus Security: ${CAMPUS_SECURITY_DISPLAY}`,
  "Gender Welfare Office (GWO): Admin Block, Room 205",
  "JKUAT Counseling Center: Health Center, 2nd Floor",
  "Befrienders Kenya (listening support): +254 722 178 177",
] as const

export const SUPPORT_CONTACTS_BLOCK = SUPPORT_CONTACTS_LINES.join("\n")
