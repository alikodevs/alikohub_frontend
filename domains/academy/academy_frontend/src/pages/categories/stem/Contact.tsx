import { useState } from "react";
import { Layout } from "@/components/categories/stem/layout/Layout";
import { Button } from "@/components/categories/stem/ui/button";
import { Card, CardContent } from "@/components/categories/stem/ui/card";
import { Input } from "@/components/categories/stem/ui/input";
import { Textarea } from "@/components/categories/stem/ui/textarea";
import { Label } from "@/components/categories/stem/ui/label";
import { Mail, MapPin, ArrowRight, Phone } from "lucide-react";
import { toast } from "sonner";
import { sendAcademyContact } from "@/services/academyContactService";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await sendAcademyContact({
        name: formData.name,
        email: formData.email,
        message: formData.message,
        source_page: "stem-contact",
        target_email: "academy-stem@alikohub.com",
      });
      toast.success("Message sent!", {
        description: "We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", message: "" });
    } catch (err: any) {
      console.error("EmailJS error:", err);
      toast.error("Failed to send message", {
        description: err?.text || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className="gradient-hero py-20 lg:py-28">
        <div className="container-content">
          <h1 className="font-display text-5xl font-extrabold text-foreground">
            Contact <span className="text-primary">Us</span>
          </h1>
          <p className="mt-5 text-xl text-[hsl(210_30%_82%)] max-w-2xl leading-relaxed">
            Have questions about our programs? Get in touch with our team.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-content">
          <div className="grid lg:grid-cols-2 gap-14">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-8">
                Get in Touch
              </h2>
              <div className="space-y-5 mb-10">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/25">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href="mailto:academy-stem@alikohub.com"
                      className="font-bold text-foreground hover:text-primary transition-colors"
                    >
                      academy-stem@alikohub.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/10 border border-secondary/25">
                  <div className="h-12 w-12 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Phone className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <div className="font-bold text-foreground text-sm flex flex-wrap items-center gap-x-1.5">
                      <a href="tel:+12063535373" className="hover:text-secondary transition-colors">+1 (206) 353 5373</a>
                      <span className="opacity-40">|</span>
                      <a href="tel:+251920907878" className="hover:text-secondary transition-colors">+251 920 907 878</a>
                      <span className="opacity-40">|</span>
                      <a href="tel:+251910813571" className="hover:text-secondary transition-colors">+251 910 813 571</a>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-accent/10 border border-accent/25">
                  <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <div className="font-bold text-foreground text-sm space-y-1">
                      <p>19550 International Blvd Suite STE 301, SeaTac, WA 98188</p>
                      <p>Addis Ababa, Bole Dembel, Tigi's Building, 12th Floor</p>
                    </div>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" size="lg">
                <a href="/enterprise">
                  Request Enterprise Training
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            <Card className="border-divider bg-card shadow-2xl">
              <CardContent className="p-8">
                <h3 className="font-display text-2xl font-bold text-foreground mb-6">
                  Send a Message
                </h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-bold">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name: e.target.value }))
                      }
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, email: e.target.value }))
                      }
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="font-bold">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, message: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
