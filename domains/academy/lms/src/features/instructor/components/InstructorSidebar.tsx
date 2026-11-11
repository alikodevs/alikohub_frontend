import { useLayoutEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  BarChart,
  ClipboardList,
  CalendarDays,
  Settings,
  MessageCircle,
  X,
  Award,
  Stethoscope,
  FileCheck2,
  CalendarCheck,
  GraduationCap,
  Building2,
  FileSpreadsheet,
  Users,
  LifeBuoy,
  ShieldCheck,
  Megaphone,
  Star,
} from "lucide-react";
import logoLms from "@/assets/Aliko Academy LMS Icon.png";
import { cn } from "@/lib/utils";
import { usePortalMode } from "@/features/auth/hooks/useAuth";

type InstructorNavItem = {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: number;
  external?: boolean;
  hideForAuditor?: boolean;
};

type NavSection = {
  title: string;
  items: InstructorNavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Main Menu",
    items: [
      { label: "Dashboard", to: "/instructor", icon: LayoutDashboard },
      { label: "My Courses", to: "/instructor/courses", icon: BookOpen, hideForAuditor: true },
      { label: "Analytics", to: "/instructor/analytics", icon: BarChart },
      { label: "Schedules", to: "/instructor/schedules", icon: CalendarDays, hideForAuditor: true },
      { label: "Announcements", to: "/instructor/announcements", icon: Megaphone, hideForAuditor: true },
      { label: "Chat", to: "/instructor/chat", icon: MessageCircle, hideForAuditor: true },
    ],
  },
  {
    title: "Students & Grading",
    items: [
      { label: "Admissions", to: "/instructor/admissions", icon: FileCheck2 },
      { label: "Attendance Census", to: "/instructor/census", icon: CalendarCheck },
      { label: "Gradebook", to: "/instructor/gradebook", icon: GraduationCap },
      { label: "Submissions", to: "/instructor/submissions", icon: ClipboardList },
      { label: "Rubrics", to: "/instructor/rubrics", icon: Award },
      { label: "Program Evaluations", to: "/instructor/evaluations", icon: Star },
    ],
  },
  {
    title: "Clinical & Compliance",
    items: [
      { label: "Skills Lab", to: "/instructor/skills-lab", icon: Stethoscope },
      { label: "Clinical Training", to: "/instructor/clinical", icon: Building2 },
      { label: "Curriculum Crosswalk", to: "/instructor/curriculum", icon: FileSpreadsheet },
      { label: "Compliance Audit", to: "/instructor/audit", icon: ShieldCheck },
    ],
  },
  {
    title: "Community & Support",
    items: [
      { label: "Study Groups", to: "/instructor/study-groups", icon: Users },
      { label: "Support Desk", to: "/instructor/support", icon: LifeBuoy },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Settings", to: "/instructor/settings", icon: Settings, hideForAuditor: true },
    ],
  },
];

interface InstructorSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

let instructorSidebarScrollTop = 0;

const InstructorSidebar = ({
  isOpen = false,
  onClose,
}: InstructorSidebarProps) => {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const { isAuditor } = usePortalMode();

  useLayoutEffect(() => {
    if (navRef.current && instructorSidebarScrollTop > 0) {
      navRef.current.scrollTop = instructorSidebarScrollTop;
    }
  }, []);

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: isAuditor
        ? section.items.filter((item) => !item.hideForAuditor)
        : section.items,
    }))
    .filter((section) => section.items.length > 0);

  const isActive = (to: string) => {
    if (to === "/instructor") return location.pathname === "/instructor";
    return location.pathname.startsWith(to);
  };

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
          "relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] transition-all duration-150 w-full group font-semibold",
          active
            ? "bg-[#e8f0fa] text-[#2b5f9e]"
            : "text-slate-600 hover:bg-[#f8fafc] hover:text-[#0f1b2d]",
        )}
      >
        {active && (
          <span className="absolute -left-4 top-2 bottom-2 w-[3px] rounded-r bg-[#f26b21]" />
        )}
        <Icon
          className={cn(
            "w-[18px] h-[18px] shrink-0",
            active
              ? "text-[#2b5f9e]"
              : "text-slate-400 group-hover:text-slate-600",
          )}
        />
        <span className="flex-1">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <span
            className={cn(
              "text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 leading-none",
              active
                ? "bg-white text-[#2b5f9e] border border-[#2b5f9e]/20"
                : "bg-[#e8f0fa] text-[#2b5f9e]",
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
          "w-[272px] shrink-0 flex flex-col h-screen bg-white border-r border-[#e5e9f0] z-50 text-slate-600",
          // Desktop: always visible
          "hidden lg:flex lg:sticky lg:top-0",
          // Mobile: slide-in overlay
          isOpen && "!flex fixed top-0 left-0 shadow-2xl",
        )}
      >
        {/* Logo + mobile close */}
        <div className="relative h-20 shrink-0 flex items-center justify-center px-6 border-b border-[#e5e9f0]">
          <img
            src="/Aliko Academy - LMS 2.png"
            alt="Aliko Academy LMS"
            className="h-10 w-auto max-w-[180px] object-contain"
          />
          <button
            onClick={onClose}
            className="absolute right-5 lg:hidden p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Nav */}
        <nav
          ref={navRef}
          onScroll={(e) => {
            instructorSidebarScrollTop = e.currentTarget.scrollTop;
          }}
          className="flex-1 overflow-y-auto sidebar-scroll py-5 px-4 space-y-5"
        >
          {visibleSections.map((section) => (
            <div key={section.title}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] px-3 mb-1.5">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default InstructorSidebar;
