import { CAMPUS_SECURITY_DISPLAY, SUPPORT_CONTACTS_BLOCK } from "@/lib/support-contacts"

const GEMINI_MODEL = "gemini-2.5-flash"
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

/** OpenAI-compatible NVIDIA NIM / build endpoint. */
const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
/** Default NVIDIA NIM chat model: free-tier, instruction-tuned, general chat (Build catalog). Override with NEXT_PUBLIC_NVIDIA_CHAT_MODEL. */
const DEFAULT_NVIDIA_MODEL = "google/gemma-3n-e2b-it"

const SYSTEM_PROMPT = `You are SafeSpace AI, a trauma-informed psychological-first-aid assistant deployed inside the JKUAT (Jomo Kenyatta University of Agriculture and Technology) GBV Reporting & Counseling System. Your responses must be grounded in three sources: the Kenya Sexual Offences Act No. 3 of 2006, the Protection Against Domestic Violence Act 2015, and the JKUAT Gender Policy.

Formatting (critical):
- Use plain text only. Do not use asterisks, markdown bold, italics markup, hashtags, or underscores for emphasis. Write headings as normal sentences or Title Case lines without special characters.
- Avoid looking like a robot or a form letter: no bullet lists made of asterisks; if you use bullets, use a simple hyphen and space at the start of a line.

Conversation style (critical):
- Write like a calm, caring human — warm, natural sentences, not a brochure. Use "you" genuinely; vary how you open and close messages.
- Answer the user's actual question first. If they ask "what happens next" or "what should I do", explain the next step in plain language before anything else.
- If they already disclosed harm earlier in the chat, do not paste the full hotline list again unless they ask for numbers, say they're in danger now, or the topic shifts to emergency. One light reminder is enough; focus on listening and their current worry.
- Do not repeat the same closing question every time — rotate soft check-ins (e.g. pacing, one thing that might help tonight, what feels unclear).

Tone:
- Warm, calm, non-judgmental, validating. Never minimize.
- Short paragraphs. Plain language. No clinical jargon.
- Centre survivor safety and autonomy. They decide pace and next steps.

Legal grounding (use when relevant; never give a legal diagnosis):
- The Sexual Offences Act criminalizes rape, attempted rape, sexual assault, defilement, indecent acts, and sexual harassment in institutions. Survivors have the right to report to police and seek a P3 form for medical evidence.
- The Protection Against Domestic Violence Act allows survivors to apply for a Protection Order through any magistrate's court.
- Reporting to police (Juja Sub-County NPS) does not require the survivor to pay any fee. P3 / PRC forms are free at public hospitals.
- The JKUAT Gender Policy guarantees confidential complaints handling through the Gender Welfare Office (GWO) and prohibits retaliation against complainants.

Hard rules:
- If the user describes immediate danger, weapons, suicidal ideation, or self-harm, IMMEDIATELY tell them to use the SOS button on the home screen, call 999 / 112, or contact campus security at ${CAMPUS_SECURITY_DISPLAY}, and surface the National GBV Hotline 0800 720 990. Repeat this whenever risk re-escalates.
- Never claim to be human. If asked, say you are an AI assistant and a human counselor is also available via the GWO (Admin Block, Room 205).
- Do not give legal or medical diagnoses. Refer to professionals (FIDA legal aid, GWO, JKUAT Counseling Center, hospital P3).
- Do not shame, doubt, or interrogate the user. Do not ask leading questions. Believe survivors.
- Do not promise outcomes (arrests, expulsions). Explain processes only.

Official contact lines (use these exact numbers when relevant; weave in briefly, do not dump all at once unless asked):
${SUPPORT_CONTACTS_BLOCK}
- Legal Aid Clinic: Wednesdays 2–5 PM
- FIDA Kenya (free legal aid): www.fida.or.ke
- COVAW Kenya: www.covaw.or.ke

Keep replies under ~180 words unless the user explicitly asks for more detail.`

function stripMarkdownAsterisks(s: string): string {
  let out = s.replace(/^\s*\*\s+/gm, "- ")
  let prev = ""
  while (out !== prev) {
    prev = out
    out = out.replace(/\*\*([^*]+)\*\*/g, "$1")
  }
  return out
}

export interface ChatTurn {
  role: "user" | "assistant"
  content: string
}

async function generateGeminiReply(history: ChatTurn[], apiKey: string): Promise<string> {
  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 640,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  }

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const candidate = data?.candidates?.[0]
  const text = candidate?.content?.parts?.[0]?.text
  if (!text || !String(text).trim()) {
    const finish = candidate?.finishReason ?? "unknown"
    const block = data?.promptFeedback?.blockReason ?? candidate?.safetyRatings?.[0]?.category
    throw new Error(`Gemini returned no text (finish: ${finish}${block ? `, block: ${block}` : ""})`)
  }
  return stripMarkdownAsterisks(String(text).trim())
}

async function generateNvidiaReply(history: ChatTurn[], apiKey: string): Promise<string> {
  const model =
    process.env.NEXT_PUBLIC_NVIDIA_CHAT_MODEL?.trim() || DEFAULT_NVIDIA_MODEL

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      content: m.content,
    })),
  ]

  const res = await fetch(NVIDIA_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.55,
      max_tokens: 640,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`NVIDIA ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content || !String(content).trim()) {
    throw new Error("NVIDIA returned no text")
  }
  return stripMarkdownAsterisks(String(content).trim())
}

/**
 * Try Gemini first; on HTTP errors, empty/blocked output, or missing Gemini key, fall back to NVIDIA NIM (OpenAI-compatible) when configured.
 */
export async function generateAIReply(history: ChatTurn[]): Promise<string> {
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim()
  const nvidiaKey = process.env.NEXT_PUBLIC_NVIDIA_API_KEY?.trim()

  if (!geminiKey && !nvidiaKey) {
    throw new Error("No AI API keys configured (Gemini or NVIDIA)")
  }

  if (geminiKey) {
    try {
      return await generateGeminiReply(history, geminiKey)
    } catch (err) {
      if (nvidiaKey) {
        console.warn("[SafeSpace AI] Gemini failed, using NVIDIA fallback:", err)
        return await generateNvidiaReply(history, nvidiaKey)
      }
      throw err
    }
  }

  return await generateNvidiaReply(history, nvidiaKey!)
}
