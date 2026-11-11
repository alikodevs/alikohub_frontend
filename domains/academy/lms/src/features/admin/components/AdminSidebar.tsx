import React, { useLayoutEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  BookOpen,
  CreditCard,
  Megaphone,
  MessageCircle,
  Award,
  Layers,
  UserCheck,
  FileText,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoLms from "@/assets/Aliko Academy LMS Icon.png";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

/* ─── Grouped navigation sections ─── */
const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "ACADEMY",
    items: [
      {
        label: "Course Reviews",
        href: "/admin/courses",
        icon: <BookOpen className="w-5 h-5" />,
      },
      {
        label: "Teacher Applications",
        href: "/admin/applications",
        icon: <Users className="w-5 h-5" />,
      },
      {
        label: "Faculty & Credentials",
        href: "/admin/faculty",
        icon: <Award className="w-5 h-5" />,
      },
      {
        label: "Enrollments & Cohorts",
        href: "/admin/enrollments",
        icon: <Layers className="w-5 h-5" />,
      },
      {
        label: "Users Directory",
        href: "/admin/users",
        icon: <UserCheck className="w-5 h-5" />,
      },
      {
        label: "Content Library",
        href: "/admin/content",
        icon: <FileText className="w-5 h-5" />,
      },
      {
        label: "Announcements",
        href: "/admin/announcements",
        icon: <Megaphone className="w-5 h-5" />,
      },
      {
        label: "Platform Analytics",
        href: "/admin/analytics",
        icon: <BarChart3 className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "OVERSIGHT & SUPPORT",
    items: [
      {
        label: "Compliance & Audits",
        href: "/admin/compliance",
        icon: <ShieldCheck className="w-5 h-5" />,
      },
      {
        label: "Support Tickets",
        href: "/admin/support",
        icon: <LifeBuoy className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "PAYMENTS",
    items: [
      {
        label: "Platform Payments",
        href: "/admin/transactions",
        icon: <CreditCard className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      {
        label: "Chat",
        href: "/admin/chat",
        icon: <MessageCircle className="w-5 h-5" />,
      },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: (state: boolean) => void;
}

let adminSidebarScrollTop = 0;

export function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const navRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (navRef.current && adminSidebarScrollTop > 0) {
      navRef.current.scrollTop = adminSidebarScrollTop;
    }
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/";
    }
    if (href === "/admin/courses") {
      return (
        pathname === "/admin/courses" || pathname.startsWith("/admin/courses/")
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar Container */}
      <div
        className={cn(
          "bg-white border-r border-[#e5e9f0] transition-all duration-300 flex flex-col min-h-screen sticky top-0 z-50 shrink-0 text-slate-600",
          // Desktop: Full width
          "lg:w-[272px]",
          // Mobile: Toggleable full sidebar
          "w-[272px] fixed inset-y-0 left-0 lg:sticky -translate-x-full lg:translate-x-0",
          isOpen && "translate-x-0",
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 h-[60px] px-5 border-b border-[#e5e9f0]">
          <Link to="/admin" className="flex items-center gap-3">
            <img
              src={logoLms}
              alt="Aliko Hub LMS"
              className="w-8 h-8 object-contain"
            />
            <span className="hidden lg:block text-[#0f1b2d] font-bold text-sm tracking-wide font-heading">
              Aliko Hub LMS
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav
          ref={navRef}
          onScroll={(e) => {
            adminSidebarScrollTop = e.currentTarget.scrollTop;
          }}
          className="flex-1 px-3 py-4 overflow-y-auto sidebar-scroll space-y-5"
        >
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] px-3 mb-1.5">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const itemIsActive = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => onToggle(false)}
                      title={item.label}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150",
                        "text-sm font-semibold",
                        itemIsActive
                          ? "bg-[#e8f0fa] text-[#2b5f9e]"
                          : "text-slate-600 hover:bg-[#f8fafc] hover:text-[#0f1b2d]",
                      )}
                    >
                      {itemIsActive && (
                        <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r bg-[#f26b21]" />
                      )}
                      <span
                        className={cn(
                          "shrink-0",
                          itemIsActive ? "text-[#2b5f9e]" : "text-slate-400",
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Overlay for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[45] lg:hidden backdrop-blur-sm transition-all animate-in fade-in duration-300"
          onClick={() => onToggle(false)}
        />
      )}
    </>
  );
}
