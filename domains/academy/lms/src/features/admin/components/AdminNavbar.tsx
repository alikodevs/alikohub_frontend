import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoLms from "@/assets/logo-lms.png";
import { useUser, useLogout } from "@/features/auth/hooks/useAuth";

const AdminNavbar = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
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
    <nav className="sticky top-0 z-50 nav-solid border-b border-border shadow-sm bg-slate-900 text-white">
      <div className="section-container flex items-center justify-between h-16 md:h-20">
        <Link to="/admin" className="flex items-center">
          <img
            src={logoLms}
            alt="Aliko Academy Admin"
            className="h-20 md:h-28 w-auto object-contain brightness-0 invert"
          />
        </Link>

        {/* User Profile */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Avatar className="h-8 w-8 border border-slate-700">
                <AvatarImage
                  src={user?.profilePicture || undefined}
                  alt={user?.firstname}
                />
                <AvatarFallback className="bg-red-500/20 text-red-500 font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-xl py-2 z-[100] text-slate-800">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold">
                    {user?.firstname} {user?.lastname}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4" /> Go to Website
                  </Link>
                  {!isAdmin && (
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" /> Switch to Student
                    </Link>
                  )}
                </div>

                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-slate-50 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:hidden"></div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
