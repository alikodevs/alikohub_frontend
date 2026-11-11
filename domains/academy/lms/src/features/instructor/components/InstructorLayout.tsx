import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Repeat,
  User,
  LogOut,
  ChevronDown,
  Menu,
  Bell,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import InstructorSidebar from "@/features/instructor/components/InstructorSidebar";
import {
  useUser,
  useSwitchAcademyRole,
  useLogout,
  usePortalMode,
} from "@/features/auth/hooks/useAuth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useAcademy";
import { formatDistanceToNow } from "date-fns";

const InstructorLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatRoute = location.pathname === "/instructor/chat";
  const { data: user } = useUser();
  const { isAuditor } = usePortalMode();
  const { mutate: switchRole, isPending: isSwitching } = useSwitchAcademyRole();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const logout = useLogout();

  const { data: notifications } = useNotifications();
  const markReadMutation = useMarkNotificationRead();

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length ?? 0;
  const latestNotifications = notifications?.slice(0, 5) ?? [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitials = user
    ? `${user.firstname?.charAt(0) || ""}${user.lastname?.charAt(0) || ""}`.toUpperCase()
    : "U";

  const handleSwitchRole = () => {
    switchRole(
      { newRole: "student" },
      {
        onSuccess: () => {
          toast.success("Switched to Student role");
          navigate("/dashboard");
        },
      },
    );
  };

  const getNotificationTitle = (notif: any) => {
    if (notif.title) return notif.title;
    switch (notif.type?.toLowerCase()) {
      case "progress":
        return "Learning Progress";
      case "announcement":
        return "New Announcement";
      case "system":
        return "System Notice";
      case "grade":
        return "Submission Graded";
      default:
        return "Notification";
    }
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    setNotificationOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      {/* Sidebar */}
      <InstructorSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-[60px] shrink-0 z-20 bg-white border-b border-[#e5e9f0] flex items-center gap-3 px-6 sm:px-8 lg:px-10">
          {/* Hamburger - mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search courses, students..."
              className="pl-9 h-9 bg-[#f8fafc] border border-[#e5e9f0] focus-visible:ring-1 focus-visible:ring-[#2b5f9e] text-sm rounded-lg text-[#0f1b2d] placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  navigate(
                    `/instructor/courses?search=${encodeURIComponent(e.currentTarget.value.trim())}`,
                  );
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Student view switch / auditor read-only preview */}
            {isAuditor ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="gap-2 bg-white text-[#2b5f9e] border-[#e5e9f0] hover:bg-[#e8f0fa] hover:border-[#2b5f9e]/30 hover:text-[#2b5f9e] text-xs font-semibold h-9 rounded-lg hidden sm:flex transition-colors"
              >
                <Repeat className="w-3.5 h-3.5" />
                Preview Student View
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwitchRole}
                disabled={isSwitching}
                className="gap-2 bg-white text-[#0f1b2d] border-[#e5e9f0] hover:bg-[#f8fafc] hover:border-[#2b5f9e]/40 hover:text-[#2b5f9e] text-xs font-semibold h-9 rounded-lg hidden sm:flex transition-colors"
              >
                <Repeat className="w-3.5 h-3.5" />
                Switch to Student
              </Button>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  setProfileOpen(false);
                }}
                className="relative w-9 h-9 rounded-lg border border-[#e5e9f0] bg-white hover:bg-[#f8fafc] text-slate-600 hover:text-[#0f1b2d] flex items-center justify-center transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f26b21] text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-xl border shadow-xl z-[100] flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
                    <span className="font-bold text-sm text-foreground">
                      Notifications
                    </span>
                  </div>

                  {/* List */}
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                    {latestNotifications.length > 0 ? (
                      latestNotifications.map((notif: any) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className="p-3.5 flex gap-3 cursor-pointer transition-colors hover:bg-muted/50"
                        >
                          <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-medium text-foreground leading-snug truncate">
                                {getNotificationTitle(notif)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1.5 block">
                              {formatDistanceToNow(new Date(notif.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                        <Bell className="w-8 h-8 text-muted-foreground/45 mb-2" />
                        <p className="text-xs font-semibold text-foreground">
                          You're all caught up
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          No notifications at the moment.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2 border-t bg-muted/10 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs font-bold text-primary hover:text-primary hover:bg-primary/5 h-8"
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate("/instructor/notifications");
                      }}
                    >
                      View all
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage
                    src={user?.profilePicture || undefined}
                    alt={user?.firstname}
                  />
                  <AvatarFallback className="bg-[#2b5f9e] text-white text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-foreground">
                  {user ? `${user.firstname} ${user.lastname}` : "Instructor"}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-lg border shadow-lg py-2 z-[100]">
                  <div className="px-4 py-3 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage
                          src={user?.profilePicture || undefined}
                          alt={user?.firstname}
                        />
                        <AvatarFallback className="bg-[#2b5f9e] text-white font-bold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user
                            ? `${user.firstname} ${user.lastname}`
                            : "Instructor"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email || "instructor@alikohub.com"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile-only: Student switch inside dropdown */}
                  <div className="sm:hidden py-1 border-b">
                    <button
                      onClick={() => {
                        handleSwitchRole();
                        setProfileOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-[#e8f0fa] hover:text-[#2b5f9e] transition-colors w-full text-left"
                    >
                      <Repeat className="w-4 h-4" /> Switch to Student
                    </button>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </Link>
                  </div>

                  <div className="border-t py-1">
                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main
          className={cn(
            "flex-1",
            isChatRoute ? "overflow-hidden" : "overflow-y-auto",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default InstructorLayout;
