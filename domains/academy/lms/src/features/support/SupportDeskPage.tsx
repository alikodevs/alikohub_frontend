import React, { useState } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  HelpCircle,
  LifeBuoy,
  Send,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MonitorCheck,
  FileText,
  MessageSquare,
  Loader2,
  ChevronDown,
  Info,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useMySupportTickets,
  useAllSupportTickets,
  useCreateSupportTicketMutation,
  useUpdateSupportTicketMutation,
  useSystemRequirements,
} from "@/features/rubric/hooks/useSupportDesk";
import { useUser } from "@/features/auth/hooks/useAuth";
import type {
  SupportTicket,
  SupportCategory,
  SupportStatus,
  SupportPriority,
  CreateSupportTicketDto,
} from "@/features/rubric/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const SupportDeskPage: React.FC = () => {
  const { data: user } = useUser();
  const role = (
    user?.academyUser?.role ||
    user?.globalRole ||
    ""
  ).toUpperCase();
  const isInstructorOrAuditor =
    role === "INSTRUCTOR" ||
    role === "ADMIN" ||
    role === "COURSE_MANAGER" ||
    role === "COMMISSION_AUDITOR";

  // Data queries
  const {
    data: myTickets,
    isLoading: isMyTicketsLoading,
  } = useMySupportTickets();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const {
    data: allTicketsData,
    isLoading: isAllTicketsLoading,
  } = useAllSupportTickets({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    category: categoryFilter === "ALL" ? undefined : categoryFilter,
  });

  const { data: systemRequirements } = useSystemRequirements();

  // Create ticket dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [category, setCategory] = useState<SupportCategory>("GENERAL");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<SupportPriority>("MEDIUM");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const createTicketMutation = useCreateSupportTicketMutation();

  // Instructor resolve dialog
  const [selectedTicketForResolution, setSelectedTicketForResolution] =
    useState<SupportTicket | null>(null);
  const [newStatus, setNewStatus] = useState<SupportStatus>("RESOLVED");
  const [resolutionText, setResolutionText] = useState("");

  const updateTicketMutation = useUpdateSupportTicketMutation();

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in subject and description.");
      return;
    }

    // Auto-capture browser diagnostics
    const diagnostics = {
      browser: navigator.userAgent,
      os: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      cookiesEnabled: navigator.cookieEnabled,
      webRtcSupported: Boolean(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      ),
    };

    const dto: CreateSupportTicketDto = {
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      attachmentUrl: attachmentUrl.trim() || undefined,
      clientDiagnostics: diagnostics,
    };

    try {
      await createTicketMutation.mutateAsync(dto);
      setIsCreateOpen(false);
      setSubject("");
      setDescription("");
      setAttachmentUrl("");
    } catch {
      // Handled by toast
    }
  };

  const handleOpenResolve = (ticket: SupportTicket) => {
    setSelectedTicketForResolution(ticket);
    setNewStatus(ticket.status === "RESOLVED" ? "RESOLVED" : "IN_PROGRESS");
    setResolutionText(ticket.resolution || "");
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicketForResolution) return;

    try {
      await updateTicketMutation.mutateAsync({
        ticketId: selectedTicketForResolution.id,
        dto: {
          status: newStatus,
          resolution: resolutionText.trim() || undefined,
        },
      });
      setSelectedTicketForResolution(null);
    } catch {
      // Handled by toast
    }
  };

  const rawTickets = isInstructorOrAuditor
    ? allTicketsData?.tickets || []
    : myTickets || [];

  const tickets = Array.isArray(rawTickets) ? rawTickets : [];

  const content = (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Academic & Technical Support Desk
              </h1>
              <p className="text-xs text-slate-500">
                WAC 246-841A-440(18) Rapid Student Support | 2h Urgent SLA | System Diagnostics.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Submit Support Request
        </Button>
      </div>

      {/* SLA & System Requirements Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <Clock className="w-8 h-8 text-primary shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Service Level Commitment
            </span>
            <p className="text-xs font-bold text-slate-900">
              Urgent issues: 2-hour response
            </p>
            <p className="text-[11px] text-slate-500">
              Standard inquiries: 24-hour SLA
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <Laptop className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              System Compatibility
            </span>
            <p className="text-xs font-bold text-slate-900">
              Chrome, Edge, Firefox, Safari
            </p>
            <p className="text-[11px] text-slate-500">
              Webcam & microphone enabled
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-blue-600 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Diagnostic Capture
            </span>
            <p className="text-xs font-bold text-slate-900">
              Automated client telemetry
            </p>
            <p className="text-[11px] text-slate-500">
              Browser, resolution, WebRTC check
            </p>
          </div>
        </div>
      </div>

      {/* Instructor Filters */}
      {isInstructorOrAuditor && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 bg-white border-slate-200 text-xs font-semibold h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-white border-slate-200 text-xs font-semibold h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="LOGIN_AUTH">Login & Auth</SelectItem>
                <SelectItem value="VIDEO_CONTENT_PLAYER">Video Player</SelectItem>
                <SelectItem value="QUIZ_EXAM_ERROR">Quiz / Exam Error</SelectItem>
                <SelectItem value="DISCUSSION_SUBMISSION">Discussion Post</SelectItem>
                <SelectItem value="BROWSER_COMPATIBILITY">Browser Compatibility</SelectItem>
                <SelectItem value="GENERAL">General Inquiries</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span className="text-xs font-medium text-slate-500">
            Total Tickets: <strong>{tickets.length}</strong>
          </span>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-slate-900">
          {isInstructorOrAuditor ? "Student Support Ticket Queue" : "Your Submitted Support Requests"}
        </h2>

        {isMyTicketsLoading || isAllTicketsLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Support Tickets Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              If you experience any technical issues with video lectures, seat-time tracking, or quiz submissions, submit a request here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const isOpen = ticket.status === "OPEN";
              const isResolved =
                ticket.status === "RESOLVED" || ticket.status === "CLOSED";

              return (
                <div
                  key={ticket.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{ticket.id}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5",
                          isOpen
                            ? "bg-rose-50 text-rose-700 border-rose-300"
                            : isResolved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-blue-50 text-blue-700 border-blue-300"
                        )}
                      >
                        {ticket.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-50 border-slate-200">
                        {ticket.category.replace(/_/g, " ")}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-[9px] font-bold border-0",
                          ticket.priority === "URGENT"
                            ? "bg-rose-600 text-white"
                            : ticket.priority === "HIGH"
                            ? "bg-amber-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        )}
                      >
                        {ticket.priority} PRIORITY
                      </Badge>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Submitted {new Date(ticket.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {ticket.subject}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>

                  {/* Resolution Feedback */}
                  {ticket.resolution && (
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <span className="font-bold text-[10px] uppercase text-emerald-700 block">
                        Support Staff Resolution Response:
                      </span>
                      <p className="text-xs">{ticket.resolution}</p>
                    </div>
                  )}

                  {/* Instructor Action */}
                  {isInstructorOrAuditor && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Student ID: {ticket.userId}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleOpenResolve(ticket)}
                        className="h-8 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                      >
                        Update Status / Respond
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Support Ticket Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-amber-600" />
            Submit Support Request
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Submit a request to AlikoHub Academy academic advisors or technical support.
          </DialogDescription>

          <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Issue Category
                </label>
                <Select
                  value={category}
                  onValueChange={(val) => setCategory(val as SupportCategory)}
                >
                  <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General Inquiries</SelectItem>
                    <SelectItem value="LOGIN_AUTH">Login & Authentication</SelectItem>
                    <SelectItem value="VIDEO_CONTENT_PLAYER">Video Playback / Seat-Time</SelectItem>
                    <SelectItem value="QUIZ_EXAM_ERROR">Quiz / Exam Submission</SelectItem>
                    <SelectItem value="DISCUSSION_SUBMISSION">Discussion Forum</SelectItem>
                    <SelectItem value="BROWSER_COMPATIBILITY">Browser / Camera Issues</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Priority
                </label>
                <Select
                  value={priority}
                  onValueChange={(val) => setPriority(val as SupportPriority)}
                >
                  <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium (Standard)</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent (Exam Blocker)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Subject
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Video lecture not recording seat-time heartbeats"
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Description of the Issue
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, any error messages, and what steps you took..."
                rows={4}
                className="text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Screenshot / Attachment URL (Optional)
              </label>
              <Input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://storage.example.com/screenshot.png"
                className="h-9 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createTicketMutation.isPending}
                className="h-9 text-xs font-bold bg-primary text-white"
              >
                {createTicketMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1.5" />
                )}
                Submit Ticket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Instructor Resolve Ticket Dialog */}
      <Dialog
        open={Boolean(selectedTicketForResolution)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicketForResolution(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle className="text-base font-black text-slate-900">
            Update Ticket #{selectedTicketForResolution?.id}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {selectedTicketForResolution?.subject}
          </DialogDescription>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Status
              </label>
              <Select
                value={newStatus}
                onValueChange={(val) => setNewStatus(val as SupportStatus)}
              >
                <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Resolution Instructions & Response
              </label>
              <Textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="Explain the solution, steps taken to resolve the error, or advice to the student..."
                rows={4}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTicketForResolution(null)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={updateTicketMutation.isPending}
                onClick={handleUpdateTicket}
                className="h-9 text-xs font-bold bg-primary text-white"
              >
                {updateTicketMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                )}
                Save Resolution
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isInstructorOrAuditor) {
    return <InstructorLayout>{content}</InstructorLayout>;
  }
  return <StudentLayout>{content}</StudentLayout>;
};

export default SupportDeskPage;

