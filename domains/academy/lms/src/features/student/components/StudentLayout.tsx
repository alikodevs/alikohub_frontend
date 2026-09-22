import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Repeat,
  Sparkles,
  User,
  LogOut,
  ChevronDown,
  Menu,
  GraduationCap,
  Bell,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StudentSidebar from "@/features/student/components/StudentSidebar";
import { cn } from "@/lib/utils";
import {
  useUser,
  useSwitchAcademyRole,
  useLogout,
} from "@/features/auth/hooks/useAuth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useAcademy";
import { formatDistanceToNow } from "date-fns";

const StudentLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatRoute = location.pathname === "/chat";
  const { data: user } = useUser();
  const { mutate: switchRole, isPending: isSwitching } = useSwitchAcademyRole();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const logout = useLogout();

  const { data: notifications } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

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

  const latestNotifications = notifications?.slice(0, 5) ?? [];

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

  const instructorStatus = user?.instructorStatus?.toUpperCase();
  const isInstructor =
    user?.globalRole === "ADMIN" ||
    user?.academyUser?.role === "INSTRUCTOR" ||
    instructorStatus === "ACCEPTED" ||
    instructorStatus === "APPROVED" ||
    instructorStatus === "ACTIVE" ||
    user?.roleStatus?.instructor === "ACTIVE" ||
    user?.roleStatus?.instructor?.toUpperCase() === "ACTIVE";

  const isPending =
    user?.hasTeacherApplication ||
    instructorStatus === "PENDING" ||
    user?.roleStatus?.instructor === "pending" ||
    user?.roleStatus?.instructor?.toUpperCase() === "PENDING";

  // Whether the user is currently on the apply-for-instructor page
  const isOnApplyPage = location.pathname === "/instructor/apply";

  const userInitials = user
    ? `${user.firstname?.charAt(0) || ""}${user.lastname?.charAt(0) || ""}`.toUpperCase()
    : "U";

  const handleSwitchRole = () => {
    switchRole(
      { newRole: "instructor" },
      {
        onSuccess: () => {
          toast.success("Switched to Instructor role");
          navigate("/instructor");
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7fc]">
      {/* Sidebar */}
      <StudentSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 z-20 bg-white border-b border-slate-200/80 flex items-center gap-3 px-6 sm:px-8 lg:px-10">
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
              placeholder="Search courses, topics..."
              className="pl-9 h-9.5 bg-[#f0f4f9] border-0 focus-visible:ring-1 text-sm rounded-xl text-slate-800 placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  navigate(
                    `/courses?search=${encodeURIComponent(e.currentTarget.value.trim())}`,
                  );
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Role button — three states */}
            {isInstructor ? (
              /* Approved instructor: switch to instructor dashboard */
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwitchRole}
                disabled={isSwitching}
                className="gap-2 text-primary border-primary/20 hover:bg-primary/10 hover:text-primary text-xs h-9 hidden sm:flex transition-colors"
              >
                <Repeat className="w-3.5 h-3.5" />
                Switch to Instructor
              </Button>
            ) : isOnApplyPage ? (
              /* On the apply page: show "Student view" to go back to dashboard */
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="gap-2 text-primary border-primary/20 hover:bg-primary/10 hover:text-primary text-xs h-9 hidden sm:flex transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Switch to Student
              </Button>
            ) : isPending ? (
              /* Application submitted but not yet approved: disabled pending state */
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-2 text-muted-foreground border-border text-xs h-9 hidden sm:flex"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Application pending
              </Button>
            ) : (
              /* New user: no application yet */
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2 text-primary border-primary/20 hover:bg-primary/10 hover:text-primary text-xs h-9 hidden sm:flex transition-colors"
              >
                <Link to="/instructor/apply">
                  <Sparkles className="w-3.5 h-3.5" />
                  Apply for instructor
                </Link>
              </Button>
            )}

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  setProfileOpen(false); // close profile dropdown if open
                }}
                className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-1"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-xl border shadow-xl z-[100] flex flex-col overflow-hidden">
                  {/* Popover Header */}
                  <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
                    <span className="font-bold text-sm text-foreground">
                      Notifications
                    </span>
                  </div>

                  {/* Popover Body - Latest 5 Notifications */}
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                    {latestNotifications.length > 0 ? (
                      latestNotifications.map((notif: any) => {
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className="p-3.5 flex gap-3 cursor-pointer transition-colors text-left hover:bg-muted/50"
                          >
                            {/* Icon */}
                            <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
                              <Bell className="w-4 h-4" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <p className="text-xs leading-snug truncate font-medium text-foreground">
                                  {getNotificationTitle(notif)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1.5 block">
                                {formatDistanceToNow(
                                  new Date(notif.createdAt),
                                  {
                                    addSuffix: true,
                                  },
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      /* Empty state */
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

                  {/* Popover Footer */}
                  <div className="p-2 border-t bg-muted/10 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs font-bold text-primary hover:text-primary hover:bg-primary/5 h-8"
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate("/notifications");
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
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-foreground">
                  {user ? `${user.firstname} ${user.lastname}` : "Student"}
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
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user
                            ? `${user.firstname} ${user.lastname}`
                            : "Student"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email || "student@alikohub.com"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile-only: role button inside dropdown */}
                  <div className="sm:hidden py-1 border-b">
                    {isInstructor ? (
                      <button
                        onClick={() => {
                          handleSwitchRole();
                          setProfileOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors w-full text-left"
                      >
                        <Repeat className="w-4 h-4" /> Switch to Instructor
                      </button>
                    ) : isOnApplyPage ? (
                      <button
                        onClick={() => {
                          navigate("/dashboard");
                          setProfileOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors w-full text-left"
                      >
                        <GraduationCap className="w-4 h-4" /> Switch to Student
                      </button>
                    ) : isPending ? (
                      <span className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4" /> Application pending
                      </span>
                    ) : (
                      <Link
                        to="/instructor/apply"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Sparkles className="w-4 h-4" /> Apply for instructor
                      </Link>
                    )}
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

export default StudentLayout;
