import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Repeat,
  Clock,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoLms from "@/assets/Aliko Academy LMS Icon.png";
import {
  useUser,
  useLogout,
  useSwitchAcademyRole,
} from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";

const lmsLinks: { label: string; to: string; external?: boolean }[] = [
  { label: "Explore", to: "/courses" },
  { label: "My Learning", to: "/learning" },
  { label: "Certifications", to: "/certifications" },
  { label: "Career Hub", to: "https://career.alikohub.com/", external: true },
];

const LmsNavbar = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const { data: user } = useUser();
  const logout = useLogout();
  const { mutate: switchRole, isPending: isSwitching } = useSwitchAcademyRole();

  const userInitials = user
    ? `${user.firstname?.charAt(0) || ""}${user.lastname?.charAt(0) || ""}`.toUpperCase()
    : "U";

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

  const isOnApplyPage = location.pathname === "/instructor/apply";

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
      <div className="section-container flex items-center justify-between h-16 md:h-20 md:grid md:grid-cols-3">
        <div className="flex justify-start">
          <Link to="/dashboard" className="flex items-center">
            <img
              src={logoLms}
              alt="Aliko Academy LMS"
              className="h-6 md:h-10 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="hidden md:flex justify-center gap-8">
          {lmsLinks.map((link) =>
            link.external ? (
              <a
                key={link.to}
                href={link.to}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium hover:text-primary ${
                  location.pathname === link.to
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        <div className="hidden md:flex justify-end items-center gap-3">
          {isInstructor ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchRole}
              disabled={isSwitching}
              className="gap-2 border-primary/20 text-primary cursor-pointer shadow-sm"
            >
              <Repeat className="w-4 h-4" />
              Switch to Instructor
            </Button>
          ) : isOnApplyPage ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2 border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
            >
              <GraduationCap className="w-4 h-4" />
              Switch to Student
            </Button>
          ) : isPending ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="gap-2 border-border text-muted-foreground shadow-sm"
            >
              <Clock className="w-4 h-4" />
              Application pending
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2 border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
            >
              <Link to="/instructor/apply">
                <Sparkles className="w-4 h-4" />
                Apply for instructor
              </Link>
            </Button>
          )}

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage
                  src={user?.profilePicture || undefined}
                  alt={user?.firstname}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">
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
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {user
                          ? `${user.firstname} ${user.lastname}`
                          : "Student"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || "student@alikohub.com"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  {/* <Link
                    to="/photo"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Camera className="w-4 h-4" /> Photo
                  </Link>
                  <Link
                    to="/account-security"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Shield className="w-4 h-4" /> Account Security
                  </Link>
                  <Link
                    to="/subscriptions"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <CreditCard className="w-4 h-4" /> Subscriptions
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <BellRing className="w-4 h-4" /> Notification Preferences
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </Link> */}
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

        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border px-4 py-6 shadow-xl space-y-4 z-50 overflow-y-auto max-h-[calc(100vh-4rem)]"
          >
            {lmsLinks.map((link) =>
              link.external ? (
                <a
                  key={link.to}
                  href={link.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ),
            )}
            {isInstructor ? (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 border-primary/20 text-primary shadow-sm"
                  onClick={() => {
                    handleSwitchRole();
                    setOpen(false);
                  }}
                  disabled={isSwitching}
                >
                  <Repeat className="w-4 h-4" />
                  Switch to Instructor
                </Button>
              </div>
            ) : isOnApplyPage ? (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 border-primary/20 text-primary"
                  onClick={() => {
                    navigate("/dashboard");
                    setOpen(false);
                  }}
                >
                  <GraduationCap className="w-4 h-4" />
                  Switch to Student
                </Button>
              </div>
            ) : isPending ? (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 border-border text-muted-foreground"
                  disabled
                >
                  <Clock className="w-4 h-4" />
                  Application pending
                </Button>
              </div>
            ) : (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 border-primary/20 text-primary"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link to="/instructor/apply">
                    <Sparkles className="w-4 h-4" />
                    Apply for instructor
                  </Link>
                </Button>
              </div>
            )}
            <div className="flex gap-4 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-muted-foreground hover:text-primary h-10"
                asChild
              >
                <a
                  href="https://academy.alikohub.com"
                  onClick={() => setOpen(false)}
                >
                  Back to Website
                </a>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 h-10"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
              >
                Log Out
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default LmsNavbar;
