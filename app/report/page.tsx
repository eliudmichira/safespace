"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/contexts/AuthContext"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { 
  Upload, 
  Shield, 
  Eye, 
  EyeOff,
  CheckCircle,
  FileText,
  Image,
  Mic,
  X,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"

type IncidentType = "physical" | "verbal" | "sexual" | "cyber" | "stalking" | "other"
type ReportType = "anonymous" | "identified"

interface FormData {
  reportType: ReportType
  incidentType: IncidentType[]
  incidentDate: string
  incidentTime: string
  incidentLocation: string
  description: string
  perpetratorInfo: string
  witnessInfo: string
  contactName: string
  contactEmail: string
  contactPhone: string
  needsSupport: boolean
  needsLegal: boolean
  needsMedical: boolean
}

interface UploadedFile {
  url: string
  name: string
  type: string
  size: number
}

export default function ReportPage() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const { toast } = useToast()
  const { user, loginAnonymously } = useAuth()
  
  const [formData, setFormData] = useState<FormData>({
    reportType: "anonymous",
    incidentType: [],
    incidentDate: "",
    incidentTime: "",
    incidentLocation: "",
    description: "",
    perpetratorInfo: "",
    witnessInfo: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    needsSupport: false,
    needsLegal: false,
    needsMedical: false,
  })

  const handleIncidentTypeChange = (type: IncidentType) => {
    setFormData((prev) => ({
      ...prev,
      incidentType: prev.incidentType.includes(type)
        ? prev.incidentType.filter((t) => t !== type)
        : [...prev.incidentType, type],
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      toast({
        title: "Configuration Missing",
        description: "Cloudinary settings not found in .env.local",
        variant: "destructive",
      })
      return
    }

    const newUploadedFiles: UploadedFile[] = []
    
    for (const file of Array.from(files)) {
      const fileId = `${file.name}-${file.size}-${Date.now()}`
      setUploadingFiles(prev => new Set(prev).add(fileId))
      
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("upload_preset", uploadPreset)

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
          { method: "POST", body: formData }
        )

        if (!response.ok) throw new Error("Upload failed")
        
        const data = await response.json()
        
        newUploadedFiles.push({
          url: data.secure_url,
          name: file.name,
          type: file.type || "unknown",
          size: file.size,
        })
      } catch (error) {
        console.error("Cloudinary upload error:", error)
        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        })
      } finally {
        setUploadingFiles(prev => {
          const next = new Set(prev)
          next.delete(fileId)
          return next
        })
      }
    }

    if (newUploadedFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newUploadedFiles])
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${newUploadedFiles.length} file(s).`,
      })
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      let currentUser = user;
      if (!currentUser) {
        await loginAnonymously();
        currentUser = auth.currentUser;
      }
      
      if (!currentUser) throw new Error("Authentication failed");

      // Files are already uploaded to UploadThing by this point
      const fileUrls = uploadedFiles.map(f => f.url);

      // Add document to Firestore
      await addDoc(collection(db, "reports"), {
        ...formData,
        evidenceUrls: fileUrls,
        reporterId: currentUser.uid,
        status: "pending",
        timestamp: serverTimestamp(),
      });
      
      setIsSubmitted(true);
      toast({
        title: "Report Submitted",
        description: "Your report has been securely submitted. A case number will be generated.",
      });
    } catch (error) {
       console.error("Error submitting report:", error);
       toast({
         title: "Submission Error",
         description: "There was a problem submitting your report. Please try again.",
         variant: "destructive",
       });
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="h-24 w-24 rounded-full lifted flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-safe/10 flex items-center justify-center animate-pulse">
                  <CheckCircle className="h-10 w-10 text-safe" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Report Submitted
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Your report has been securely submitted. A confidential case number has been assigned.
            </p>
            
            <div className="card-embossed p-10 mb-10">
              <p className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Case Reference Number</p>
              <div className="recessed py-4 px-6 rounded-2xl mb-4">
                <p className="text-3xl font-mono font-black text-foreground tracking-tighter">
                  GBV-{Date.now().toString().slice(-8)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Please save this number. You will need it to track your case or speak with a counselor about this specific incident.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button onClick={() => window.location.href = "/chat"} className="pill lifted-primary w-full h-16 text-lg font-bold">
                Talk to AI Counselor
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = "/"} className="w-full text-muted-foreground hover:text-foreground h-12">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 pill recessed mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">Secure Incident Reporting</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Your safety is our priority. This form is encrypted and handled with extreme care.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-16 px-4">
            {[
              { num: 1, label: "Details" },
              { num: 2, label: "Evidence" },
              { num: 3, label: "Support" }
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-2">
                <div className="flex items-center">
                  <div
                    className={cn(
                      "h-12 w-12 pill flex items-center justify-center text-base font-bold transition-all duration-500",
                      step >= s.num
                        ? "lifted-primary text-white scale-110"
                        : "recessed text-muted-foreground"
                    )}
                  >
                    {s.num}
                  </div>
                  {s.num < 3 && (
                    <div
                      className={cn(
                        "w-12 sm:w-20 h-1.5 mx-2 rounded-full transition-all duration-500",
                        step > s.num ? "bg-primary shadow-inner" : "bg-muted"
                      )}
                    />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-bold uppercase tracking-widest transition-colors duration-300",
                  step >= s.num ? "text-primary" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Report Type & Incident Details */}
          {step === 1 && (
            <div className="card-embossed p-8 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="border-b border-white/5 pb-6">
                <h2 className="text-2xl font-bold text-foreground">Incident Details</h2>
                <p className="text-muted-foreground">
                  Provide as much or as little information as you feel safe sharing.
                </p>
              </div>

              <div className="space-y-10">
                {/* Report Type */}
                <div className="space-y-6">
                  <Label className="text-lg font-bold">Reporting Method</Label>
                  <RadioGroup
                    value={formData.reportType}
                    onValueChange={(value: ReportType) =>
                      setFormData((prev) => ({ ...prev, reportType: value }))
                    }
                    className="grid gap-6"
                  >
                    <div 
                      className={cn(
                        "flex items-start gap-5 p-6 rounded-3xl transition-all duration-300 cursor-pointer group",
                        formData.reportType === "anonymous" 
                          ? "lifted ring-2 ring-primary/20 scale-[1.02]" 
                          : "recessed hover:bg-black/5"
                      )}
                      onClick={() => setFormData((prev) => ({ ...prev, reportType: "anonymous" }))}
                    >
                      <RadioGroupItem value="anonymous" id="anonymous" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="anonymous" className="cursor-pointer flex items-center gap-2 text-lg font-bold group-hover:text-primary transition-colors">
                          <EyeOff className="h-5 w-5" />
                          Anonymous Report
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          No personal information is required. Ideal for quick alerts or when you prefer total privacy.
                        </p>
                      </div>
                    </div>
                    <div 
                      className={cn(
                        "flex items-start gap-5 p-6 rounded-3xl transition-all duration-300 cursor-pointer group",
                        formData.reportType === "identified" 
                          ? "lifted ring-2 ring-primary/20 scale-[1.02]" 
                          : "recessed hover:bg-black/5"
                      )}
                      onClick={() => setFormData((prev) => ({ ...prev, reportType: "identified" }))}
                    >
                      <RadioGroupItem value="identified" id="identified" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="identified" className="cursor-pointer flex items-center gap-2 text-lg font-bold group-hover:text-primary transition-colors">
                          <Eye className="h-5 w-5" />
                          Identified Report
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Share your details so counselors can reach out directly with support and legal guidance.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Incident Type */}
                <div className="space-y-6">
                  <Label className="text-lg font-bold">Type of Incident</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "physical", label: "Physical" },
                      { value: "verbal", label: "Verbal" },
                      { value: "sexual", label: "Sexual" },
                      { value: "cyber", label: "Cyber" },
                      { value: "stalking", label: "Stalking" },
                      { value: "other", label: "Other" },
                    ].map((type) => (
                      <div
                        key={type.value}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 cursor-pointer",
                          formData.incidentType.includes(type.value as IncidentType)
                            ? "lifted-primary border-none scale-[1.05]"
                            : "recessed hover:bg-black/5"
                        )}
                        onClick={() => handleIncidentTypeChange(type.value as IncidentType)}
                      >
                        <Checkbox
                          checked={formData.incidentType.includes(type.value as IncidentType)}
                          className={cn(
                            "rounded-md",
                            formData.incidentType.includes(type.value as IncidentType) && "border-white bg-white/20"
                          )}
                          onCheckedChange={() => handleIncidentTypeChange(type.value as IncidentType)}
                        />
                        <span className={cn(
                          "text-sm font-bold",
                          formData.incidentType.includes(type.value as IncidentType) ? "text-white" : "text-foreground"
                        )}>{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date & Time & Location */}
                <div className="space-y-6">
                  <Label className="text-lg font-bold">When & Where</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm font-semibold text-muted-foreground ml-1">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        className="recessed border-none h-14 rounded-2xl px-5 text-base"
                        value={formData.incidentDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, incidentDate: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-sm font-semibold text-muted-foreground ml-1">Time (Approx)</Label>
                      <Input
                        id="time"
                        type="time"
                        className="recessed border-none h-14 rounded-2xl px-5 text-base"
                        value={formData.incidentTime}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, incidentTime: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-semibold text-muted-foreground ml-1">Location Details</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Science Complex, Near Main Gate, etc."
                      className="recessed border-none h-14 rounded-2xl px-5 text-base"
                      value={formData.incidentLocation}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, incidentLocation: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={() => setStep(2)} className="pill lifted-primary w-full h-16 text-xl font-bold group">
                    Continue to Evidence
                    <CheckCircle className="ml-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Description & Evidence */}
          {step === 2 && (
            <div className="card-embossed p-8 md:p-10 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="border-b border-white/5 pb-6">
                <h2 className="text-2xl font-bold text-foreground">Narrative & Proof</h2>
                <p className="text-muted-foreground">
                  Your story is safe with us. Add files if they help document the situation.
                </p>
              </div>

              <div className="space-y-8">
                {/* Description */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-lg font-bold">What happened?</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us what occurred..."
                    rows={6}
                    className="recessed border-none rounded-3xl p-6 text-base resize-none focus-visible:ring-primary/20 leading-relaxed"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                  <Label className="text-lg font-bold">Supporting Evidence</Label>
                  <div className="recessed p-12 rounded-[2rem] text-center transition-all hover:bg-black/5 group cursor-pointer border-2 border-dashed border-white/10 relative">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingFiles.size > 0}
                    />
                    <div className="pointer-events-none">
                      <div className="h-20 w-20 rounded-full lifted bg-primary/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all">
                        {uploadingFiles.size > 0 ? (
                          <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <Upload className="h-10 w-10 text-primary" />
                        )}
                      </div>
                      <p className="text-xl font-bold text-foreground mb-2">
                        {uploadingFiles.size > 0 ? "Uploading..." : "Drop files or click to browse"}
                      </p>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Cloudinary Secure Upload — Any file type supported.
                      </p>
                    </div>
                  </div>
                  
                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 mt-6">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 recessed rounded-2xl group animate-in zoom-in-95 duration-300"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl lifted bg-background flex items-center justify-center">
                              {file.type.startsWith("image") ? (
                                <Image className="h-6 w-6 text-primary" />
                              ) : file.type.startsWith("audio") ? (
                                <Mic className="h-6 w-6 text-primary" />
                              ) : (
                                <FileText className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground line-clamp-1">{file.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 pill hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="perpetrator" className="text-sm font-bold text-muted-foreground ml-1">Perpetrator Info (If known)</Label>
                    <Input
                      id="perpetrator"
                      placeholder="Name, description, or identity"
                      className="recessed border-none h-14 rounded-2xl px-5"
                      value={formData.perpetratorInfo}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, perpetratorInfo: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="witness" className="text-sm font-bold text-muted-foreground ml-1">Witnesses</Label>
                    <Input
                      id="witness"
                      placeholder="Names or descriptions of observers"
                      className="recessed border-none h-14 rounded-2xl px-5"
                      value={formData.witnessInfo}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, witnessInfo: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-16 rounded-2xl text-lg">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="pill lifted-primary flex-1 h-16 text-xl font-bold">
                    Next Step
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Support & Contact */}
          {step === 3 && (
            <div className="card-embossed p-8 md:p-10 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="border-b border-white/5 pb-6">
                <h2 className="text-2xl font-bold text-foreground">Support & Security</h2>
                <p className="text-muted-foreground">
                  Finalize your report and choose how you want to be supported.
                </p>
              </div>

              <div className="space-y-10">
                {/* Support Needs */}
                <div className="space-y-6">
                  <Label className="text-lg font-bold">Requested Assistance</Label>
                  <div className="grid gap-4">
                    {[
                      { 
                        id: "needsSupport", 
                        label: "Counseling", 
                        description: "Immediate mental health support",
                        icon: Mic
                      },
                      { 
                        id: "needsLegal", 
                        label: "Legal Aid", 
                        description: "Help with justice and reporting",
                        icon: Shield
                      },
                      { 
                        id: "needsMedical", 
                        label: "Medical Care", 
                        description: "Emergency health assistance",
                        icon: AlertTriangle
                      },
                    ].map((support) => (
                      <div
                        key={support.id}
                        className={cn(
                          "flex items-center gap-5 p-5 rounded-3xl transition-all duration-300 cursor-pointer",
                          formData[support.id as keyof FormData]
                            ? "lifted-primary border-none scale-[1.02]"
                            : "recessed hover:bg-black/5"
                        )}
                        onClick={() =>
                          setFormData((prev) => ({ 
                            ...prev, 
                            [support.id]: !prev[support.id as keyof FormData] 
                          }))
                        }
                      >
                        <Checkbox
                          checked={formData[support.id as keyof FormData] === true}
                          className={cn(
                            "h-6 w-6 rounded-lg",
                            formData[support.id as keyof FormData] && "border-white bg-white/20"
                          )}
                          onCheckedChange={(checked: boolean | "indeterminate") =>
                            setFormData((prev) => ({ ...prev, [support.id]: checked === true }))
                          }
                        />
                        <div className="flex-1">
                          <p className={cn(
                            "text-lg font-bold",
                            formData[support.id as keyof FormData] ? "text-white" : "text-foreground"
                          )}>
                            {support.label}
                          </p>
                          <p className={cn(
                            "text-sm",
                            formData[support.id as keyof FormData] ? "text-white/70" : "text-muted-foreground"
                          )}>
                            {support.description}
                          </p>
                        </div>
                        <support.icon className={cn(
                          "h-8 w-8 opacity-20",
                          formData[support.id as keyof FormData] ? "text-white" : "text-primary"
                        )} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Info (for identified reports) */}
                {formData.reportType === "identified" && (
                  <div className="recessed p-8 rounded-[2.5rem] space-y-8 animate-in zoom-in-95 duration-500 border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 pill lifted flex items-center justify-center bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <Label className="text-xl font-bold">Your Contact Details</Label>
                    </div>
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-bold text-muted-foreground ml-1">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="How should we address you?"
                          className="bg-background/40 border-none h-14 rounded-2xl px-5 text-base"
                          value={formData.contactName}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, contactName: e.target.value }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-bold text-muted-foreground ml-1">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            className="bg-background/40 border-none h-14 rounded-2xl px-5"
                            placeholder="your.email@domain.com"
                            value={formData.contactEmail}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-bold text-muted-foreground ml-1">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            className="bg-background/40 border-none h-14 rounded-2xl px-5"
                            placeholder="+254 XXX XXX XXX"
                            value={formData.contactPhone}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Badge */}
                <div className="recessed p-6 rounded-3xl bg-safe/5 border border-safe/10">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 pill lifted bg-background flex items-center justify-center shrink-0">
                      <Shield className="h-6 w-6 text-safe" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-base">Encrypted Submission</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        This report is end-to-end encrypted. Only authorized Gender Welfare response team members can view this data.
                        {formData.reportType === "anonymous" 
                          ? " Your browser and IP information have been stripped for anonymity."
                          : " Your data is stored in a secure, siloed environment."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 h-16 rounded-2xl text-lg">
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="pill lifted-primary flex-1 h-16 text-xl font-bold shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : "Submit Report"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Toaster />
    </div>
  )
}
