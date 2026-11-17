import { BookOpen, Award, Users, Zap } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  subheading?: string;
}

const features = [
  { icon: BookOpen, label: "Expert-led Courses" },
  { icon: Award, label: "Earn Certificates" },
  { icon: Users, label: "1,200+ Learners" },
  { icon: Zap, label: "Learn at Your Pace" },
];

const stats = [
  { value: "1,200+", label: "Learners" },
  { value: "50+", label: "Courses" },
  { value: "4.8★", label: "Rating" },
];

const AuthLayout = ({ children, heading, subheading }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-[48%] relative overflow-hidden items-center justify-center p-4 lg:sticky lg:top-0 lg:h-screen"
        style={{
          background: "#081831",
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center space-y-8 max-w-sm w-full">
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="relative w-full h-32 flex items-center justify-center">
              <img
                src="/academy-icon.png"
                alt="Aliko Academy"
                fetchPriority="high"
                loading="eager"
                className="relative z-10 h-24 w-auto object-contain translate-x-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              />
            </div>

            <div className="text-center">
              <span className="text-3xl font-heading font-semibold tracking-tight block mb-3 text-white">
                <span className="text-white">Aliko</span>{" "}
                <span style={{ color: "#D77510" }}>Academy</span>
              </span>
              <p
                className="text-xs font-medium tracking-widest uppercase text-white/80"
                style={{
                  letterSpacing: "0.25em",
                }}
              >
                Learn · Grow · Succeed
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-white/70">
            Expert-led courses designed for real-world impact. Start learning
            today and transform your career.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 bg-white/10 border border-white/10 backdrop-blur-md"
              >
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: "rgba(215, 117, 16, 0.2)" }}
                >
                  <Icon size={14} style={{ color: "#D77510" }} />
                </div>
                <span className="text-xs font-medium text-white/90">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/20" />

          {/* Stats */}
          <div className="flex items-center justify-center gap-6">
            {stats.map(({ value, label }, i) => (
              <div key={label} className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xl font-heading font-semibold text-white">{value}</p>
                  <p className="text-xs text-white/60">{label}</p>
                </div>
                {i < stats.length - 1 && (
                  <div className="w-px h-8 bg-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-20 bg-background/50 backdrop-blur-sm">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-6">
            <div className="relative w-full h-20 flex items-center justify-center">
              <img
                src="/academy-icon.png"
                alt="Aliko Academy"
                fetchPriority="high"
                loading="eager"
                className="relative z-10 h-16 w-auto object-contain translate-x-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]"
              />
            </div>

            <div className="text-center">
              <span className="text-2xl font-heading font-semibold tracking-tight text-foreground">
                <span className="text-[#0A65A0]">Aliko</span>{" "}
                <span style={{ color: "#D77510" }}>Academy</span>
              </span>
              <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground mt-0.5">
                Learn · Grow · Succeed
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-foreground tracking-tight">
              {heading}
            </h2>
            {subheading && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {subheading}
              </p>
            )}
          </div>

          {/* Form */}
          <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
