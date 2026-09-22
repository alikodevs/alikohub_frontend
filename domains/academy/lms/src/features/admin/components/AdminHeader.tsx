import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Search,
  Bell,
  Phone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useLogout } from "@/features/auth/hooks/useAuth";

interface AdminHeaderProps {
  title?: string;
  onMenuClick?: () => void;
  /** @deprecated — dark mode removed, kept for API compatibility */
  darkTheme?: boolean;
}

export function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { data: user } = useUser();
  const isAdmin = user?.globalRole === "ADMIN";
  const logout = useLogout();

  const userInitials = user
    ? `${user.firstname?.charAt(0) || ""}${user.lastname?.charAt(0) || ""}`.toUpperCase()
    : "A";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 h-16 px-4 md:px-6 flex items-center justify-between bg-white border-b border-[#E1EAF2]">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg transition-all text-slate-600 hover:bg-slate-100"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {/* Search bar */}
        <div className="relative hidden md:flex items-center flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            placeholder="Search..."
            className="w-full pl-9 pr-16 h-9 bg-slate-100 border-0 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded font-mono">
            Ctrl K
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
   
        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-slate-100"
          >
            <Avatar className="h-8 w-8 border border-slate-200">
              <AvatarImage
                src={user?.profilePicture || undefined}
                alt={user?.firstname}
              />
              <AvatarFallback className="bg-[#2563eb]/10 text-[#2563eb] font-bold text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start text-left">
              <span className="text-sm font-semibold leading-tight text-slate-800">
                {user?.firstname
                  ? `${user.firstname} ${user.lastname || ""}`
                  : "Global Administrator"}
              </span>
              <span className="text-[10px] leading-tight text-slate-500">
                Administrator
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[#E1EAF2] shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-200 bg-white text-slate-800">
              <div className="px-4 py-3 border-b border-[#E1EAF2]">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.firstname} {user?.lastname}
                </p>
                <p className="text-xs truncate text-slate-500">{user?.email}</p>
              </div>

              <div className="py-1">
                {!isAdmin && (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-[#EAF4FB] text-slate-700"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                    Switch to Student
                  </Link>
                )}
              </div>

              <div className="border-t border-[#E1EAF2] py-1">
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-3 px-4 py-2 text-sm transition-colors w-full text-left font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
