import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  BookOpen,
  CreditCard,
  Megaphone,
  MessageCircle,
  Shield,
  Settings,
  HelpCircle,
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

export function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;

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
          "bg-[#0f172a] border-r border-white/10 transition-all duration-300 flex flex-col min-h-screen sticky top-0 z-50 shrink-0",
          // Desktop: Full width
          "lg:w-64",
          // Mobile: Toggleable full sidebar
          "w-64 fixed inset-y-0 left-0 lg:sticky -translate-x-full lg:translate-x-0",
          isOpen && "translate-x-0",
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 h-16 px-5 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-3">
            <img
              src={logoLms}
              alt="Aliko Hub LMS"
              className="w-8 h-8 object-contain"
            />
            <span className="hidden lg:block text-white font-bold text-sm tracking-wide font-heading">
              Aliko Hub LMS
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-scroll space-y-5">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const itemIsActive = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => onToggle(false)}
                      title={item.label}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "text-sm font-medium",
                        itemIsActive
                          ? "bg-[#2563eb] text-white shadow-lg shadow-[#2563eb]/25"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                      )}
                    >
                      <span className="shrink-0">{item.icon}</span>
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
