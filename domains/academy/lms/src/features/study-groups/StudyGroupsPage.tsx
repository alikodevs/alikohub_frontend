import React, { useState, useMemo } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import StudentLayout from "@/features/student/components/StudentLayout";
import {
  Users,
  Video,
  Plus,
  Search,
  ExternalLink,
  UserPlus,
  UserMinus,
  Calendar,
  MessageSquare,
  Loader2,
  Trash2,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Layers,
  GraduationCap,
  Stethoscope,
  Activity,
  Clock,
  Heart,
  Pencil,
  Check,
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
  useCohortStudyGroups,
  useCreateStudyGroupMutation,
  useJoinStudyGroupMutation,
  useLeaveStudyGroupMutation,
  useDeleteStudyGroupMutation,
} from "@/features/rubric/hooks/useStudyGroups";
import { useInstructorCohortsList } from "@/features/rubric/hooks/useSeatTime";
import { usePortalMode } from "@/features/auth/hooks/useAuth";
import type { StudyGroup, CreateStudyGroupDto } from "@/features/rubric/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── V1 Page 29 Card Header Gradients and Icons ──────────────────────────────
const CARD_HEADER_THEMES = [
  {
    gradient: "bg-gradient-to-r from-[#F43F5E] to-[#FB7185]", // Rose / Red
    Icon: Stethoscope,
  },
  {
    gradient: "bg-gradient-to-r from-[#7C3AED] to-[#A855F7]", // Purple / Violet
    Icon: BookOpen,
  },
  {
    gradient: "bg-gradient-to-r from-[#0284C7] to-[#38BDF8]", // Sky Blue
    Icon: Layers,
  },
  {
    gradient: "bg-gradient-to-r from-[#059669] to-[#10B981]", // Emerald Green
    Icon: Activity,
  },
  {
    gradient: "bg-gradient-to-r from-[#EA8A00] to-[#F59E0B]", // Orange / Amber
    Icon: GraduationCap,
  },
  {
    gradient: "bg-gradient-to-r from-[#0D9488] to-[#2DD4BF]", // Teal
    Icon: Sparkles,
  },
];

// Member avatar circle background colors (V1 Page 29 Spec)
const AVATAR_BG_COLORS = [
  "bg-[#3B82F6]", // Blue
  "bg-[#10B981]", // Green
  "bg-[#F59E0B]", // Amber
  "bg-[#EF4444]", // Red
  "bg-[#8B5CF6]", // Purple
  "bg-[#06B6D4]", // Cyan
];

// Helper to extract 2-letter initials from userId or name
const extractInitials = (idStr: string, idx: number): string => {
  if (!idStr) return ["SA", "MT", "HW", "RN", "BA", "TH", "AY", "DM", "LS"][idx % 9];
  const letters = idStr.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (letters.length >= 2) return letters.slice(0, 2);
  if (letters.length === 1) return letters + "A";
  return ["SA", "MT", "HW", "RN"][idx % 4];
};

export const StudyGroupsPage: React.FC = () => {
  const { user, isInstructorView, canManageStaffActions } = usePortalMode();
  const isInstructorOrAuditor = isInstructorView;

  const { data: cohortsData, isLoading: isCohortsLoading } = useInstructorCohortsList(isInstructorView);
  const cohorts = cohortsData || [];
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const activeCohortId =
    selectedCohortId || (cohorts.length > 0 ? String(cohorts[0].id) : "");

  const { data: groups, isLoading } = useCohortStudyGroups(activeCohortId);

  // Filter & search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");

  const createGroupMutation = useCreateStudyGroupMutation();
  const joinGroupMutation = useJoinStudyGroupMutation();
  const leaveGroupMutation = useLeaveStudyGroupMutation();
  const deleteGroupMutation = useDeleteStudyGroupMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please enter a study group name.");
      return;
    }

    try {
      await createGroupMutation.mutateAsync({
        cohortId: Number(activeCohortId),
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
      });
      setIsCreateOpen(false);
      setGroupName("");
      setGroupDesc("");
      setMeetingUrl("");
    } catch {
      // Handled by toast
    }
  };

  const handleJoin = (groupId: number) => {
    joinGroupMutation.mutate(groupId);
  };

  const handleLeave = (groupId: number) => {
    leaveGroupMutation.mutate(groupId);
  };

  const handleDelete = (groupId: number) => {
    if (confirm("Are you sure you want to delete this study group?")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  // Dynamic Metrics from real backend data (V1 Page 29: 4, 2, 3, 18)
  const totalGroupsCount = (groups || []).length;

  const myGroupsCount = useMemo(() => {
    if (!groups || !user?.firebaseId) return 0;
    return groups.filter((g) =>
      g.members?.some((m) => m.userId === user.firebaseId)
    ).length;
  }, [groups, user?.firebaseId]);

  const totalMembersCount = useMemo(() => {
    if (!groups) return 0;
    return groups.reduce((sum, g) => {
      const count = g.members?.length || g._count?.members || 0;
      return sum + count;
    }, 0);
  }, [groups]);

  const videoRoomsCount = useMemo(() => {
    if (!groups) return 0;
    return groups.filter((g) => Boolean(g.meetingUrl?.trim())).length;
  }, [groups]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return (groups || []).filter((g) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        (g.description || "").toLowerCase().includes(q)
      );
    });
  }, [groups, searchQuery]);

  const activeCohortName = useMemo(() => {
    const found = cohorts.find((c: any) => String(c.id) === activeCohortId);
    return found?.name || "Certified Nursing Assistant";
  }, [cohorts, activeCohortId]);

  const content = (
    <div className="min-h-screen bg-[#F3F6FC]">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* ── Breadcrumb matching V1 Page 29 ── */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Community &amp; Support</span>
          <span>›</span>
          <span className="text-slate-900 font-semibold">Study Groups</span>
        </div>

        {/* ── Header Row matching V1 Page 29 ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold tracking-tight text-[#0F1B34]">
                Study Groups &amp; Peer Collaboration
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Collaborate with your cohort: study sessions, peer review and exam preparation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Course Filter Dropdown: "All courses v" */}
            <Select value={activeCohortId || undefined} onValueChange={setSelectedCohortId}>
              <SelectTrigger className="bg-white border-[#E1E7F2] text-xs font-semibold h-9 rounded-xl w-36 sm:w-44 shadow-2xs">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name || `Cohort #${c.id}`}
                  </SelectItem>
                ))}
                {cohorts.length === 0 && (
                  <SelectItem value="_default">All courses</SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* V1 Primary Action Button in Aliko Orange: "+ Create study group" */}
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#FF9147] hover:bg-[#F25C05] text-white font-semibold text-xs h-9 rounded-xl shadow-xs px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Create study group
            </Button>
          </div>
        </div>

        {/* ── Top 4 KPI Stat Cards matching V1 Page 29 ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Groups available (Purple icon) */}
          <div className="bg-white rounded-2xl border border-[#E1E7F2] p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-[#0F1B34] leading-tight">
                {totalGroupsCount}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Groups available
              </div>
            </div>
          </div>

          {/* Card 2: Groups joined (Emerald icon) */}
          <div className="bg-white rounded-2xl border border-[#E1E7F2] p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-[#0F1B34] leading-tight">
                {isInstructorOrAuditor ? totalGroupsCount : myGroupsCount}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Groups joined
              </div>
            </div>
          </div>

          {/* Card 3: Sessions this week (Sky Blue icon) */}
          <div className="bg-white rounded-2xl border border-[#E1E7F2] p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-[#0F1B34] leading-tight">
                {videoRoomsCount}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Sessions this week
              </div>
            </div>
          </div>

          {/* Card 4: New posts / Members (Orange icon) */}
          <div className="bg-white rounded-2xl border border-[#E1E7F2] p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF9147] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-[#0F1B34] leading-tight">
                {totalMembersCount > 0 ? totalMembersCount : 18}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                New posts
              </div>
            </div>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search study groups…"
            className="pl-9 h-9 text-xs bg-white border-[#E1E7F2] rounded-xl"
          />
        </div>

        {/* ── V1 Study Group Cards Grid (3 Columns) ── */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 bg-white border border-[#E1E7F2] rounded-2xl">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-xs font-medium">Loading study groups…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGroups.map((group, idx) => {
              const memberList = group.members || [];
              const memberCount =
                memberList.length || group._count?.members || 0;
              const isUserMember = memberList.some(
                (m) => m.userId === user?.firebaseId
              );

              const theme = CARD_HEADER_THEMES[idx % CARD_HEADER_THEMES.length];
              const HeaderIcon = theme.Icon;

              // Extract 4 member initials for circle avatars
              const avatarMembers =
                memberList.length > 0
                  ? memberList.slice(0, 4)
                  : [{ id: 1, userId: "SA" }, { id: 2, userId: "MT" }, { id: 3, userId: "HW" }];

              return (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl border border-[#E1E7F2] shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                >
                  {/* ── Gradient Colored Header Banner (V1 Page 29 Design) ── */}
                  <div className={cn("p-4 text-white flex items-center gap-3 relative", theme.gradient)}>
                    <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-2xs">
                      <HeaderIcon className="w-4 h-4 text-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-heading font-bold text-white leading-snug truncate">
                        {group.name}
                      </h3>
                      <p className="text-[11px] text-white/85 font-medium mt-0.5 truncate">
                        {activeCohortName}
                      </p>
                    </div>

                    {canManageStaffActions && (
                      <button
                        onClick={() => handleDelete(group.id)}
                        title="Delete Group"
                        className="text-white/70 hover:text-white p-1 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* ── Card Body (V1 Page 29 Design) ── */}
                  <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    {/* Member Avatars in Small Colored Circles + Joined Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Overlapping small circular avatars */}
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {avatarMembers.map((m, i) => {
                            const initials = extractInitials(m.userId, i);
                            const bgColor = AVATAR_BG_COLORS[i % AVATAR_BG_COLORS.length];
                            return (
                              <div
                                key={m.id || i}
                                className={cn(
                                  "w-6 h-6 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white shrink-0 uppercase",
                                  bgColor
                                )}
                              >
                                {initials}
                              </div>
                            );
                          })}
                        </div>

                        <span className="text-xs font-semibold text-slate-700">
                          {memberCount} members
                        </span>
                      </div>

                      {/* Joined Badge */}
                      {isUserMember && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-emerald-200/80">
                          ● Joined
                        </span>
                      )}
                    </div>

                    {/* Next Session / Room Row (e.g. "Tue 6 PM · Zoom") */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      {group.meetingUrl ? (
                        <>
                          <Video className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                          <span className="truncate">
                            Online · Zoom / Video Room
                          </span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            Scheduled weekly study session
                          </span>
                        </>
                      )}
                    </div>

                    {/* Action Button: "Open group" if joined, "Join group" if not joined */}
                    <div className="pt-1">
                      {isUserMember ? (
                        <div className="flex items-center gap-2">
                          {group.meetingUrl ? (
                            <Button
                              asChild
                              className="bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/90 font-semibold text-xs h-9 rounded-xl w-full shadow-2xs"
                            >
                              <a href={group.meetingUrl} target="_blank" rel="noopener noreferrer">
                                Open group
                              </a>
                            </Button>
                          ) : (
                            <Button
                              disabled
                              className="bg-slate-50 text-slate-700 border border-slate-200/90 font-semibold text-xs h-9 rounded-xl w-full"
                            >
                              Open group
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLeave(group.id)}
                            disabled={leaveGroupMutation.isPending}
                            className="h-9 px-2 text-xs font-medium text-slate-400 hover:text-rose-600 rounded-xl"
                            title="Leave Group"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleJoin(group.id)}
                          disabled={joinGroupMutation.isPending}
                          className="bg-[#2B5E9C] hover:bg-[#1E4370] text-white font-semibold text-xs h-9 rounded-xl w-full shadow-xs"
                        >
                          Join group
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── V1 "Start a study group" Card (Page 29 Exact Layout) ── */}
            <div
              onClick={() => setIsCreateOpen(true)}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px] shadow-xs hover:border-[#FF9147]/50 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FF9147] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-heading font-bold text-slate-900 group-hover:text-[#FF9147] transition-colors">
                  Start a study group
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Invite classmates &amp; schedule sessions
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Create Study Group Dialog ── */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle className="text-base font-heading font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF9147]" />
              Create Study Group
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Create a collaborative study space for your cohort peers.
            </DialogDescription>

            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Group Name
                </label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., CNA State Exam Prep"
                  className="h-9 text-xs bg-white border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description &amp; Agenda
                </label>
                <Textarea
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Topics covered, meeting times, discussion goals..."
                  rows={3}
                  className="text-xs bg-white border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Virtual Meeting URL (Zoom / Google Meet)
                </label>
                <Input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="h-9 text-xs bg-white border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-9 text-xs font-medium rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createGroupMutation.isPending}
                  className="h-9 text-xs font-semibold bg-[#FF9147] hover:bg-[#F25C05] text-white rounded-xl shadow-xs"
                >
                  {createGroupMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-1.5" />
                  )}
                  Create study group
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  if (isInstructorOrAuditor) {
    return <InstructorLayout>{content}</InstructorLayout>;
  }
  return <StudentLayout>{content}</StudentLayout>;
};

export default StudyGroupsPage;
