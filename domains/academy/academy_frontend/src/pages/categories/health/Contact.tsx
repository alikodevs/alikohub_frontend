import { useState } from "react";
import { Layout } from "@/components/categories/health/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Send,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStateConfig } from "@/hooks/categories/health/useStateConfig";
import { sendAcademyContact } from "@/services/academyContactService";

const Contact = () => {
  const { toast } = useToast();
  const { currentState } = useStateConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fd = new FormData(e.currentTarget);
    try {
      await sendAcademyContact({
        name: `${fd.get("firstName") ?? ""} ${fd.get("lastName") ?? ""}`.trim(),
        email: (fd.get("email") as string) || "",
        phone: (fd.get("phone") as string) || undefined,
        service_interest: (fd.get("topic") as string) || undefined,
        message: (fd.get("message") as string) || "",
        source_page: "health-contact",
        target_email: "academy-health@alikohub.com",
      });
      setIsSubmitted(true);
      toast({
        title: "Message Sent",
        description:
          "Thank you for contacting us. We'll respond within 1-2 business days.",
      });
    } catch (err: any) {
      console.error("EmailJS error:", err);
      toast({
        title: "Error",
        description: err?.text ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-card to-accent/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

        <div className="container-academy relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-12 bg-accent rounded-full" />
            <span className="text-sm font-medium text-accent">
              Get in Touch
            </span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold text-primary">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
            Have questions about our programs, admissions, or career services?
            Our team is here to help you get started on your healthcare career
            journey.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container-academy">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5" />
                    <CardTitle className="text-lg text-primary-foreground">
                      Send Us a Message
                    </CardTitle>
                  </div>
                </div>
                <CardContent className="pt-6">
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-accent" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">
                        Thank You!
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Your message has been received. Our team will respond
                        within 1-2 business days.
                      </p>
                      <Button
                        onClick={() => setIsSubmitted(false)}
                        variant="outline"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            required
                            placeholder="John"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            required
                            placeholder="Smith"
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            placeholder="john@example.com"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder={currentState.contact.phone}
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="topic">Topic *</Label>
                        <Select required>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="programs">
                              Program Information
                            </SelectItem>
                            <SelectItem value="admissions">
                              Admissions & Enrollment
                            </SelectItem>
                            <SelectItem value="tuition">
                              Tuition & Payment
                            </SelectItem>
                            <SelectItem value="schedule">
                              Schedule & Start Dates
                            </SelectItem>
                            <SelectItem value="career">
                              Career Services
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          required
                          placeholder="Tell us how we can help you..."
                          className="min-h-[140px] resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        size="lg"
                        className="w-full sm:w-auto shadow-lg"
                      >
                        {isSubmitting ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground space-y-1">
                    <span>19550 International Blvd Suite STE 301, SeaTac, WA 98188</span>
                    <br />
                    <span>Addis Ababa, Bole Dembel, Tigi's Building, 12th Floor</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-accent" />
                    </div>
                    Phone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
                    <a href={`tel:${currentState.contact.phone}`} className="hover:text-accent transition-colors">
                      {currentState.contact.phone}
                    </a>
                    <span>|</span>
                    <a href="tel:+251920907878" className="hover:text-accent transition-colors">
                      +251 920 907 878
                    </a>
                    <span>|</span>
                    <a href="tel:+251910813571" className="hover:text-accent transition-colors">
                      +251 910 813 571
                    </a>
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    General: {currentState.contact.email}
                    <br />
                    Admissions: {currentState.contact.admissionsEmail}
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    Office Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {currentState.officeHours.weekday}
                    <br />
                    {currentState.officeHours.saturday}
                    <br />
                    {currentState.officeHours.sunday}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
