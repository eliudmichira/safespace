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

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

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

// Simulated AI responses based on keywords
const generateResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes("unsafe") || lowerMessage.includes("scared") || lowerMessage.includes("danger")) {
    return `I hear that you're feeling unsafe, and I want you to know that your safety is the top priority. Here are some immediate options:

1. If you're in immediate danger, please use the SOS button on the home screen or call 999/112
2. You can share your live location with trusted contacts through our tracking feature
3. Campus security is available 24/7 at 0720 000 000

Can you tell me more about what's making you feel unsafe? I'm here to help you figure out the best next steps.`
  }
  
  if (lowerMessage.includes("report") || lowerMessage.includes("incident")) {
    return `I understand you want to report an incident. You have options available to you:

- Anonymous reporting: You can submit a report without revealing your identity
- Formal report: This can be submitted to the GBV office for official action
- Both options allow you to upload evidence and provide detailed descriptions

Would you like me to guide you through the reporting process? You can also go directly to the Report section when you're ready.

Remember, reporting is your choice, and I'm here to support you regardless of what you decide.`
  }
  
  if (lowerMessage.includes("talk") || lowerMessage.includes("someone") || lowerMessage.includes("listen")) {
    return `I'm here to listen. Whatever you're going through, you don't have to face it alone.

Take your time. You can share as much or as little as you feel comfortable with. There's no pressure, and everything you say here stays confidential.

If at any point you feel you'd like to speak with a human counselor, I can help connect you with professional support services available through the university.

What would you like to share?`
  }
  
  if (lowerMessage.includes("resources") || lowerMessage.includes("help") || lowerMessage.includes("information")) {
    return `Here are the support resources available to you:

Support Services:
- GBV Office: Located at Admin Block, Room 205
- University Counseling Center: Health Center, 2nd Floor
- Legal Aid Clinic: Every Wednesday, 2-5 PM

Hotlines (24/7):
- National GBV Hotline: 0800 720 990
- Police Emergency: 999 / 112
- Campus Security: 0720 000 000

Online Resources:
- Kenya Women's Rights (www.fida.or.ke)
- COVAW Kenya (www.covaw.or.ke)

Would you like more details about any of these resources?`
  }
  
  // Default supportive response
  return `Thank you for sharing that with me. I can sense this is a difficult time for you.

I want you to know that your feelings are valid, and it takes courage to reach out for support.

Can you tell me more about what you're experiencing? Understanding your situation better will help me provide more specific support and guidance.

Remember, you're in control here. We can move at whatever pace feels right for you.`
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateResponse(userMessage.content),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
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
      
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Chat Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">AI Counselor</h1>
                <p className="text-xs text-muted-foreground">24/7 Trauma-Informed Support</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/report">
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Report</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="gap-2 text-emergency border-emergency/30 hover:bg-emergency/10">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Call Now</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}
          
          {isTyping && (
            <div className="flex gap-3 p-4 bg-muted/30">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 pt-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Responses */}
        {messages.length === 1 && (
          <div className="border-t border-border p-4">
            <p className="text-xs text-muted-foreground mb-3">Quick responses:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_RESPONSES.map((response) => (
                <button
                  key={response}
                  onClick={() => handleQuickResponse(response)}
                  className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
                >
                  {response}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <Card className="flex items-end gap-2 p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[40px] max-h-[120px] py-2 px-2"
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = "auto"
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`
              }}
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isTyping}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </Card>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <AlertTriangle className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center">
              If you are in immediate danger, please use the SOS feature or call 999
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
