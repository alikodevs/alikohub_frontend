import React, { useState, useMemo } from "react";
import {
  useAllSupportTickets,
  useUpdateSupportTicketMutation,
} from "@/features/rubric/hooks/useSupportDesk";
import type { SupportTicket, SupportStatus } from "@/features/rubric/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { LifeBuoy, Clock, CheckCircle2, Loader2 } from "lucide-react";

interface AdminSupportTabProps {
  userMap: Record<string, string>;
}

export const AdminSupportTab: React.FC<AdminSupportTabProps> = ({ userMap }) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const { data: ticketsRaw, isLoading } = useAllSupportTickets({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    category: categoryFilter === "ALL" ? undefined : categoryFilter,
  });

  const updateMutation = useUpdateSupportTicketMutation();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );
  const [nextStatus, setNextStatus] = useState<SupportStatus>("RESOLVED");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const tickets: SupportTicket[] = useMemo(() => {
    if (Array.isArray(ticketsRaw)) return ticketsRaw;
    return (ticketsRaw as any)?.tickets || [];
  }, [ticketsRaw]);

  const handleOpenUpdate = (t: SupportTicket) => {
    setSelectedTicket(t);
    setNextStatus(t.status === "OPEN" ? "IN_PROGRESS" : t.status);
    setResolutionNotes(t.resolution || "");
  };

  const handleSave = async () => {
    if (!selectedTicket) return;
    await updateMutation.mutateAsync({
      ticketId: selectedTicket.id,
      dto: {
        status: nextStatus,
        resolution: resolutionNotes.trim() || undefined,
      },
    });
    setSelectedTicket(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E1EAF2] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-[#2b5f9e]" />
            Platform Support Tickets ({tickets.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor and resolve student &amp; staff technical support inquiries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E1EAF2] bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#E1EAF2] bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="LOGIN_AUTH">Login &amp; Auth</option>
            <option value="VIDEO_CONTENT_PLAYER">Video Player</option>
            <option value="QUIZ_EXAM_ERROR">Quiz / Exam Error</option>
            <option value="DISCUSSION_SUBMISSION">Discussion Post</option>
            <option value="BROWSER_COMPATIBILITY">Browser Compatibility</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-[#E1EAF2] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 uppercase text-xs font-bold border-b border-[#E1EAF2]">
              <tr>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1EAF2]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <Clock className="w-7 h-7 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-xs">
                    No support tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-[#EAF4FB] transition-colors">
                    <td className="px-6 py-4 text-xs">
                      <div className="font-bold text-slate-900">
                        #{t.id} — {t.subject}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                        {t.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700 font-medium">
                      {userMap[t.userId] || t.userId}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {t.category}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase bg-slate-50 text-slate-700"
                      >
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenUpdate(t)}
                        className="h-8 px-3 text-xs font-bold"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
      >
        <DialogContent className="sm:max-w-md bg-white border-[#E1EAF2]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Update Support Ticket #{selectedTicket?.id}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Status
              </label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as SupportStatus)}
                className="w-full h-9 px-3 rounded-lg border border-[#E1EAF2] bg-white text-xs font-semibold"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Resolution Notes
              </label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
                placeholder="Enter resolution summary..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTicket(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={updateMutation.isPending}
              onClick={handleSave}
              className="bg-[#2b5f9e] hover:bg-[#234e83] text-white"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              )}
              Save Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

