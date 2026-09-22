import { useState } from "react";
import {
  BellRing,
  Search,
  Inbox,
  Mail,
  MailOpen,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useAcademy";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const InstructorNotifications = () => {
  const {
    data: notifications,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useNotifications();
  const markReadMutation = useMarkNotificationRead();

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length ?? 0;

  const filteredNotifications = notifications
    ?.filter((n: any) => {
      if (activeTab === "unread") return !n.isRead;
      return true;
    })
    .filter((n: any) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        n.title?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q)
      );
    });

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

  const handleMarkRead = (notifId: string) => {
    setMarkingId(notifId);
    markReadMutation.mutate(notifId, {
      onSettled: () => setMarkingId(null),
    });
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      handleMarkRead(notif.id);
    }
  };

  return (
    <InstructorLayout>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200/40">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground leading-tight">
                  Notifications
                </h1>
                <p className="text-muted-foreground text-sm">
                  {(notifications?.length ?? 0) > 0
                    ? `${notifications?.length ?? 0} notification${(notifications?.length ?? 0) !== 1 ? "s" : ""} · ${unreadCount} unread`
                    : "You're all caught up"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 text-xs font-semibold gap-1.5 border-slate-200"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              All
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "all"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {notifications?.length ?? 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "unread"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "unread"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 transition-all"
              id="notification-search-input"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          /* Loading State */
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="flex items-center gap-3.5">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/3 rounded-lg" />
                  </div>
                  <Skeleton className="w-20 h-4 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          /* Error State */
          <div className="bg-card rounded-2xl border border-red-100 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              Failed to load notifications
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              {(error as any)?.response?.data?.message ||
                (error as any)?.message ||
                "An unexpected error occurred. Please try again."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </Button>
          </div>
        ) : filteredNotifications?.length === 0 ? (
          /* Empty State */
          <div className="bg-card rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto mb-5">
              <Inbox className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1.5">
              {activeTab === "unread"
                ? "No unread notifications"
                : "All caught up!"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {activeTab === "unread"
                ? "You've read all your notifications. Nice work!"
                : "No new notifications for you right now. Check back soon!"}
            </p>
          </div>
        ) : (
          /* Notifications List */
          <div className="space-y-3">
            {filteredNotifications?.map((notif: any, index: number) => {
              const isUnread = !notif.isRead;

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div
                    className={`bg-card rounded-2xl border transition-all cursor-pointer group hover:shadow-md ${
                      isUnread
                        ? "border-blue-200/60 bg-blue-50/20 shadow-sm"
                        : "hover:border-slate-300"
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                    id={`notification-${notif.id}`}
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-3.5">
                        {/* Unread dot */}
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                            isUnread
                              ? "bg-blue-500 shadow-md shadow-blue-200/60"
                              : "bg-slate-200"
                          }`}
                        />

                        {/* Icon */}
                        <div
                          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            isUnread
                              ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-200/40"
                              : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                          }`}
                        >
                          {isUnread ? (
                            <Mail className="w-4.5 h-4.5" />
                          ) : (
                            <MailOpen className="w-4.5 h-4.5" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3
                                className={`text-sm leading-snug transition-colors ${
                                  isUnread
                                    ? "font-bold text-foreground"
                                    : "font-medium text-muted-foreground"
                                }`}
                              >
                                {getNotificationTitle(notif)}
                              </h3>
                              <p
                                className={`text-sm mt-0.5 line-clamp-1 ${
                                  isUnread
                                    ? "text-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {notif.message}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                            <span>
                              {formatDistanceToNow(new Date(notif.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span>
                              {format(new Date(notif.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUnread && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkRead(notif.id);
                              }}
                              title="Mark as read"
                              disabled={markingId === notif.id}
                              className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors"
                            >
                              {markingId === notif.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
};

export default InstructorNotifications;
