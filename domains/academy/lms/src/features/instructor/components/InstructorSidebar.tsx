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
} from "lucide-react";
import logoLms from "@/assets/Aliko Academy LMS Icon.png";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Dashboard", to: "/instructor", icon: LayoutDashboard },
  { label: "My Courses", to: "/instructor/courses", icon: BookOpen },
  { label: "Analytics", to: "/instructor/analytics", icon: BarChart },
  { label: "Chat", to: "/instructor/chat", icon: MessageCircle },
];

const manageNav = [
  { label: "Submissions", to: "/instructor/submissions", icon: ClipboardList },
  { label: "Schedules", to: "/instructor/schedules", icon: CalendarDays },
  { label: "Settings", to: "/instructor/settings", icon: Settings },
];

interface InstructorSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const InstructorSidebar = ({
  isOpen = false,
  onClose,
}: InstructorSidebarProps) => {
  const location = useLocation();

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
          "w-[240px] shrink-0 flex flex-col h-screen bg-[#0b1739] border-r border-slate-800/60 z-50 text-slate-300",
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
        <nav className="flex-1 overflow-y-auto sidebar-scroll py-6 px-4 space-y-7">
          <div>
            <p className="text-[10px] font-bold text-slate-400/70 uppercase tracking-[0.14em] px-3 mb-2.5">
              Main Menu
            </p>
            <div className="space-y-1.5">
              {mainNav.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400/70 uppercase tracking-[0.14em] px-3 mb-2.5">
              Manage
            </p>
            <div className="space-y-1.5">
              {manageNav.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default InstructorSidebar;
