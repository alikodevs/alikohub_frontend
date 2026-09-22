import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { useToast } from "@/hooks/use-toast";
import { sendAcademyContact } from "@/services/academyContactService";
import bgContactHero from "@/assets/bg-contact-hero.jpg";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    else if (form.name.length > 100)
      errs.name = "Name must be under 100 characters";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email address";
    if (!form.subject.trim()) errs.subject = "Subject is required";
    else if (form.subject.length > 200)
      errs.subject = "Subject must be under 200 characters";
    if (!form.message.trim()) errs.message = "Message is required";
    else if (form.message.length > 2000)
      errs.message = "Message must be under 2000 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await sendAcademyContact({
        name: form.name,
        email: form.email,
        service_interest: form.subject || undefined,
        message: form.message,
        source_page: "contact",
      });
      setSubmitted(true);
      toast({
        title: "Message sent!",
        description: "We'll get back to you shortly.",
      });
    } catch (err: any) {
      console.error("EmailJS error:", err);
      toast({
        title: "Error",
        description: err?.text ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const inputClass =
    "w-full rounded-lg border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/30";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero with background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={bgContactHero}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/75 to-slate-900/60" />
        </div>
        <div className="section-container py-16 md:py-20 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">
            Get in Touch
          </h1>
          <p className="mt-4 text-white/70 max-w-lg mx-auto">
            Have questions about our pathways or want to partner with us? We'd
            love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact info cards with color */}
      <section className="section-container -mt-8 relative z-20 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Mail,
              label: "Email",
              value: "academy@alikohub.com",
              bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
              iconBg: "bg-blue-100",
              iconColor: "text-blue-600",
            },
            {
              icon: Phone,
              label: "Phone",
              values: [
                "+1 (206) 353 5373",
                "+251 920 907 878",
                "+251 910 813 571",
              ],
              bg: "bg-gradient-to-br from-amber-50 to-orange-100/50",
              iconBg: "bg-amber-100",
              iconColor: "text-amber-600",
            },
            {
              icon: MapPin,
              label: "Locations",
              values: [
                "19550 International Blvd Suite STE 301, SeaTac, WA 98188",
                "Addis Ababa, Bole Dembel, Tigi's Building, 12th Floor",
              ],
              bg: "bg-gradient-to-br from-emerald-50 to-green-100/50",
              iconBg: "bg-emerald-100",
              iconColor: "text-emerald-600",
            },
          ].map((c) => (
            <div
              key={c.label}
              className={`${c.bg} rounded-lg border p-6 text-center shadow-sm`}
            >
              <div
                className={`w-10 h-10 rounded-full ${c.iconBg} flex items-center justify-center mx-auto mb-3`}
              >
                <c.icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
              <p className="text-sm text-muted-foreground">{c.label}</p>
              {c.values ? (
                <div className="font-medium text-foreground mt-1 text-sm space-y-1">
                  {c.label === "Phone" ? (
                    <p className="flex flex-wrap items-center justify-center gap-x-1.5">
                      <span>+1 (206) 353 5373</span>
                      <span className="text-muted-foreground/40">|</span>
                      <span>+251 920 907 878</span>
                      <span className="text-muted-foreground/40">|</span>
                      <span>+251 910 813 571</span>
                    </p>
                  ) : (
                    c.values.map((v) => <p key={v}>{v}</p>)
                  )}
                </div>
              ) : (
                <p className="font-medium text-foreground mt-1">{c.value}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="section-container max-w-3xl pb-20">
        {submitted ? (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200 p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
              Message Sent!
            </h2>
            <p className="text-muted-foreground mb-6">
              Thank you for reaching out. We'll get back to you as soon as
              possible.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setForm({ name: "", email: "", subject: "", message: "" });
              }}
            >
              Send Another Message
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-lg border p-8 space-y-5 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  maxLength={100}
                  className={inputClass}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  maxLength={255}
                  className={inputClass}
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
            <div>
              <input
                type="text"
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                maxLength={200}
                className={inputClass}
              />
              {errors.subject && (
                <p className="text-xs text-destructive mt-1">
                  {errors.subject}
                </p>
              )}
            </div>
            <div>
              <textarea
                rows={5}
                placeholder="Your Message"
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                maxLength={2000}
                className={`${inputClass} resize-none`}
              />
              {errors.message && (
                <p className="text-xs text-destructive mt-1">
                  {errors.message}
                </p>
              )}
            </div>
            <Button
              size="lg"
              className="w-full gap-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  Send Message <Send className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </section>

      {/* CTA Section */}
      <CTASection
        title="Still Have Questions?"
        description="Our team is here to help you find the right pathway for your career goals."
        primaryText="Access LMS"
        secondaryText="Explore Pathways"
      />

      <Footer />
    </div>
  );
};

export default Contact;
