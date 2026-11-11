import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateTeachingSchedule,
  useUpdateTeachingSchedule,
  useDeleteTeachingSchedule,
  useTeachingSchedules,
  useCohorts,
} from "@/hooks/useAcademy";
import {
  Calendar,
  Plus,
  Clock,
  Video,
  Edit3,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleTabProps {
  courseId: string;
}

const emptyForm = {
  title: "",
  description: "",
  type: "LIVE",
  cohortId: "",
  startTime: "",
  endTime: "",
};

const toLocalDatetimeInput = (iso?: string) => {
  if (!iso) return "";
  try {
    return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
};

export const ScheduleTab = ({ courseId }: ScheduleTabProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const { data: schedulesData, isLoading } = useTeachingSchedules();
  const { data: cohortsData } = useCohorts(courseId, undefined, {
    enabled: Boolean(courseId),
  });
  const createScheduleMutation = useCreateTeachingSchedule();
  const updateScheduleMutation = useUpdateTeachingSchedule();
  const deleteScheduleMutation = useDeleteTeachingSchedule();

  const cohorts = (cohortsData as any)?.cohorts || [];

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleEditClick = (session: any) => {
    setEditingId(Number(session.id));
    setFormData({
      title: session.title || "",
      description: session.description || "",
      type: session.type || "LIVE",
      cohortId: session.cohortId ? String(session.cohortId) : "",
      startTime: toLocalDatetimeInput(session.startTime),
      endTime: toLocalDatetimeInput(session.endTime),
    });
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in title, start time, and end time.");
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (end <= start) {
      toast.error("End time must be after start time.");
      return;
    }

    const payload: any = {
      courseId: Number(courseId),
      title: formData.title.trim(),
      type: formData.type,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      ...(formData.description.trim()
        ? { description: formData.description.trim() }
        : {}),
      ...(formData.cohortId ? { cohortId: Number(formData.cohortId) } : {}),
    };

    if (editingId) {
      updateScheduleMutation.mutate(
        { scheduleId: editingId, data: payload },
        { onSuccess: resetForm },
      );
    } else {
      createScheduleMutation.mutate(payload, { onSuccess: resetForm });
    }
  };

  const schedules = Array.isArray(schedulesData)
    ? schedulesData
    : (schedulesData as any)?.items || [];

  const filteredUpcoming =
    schedules?.filter(
      (s: any) => s.courseId?.toString() === courseId?.toString(),
    ) || [];

  const isSubmitting =
    createScheduleMutation.isPending || updateScheduleMutation.isPending;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 border-none">
            Teaching Schedule
          </h2>
          <p className="text-slate-500 text-sm">
            Create and manage your live sessions, Q&amp;A workshops, or office hours.
          </p>
        </div>
        <Button
          onClick={() => (isAdding ? resetForm() : setIsAdding(true))}
          className="bg-[#2b5f9e] hover:bg-[#234e83] text-white font-semibold gap-2 border-0"
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add Schedule
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-none shadow-xl bg-slate-50 ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2b5f9e]" />
            <CardTitle className="text-lg font-bold">
              {editingId ? "Edit Session Details" : "New Session Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-bold text-slate-700"
                >
                  Session Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Live Q&A Session"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="bg-white border-slate-200 focus:ring-[#2b5f9e] h-11"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="type"
                  className="text-sm font-bold text-slate-700"
                >
                  Session Type
                </Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5f9e] h-11"
                >
                  <option value="LIVE">Live Session</option>
                  <option value="RECORDING">Recorded Lecture Release</option>
                  <option value="Q_AND_A">Q &amp; A / Mentorship</option>
                  <option value="OFFICE_HOURS">Office Hours</option>
                  <option value="WORKSHOP">Workshop</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="cohortId"
                  className="text-sm font-bold text-slate-700"
                >
                  Target Cohort (Optional)
                </Label>
                <select
                  id="cohortId"
                  value={formData.cohortId}
                  onChange={(e) =>
                    setFormData({ ...formData, cohortId: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5f9e] h-11"
                >
                  <option value="">All cohorts in this course</option>
                  {cohorts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-bold text-slate-700"
                >
                  Description / Agenda
                </Label>
                <Textarea
                  id="description"
                  placeholder="Topics covered or joining instructions..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="bg-white border-slate-200 focus:ring-[#2b5f9e] min-h-[75px]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="startTime"
                  className="text-sm font-bold text-slate-700"
                >
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="bg-white border-slate-200 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="endTime"
                  className="text-sm font-bold text-slate-700"
                >
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="bg-white border-slate-200 h-11"
                />
              </div>

              <div className="md:col-span-2 pt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="h-11 px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#2b5f9e] hover:bg-[#234e83] text-white font-semibold h-11 px-8 rounded-lg transition-all"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                      ? "Update Schedule"
                      : "Create Schedule"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#2b5f9e]" />
          Scheduled Sessions
        </h3>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredUpcoming.length === 0 ? (
          <Card className="border-dashed border-2 bg-slate-50/50 flex flex-col items-center justify-center p-12">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <Calendar className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-500 font-medium">
              No sessions scheduled yet.
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Add a schedule above to organize live meetings with your students.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUpcoming.map((session: any) => {
              let formattedDate = "Invalid date";
              let formattedTimeRange = "";
              try {
                if (session.startTime) {
                  const startDate = new Date(session.startTime);
                  formattedDate = format(startDate, "PPP");
                  formattedTimeRange = `${format(startDate, "p")}`;
                  if (session.endTime) {
                    formattedTimeRange += ` - ${format(new Date(session.endTime), "p")}`;
                  }
                }
              } catch (e) {
                console.error("Date formatting error", e);
              }

              return (
                <Card
                  key={session.id}
                  className="border-none shadow-sm h-full group hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                              session.type === "LIVE"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {session.type}
                          </span>
                          {session.cohort?.name && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">
                              {session.cohort.name}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">
                          {session.title}
                        </h4>
                        {session.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {session.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(session)}
                          className="h-8 w-8 text-slate-400 hover:text-slate-900"
                          title="Edit session"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={deleteScheduleMutation.isPending}
                          onClick={() => deleteScheduleMutation.mutate(session.id)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600"
                          title="Delete session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-auto space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-50 p-2 rounded-lg">
                        <Clock className="w-4 h-4 text-[#2b5f9e]" />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-xs">
                            {formattedDate}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formattedTimeRange}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
