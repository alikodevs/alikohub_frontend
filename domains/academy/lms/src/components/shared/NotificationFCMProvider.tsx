import React, {
  useEffect,
  createContext,
  useContext,
} from "react";
import { onMessage, type MessagePayload } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Bell, Megaphone, BookOpen, Users, X, ArrowRight } from "lucide-react";

interface NotificationContextValue {
  // kept minimal — token registration removed, banner removed
}

const NotificationContext = createContext<NotificationContextValue>({});

export const useNotificationFCM = () => useContext(NotificationContext);

/** Maps data.type to a navigation path */
function getNavigationPath(data: Record<string, string>): string {
  switch (data.type) {
    case "ANNOUNCEMENT":
      return "/announcements";
    case "NEW_COURSE":
      return data.courseId ? `/courses/${data.courseId}` : "/courses";
    case "NEW_COHORT":
      return data.courseId ? `/courses/${data.courseId}` : "/courses";
    default:
      return "/dashboard";
  }
}

/** Maps data.type to a themed icon */
function getNotificationIcon(type?: string) {
  switch (type) {
    case "ANNOUNCEMENT":
      return <Megaphone className="w-5 h-5" />;
    case "NEW_COURSE":
      return <BookOpen className="w-5 h-5" />;
    case "NEW_COHORT":
      return <Users className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
}

function getNotificationColor(type?: string) {
  switch (type) {
    case "ANNOUNCEMENT":
      return {
        bg: "bg-gradient-to-br from-amber-50 to-orange-50",
        iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
        accent: "text-amber-600",
        border: "border-amber-200/60",
      };
    case "NEW_COURSE":
      return {
        bg: "bg-gradient-to-br from-indigo-50 to-purple-50",
        iconBg: "bg-gradient-to-br from-indigo-400 to-purple-500",
        accent: "text-indigo-600",
        border: "border-indigo-200/60",
      };
    case "NEW_COHORT":
      return {
        bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
        iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
        accent: "text-emerald-600",
        border: "border-emerald-200/60",
      };
    default:
      return {
        bg: "bg-gradient-to-br from-slate-50 to-gray-50",
        iconBg: "bg-gradient-to-br from-slate-400 to-gray-500",
        accent: "text-slate-600",
        border: "border-slate-200/60",
      };
  }
}

export const NotificationFCMProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const navigate = useNavigate();  /** Listen for foreground messages */
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
        const { title, body } = payload.notification || {};
        const data = (payload.data || {}) as Record<string, string>;
        const targetPath = getNavigationPath(data);
        const colors = getNotificationColor(data.type);

        toast.custom(
          (id) => (
            <div
              className={`w-[380px] ${colors.bg} ${colors.border} border rounded-2xl p-4 shadow-xl shadow-black/5 backdrop-blur-sm`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`${colors.iconBg} text-white p-2.5 rounded-xl shrink-0 shadow-lg`}
                >
                  {getNotificationIcon(data.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      {title || "New Notification"}
                    </p>
                    <button
                      onClick={() => toast.dismiss(id)}
                      className="p-0.5 rounded-full hover:bg-black/5 transition-colors shrink-0 mt-0.5"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                  {body && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {body}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      toast.dismiss(id);
                      navigate(targetPath);
                    }}
                    className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${colors.accent} hover:opacity-80 transition-opacity`}
                  >
                    View Details
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ),
          {
            duration: 8000,
            position: "top-right",
          },
        );
      });
    };

    setupListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);

  /** Listen for navigation messages from service worker */
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK" && event.data?.url) {
        navigate(event.data.url);
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handler);
    };
  }, [navigate]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationFCMProvider;
