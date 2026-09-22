import { useState } from "react";
import { Mail, Phone, MapPin, Calendar, Send, Sparkles } from "lucide-react";
import Layout from "@/components/categories/technology/layout/Layout";
import { Button } from "@/components/categories/technology/ui/button";
import { Input } from "@/components/categories/technology/ui/input";
import { Textarea } from "@/components/categories/technology/ui/textarea";
import { Label } from "@/components/categories/technology/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/categories/technology/ui/select";
import { useToast } from "@/hooks/categories/technology/use-toast";
import { sendAcademyContact } from "@/services/academyContactService";

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const firstName = ((formData.get("firstName") as string) || "").trim();
    const lastName = ((formData.get("lastName") as string) || "").trim();
    const email = ((formData.get("email") as string) || "").trim();
    const topic = ((formData.get("topic") as string) || "General").trim();
    const message = ((formData.get("message") as string) || "").trim();

    if (!firstName || !email || !message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await sendAcademyContact({
        name: `${firstName} ${lastName}`.trim(),
        email,
        service_interest: topic || undefined,
        message,
        source_page: "technology-contact",
        target_email: "academy-tech@alikohub.com",
      });
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      console.error("EmailJS error:", err);
      toast({
        title: "Error",
        description: err?.text || "Something went wrong.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-[hsl(210,30%,16%)] via-[hsl(215,28%,14%)] to-[hsl(220,25%,11%)]">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
        <div className="container-padding mx-auto max-w-7xl relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-1 bg-accent rounded-full" />
              <span className="text-accent font-semibold text-sm">
                We respond within 24 hours
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-accent mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-foreground/70 leading-relaxed">
              Have questions? We're here to help.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-padding mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-3xl p-8 md:p-10 border border-border shadow-lg">
                <h2 className="text-2xl font-black text-foreground mb-8">
                  Send Us a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-foreground font-semibold"
                      >
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        className="h-12 rounded-xl border-border"
                        required
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-foreground font-semibold"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Smith"
                        className="h-12 rounded-xl border-border"
                        maxLength={100}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-foreground font-semibold"
                    >
                      Email *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      className="h-12 rounded-xl border-border"
                      required
                      maxLength={255}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="topic"
                      className="text-foreground font-semibold"
                    >
                      Topic
                    </Label>
                    <Select name="topic" defaultValue="General">
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Programs & Curriculum">
                          Programs & Curriculum
                        </SelectItem>
                        <SelectItem value="Admissions">Admissions</SelectItem>
                        <SelectItem value="Tuition & Payment">
                          Tuition & Payment
                        </SelectItem>
                        <SelectItem value="Career Services">
                          Career Services
                        </SelectItem>
                        <SelectItem value="Employer Partnerships">
                          Employer Partnerships
                        </SelectItem>
                        <SelectItem value="General">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="message"
                      className="text-foreground font-semibold"
                    >
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="How can we help you?"
                      rows={5}
                      className="rounded-xl border-border resize-none"
                      required
                      maxLength={2000}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-xl"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" /> Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-foreground mb-6">
                  Quick Contact
                </h3>
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href="mailto:academy-tech@alikohub.com"
                        className="font-semibold text-foreground hover:text-secondary transition-colors"
                      >
                        academy-tech@alikohub.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <div className="font-semibold text-foreground text-sm flex flex-wrap items-center gap-x-1.5">
                        <a href="tel:+12063535373" className="hover:text-accent transition-colors">+1 (206) 353 5373</a>
                        <span className="text-muted-foreground/40">|</span>
                        <a href="tel:+251920907878" className="hover:text-accent transition-colors">+251 920 907 878</a>
                        <span className="text-muted-foreground/40">|</span>
                        <a href="tel:+251910813571" className="hover:text-accent transition-colors">+251 910 813 571</a>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold text-foreground text-sm space-y-1">
                        <span>19550 International Blvd Suite STE 301, SeaTac, WA 98188</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative bg-gradient-to-br from-accent to-[hsl(207,90%,25%)] text-accent-foreground rounded-2xl p-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-foreground/10 rounded-full blur-2xl" />
                <div className="relative">
                  <Calendar className="h-10 w-10 mb-4" />
                  <h3 className="font-bold text-xl mb-2">
                    Book an Advising Call
                  </h3>
                  <p className="text-accent-foreground/80 mb-6">
                    Schedule a free 15-minute call with our admissions team.
                  </p>
                  <Button className="w-full bg-accent-foreground text-accent hover:bg-accent-foreground/90 font-bold rounded-xl">
                    Schedule Call
                  </Button>
                </div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-secondary" />
                  </div>
                  <h3 className="font-bold text-foreground">Support Hours</h3>
                </div>
                <p className="text-muted-foreground">
                  Monday - Friday: 9am - 6pm EST
                  <br />
                  Response time: Within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
