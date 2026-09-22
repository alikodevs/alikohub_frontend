import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  Award,
  Briefcase,
  X,
  Receipt,
  MessageSquareText,
  CalendarDays,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import logoLms from "@/assets/Aliko Academy LMS Icon.png";
import { cn } from "@/lib/utils";
import { useEnrollments, useMyTransactions } from "@/hooks/useAcademy";

const achieveNav = [
  { label: "Certifications", to: "/certifications", icon: Award },
  {
    label: "Career Hub",
    to: "https://career.alikohub.com/",
    icon: Briefcase,
    external: true,
  },
];

const accountNav = [
  { label: "Transactions", to: "/transactions", icon: Receipt },
];

interface StudentSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const StudentSidebar = ({ isOpen = false, onClose }: StudentSidebarProps) => {
  const location = useLocation();
  const { data: enrollments } = useEnrollments();
  const { data: myTransactions } = useMyTransactions();

  const completedTxCourseIds = new Set(
    myTransactions
      ?.filter((tx: any) => tx.status === "COMPLETED")
      .map((tx: any) => (tx.metadata as any)?.courseId)
      .filter(Boolean) || [],
  );

  const activeEnrollmentsCount =
    enrollments?.filter(
      (e: any) =>
        e.status === "ACTIVE" ||
        e.status === "COMPLETED" ||
        completedTxCourseIds.has(e.courseId ?? e.course?.id),
    ).length || 0;

  const mainNav = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    {
      label: "My Learning",
      to: "/learning",
      icon: BookOpen,
      badge: activeEnrollmentsCount,
    },
    { label: "My Schedule", to: "/schedules", icon: CalendarDays },
    { label: "Explore", to: "/courses", icon: Compass },
    { label: "Peer Grading", to: "/peer-grading", icon: MessageSquareText },
    { label: "Chat", to: "/chat", icon: MessageCircle },
  ];

  const isActive = (to: string) => location.pathname === to;

  const NavItem = ({
    item,
  }: {
    item: {
      label: string;
      to: string;
      icon: React.ElementType;
      badge?: number;
      external?: boolean;
    };
  }) => {
    const active = isActive(item.to);
    const Icon = item.icon;
    const content = (
      <span
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 w-full group font-medium",
          active
            ? "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
            : "text-slate-300/80 hover:bg-white/5 hover:text-white",
        )}
      >
        <Icon
          className={cn(
            "w-[18px] h-[18px] shrink-0",
            active
              ? "text-primary-foreground"
              : "text-slate-400 group-hover:text-slate-200",
          )}
        />
        <span className="flex-1">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <span
            className={cn(
              "text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 leading-none",
              active
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-primary/20 text-primary-foreground/80",
            )}
          >
            {item.badge}
          </span>
        )}
      </span>
    );

    if (item.external) {
      return (
        <a
          href={item.to}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {content}
        </a>
      );
    }
    return (
      <Link to={item.to} className="block" onClick={onClose}>
        {content}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "relative w-[240px] shrink-0 flex flex-col h-screen bg-[#0b1739] border-r border-slate-800/60 z-50 text-slate-300",
          // Desktop: always visible
          "hidden lg:flex lg:sticky lg:top-0",
          // Mobile: slide-in overlay
          isOpen && "!flex fixed top-0 left-0 shadow-2xl",
        )}
      >
        {/* Logo + mobile close */}
        <div className="relative h-24 shrink-0 flex items-center justify-center px-7 border-b border-slate-800/60">
          <img
            src="/Aliko Academy - LMS 2.png"
            alt="Aliko Academy LMS"
            className="h-10 w-auto max-w-[180px] object-contain"
          />
          <button
            onClick={onClose}
            className="absolute right-7 lg:hidden p-2 hover:bg-white/10 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll py-6 px-4 space-y-7 pb-10">
          <div>
            <p className="text-[10px] font-bold text-slate-400/70 uppercase tracking-[0.14em] px-3 mb-2.5">
              Main
            </p>
            <div className="space-y-1.5">
              {mainNav.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400/70 uppercase tracking-[0.14em] px-3 mb-2.5">
              Achieve
            </p>
            <div className="space-y-1.5">
              {achieveNav.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400/70 uppercase tracking-[0.14em] px-3 mb-2.5">
              Account
            </p>
            <div className="space-y-1.5">
              {accountNav.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          </div>
        </nav>

        {/* Floating Circular Down Arrow Scroll Cue */}
        <div className="absolute bottom-[145px] left-0 right-0 pointer-events-none flex justify-center z-30">
          <button
            type="button"
            aria-label="Scroll down sidebar"
            onClick={() => {
              const navEl = document.querySelector(".sidebar-scroll");
              if (navEl) navEl.scrollBy({ top: 160, behavior: "smooth" });
            }}
            className="pointer-events-auto w-7 h-7 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-500 hover:scale-105 transition-all cursor-pointer opacity-90 hover:opacity-100 border border-blue-400/30"
          >
            <ChevronDown size={15} />
          </button>
        </div>

        {/* Bottom motivational card */}
        <div className="px-4 pb-3 pt-3 shrink-0">
          <div
            className="relative overflow-hidden rounded-2xl p-6 border border-blue-900/50 shadow-xl min-h-[128px] flex flex-col justify-center"
            style={{
              background:
                "linear-gradient(145deg, #0c1e48 0%, #091535 50%, #0c2254 100%)",
            }}
          >
            {/* Subtle glow */}
            <div
              className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(251,146,60,0.15) 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10">
              <p className="text-white font-heading font-bold text-[15px] leading-tight pr-4">
                Learn · Grow · Succeed
              </p>
              {/* Orange underline bar matching reference */}
              <div className="w-8 h-1 bg-[#ff5e14] rounded-full mt-2.5 shadow-sm shadow-orange-500/50" />
            </div>

            {/* 3D Mountain vector artwork matching reference image */}
            <div className="absolute right-0 bottom-0 w-28 h-24 pointer-events-none opacity-90">
              <svg
                viewBox="0 0 120 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <polygon points="10,90 35,40 55,90" fill="url(#blue-grad-1)" />
                <polygon
                  points="35,40 55,90 40,90"
                  fill="#3b82f6"
                  opacity="0.8"
                />

                <polygon points="30,90 65,15 95,90" fill="url(#blue-grad-2)" />
                <polygon
                  points="65,15 95,90 75,90"
                  fill="#1d4ed8"
                  opacity="0.9"
                />
                <polygon
                  points="65,15 80,50 65,90"
                  fill="#60a5fa"
                  opacity="0.6"
                />

                <polygon points="70,90 95,35 115,90" fill="url(#blue-grad-3)" />
                <polygon points="95,35 115,90 102,90" fill="#2563eb" />

                <polygon points="5,90 25,65 45,90" fill="url(#orange-grad-1)" />
                <polygon points="25,65 45,90 35,90" fill="#ea580c" />

                <defs>
                  <linearGradient
                    id="blue-grad-1"
                    x1="10"
                    y1="40"
                    x2="55"
                    y2="90"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#60a5fa" />
                    <stop offset="1" stopColor="#1e40af" />
                  </linearGradient>
                  <linearGradient
                    id="blue-grad-2"
                    x1="30"
                    y1="15"
                    x2="95"
                    y2="90"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#93c5fd" />
                    <stop offset="0.5" stopColor="#2563eb" />
                    <stop offset="1" stopColor="#1e3a8a" />
                  </linearGradient>
                  <linearGradient
                    id="blue-grad-3"
                    x1="70"
                    y1="35"
                    x2="115"
                    y2="90"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient
                    id="orange-grad-1"
                    x1="5"
                    y1="65"
                    x2="45"
                    y2="90"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#ff782c" />
                    <stop offset="1" stopColor="#c2410c" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar;
