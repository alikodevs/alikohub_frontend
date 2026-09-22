import { useEffect, useState } from "react";
import {
  Link,
  useSearchParams,
  useParams,
  useNavigate,
} from "react-router-dom";
import api, { formatUploadUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Video,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatWebinarDateTime } from "@/lib/utils";
import webinarVisa from "@/assets/webinar-visa.jpg";
import webinarBusiness from "@/assets/webinar-business.jpg";
import webinarCareer from "@/assets/webinar-career.jpg";
import webinarPhd from "@/assets/webinar-phd.jpg";

const fallbackThumbnails = [
  webinarVisa,
  webinarBusiness,
  webinarCareer,
  webinarPhd,
];

type Webinar = {
  id: string;
  title: string;
  slug?: string | null;
  description: string | null;
  scheduledAt: string | null;
  durationMinutes: number | null;
  agenda: string[] | null;
  takeaways: string[] | null;
  webinarUrl: string | null;
  thumbnailUrl: string | null;
  isFree: boolean;
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const Webinars = () => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<Webinar | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    webinarTitle: string;
    name: string;
    email: string;
    scheduledAt?: string | null;
  } | null>(null);

  const [searchParams] = useSearchParams();
  const { slug: routeSlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentSlug = routeSlug || searchParams.get("slug");

  useEffect(() => {
    const fetchWebinars = async () => {
      try {
        const { data } = await api.get("/consultancy/cms/webinars");
        setWebinars(data || []);
      } catch (error) {
        console.error("Failed to fetch webinars:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWebinars();
  }, []);

  const now = new Date();
  const upcoming = webinars.filter(
    (w) => !w.scheduledAt || new Date(w.scheduledAt) >= now,
  );
  const past = webinars.filter(
    (w) => w.scheduledAt && new Date(w.scheduledAt) < now,
  );

  const selectedWebinar = currentSlug
    ? webinars.find(
        (w) =>
          w.slug === currentSlug ||
          w.id === currentSlug ||
          (w.title && slugify(w.title) === currentSlug),
      )
    : null;

  const isSelectedUpcoming = selectedWebinar
    ? !selectedWebinar.scheduledAt ||
      new Date(selectedWebinar.scheduledAt) >= now
    : false;

  const viewDetail = (w: Webinar) => {
    const targetSlug = w.slug || (w.title ? slugify(w.title) : w.id);
    navigate(`/webinars/${targetSlug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearDetail = () => {
    navigate("/webinars");
  };

  const handleRegisterClick = (w: Webinar) => {
    setForm({ name: "", email: "" });
    setRegistering(w);
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !registering) return;
    setSubmitting(true);

    try {
      await api.post(`/consultancy/cms/webinars/${registering.id}/register`, {
        name: form.name,
        email: form.email,
      });

      setSuccessData({
        webinarTitle: registering.title,
        name: form.name,
        email: form.email,
        scheduledAt: registering.scheduledAt,
      });

      setRegistering(null);
      setForm({ name: "", email: "" });
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration Failed",
        description:
          "An error occurred while registering for the webinar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getThumb = (w: Webinar, index: number) => {
    if (w.thumbnailUrl) {
      return formatUploadUrl(w.thumbnailUrl);
    }
    return fallbackThumbnails[index % fallbackThumbnails.length];
  };

  return (
    <div>
      {/* Hero Header */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${webinarVisa})` }}
        />
        <div className="absolute inset-0 bg-navy/85" />
        <div className="relative container-wide px-4 lg:px-8 py-20 md:py-28 lg:py-32">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent mb-4 block">
              Webinars & Events
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              {selectedWebinar
                ? selectedWebinar.title
                : "Live & Recorded Sessions"}
            </h1>
            <p className="text-primary-foreground/70 text-lg">
              {selectedWebinar
                ? "Join our expert-led session or catch up on event details below."
                : "Join expert-led webinars on business, career, and travel topics."}
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading webinar details…</p>
            </div>
          ) : currentSlug ? (
            /* EVENT DETAIL ROUTE VIEW */
            <div>
              <Button
                variant="ghost"
                onClick={clearDetail}
                className="mb-8 hover:bg-muted text-muted-foreground hover:text-foreground font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Webinars
              </Button>

              {!selectedWebinar ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-xl mx-auto">
                  <h2 className="font-serif text-2xl font-bold text-primary mb-3">
                    Webinar Not Found
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    The requested event detail could not be found or may have
                    been removed.
                  </p>
                  <Button
                    onClick={clearDetail}
                    className="bg-gold text-navy hover:bg-gold/90 font-semibold"
                  >
                    View Available Webinars
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Detail Content */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-border relative bg-muted shadow-md">
                      <img
                        src={getThumb(selectedWebinar, 0)}
                        alt={selectedWebinar.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        {selectedWebinar.scheduledAt &&
                        new Date(selectedWebinar.scheduledAt) >= now ? (
                          <span className="bg-green-500/10 text-green-700 dark:text-green-400 font-semibold text-xs px-3 py-1 rounded-full border border-green-500/20">
                            Upcoming Live Webinar
                          </span>
                        ) : (
                          <span className="bg-muted text-muted-foreground font-semibold text-xs px-3 py-1 rounded-full border border-border">
                            Past Session
                          </span>
                        )}
                        <span className="bg-accent/10 text-accent font-semibold text-xs px-3 py-1 rounded-full border border-accent/20">
                          {selectedWebinar.isFree ? "Free Access" : "Premium"}
                        </span>
                      </div>

                      <h2 className="font-serif text-3xl font-bold text-primary mb-4">
                        {selectedWebinar.title}
                      </h2>

                      <div className="prose max-w-none text-muted-foreground space-y-4 leading-relaxed">
                        {selectedWebinar.description ? (
                          selectedWebinar.description
                            .split("\n\n")
                            .map((para, i) => <p key={i}>{para}</p>)
                        ) : (
                          <p>
                            Join our expert consultants for this interactive
                            session. Get actionable insights, live Q&A, and
                            downloadable guides tailored to your goals.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Detail Card */}
                  <div className="lg:col-span-1">
                    <div className="bg-card border border-border rounded-2xl p-6 sticky top-28 space-y-6 shadow-sm">
                      <h3 className="font-serif text-xl font-semibold text-primary pb-4 border-b border-border">
                        Event Details
                      </h3>

                      <div className="space-y-4 text-sm">
                        {selectedWebinar.scheduledAt && (
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">
                                Date & Time
                              </p>
                               <p className="text-muted-foreground font-semibold text-primary/90">
                                {
                                  formatWebinarDateTime(
                                    selectedWebinar.scheduledAt,
                                    selectedWebinar.durationMinutes,
                                  ).fullStr
                                }
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedWebinar.durationMinutes && (
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">
                                Duration
                              </p>
                              <p className="text-muted-foreground">
                                {selectedWebinar.durationMinutes} minutes
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <Video className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">
                              Platform
                            </p>
                            <p className="text-muted-foreground">
                              Live Online Stream (Zoom)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3 pt-2">
                        {isSelectedUpcoming ? (
                          <Button
                            onClick={() => handleRegisterClick(selectedWebinar)}
                            className="w-full bg-gold text-navy hover:bg-gold/90 font-semibold py-6 text-base shadow-md"
                          >
                            Register Now
                          </Button>
                        ) : (
                          <Button disabled className="w-full py-6 text-base font-semibold">
                            Session Concluded
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : webinars.length === 0 ? (
            /* EMPTY LIST VIEW */
            <p className="text-center text-muted-foreground py-12">
              No webinars available yet. Check back soon!
            </p>
          ) : (
            /* WEBINARS LIST VIEW */
            <>
              {upcoming.length > 0 && (
                <>
                  <h2 className="font-serif text-2xl font-bold text-primary mb-8">
                    Upcoming Sessions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {upcoming.map((w, i) => (
                      <div
                        key={w.id}
                        className="bg-card border border-border rounded-xl overflow-hidden card-hover group flex flex-col justify-between"
                      >
                        <div>
                          <div
                            className="aspect-[16/9] overflow-hidden cursor-pointer"
                            onClick={() => viewDetail(w)}
                          >
                            <img
                              src={getThumb(w, i)}
                              alt={w.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-6">
                            <h3
                              onClick={() => viewDetail(w)}
                              className="font-serif text-lg font-semibold text-primary mb-3 hover:text-accent cursor-pointer transition-colors"
                            >
                              {w.title}
                            </h3>
                            {w.description && (
                              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                {w.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-5">
                              {w.scheduledAt && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4 text-accent" />
                                  {formatWebinarDateTime(w.scheduledAt, w.durationMinutes).fullStr}
                                </span>
                              )}
                              {w.durationMinutes && (
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-accent" />
                                  {w.durationMinutes} min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="px-6 pb-6 pt-0 space-y-2.5">
                          <Button
                            onClick={() => handleRegisterClick(w)}
                            className="w-full bg-gold text-navy hover:bg-gold/90 font-semibold py-5 text-sm shadow-sm"
                          >
                            Register Now
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => viewDetail(w)}
                            className="w-full py-5 text-sm font-semibold border-border hover:bg-muted text-foreground"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {past.length > 0 && (
                <>
                  <h2 className="font-serif text-2xl font-bold text-primary mb-8">
                    Past Sessions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {past.map((w, i) => (
                      <div
                        key={w.id}
                        className="bg-card border border-border rounded-xl overflow-hidden group flex flex-col justify-between"
                      >
                        <div>
                          <div
                            className="aspect-[16/9] overflow-hidden relative cursor-pointer"
                            onClick={() => viewDetail(w)}
                          >
                            <img
                              src={getThumb(w, upcoming.length + i)}
                              alt={w.title}
                              className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-14 h-14 rounded-full bg-card/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Video className="w-6 h-6 text-accent" />
                              </div>
                            </div>
                          </div>
                          <div className="p-6">
                            <h3
                              onClick={() => viewDetail(w)}
                              className="font-serif text-lg font-semibold text-primary mb-3 hover:text-accent cursor-pointer transition-colors"
                            >
                              {w.title}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                              {w.scheduledAt && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" />
                                  {formatWebinarDateTime(w.scheduledAt, w.durationMinutes).fullStr}
                                </span>
                              )}
                              {w.durationMinutes && (
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" />
                                  {w.durationMinutes} min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="px-6 pb-6 pt-0">
                          <Button
                            variant="outline"
                            onClick={() => viewDetail(w)}
                            className="w-full py-5 text-sm font-semibold border-border hover:bg-muted text-foreground"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* WEBINAR REGISTRATION CONFIRMATION MODAL */}
      <Dialog
        open={!!registering}
        onOpenChange={(open) => {
          if (!open) setRegistering(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Register for Webinar
            </DialogTitle>
          </DialogHeader>
          {registering && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-xl space-y-1 border border-border">
                <p className="font-semibold text-sm text-foreground">
                  {registering.title}
                </p>
                {registering.scheduledAt && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-medium text-foreground">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    {formatWebinarDateTime(registering.scheduledAt, registering.durationMinutes).fullStr}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Full Name
                </label>
                <Input
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Email Address
                </label>
                <Input
                  placeholder="you@example.com"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                The webinar link (zoom) will be sent to your email upon
                confirmation.
              </p>

              <Button
                onClick={handleRegister}
                disabled={submitting || !form.name || !form.email}
                className="w-full bg-gold text-navy hover:bg-gold/90 font-semibold py-5"
              >
                {submitting ? "Confirming…" : "Confirm Registration"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REGISTRATION SUCCESS POPUP MODAL */}
      <Dialog
        open={!!successData}
        onOpenChange={(open) => !open && setSuccessData(null)}
      >
        <DialogContent className="sm:max-w-md text-center p-6 space-y-4">
          <DialogHeader className="pt-2 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mb-3 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-accent animate-in zoom-in-75 duration-300" />
            </div>
            <DialogTitle className="font-serif text-2xl font-bold text-primary">
              Registration Confirmed! 🎉
            </DialogTitle>
          </DialogHeader>

          {successData && (
            <div className="space-y-4 text-left pt-1">
              <p className="text-muted-foreground text-sm text-center">
                Thank you,{" "}
                <strong className="text-foreground">{successData.name}</strong>!
                You have successfully reserved your spot.
              </p>

              <div className="bg-card border border-border rounded-xl p-4 space-y-2.5 shadow-sm">
                <h4 className="font-serif font-bold text-base text-primary">
                  {successData.webinarTitle}
                </h4>

                {successData.scheduledAt && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2 font-medium text-foreground">
                    <Calendar className="w-4 h-4 text-accent shrink-0" />
                    <span>
                      {formatWebinarDateTime(successData.scheduledAt).fullStr}
                    </span>
                  </p>
                )}

                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent shrink-0" />
                  <span>
                    Confirmation sent to:{" "}
                    <strong className="text-foreground">
                      {successData.email}
                    </strong>
                  </span>
                </p>
              </div>

              <Button
                onClick={() => setSuccessData(null)}
                className="w-full py-5 text-sm font-semibold bg-gold text-navy hover:bg-gold/90"
              >
                Great, Thank You!
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Webinars;
