import { useLayoutEffect, useRef } from "react";
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
  GraduationCap,
  FileCheck2,
  Stethoscope,
  Building2,
  FileSpreadsheet,
  Users,
  LifeBuoy,
  Star,
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

let studentSidebarScrollTop = 0;

const StudentSidebar = ({ isOpen = false, onClose }: StudentSidebarProps) => {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (navRef.current && studentSidebarScrollTop > 0) {
      navRef.current.scrollTop = studentSidebarScrollTop;
    }
  }, []);
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

  const sections = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
        { label: "Explore", to: "/courses", icon: Compass },
        {
          label: "My Learning",
          to: "/learning",
          icon: BookOpen,
          badge: activeEnrollmentsCount,
        },
        { label: "My Schedule", to: "/schedules", icon: CalendarDays },
        { label: "Chat", to: "/chat", icon: MessageCircle },
      ],
    },
    {
      title: "Admissions & Onboarding",
      items: [
        { label: "Admissions", to: "/admissions", icon: FileCheck2 },
        { label: "Orientation", to: "/orientation", icon: GraduationCap },
      ],
    },
    {
      title: "Training & Curriculum",
      items: [
        { label: "My Grades", to: "/grades", icon: Award },
        { label: "Curriculum Crosswalk", to: "/curriculum", icon: FileSpreadsheet },
        { label: "Skills Lab", to: "/skills-lab", icon: Stethoscope },
        { label: "Clinical Training", to: "/clinical", icon: Building2 },
      ],
    },
    {
      title: "Community & Support",
      items: [
        { label: "Study Groups", to: "/study-groups", icon: Users },
        { label: "Peer Grading", to: "/peer-grading", icon: MessageSquareText },
        { label: "Program Evaluation", to: "/evaluations", icon: Star },
        { label: "Support Desk", to: "/support", icon: LifeBuoy },
      ],
    },
    { title: "Achieve", items: achieveNav },
    { title: "Account", items: accountNav },
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
          "relative w-[272px] shrink-0 flex flex-col h-screen bg-white border-r border-[#e5e9f0] z-50 text-slate-600",
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
            studentSidebarScrollTop = e.currentTarget.scrollTop;
          }}
          className="flex-1 overflow-y-auto sidebar-scroll py-5 px-4 space-y-5 pb-10"
        >
          {sections.map((section) => (
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

        {/* Floating Circular Down Arrow Scroll Cue */}
        <div className="absolute bottom-[118px] left-0 right-0 pointer-events-none flex justify-center z-30">
          <button
            type="button"
            aria-label="Scroll down sidebar"
            onClick={() => {
              navRef.current?.scrollBy({ top: 160, behavior: "smooth" });
            }}
            className="pointer-events-auto w-7 h-7 rounded-full bg-white text-[#2b5f9e] shadow-sm flex items-center justify-center hover:bg-[#e8f0fa] hover:scale-105 transition-all cursor-pointer border border-[#e5e9f0]"
          >
            <ChevronDown size={15} />
          </button>
        </div>

        {/* Bottom footer card */}
        <div className="px-3 pb-3 pt-2 shrink-0">
          <div className="rounded-xl border border-[#e5e9f0] bg-[#f8fafc] p-3.5 space-y-1.5">
            <p className="text-[#0f1b2d] font-heading font-bold text-[13px] leading-tight">
              Learn · Grow · Succeed
            </p>
            <div className="w-7 h-0.5 bg-[#f26b21] rounded-full" />
            <p className="text-slate-500 text-xs leading-snug">
              Finish your courses to unlock your certificate.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar;
