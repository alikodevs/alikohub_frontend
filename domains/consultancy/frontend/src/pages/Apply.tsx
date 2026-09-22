import { useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CheckCircle2, Upload, X } from "lucide-react";
import api, { formatUploadUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Apply = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [pillar, setPillar] = useState(searchParams.get("pillar") || "");
  const [level, setLevel] = useState(searchParams.get("level") || "");
  const [submitted, setSubmitted] = useState(false);
  const [appCode, setAppCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    destination: "",
    company: "",
    industry: "",
    businessChallenge: "",
    currentRole: "",
    targetRole: "",
    research: "",
    goals: "",
  });

  const mapPillar = (p: string) => {
    if (p === "student") return "travel";
    return p as "business" | "career" | "travel";
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData: Record<string, any> = { ...form, level };
      Object.keys(formData).forEach((k) => {
        if (!formData[k]) delete formData[k];
      });

      const appPayload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
        consultationType: mapPillar(pillar).toUpperCase(),
        formData: formData,
      };

      const { data: application } = await api.post(
        "/consultancy/applications",
        appPayload,
      );
      const applicationId = application.id;
      const generatedCode = application.applicationCode;

      if (files.length > 0) {
        for (const file of files) {
          const fileFormData = new FormData();
          fileFormData.append("file", file);

          const uploadRes = await api.post("/upload/document", fileFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          await api.post("/consultancy/applications/documents", {
            applicationId: applicationId,
            fileName: file.name,
            filePath: formatUploadUrl(uploadRes.data.url),
            fileSize: file.size,
            mimeType: file.type,
          });
        }
      }

      setAppCode(generatedCode);
      setSubmitted(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to submit application.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles([...files, ...Array.from(e.target.files)]);
  };

  if (submitted) {
    return (
      <div className="section-padding">
        <div className="container-narrow text-center">
          <CheckCircle2 className="w-16 h-16 text-gold mx-auto mb-6" />
          <h1 className="font-serif text-3xl font-bold text-primary mb-4">
            Your application has been submitted successfully.
          </h1>
          <p className="text-muted-foreground mb-2 text-lg">
            Your Tracking ID:{" "}
            <span className="font-mono font-bold text-accent">#{appCode}</span>
          </p>
          <p className="text-muted-foreground mb-8">
            Use this ID to check your application status anytime.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={`/application-status/${encodeURIComponent(appCode)}`}>
              <Button className="bg-gold text-navy hover:bg-gold/90 font-semibold px-8 py-6">
                Track Application
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="px-8 py-6">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-navy section-padding">
        <div className="container-wide">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold mb-4 block">
              Application Portal
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Apply Now
            </h1>
            <p className="text-primary-foreground/70 text-lg">
              Complete the application form below. Our team will review your
              submission and respond within 5 business days.
            </p>
          </div>
        </div>
      </section>
      <section className="section-padding">
        <div className="container-narrow">
          <div className="flex items-center justify-center gap-2 mb-12">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                    step >= s
                      ? "bg-gold text-navy"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={cn(
                      "w-8 h-0.5",
                      step > s ? "bg-gold" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6 max-w-md mx-auto">
              <h2 className="font-serif text-2xl font-bold text-primary text-center mb-6">
                Select Your Track
              </h2>
              <Select value={pillar} onValueChange={setPillar}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Select a track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business Consulting</SelectItem>
                  <SelectItem value="career">Career Mentorship</SelectItem>
                  <SelectItem value="travel">Travel Advisory</SelectItem>
                  <SelectItem value="student">Student Program</SelectItem>
                </SelectContent>
              </Select>
              {(pillar === "student" || pillar === "travel") && (
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Academic level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HS">High School</SelectItem>
                    <SelectItem value="UG">Undergraduate</SelectItem>
                    <SelectItem value="Grad">Graduate</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={() => pillar && setStep(2)}
                disabled={!pillar}
                className="w-full bg-gold text-navy hover:bg-gold/90 font-semibold py-5"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 max-w-md mx-auto">
              <h2 className="font-serif text-2xl font-bold text-primary text-center mb-6">
                Your Information
              </h2>
              <Input
                placeholder="Full Name"
                required
                className="bg-card"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <Input
                type="email"
                placeholder="Email Address"
                required
                className="bg-card"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                placeholder="Phone (optional)"
                className="bg-card"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                placeholder="Country of Residence"
                className="bg-card"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
              {pillar === "travel" && (
                <Input
                  placeholder="Destination Country"
                  className="bg-card"
                  value={form.destination}
                  onChange={(e) =>
                    setForm({ ...form, destination: e.target.value })
                  }
                />
              )}
              {pillar === "business" && (
                <>
                  <Input
                    placeholder="Company Name"
                    className="bg-card"
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Industry"
                    className="bg-card"
                    value={form.industry}
                    onChange={(e) =>
                      setForm({ ...form, industry: e.target.value })
                    }
                  />
                  <Textarea
                    placeholder="Describe your business challenge..."
                    rows={3}
                    className="bg-card"
                    value={form.businessChallenge}
                    onChange={(e) =>
                      setForm({ ...form, businessChallenge: e.target.value })
                    }
                  />
                </>
              )}
              {pillar === "career" && (
                <>
                  <Input
                    placeholder="Current Role"
                    className="bg-card"
                    value={form.currentRole}
                    onChange={(e) =>
                      setForm({ ...form, currentRole: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Target Role"
                    className="bg-card"
                    value={form.targetRole}
                    onChange={(e) =>
                      setForm({ ...form, targetRole: e.target.value })
                    }
                  />
                </>
              )}
              <Textarea
                placeholder="Program goals and motivations"
                rows={3}
                className="bg-card"
                value={form.goals}
                onChange={(e) => setForm({ ...form, goals: e.target.value })}
              />
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => form.fullName && form.email && setStep(3)}
                  className="bg-gold text-navy hover:bg-gold/90 font-semibold"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 max-w-md mx-auto">
              <h2 className="font-serif text-2xl font-bold text-primary text-center mb-6">
                Upload Documents
              </h2>
              <p className="text-muted-foreground text-sm text-center mb-4">
                Upload required documents. Supported: PDF, DOC, JPG, PNG (max
                10MB).
              </p>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-accent transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Click to browse files
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={addFiles}
                  className="hidden"
                />
              </div>
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-muted/30 rounded-lg p-2 text-sm"
                    >
                      <span>
                        {f.name} ({(f.size / 1024).toFixed(0)}KB)
                      </span>
                      <button
                        onClick={() =>
                          setFiles(files.filter((_, idx) => idx !== i))
                        }
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="bg-gold text-navy hover:bg-gold/90 font-semibold"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 max-w-md mx-auto">
              <h2 className="font-serif text-2xl font-bold text-primary text-center mb-6">
                Review & Submit
              </h2>
              <div className="bg-off-white rounded-lg p-6 text-sm space-y-2">
                <p>
                  <span className="font-semibold">Track:</span> {pillar}
                </p>
                {level && (
                  <p>
                    <span className="font-semibold">Level:</span> {level}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Name:</span> {form.fullName}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {form.email}
                </p>
                {files.length > 0 && (
                  <p>
                    <span className="font-semibold">Documents:</span>{" "}
                    {files.length} file(s)
                  </p>
                )}
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gold text-navy hover:bg-gold/90 font-semibold"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Apply;
