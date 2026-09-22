import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const contactInfo = [
  { 
    icon: Mail, 
    title: "Email", 
    detail: "consultancy@alikohub.com",
    links: [
      { text: "consultancy@alikohub.com", href: "mailto:consultancy@alikohub.com" },
    ] 
  },
  { 
    icon: Phone, 
    title: "Phone", 
    detail: "+1 (206) 353 5373",
    links: [
      { text: "+1 (206) 353 5373", href: "tel:+12063535373" },
      { text: "+251 920 907 878", href: "tel:+251920907878" },
      { text: "+251 910 813 571", href: "tel:+251910813571" },
    ] 
  },
  { icon: Clock, title: "Hours", detail: "Mon-Fri, 9:00 AM - 5:00 PM" },
];

const officeLocations = [
  {
    country: "USA",
    title: "USA Office",
    address: "19550 International Blvd Suite STE 301, SeaTac, WA 98188",
    style: "card-navy-subtle",
  },
  {
    country: "ETHIOPIA",
    title: "Ethiopia Office",
    address: "Addis Ababa, Bole Dembel, Tigi's Building, 12th Floor",
    style: "card-gold-subtle",
  },
];

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/consultancy/contact", form);
      toast({ title: "Message Sent", description: "We'll get back to you within 24 hours." });
      setForm({ fullName: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to send message.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="bg-navy section-padding">
        <div className="container-wide">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent mb-4 block">Contact</span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">Get in Touch</h1>
            <p className="text-primary-foreground/70 text-lg">We'd love to hear from you. Reach out to our global offices or send us a message below.</p>
          </div>
        </div>
      </section>

      {/* Office Locations & Contact Info */}
      <section className="bg-gradient-warm py-12 md:py-16">
        <div className="container-wide">
          {/* Quick Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {contactInfo.map((c, i) => {
              const styles = ["card-navy-subtle", "card-teal-subtle", "card-forest-subtle"];
              return (
                <div key={c.title} className={`${styles[i]} rounded-xl p-6 text-center card-hover`}>
                  <div className="w-12 h-12 rounded-lg bg-accent/15 flex items-center justify-center mx-auto mb-3">
                    <c.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-base text-primary mb-1">{c.title}</h3>
                  {c.links ? (
                    <div className="text-muted-foreground text-sm flex flex-wrap items-center justify-center gap-x-1.5">
                      {c.links.map((link, idx) => (
                        <span key={link.text} className="inline-flex items-center gap-1.5">
                          {idx > 0 && <span className="text-muted-foreground/40">|</span>}
                          <a href={link.href} className="hover:text-primary transition-colors font-medium">
                            {link.text}
                          </a>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm font-medium">{c.detail}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Offices Header & Cards */}
          <div>
            <div className="text-center mb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent block mb-1">Our Locations</span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Global Offices</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {officeLocations.map((office) => (
                <div key={office.country} className={`${office.style} rounded-xl p-6 border border-border card-hover flex items-start gap-4`}>
                  <div className="w-12 h-12 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 mt-1">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-accent bg-accent/15 px-2.5 py-0.5 rounded-full mb-2">
                      {office.country}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-primary mb-2">{office.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{office.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Message Form */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="bg-card border border-border rounded-xl p-8 md:p-12 max-w-2xl mx-auto shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-primary mb-6 text-center">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input placeholder="Full Name" required className="bg-background" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                <Input type="email" placeholder="Email Address" required className="bg-background" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <Input placeholder="Subject" required className="bg-background" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              <Textarea placeholder="Your message..." rows={5} required className="bg-background" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <Button type="submit" disabled={loading} className="w-full bg-gold text-navy hover:bg-gold/90 font-semibold px-8 py-5">
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
