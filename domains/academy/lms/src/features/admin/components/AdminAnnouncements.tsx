import React, { useState } from "react";
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from "@/hooks/useAcademy";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Megaphone,
  Plus,
  Send,
  Loader2,
  Clock,
  CalendarDays,
  Inbox,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function AdminAnnouncements() {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const { data, isLoading, isError, error, refetch, isFetching } =
    useAnnouncements({ page, pageSize });
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  const announcements = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await createMutation.mutateAsync({
        title: newTitle.trim(),
        content: newContent.trim(),
      });
      setNewTitle("");
      setNewContent("");
      setShowCreate(false);
    } catch (err) {
      // Handled in hooks
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editTitle.trim() || !editContent.trim()) return;
    try {
      await updateMutation.mutateAsync({
        id: editTarget,
        data: {
          title: editTitle.trim(),
          content: editContent.trim(),
        },
      });
      setShowEdit(false);
      setEditTarget(null);
    } catch (err) {}
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      {/* Title section + publish toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Broadcast Announcements
          </h2>
          <div className="h-0.5 w-8 bg-[#F37E28] rounded-full mt-0.5" />
          <p className="text-xs text-slate-500 mt-1">
            Publish site-wide announcements and send push notifications to app
            users.
          </p>
        </div>

        <Button
          onClick={() => setShowCreate(true)}
          className="gap-2 bg-[#0095DA] hover:bg-[#007BB8] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
        >
          Create Announcement
          <Plus size={14} />
        </Button>
      </div>

      {/* History & List Panel */}
      <div className="bg-white border border-[#E1EAF2] rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-[#E1EAF2] flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">
            Announcement Registry ({total})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 text-xs font-semibold gap-1.5 border-[#E1EAF2] text-slate-600"
          >
            <RefreshCw
              className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`}
            />
            Sync
          </Button>
        </div>

        {isLoading ? (
          /* Loading skeletons matching dashboard grids */
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-3 w-5/6 rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          /* Error Card */
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">
              Failed to load announcements
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {(error as any)?.response?.data?.message ||
                (error as any)?.message ||
                "An error occurred helper payload."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-3 gap-1.5 text-xs font-semibold"
            >
              Retry
            </Button>
          </div>
        ) : announcements.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EAF4FB] flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-[#0095DA]/30" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              No announcements broadcasted yet
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Start sharing updates, cohort releases, scheduling revisions, etc.
              with learners.
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              className="mt-4 gap-1 bg-[#0095DA] hover:bg-[#007BB8] text-white text-xs font-bold rounded-xl"
            >
              Create Announcement
            </Button>
          </div>
        ) : (
          /* Table Log */
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 uppercase text-xs font-bold border-b border-zinc-200 dark:border-[#3f3f46] transition-colors duration-300">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Message Summary</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1EAF2]">
                {announcements.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#EAF4FB] transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-800 text-sm max-w-[200px] truncate">
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 line-clamp-2 max-w-md leading-relaxed whitespace-pre-wrap">
                        {item.content}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 font-bold text-zinc-700 ">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <span className="flex items-center gap-1 text-[10px]">
                          <CalendarDays className="w-3 h-3 text-zinc-400" />
                          {format(new Date(item.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditTarget(item.id);
                            setEditTitle(item.title);
                            setEditContent(item.content);
                            setShowEdit(true);
                          }}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#E1EAF2]">
                <span className="text-xs text-zinc-500 font-medium">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 bg-white hover:bg-[#EAF4FB] border border-[#E1EAF2] text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    className="px-3 py-1.5 bg-white hover:bg-[#EAF4FB] border border-[#E1EAF2] text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isFetching}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[550px] bg-white border border-[#E1EAF2]">
          <DialogHeader>
            <DialogTitle className="text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Create New Announcement
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              This announcement will be published to the registry immediately
              and sent to all students.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance, New Course Release..."
                className="w-full px-4 py-2 rounded-lg border border-[#E1EAF2] bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#F37E28]/40 focus:border-[#F37E28] transition-all"
                disabled={createMutation.isPending}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Content Body
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Type the announcement message details here..."
                rows={5}
                className="w-full px-4 py-2 rounded-lg border border-[#E1EAF2] bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#F37E28]/40 focus:border-[#F37E28] transition-all resize-none"
                disabled={createMutation.isPending}
                required
              />
            </div>

            <DialogFooter className="pt-4 border-t border-[#E1EAF2] gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreate(false);
                  setNewTitle("");
                  setNewContent("");
                }}
                disabled={createMutation.isPending}
                className="text-xs text-slate-500 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !newTitle.trim() ||
                  !newContent.trim() ||
                  createMutation.isPending
                }
                className="bg-[#0095DA] hover:bg-[#007BB8] text-white text-xs font-bold flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Publish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Modal */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-[550px] bg-white border border-[#E1EAF2]">
          <DialogHeader>
            <DialogTitle className="text-slate-800 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-500" />
              Edit Announcement
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Update the details of the announcement. Changes will be saved to the registry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance, New Course Release..."
                className="w-full px-4 py-2 rounded-lg border border-[#E1EAF2] bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#F37E28]/40 focus:border-[#F37E28] transition-all"
                disabled={updateMutation.isPending}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Content Body
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Type the announcement message details here..."
                rows={5}
                className="w-full px-4 py-2 rounded-lg border border-[#E1EAF2] bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#F37E28]/40 focus:border-[#F37E28] transition-all resize-none"
                disabled={updateMutation.isPending}
                required
              />
            </div>

            <DialogFooter className="pt-4 border-t border-[#E1EAF2] gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowEdit(false);
                  setEditTarget(null);
                }}
                disabled={updateMutation.isPending}
                className="text-xs text-slate-500 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !editTitle.trim() ||
                  !editContent.trim() ||
                  updateMutation.isPending
                }
                className="bg-[#0095DA] hover:bg-[#007BB8] text-white text-xs font-bold flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
