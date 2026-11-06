import React, { useState } from "react";
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
import { useUser } from "@/features/auth/hooks/useAuth";
import type { StudyGroup, CreateStudyGroupDto } from "@/features/rubric/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const StudyGroupsPage: React.FC = () => {
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

  const { data: cohortsData } = useInstructorCohortsList();
  const cohorts = cohortsData || [];
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const activeCohortId =
    selectedCohortId || (cohorts.length > 0 ? String(cohorts[0].id) : "1");

  const { data: groups, isLoading } = useCohortStudyGroups(activeCohortId);

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

  const filteredGroups = (groups || []).filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const content = (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Cohort Study Groups & Peer Collaboration
              </h1>
              <p className="text-xs text-slate-500">
                Collaborative virtual study rooms, peer review, and group exam preparation.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Create Study Group
        </Button>
      </div>

      {/* Cohort Selector & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-64">
          <Select value={activeCohortId} onValueChange={setSelectedCohortId}>
            <SelectTrigger className="bg-white border-slate-200 text-xs font-semibold h-10">
              <SelectValue placeholder="Select Cohort" />
            </SelectTrigger>
            <SelectContent>
              {cohorts.map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name || `Cohort #${c.id}`}
                </SelectItem>
              ))}
              {cohorts.length === 0 && (
                <SelectItem value="1">Cohort 1 (Default)</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search study groups..."
            className="pl-9 h-10 bg-white border-slate-200 text-xs"
          />
        </div>
      </div>

      {/* Study Groups Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading study groups...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Study Groups Found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a new study group to coordinate group review sessions, quiz practice, or skills review with your peers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const memberCount =
              group.members?.length || group._count?.members || 0;
            const isUserMember = group.members?.some(
              (m) => m.userId === user?.firebaseId
            );

            return (
              <div
                key={group.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold text-[10px]">
                      {memberCount} Active Members
                    </Badge>
                    {isInstructorOrAuditor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(group.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                        {group.description}
                      </p>
                    )}
                  </div>

                  {group.meetingUrl && (
                    <a
                      href={group.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-bold hover:underline"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Video Meeting Room
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </span>

                  {!isInstructorOrAuditor && (
                    isUserMember ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLeave(group.id)}
                        disabled={leaveGroupMutation.isPending}
                        className="h-8 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <UserMinus className="w-3.5 h-3.5 mr-1" /> Leave
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleJoin(group.id)}
                        disabled={joinGroupMutation.isPending}
                        className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> Join Group
                      </Button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Study Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Create Cohort Study Group
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Create a collaborative study space for your cohort peers.
          </DialogDescription>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Group Name
              </label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Module 3 CNA Skills & Exam Review"
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Description & Agenda
              </label>
              <Textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="Topics covered, meeting times, discussion goals..."
                rows={3}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Virtual Meeting URL (Zoom / Google Meet)
              </label>
              <Input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
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
                disabled={createGroupMutation.isPending}
                className="h-9 text-xs font-bold bg-primary text-white"
              >
                {createGroupMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-1.5" />
                )}
                Create Group
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isInstructorOrAuditor) {
    return <InstructorLayout>{content}</InstructorLayout>;
  }
  return <StudentLayout>{content}</StudentLayout>;
};

export default StudyGroupsPage;

