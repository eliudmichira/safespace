"use client"

import { useState, useRef, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { ChatMessage } from "@/components/chat-message"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Send, 
  Phone, 
  FileText, 
  AlertTriangle,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { generateAIReply, type ChatTurn } from "@/lib/ai"
import { getDeterministicCrisisReply, getImminentDangerReply, getStructuredCrisisReply } from "@/lib/crisis-replies"
import { CAMPUS_SECURITY_DISPLAY } from "@/lib/support-contacts"
import { db, auth } from "@/lib/firebase"
import {
  collection,
  addDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  getDoc,
  limit,
} from "firebase/firestore"
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  authorUid?: string | null
}

type ChatStatus = "ai" | "awaiting_human" | "human"

const HUMAN_REQUEST_PATTERNS: RegExp[] = [
  /\b(speak|talk|chat)\s+(to|with)\s+(a\s+)?(human|person|counselor|counsellor|officer|agent|someone)\b/i,
  /\b(real|live|actual)\s+(human|person|counselor|counsellor)\b/i,
  /\bhuman\s+(help|support|counselor|counsellor)\b/i,
  /\bnot\s+(a|an)?\s*(bot|ai|robot)\b/i,
  /\b(i\s+)?(need|want)\s+to\s+talk\b/i,
  /\bcan\s+i\s+talk\b/i,
  /\bcan\s+we\s+talk\b/i,
  /\bjust\s+need\s+someone\s+to\s+talk\s+to\b/i,
  /\btalk\s+to\s+someone\b/i,
]

function wantsHuman(text: string): boolean {
  return HUMAN_REQUEST_PATTERNS.some((re) => re.test(text))
}

const HUMAN_SUPPORT_MESSAGE = `You've asked to speak with a person. This chat is mainly answered by the automated assistant — Gender Welfare staff are not able to read or join this thread in real time.

To reach someone directly: visit the Gender Welfare Office (Admin Block, Room 205) during working hours, or use the Report section and include contact details so the office can follow up with you outside this chat.

If you are in immediate danger: use the SOS button on the home screen, call 999 / 112, campus security ${CAMPUS_SECURITY_DISPLAY}, or the National GBV helpline 0800 720 990.`

const INITIAL_MESSAGE: Message = {
  id: "1",
  role: "assistant",
  content: `Hello, I'm your SafeSpace AI Counselor. I'm here to provide support, listen to your concerns, and help guide you through difficult situations.

Everything you share with me is confidential. I'm trained to provide trauma-informed support and can help you with:

- Emotional support and coping strategies
- Understanding your options for reporting
- Connecting you with professional resources
- Safety planning

How are you feeling today? Is there something specific you'd like to talk about?`,
  timestamp: new Date(),
}

const QUICK_RESPONSES = [
  "I need to talk to someone",
  "I want to report an incident",
  "I'm feeling unsafe",
  "I need information about resources",
]

const AI_ERROR_MESSAGE = `The assistant could not generate a reply just now (for example a network issue or a safety filter). Please try sending your message again in a moment.

If you need help right away: SOS on the home screen, police 999 / 112, campus security ${CAMPUS_SECURITY_DISPLAY}, National GBV helpline 0800 720 990.

Use the Resources and Report pages in this app for fixed contact details and reporting options.`

const HIGH_RISK_PATTERNS: RegExp[] = [
  /\b(kill (myself|me)|suicide|end (it|my life)|don'?t want to live|hurt myself|cut myself)\b/i,
  /\b(weapon|knife|gun|panga|machete|threatening me)\b/i,
  /\b(he is here|right now|breaking in|outside (my )?door|following me|chasing)\b/i,
  /\b(rape|raped|assaulting|attacking)\b/i,
  /\b(can'?t breathe|bleeding|unconscious)\b/i,
]

function detectHighRisk(text: string): boolean {
  return HIGH_RISK_PATTERNS.some((re) => re.test(text))
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [chatStatus, setChatStatus] = useState<ChatStatus>("ai")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { user, role, loginAnonymously } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    let unsubscribe: () => void;

    const setupChat = async () => {
      let currentUser = user;
      if (!currentUser) {
        await loginAnonymously();
        currentUser = auth.currentUser;
      }
      if (!currentUser) return;

      // Check for chat ID in query params (for counselors joining a chat)
      const params = new URLSearchParams(window.location.search);
      const forcedChatId = params.get("id");
      
      let currentChatId: string | null = null;
      const chatsRef = collection(db, "chats");
      const cacheKey = `safespace_chat_${currentUser.uid}`;

      if (forcedChatId) {
        currentChatId = forcedChatId;
      } else {
        const cachedId = localStorage.getItem(cacheKey);
        let usedCache = false;
        if (cachedId) {
          const cachedSnap = await getDoc(doc(db, "chats", cachedId));
          const ownerId = cachedSnap.data()?.userId;
          if (cachedSnap.exists() && ownerId === currentUser.uid) {
            currentChatId = cachedId;
            usedCache = true;
          } else {
            localStorage.removeItem(cacheKey);
          }
        }

        if (!usedCache) {
          const q = query(chatsRef, where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"), limit(1));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            const newChat = await addDoc(chatsRef, {
              userId: currentUser.uid,
              createdAt: serverTimestamp(),
              status: "ai",
            });
            currentChatId = newChat.id;

            await addDoc(collection(db, "chats", currentChatId, "messages"), {
              role: "assistant",
              content: INITIAL_MESSAGE.content,
              timestamp: serverTimestamp(),
            });
          } else {
            currentChatId = querySnapshot.docs[0].id;
          }
        }
      }
      
      setChatId(currentChatId);
      if (!currentChatId) return;

      localStorage.setItem(cacheKey, currentChatId);

      // Subscribe to messages
      const messagesRef = collection(db, "chats", currentChatId, "messages");
      const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

      const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
        const newMessages: Message[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          newMessages.push({
            id: d.id,
            role: data.role,
            content: data.content,
            timestamp: data.timestamp?.toDate() || new Date(),
            authorUid: data.authorUid ?? null,
          });
        });
        setMessages(newMessages);
      });

      // Subscribe to chat status (AI vs human handoff)
      const unsubChat = onSnapshot(doc(db, "chats", currentChatId), (snap) => {
        const data = snap.data();
        const s = (data?.status as ChatStatus) || "ai";
        setChatStatus(s);
      });

      unsubscribe = () => {
        unsubMessages();
        unsubChat();
      };
    };

    setupChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, loginAnonymously]);

  const handleSend = async () => {
    if (!input.trim() || !chatId) return

    const userMessageContent = input.trim()
    setInput("")
    
    const currentUser = auth.currentUser
    const isStaff = role && role !== "survivor"

    // If staff/admin is typing, send as assistant (counselor) and do NOT trigger AI
    if (isStaff) {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        role: "assistant",
        content: userMessageContent,
        timestamp: serverTimestamp(),
        authorUid: currentUser?.uid ?? null,
      });
      return;
    }
    
    // Add survivor message to Firestore
    await addDoc(collection(db, "chats", chatId, "messages"), {
      role: "user",
      content: userMessageContent,
      timestamp: serverTimestamp(),
      authorUid: currentUser?.uid ?? null,
    });

    // High-risk content detection — flag silently for staff review (no promise of in-chat response).
    if (detectHighRisk(userMessageContent)) {
      try {
        await addDoc(collection(db, "escalations"), {
          chatId,
          userId: currentUser?.uid || "anonymous",
          excerpt: userMessageContent.slice(0, 280),
          severity: "high",
          createdAt: serverTimestamp(),
        })
      } catch (e) {
        console.error("escalation log failed", e)
      }
    }

    const priorUserLines = messages
      .filter((m) => m.role === "user")
      .slice(-8)
      .map((m) => m.content)
    const userContextBlob = [...priorUserLines, userMessageContent].join("\n")

    const imminentReply = getImminentDangerReply(userMessageContent, userContextBlob)
    if (imminentReply) {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        role: "assistant",
        content: imminentReply,
        timestamp: serverTimestamp(),
      })
      return
    }

    // Human / counsellor intent before other canned paths so "I need to talk" is not treated as a repeat disclosure.
    if (chatStatus === "ai" && wantsHuman(userMessageContent)) {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        role: "assistant",
        content: HUMAN_SUPPORT_MESSAGE,
        timestamp: serverTimestamp(),
      })
      return
    }

    const structuredReply = getStructuredCrisisReply(userMessageContent)
    if (structuredReply) {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        role: "assistant",
        content: structuredReply,
        timestamp: serverTimestamp(),
      })
      return
    }

    // Gate AI: only reply if we are in 'ai' status
    if (chatStatus !== "ai") return

    setIsTyping(true)
    try {
      const history: ChatTurn[] = [
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: userMessageContent },
      ]
      const reply = await generateAIReply(history)
      await addDoc(collection(db, "chats", chatId, "messages"), {
        role: "assistant",
        content: reply,
        timestamp: serverTimestamp(),
      })
    } catch (err) {
      console.error("AI reply failed:", err)
      const crisisFallback = getDeterministicCrisisReply(userMessageContent, userContextBlob)
      await addDoc(collection(db, "chats", chatId, "messages"), {
        role: "assistant",
        content: crisisFallback ?? AI_ERROR_MESSAGE,
        timestamp: serverTimestamp(),
        system: true,
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickResponse = (response: string) => {
    setInput(response)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navigation />
      
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 overflow-hidden">
        {/* Chat Container - Large Recessed Area */}
        <div className="flex-1 flex flex-col recessed rounded-lg overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-card/30 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 pill lifted-primary flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground tracking-tight">SafeSpace Assistant</h1>
                  <p className={cn(
                    "text-[10px] uppercase tracking-widest font-bold transition-colors duration-500",
                    chatStatus === "ai" ? "text-muted-foreground" : 
                    chatStatus === "awaiting_human" ? "text-warning animate-pulse" : 
                    "text-primary"
                  )}>
                    {chatStatus === "ai" && "24/7 AI Support Active"}
                    {chatStatus === "awaiting_human" && "Connecting to Counselor..."}
                    {chatStatus === "human" && "Human Counselor Online"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href="tel:0800720990"
                  className="h-10 w-10 pill recessed text-emergency hover:bg-emergency/10 flex items-center justify-center transition-colors"
                  aria-label="Call National GBV Hotline"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                authorUid={message.authorUid}
              />
            ))}
            
            {isTyping && (
              <div className="flex justify-start mb-6">
                <div className="recessed px-6 py-4 rounded-lg flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Internal Compartment */}
          <div className="p-4 bg-card/10 border-t border-white/5">
            {/* Quick Responses */}
            {messages.length === 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {QUICK_RESPONSES.map((response) => (
                  <button
                    key={response}
                    onClick={() => handleQuickResponse(response)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider lifted text-foreground hover:scale-105 transition-all pill"
                  >
                    {response}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-3 p-2 pill recessed">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-h-[44px] max-h-[120px] py-3 px-4 font-medium"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "auto"
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                }}
              />
              <button 
                onClick={handleSend} 
                disabled={!input.trim() || isTyping}
                className={cn(
                  "h-11 w-11 flex items-center justify-center pill transition-all duration-300",
                  input.trim() && !isTyping ? "lifted-primary" : "recessed text-muted-foreground opacity-50"
                )}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
              <AlertTriangle className="h-3 w-3 text-warning" />
              <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                In danger? Use SOS immediately.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
