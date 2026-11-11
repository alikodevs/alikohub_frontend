import React, { useState } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import {
  Calendar,
  Clock,
  BellRing,
  PlusCircle,
  Video,
  PlayCircle,
  HelpCircle,
  BookOpen,
  Info,
  CalendarDays,
  Edit3,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateTeachingSchedule,
  useUpdateTeachingSchedule,
  useDeleteTeachingSchedule,
  useTeachingSchedules,
  useInstructorCourses,
  useCohorts,
} from "@/hooks/useAcademy";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface FormState {
  title: string;
  description: string;
  type: string;
  courseId: string;
  cohortId: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

const typeColors: Record<string, string> = {
  LIVE: "bg-rose-100 text-rose-700 border-rose-200",
  RECORDING: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Q_AND_A: "bg-amber-100 text-amber-700 border-amber-200",
  OFFICE_HOURS: "bg-emerald-100 text-emerald-700 border-emerald-200",
  WORKSHOP: "bg-violet-100 text-violet-700 border-violet-200",
};

const InstructorSchedules = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormState>({
    title: "",
    description: "",
    type: "WORKSHOP",
    courseId: "",
    cohortId: "",
    startTime: "",
    endTime: "",
    isRecurring: false,
  });

  const { data: coursesData, isLoading: coursesLoading } =
    useInstructorCourses();
  const { data: schedulesData, isLoading: schedulesLoading } =
    useTeachingSchedules();

  // Conditionally fetch cohorts when courseId is selected
  const { data: cohortsData, isLoading: cohortsLoading } = useCohorts(
    formData.courseId,
    undefined,
    { enabled: !!formData.courseId },
  );

  const createScheduleMutation = useCreateTeachingSchedule();
  const updateScheduleMutation = useUpdateTeachingSchedule();
  const deleteScheduleMutation = useDeleteTeachingSchedule();

  const courses = coursesData?.courses || [];
  const cohorts = (cohortsData as any)?.cohorts || [];
  const schedules = Array.isArray(schedulesData)
    ? schedulesData
    : (schedulesData as any)?.items || [];

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      courseId,
      cohortId: "", // reset cohort when course changes
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a session title");
      return;
    }
    if (!formData.courseId) {
      toast.error("Please select a course");
      return;
    }
    if (!formData.cohortId) {
      toast.error("Please select a cohort");
      return;
    }
    if (!formData.startTime) {
      toast.error("Please select a start time");
      return;
    }
    if (!formData.endTime) {
      toast.error("Please select an end time");
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (end <= start) {
      toast.error("End time must be after start time");
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      type: formData.type,
      courseId: Number(formData.courseId),
      cohortId: Number(formData.cohortId),
      isRecurring: formData.isRecurring,
    };

    const onSuccessReset = () => {
      setIsAdding(false);
      setEditingScheduleId(null);
      setFormData({
        title: "",
        description: "",
        type: "WORKSHOP",
        courseId: "",
        cohortId: "",
        startTime: "",
        endTime: "",
        isRecurring: false,
      });
    };

    if (editingScheduleId) {
      updateScheduleMutation.mutate(
        { scheduleId: editingScheduleId, data: payload },
        { onSuccess: onSuccessReset }
      );
    } else {
      createScheduleMutation.mutate(payload, { onSuccess: onSuccessReset });
    }
  };

  // Helper to look up course title by ID
  const getCourseTitle = (courseId: any) => {
    const found = courses.find((c: any) => String(c.id) === String(courseId));
    return found ? found.title : `Course #${courseId}`;
  };

  return (
    <InstructorLayout>
      <main className="section-container py-8 md:py-12">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900 border-none">
              Course Schedules
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your cohort schedules, live workshops, office hours, and
              milestones.
            </p>
          </div>
          <Button
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                setEditingScheduleId(null);
              } else {
                setEditingScheduleId(null);
                setIsAdding(true);
              }
            }}
            className="bg-[#2b5f9e] hover:bg-[#234e83] text-white font-semibold gap-2 shadow-sm transition-all border-0"
          >
            {isAdding ? (
              "Cancel"
            ) : (
              <>
                <PlusCircle className="w-4.5 h-4.5" />
                Schedule Session
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Schedule Card Form */}
            {isAdding && (
              <Card className="border-none shadow-xl bg-slate-50 ring-1 ring-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <CardHeader className="bg-white border-b border-slate-100 py-4 px-6 flex flex-row items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#2b5f9e]" />
                  <div>
                    <CardTitle className="text-lg font-bold">
                      {editingScheduleId ? "Update Scheduled Session" : "New Cohort Scheduling"}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Determine the date, course context, and exact cohort
                      target list.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleCreate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Course Dropdown */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="courseId"
                          className="text-sm font-bold text-slate-700"
                        >
                          Course
                        </Label>
                        <select
                          id="courseId"
                          value={formData.courseId}
                          onChange={handleCourseChange}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5f9e] h-11"
                          required
                          disabled={coursesLoading}
                        >
                          <option value="">
                            {coursesLoading
                              ? "Loading Courses..."
                              : "Select Course"}
                          </option>
                          {courses.map((course: any) => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cohort Dropdown */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="cohortId"
                          className="text-sm font-bold text-slate-700"
                        >
                          Target Cohort
                        </Label>
                        <select
                          id="cohortId"
                          value={formData.cohortId}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              cohortId: e.target.value,
                            }))
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5f9e] h-11 disabled:bg-slate-100/80 disabled:text-slate-400"
                          required
                          disabled={!formData.courseId || cohortsLoading}
                        >
                          <option value="">
                            {!formData.courseId
                              ? "Please select course first"
                              : cohortsLoading
                                ? "Loading cohorts..."
                                : cohorts.length === 0
                                  ? "No cohorts available"
                                  : "Select Cohort"}
                          </option>
                          {cohorts.map((cohort: any) => (
                            <option key={cohort.id} value={cohort.id}>
                              {cohort.name}
                            </option>
                          ))}
                        </select>
                        {formData.courseId &&
                          !cohortsLoading &&
                          cohorts.length === 0 && (
                            <div className="text-[11px] text-amber-600 flex items-center gap-1 mt-1 font-medium">
                              <Info className="w-3.5 h-3.5" />
                              To schedule, you must first create a cohort inside
                              the Course Editor.
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Session Title */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="title"
                          className="text-sm font-bold text-slate-700"
                        >
                          Session Title
                        </Label>
                        <Input
                          id="title"
                          placeholder="e.g. Weekly Synchronization, LIVE Q&A"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="bg-white border-slate-200 focus:ring-[#2b5f9e] h-11"
                          required
                        />
                      </div>

                      {/* Session Type */}
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
                            setFormData((prev) => ({
                              ...prev,
                              type: e.target.value,
                            }))
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5f9e] h-11"
                          required
                        >
                          <option value="WORKSHOP">Workshop</option>
                          <option value="LIVE">Live Session</option>
                          <option value="RECORDING">Recording</option>
                          <option value="Q_AND_A">Q & A / Mentorship</option>
                          <option value="OFFICE_HOURS">Office Hours</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-sm font-bold text-slate-700"
                      >
                        Description / Agenda
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Details about what topics will be covered or instructions for joining..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="bg-white border-slate-200 focus:ring-[#2b5f9e] min-h-[80px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Start Time */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="startTime"
                          className="text-sm font-bold text-slate-700"
                        >
                          Start Time & Date
                        </Label>
                        <Input
                          id="startTime"
                          type="datetime-local"
                          value={formData.startTime}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              startTime: e.target.value,
                            }))
                          }
                          className="bg-white border-slate-200 h-11"
                          required
                        />
                      </div>

                      {/* End Time */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="endTime"
                          className="text-sm font-bold text-slate-700"
                        >
                          End Time & Date
                        </Label>
                        <Input
                          id="endTime"
                          type="datetime-local"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              endTime: e.target.value,
                            }))
                          }
                          className="bg-white border-slate-200 h-11"
                          required
                        />
                      </div>
                    </div>

                    {/* Recurring Option */}
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        id="isRecurring"
                        type="checkbox"
                        checked={formData.isRecurring}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isRecurring: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-[#2b5f9e] focus:ring-[#2b5f9e]"
                      />
                      <label
                        htmlFor="isRecurring"
                        className="text-sm font-medium text-slate-700 select-none"
                      >
                        This is a recurring session (e.g. repeats weekly)
                      </label>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAdding(false);
                          setEditingScheduleId(null);
                        }}
                        className="h-11 px-6 rounded-lg transition-all"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                        className="bg-[#2b5f9e] hover:bg-[#234e83] text-white font-semibold h-11 px-8 rounded-lg transition-all disabled:opacity-50"
                      >
                        {(createScheduleMutation.isPending || updateScheduleMutation.isPending)
                          ? "Saving..."
                          : editingScheduleId
                            ? "Update Schedule"
                            : "Create Schedule"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Schedules List */}
            <Card className="border border-border/80">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">
                    Upcoming Scheduled Sessions
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your scheduled events across all active student cohorts.
                  </CardDescription>
                </div>
                <div className="bg-slate-100 rounded-lg p-2 text-slate-500">
                  <CalendarDays className="w-5 h-5 text-slate-700" />
                </div>
              </CardHeader>
              <CardContent>
                {schedulesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                    <Calendar className="w-16 h-16 text-slate-200 mb-4" />
                    <p className="font-semibold text-slate-700 text-base">
                      No scheduled events found
                    </p>
                    <p className="text-sm text-slate-400 max-w-sm mt-1">
                      Create live workshop slots or classroom syncing for your
                      student cohorts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((session: any) => {
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
                        <div
                          key={session.id}
                          className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                        >
                          <div className="space-y-2 flex-grow">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-current ${
                                  typeColors[session.type] ||
                                  "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {session.type}
                              </span>
                              {session.isRecurring && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold uppercase tracking-wider">
                                  Recurring
                                </span>
                              )}
                              <span className="text-xs text-slate-400 font-medium">
                                ID: #{session.id}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-base font-bold text-slate-800 leading-snug group-hover:text-[#2b5f9e] transition-colors">
                                {session.title}
                              </h4>
                              {session.description && (
                                <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                                  {session.description}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-500 font-semibold">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                {getCourseTitle(session.courseId)}
                              </span>
                              {session.cohort && (
                                <span className="flex items-center gap-1 bg-amber-50/50 text-amber-700 py-0.5 px-2 rounded-full ring-1 ring-amber-100/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Cohort: {session.cohort.name}
                                </span>
                              )}
                              {!session.cohort && session.cohortId && (
                                <span className="flex items-center gap-1 bg-amber-50/50 text-amber-700 py-0.5 px-2 rounded-full ring-1 ring-amber-100/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Cohort ID: #{session.cohortId}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 gap-3">
                            <div className="flex flex-col text-left md:text-right gap-0.5">
                              <div className="flex items-center gap-1 md:justify-end text-slate-700 font-bold text-xs">
                                <Calendar className="w-3.5 h-3.5 text-[#2b5f9e]" />
                                {formattedDate}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {formattedTimeRange}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingScheduleId(Number(session.id));
                                  setFormData({
                                    title: session.title || "",
                                    description: session.description || "",
                                    type: session.type || "WORKSHOP",
                                    courseId: session.courseId ? String(session.courseId) : "",
                                    cohortId: session.cohortId ? String(session.cohortId) : "",
                                    startTime: session.startTime ? format(new Date(session.startTime), "yyyy-MM-dd'T'HH:mm") : "",
                                    endTime: session.endTime ? format(new Date(session.endTime), "yyyy-MM-dd'T'HH:mm") : "",
                                    isRecurring: Boolean(session.isRecurring),
                                  });
                                  setIsAdding(true);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="h-8 px-2.5 text-xs gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={deleteScheduleMutation.isPending}
                                onClick={() => deleteScheduleMutation.mutate(session.id)}
                                className="h-8 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 text-sm animate-in fade-in slide-in-from-right duration-500">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <BellRing className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">
                      System Update
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Live streaming features will be available next week.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-[#e5e9f0] text-[#0f1b2d]">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-[#2b5f9e]" />
                  <span className="font-bold">Pro Tip</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Scheduling regular live sessions increases student engagement
                  by up to 40%!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </InstructorLayout>
  );
};

export default InstructorSchedules;
