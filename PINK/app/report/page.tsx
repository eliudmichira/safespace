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
  name: string
  type: string
  size: number
}

export default function ReportPage() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const { toast } = useToast()
  
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      }))
      setUploadedFiles((prev) => [...prev, ...newFiles])
      toast({
        title: "File Uploaded",
        description: `${files.length} file(s) added to your report.`,
      })
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    
    toast({
      title: "Report Submitted",
      description: "Your report has been securely submitted. A case number will be generated.",
    })
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
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-safe/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-safe" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Report Submitted Successfully
            </h1>
            <p className="text-muted-foreground mb-6">
              Your report has been securely submitted. A confidential case number has been assigned.
            </p>
            
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Case Reference Number</p>
                <p className="text-2xl font-mono font-bold text-foreground">
                  GBV-{Date.now().toString().slice(-8)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Save this number for your records
                </p>
              </CardContent>
            </Card>
            
            <div className="space-y-3">
              <Button onClick={() => window.location.href = "/chat"} className="w-full">
                Talk to AI Counselor
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/"} className="w-full">
                Return Home
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Report an Incident</h1>
            <p className="text-muted-foreground">
              Your report will be handled with confidentiality and care
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      "w-12 h-1 mx-2",
                      step > s ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Report Type & Incident Details */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Incident Details</CardTitle>
                <CardDescription>
                  Tell us about what happened. All fields are optional.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Report Type */}
                <div className="space-y-3">
                  <Label>Report Type</Label>
                  <RadioGroup
                    value={formData.reportType}
                    onValueChange={(value: ReportType) =>
                      setFormData((prev) => ({ ...prev, reportType: value }))
                    }
                  >
                    <div className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="anonymous" id="anonymous" />
                      <div className="flex-1">
                        <Label htmlFor="anonymous" className="cursor-pointer flex items-center gap-2">
                          <EyeOff className="h-4 w-4" />
                          Anonymous Report
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your identity will be kept confidential
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="identified" id="identified" />
                      <div className="flex-1">
                        <Label htmlFor="identified" className="cursor-pointer flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Identified Report
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Allows for direct follow-up and support
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Incident Type */}
                <div className="space-y-3">
                  <Label>Type of Incident (select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "physical", label: "Physical Violence" },
                      { value: "verbal", label: "Verbal Abuse" },
                      { value: "sexual", label: "Sexual Violence" },
                      { value: "cyber", label: "Cyber Harassment" },
                      { value: "stalking", label: "Stalking" },
                      { value: "other", label: "Other" },
                    ].map((type) => (
                      <div
                        key={type.value}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                          formData.incidentType.includes(type.value as IncidentType)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        )}
                        onClick={() => handleIncidentTypeChange(type.value as IncidentType)}
                      >
                        <Checkbox
                          checked={formData.incidentType.includes(type.value as IncidentType)}
                          onCheckedChange={() => handleIncidentTypeChange(type.value as IncidentType)}
                        />
                        <span className="text-sm text-foreground">{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date of Incident</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.incidentDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, incidentDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time (approximate)</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.incidentTime}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, incidentTime: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Library, Hostel Block A, etc."
                    value={formData.incidentLocation}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, incidentLocation: e.target.value }))
                    }
                  />
                </div>

                <Button onClick={() => setStep(2)} className="w-full">
                  Continue
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Description & Evidence */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Description & Evidence</CardTitle>
                <CardDescription>
                  Provide details about what happened. Include any evidence if available.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">What happened?</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the incident in as much detail as you feel comfortable sharing..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>

                {/* Perpetrator Info */}
                <div className="space-y-2">
                  <Label htmlFor="perpetrator">Information about the perpetrator (if known)</Label>
                  <Textarea
                    id="perpetrator"
                    placeholder="Physical description, name, relationship to you, etc."
                    rows={3}
                    value={formData.perpetratorInfo}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, perpetratorInfo: e.target.value }))
                    }
                  />
                </div>

                {/* Witness Info */}
                <div className="space-y-2">
                  <Label htmlFor="witness">Witness information (if any)</Label>
                  <Input
                    id="witness"
                    placeholder="Names or descriptions of anyone who witnessed the incident"
                    value={formData.witnessInfo}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, witnessInfo: e.target.value }))
                    }
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-3">
                  <Label>Upload Evidence (optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-foreground font-medium">
                        Click to upload files
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Images, audio, video, or documents
                      </p>
                    </label>
                  </div>
                  
                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {file.type.startsWith("image") ? (
                              <Image className="h-4 w-4 text-muted-foreground" />
                            ) : file.type.startsWith("audio") ? (
                              <Mic className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-foreground">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Support & Contact */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Support & Contact</CardTitle>
                <CardDescription>
                  Let us know what support you need and how we can reach you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Support Needs */}
                <div className="space-y-3">
                  <Label>What support do you need?</Label>
                  <div className="space-y-3">
                    <div
                      className={cn(
                        "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                        formData.needsSupport
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, needsSupport: !prev.needsSupport }))
                      }
                    >
                      <Checkbox
                        checked={formData.needsSupport}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, needsSupport: checked === true }))
                        }
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">Counseling Support</p>
                        <p className="text-xs text-muted-foreground">
                          Connect with a professional counselor
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                        formData.needsLegal
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, needsLegal: !prev.needsLegal }))
                      }
                    >
                      <Checkbox
                        checked={formData.needsLegal}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, needsLegal: checked === true }))
                        }
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">Legal Assistance</p>
                        <p className="text-xs text-muted-foreground">
                          Get advice on legal options available
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                        formData.needsMedical
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, needsMedical: !prev.needsMedical }))
                      }
                    >
                      <Checkbox
                        checked={formData.needsMedical}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, needsMedical: checked === true }))
                        }
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">Medical Support</p>
                        <p className="text-xs text-muted-foreground">
                          Access medical care and documentation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Info (for identified reports) */}
                {formData.reportType === "identified" && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium">Contact Information</Label>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.contactName}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, contactName: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@jkuat.ac.ke"
                          value={formData.contactEmail}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+254 7XX XXX XXX"
                          value={formData.contactPhone}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Notice */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Privacy Notice</p>
                      <p>
                        Your report will be handled confidentially by trained staff. 
                        {formData.reportType === "anonymous" 
                          ? " As an anonymous report, your identity will not be recorded."
                          : " Your contact information will only be used to follow up on your case."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Toaster />
    </div>
  )
}
