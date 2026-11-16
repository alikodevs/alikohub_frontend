import { useState } from "react";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  Megaphone,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Loader2,
  Send,
  X,
  Inbox,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnouncements, useCreateAnnouncement } from "@/hooks/useAcademy";
import { useUser } from "@/features/auth/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const Announcements = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data, isLoading, isError, error, refetch, isFetching } =
    useAnnouncements({ page, pageSize });
  const createMutation = useCreateAnnouncement();
  const { data: user } = useUser();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Check if user is instructor or admin
  const activeRole = (
    user?.academyUser?.activeRole ||
    user?.academyActiveRole ||
    ""
  )
    .toString()
    .toUpperCase();
  const isInstructorOrAdmin =
    user?.globalRole === "ADMIN" ||
    activeRole === "INSTRUCTOR" ||
    activeRole === "ADMIN";

  const announcements: Announcement[] = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await createMutation.mutateAsync({
      title: newTitle.trim(),
      content: newContent.trim(),
    });
    setNewTitle("");
    setNewContent("");
    setShowCreateForm(false);
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/40">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground leading-tight">
                  Announcements
                </h1>
                <p className="text-muted-foreground text-sm">
                  {total > 0
                    ? `${total} announcement${total !== 1 ? "s" : ""} posted`
                    : "Stay updated with the latest news"}
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

            {isInstructorOrAdmin && (
              <Button
                size="sm"
                onClick={() => setShowCreateForm(true)}
                className="h-9 text-xs font-semibold gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/30 border-0"
              >
                <Plus className="w-3.5 h-3.5" />
                New Announcement
              </Button>
            )}
          </div>
        </div>

        {/* Create Form (Inline Modal) */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl border border-amber-200/60 shadow-lg shadow-amber-100/20 overflow-hidden"
            >
              <div className="p-5 border-b border-amber-100/60 bg-gradient-to-r from-amber-50/50 to-orange-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Publish New Announcement
                  </h2>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New course available this week..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300 transition-all"
                    disabled={createMutation.isPending}
                    id="announcement-title-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Content
                  </label>
                  <textarea
                    placeholder="Write your announcement details here..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300 transition-all resize-none"
                    disabled={createMutation.isPending}
                    id="announcement-content-input"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewTitle("");
                      setNewContent("");
                    }}
                    className="h-9 text-xs font-semibold"
                    disabled={createMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={
                      !newTitle.trim() ||
                      !newContent.trim() ||
                      createMutation.isPending
                    }
                    className="h-9 text-xs font-semibold gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                    id="publish-announcement-btn"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Publish
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {isLoading ? (
          /* Loading State */
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/3 rounded-lg" />
                    <Skeleton className="h-3 w-full rounded-lg mt-2" />
                    <Skeleton className="h-3 w-5/6 rounded-lg" />
                  </div>
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
              Failed to load announcements
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
        ) : announcements.length === 0 ? (
          /* Empty State */
          <div className="bg-card rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mx-auto mb-5">
              <Inbox className="w-10 h-10 text-amber-300" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1.5">
              No announcements yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              When instructors or admins publish announcements, they'll appear
              here. Check back soon!
            </p>
          </div>
        ) : (
          /* Announcements List */
          <div className="space-y-3">
            {announcements.map((item, index) => {
              const isExpanded = expandedId === item.id;
              const isNew =
                Date.now() - new Date(item.createdAt).getTime() <
                24 * 60 * 60 * 1000;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div
                    className={`bg-card rounded-2xl border transition-all cursor-pointer group hover:shadow-md ${
                      isExpanded
                        ? "border-amber-200/60 shadow-lg shadow-amber-100/10 ring-1 ring-amber-200/30"
                        : "hover:border-amber-200/40"
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    id={`announcement-${item.id}`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-3.5">
                        {/* Icon */}
                        <div
                          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            isExpanded
                              ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200/40"
                              : "bg-amber-50 text-amber-500 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-orange-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-amber-200/40"
                          }`}
                        >
                          <Megaphone className="w-4.5 h-4.5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-amber-700 transition-colors">
                                  {item.title}
                                </h3>
                                {isNew && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-semibold uppercase tracking-wider">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    New
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(
                                    new Date(item.createdAt),
                                    { addSuffix: true },
                                  )}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  {format(
                                    new Date(item.createdAt),
                                    "MMM d, yyyy",
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Preview (collapsed) */}
                          {!isExpanded && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                              {item.content}
                            </p>
                          )}

                          {/* Full content (expanded) */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                    {item.content}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground font-medium">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    disabled={isFetching}
                    className={`h-8 w-8 p-0 text-xs font-bold ${
                      pageNum === page
                        ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                        : ""
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default Announcements;
