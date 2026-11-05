import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import { Inbox, Search, MoreVertical } from "lucide-react";
import { useInstructorSubmissions } from "@/hooks/useAcademy";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────
const cleanTitle = (raw: string | undefined | null) => {
  if (!raw) return "";
  return raw.split("|||")[0].trim();
};

const initialsOf = (firstname?: string, lastname?: string) =>
  `${firstname?.[0] ?? ""}${lastname?.[0] ?? ""}`.toUpperCase();

const AVATAR_PALETTES = [
  "bg-indigo-50 text-indigo-600",
  "bg-rose-50 text-rose-600",
  "bg-amber-50 text-amber-600",
  "bg-emerald-50 text-emerald-600",
  "bg-sky-50 text-sky-600",
  "bg-violet-50 text-violet-600",
];
const avatarPalette = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++)
    hash = (hash + key.charCodeAt(i)) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[hash];
};

// Grade distribution buckets
const GRADE_BUCKETS = [
  { label: "0-20", min: 0, max: 20 },
  { label: "21-40", min: 21, max: 40 },
  { label: "41-60", min: 41, max: 60 },
  { label: "61-80", min: 61, max: 80 },
  { label: "81-100", min: 81, max: 100 },
];

const InstructorSubmissions = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: submissionsData, isLoading } = useInstructorSubmissions({
    page: 1,
    pageSize: 300,
    status: statusFilter === "ALL" ? undefined : (statusFilter as any),
  });

  const rawSubmissions = submissionsData?.items ?? [];

  // ── Flatten & Group for Table View ─────────────────────────────────────
  const groupedSubmissions = useMemo(() => {
    const groups: Record<string, any> = {};

    rawSubmissions.forEach((sub: any) => {
      const quizId = sub.exercise?.lessonId || sub.exercise?.id;
      const key = `${sub.userId}-${quizId}`;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          userId: sub.userId,
          user: sub.user,
          quizId,
          quizTitle:
            sub.exercise?.lesson?.title || cleanTitle(sub.exercise?.title),
          courseTitle: sub.exercise?.module?.course?.title,
          courseId: sub.exercise?.module?.course?.id,
          submissions: [],
          totalScore: 0,
          maxPoints: 0,
          status: "GRADED",
          createdAt: sub.createdAt,
          gradedAt: sub.status === "GRADED" ? sub.updatedAt : null,
        };
      }

      const g = groups[key];
      g.submissions.push(sub);
      g.totalScore += sub.score ?? 0;
      g.maxPoints += sub.exercise?.points ?? 0;

      if (sub.status === "PENDING") {
        g.status = "PENDING";
      }

      if (
        sub.status === "GRADED" &&
        (!g.gradedAt || new Date(sub.updatedAt) > new Date(g.gradedAt))
      ) {
        g.gradedAt = sub.updatedAt;
      }
    });

    return Object.values(groups)
      .filter((g: any) => {
        const fullName =
          `${g.user?.firstname} ${g.user?.lastname}`.toLowerCase();
        const matchesSearch =
          fullName.includes(searchQuery.toLowerCase()) ||
          g.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.quizTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCourse =
          courseFilter === "ALL" || g.courseId?.toString() === courseFilter;
        return matchesSearch && matchesCourse;
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [rawSubmissions, searchQuery, courseFilter]);

  // Unique courses for filter
  const uniqueCourses = useMemo(() => {
    const courses = new Map();
    rawSubmissions.forEach((sub: any) => {
      const c = sub.exercise?.module?.course;
      if (c && !courses.has(c.id)) {
        courses.set(c.id, c.title);
      }
    });
    return Array.from(courses.entries()).map(([id, title]) => ({ id, title }));
  }, [rawSubmissions]);

  // ── Task 1: Grading & Submission Stats ─────────────────────────────────
  const gradingStats = useMemo(() => {
    const total = groupedSubmissions.length;
    const returned = groupedSubmissions.filter(
      (g: any) => g.status === "GRADED" && g.totalScore > 0,
    ).length;
    const draft = groupedSubmissions.filter(
      (g: any) => g.status === "PENDING",
    ).length;
    const notGraded = groupedSubmissions.filter(
      (g: any) => g.status === "GRADED" && g.totalScore === 0,
    ).length;
    return { total, returned, draft, notGraded };
  }, [groupedSubmissions]);

  const submissionStats = useMemo(() => {
    const total = groupedSubmissions.length;
    // "On Time" = graded submissions; "Late" = pending; "Missing" = no submission (0 score + no gradedAt)
    const onTime = groupedSubmissions.filter(
      (g: any) => g.status === "GRADED" && g.gradedAt,
    ).length;
    const late = groupedSubmissions.filter(
      (g: any) => g.status === "PENDING",
    ).length;
    const missing = groupedSubmissions.filter(
      (g: any) => g.maxPoints === 0,
    ).length;
    return { total, onTime, late, missing };
  }, [groupedSubmissions]);

  // ── Task 2: Grade Distribution Buckets ─────────────────────────────────
  const gradeDistribution = useMemo(() => {
    return GRADE_BUCKETS.map((bucket) => {
      const count = groupedSubmissions.filter((g: any) => {
        if (g.status === "PENDING" || g.maxPoints === 0) return false;
        const pct = Math.round((g.totalScore / g.maxPoints) * 100);
        return pct >= bucket.min && pct <= bucket.max;
      }).length;
      return { label: bucket.label, count };
    });
  }, [groupedSubmissions]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const viewSubmissionDetail = (sub: any) => {
    navigate(`/instructor/submissions/${sub.id}`, {
      state: { group: sub },
    });
  };

  return (
    <InstructorLayout>
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200/80 shrink-0">
        <div className="max-w-screen-2xl mx-auto">
          <div className="px-8 pt-8 pb-4">
            <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
              Grading Hub
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review and grade learner submissions across all your courses.
            </p>
          </div>

          <div className="px-8 flex items-center gap-8 border-b border-slate-100">
            <button className="pb-4 text-sm font-bold transition-all relative text-blue-600">
              <div className="flex items-center gap-2">
                Assignments
                <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white bg-blue-600">
                  {groupedSubmissions.length}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-6 space-y-6">
          {/* ── Task 5: Course Filter (week-style) ── */}
          <div className="flex items-center gap-3">
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-9 w-[180px] rounded-lg border-slate-200 bg-white text-sm font-medium shadow-sm">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-xl">
                <SelectItem value="ALL">All Courses</SelectItem>
                {uniqueCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Task 3: Stats + Chart Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 – Grading Stat */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Grading Stat
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-4xl font-bold text-slate-900">
                  {gradingStats.total}
                </span>
                <span className="text-sm text-slate-500 font-medium leading-tight">
                  Total
                  <br />
                  Number
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Returned</span>
                  <span className="font-semibold text-slate-700">
                    {gradingStats.returned}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Draft</span>
                  <span className="font-semibold text-slate-700">
                    {gradingStats.draft}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-500 font-medium">Not Graded</span>
                  <span className="font-semibold text-amber-500">
                    {gradingStats.notGraded}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2 – Submission Stat */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Submission Stat
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-4xl font-bold text-slate-900">
                  {submissionStats.total}
                </span>
                <span className="text-sm text-slate-500 font-medium leading-tight">
                  Total
                  <br />
                  Submission
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">On Time</span>
                  <span className="font-semibold text-slate-700">
                    {submissionStats.onTime}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-500 font-medium">Late</span>
                  <span className="font-semibold text-amber-500">
                    {submissionStats.late}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-500 font-medium">Missing</span>
                  <span className="font-semibold text-amber-500">
                    {submissionStats.missing}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3 – Grade Distribution Chart */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Grade Distribution
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={gradeDistribution}
                  margin={{ top: 10, right: 4, left: -28, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value) => [value, "Students"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {gradeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? "#f97316" : "#fed7aa"}
                        fillOpacity={entry.count > 0 ? 0.85 : 0.4}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Task 4: Search + Table ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Search bar inside table card */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="relative group w-72">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                  size={16}
                />
                <Input
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 rounded-lg border-slate-200 bg-slate-50/50 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-b border-slate-200/60">
                  <TableHead className="w-[40px] pl-6">
                    <Input type="checkbox" className="h-4 w-4 rounded" />
                  </TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 text-xs">
                    User
                  </TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 text-xs">
                    Course
                  </TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 text-xs">
                    Submission date
                  </TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 text-xs">
                    Grade date
                  </TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 text-xs">
                    Grade
                  </TableHead>
                  <TableHead className="py-4 pr-6 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell colSpan={7} className="py-6 px-6">
                          <div className="h-4 bg-slate-100 rounded w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : groupedSubmissions.map((sub: any) => (
                      <TableRow
                        key={sub.id}
                        className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors group"
                      >
                        <TableCell className="pl-6">
                          <Input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-8 w-8 shrink-0 rounded-full flex items-center justify-center font-bold text-[10px]",
                                avatarPalette(sub.user?.email ?? sub.userId),
                              )}
                            >
                              {initialsOf(
                                sub.user?.firstname,
                                sub.user?.lastname,
                              )}
                            </div>
                            <span className="font-bold text-slate-700 text-sm whitespace-nowrap">
                              {sub.user?.firstname} {sub.user?.lastname}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className="py-4 text-sm text-slate-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                          title={sub.courseTitle}
                        >
                          {sub.courseTitle}
                        </TableCell>
                        <TableCell className="py-4 text-sm text-slate-500 font-medium">
                          {format(new Date(sub.createdAt), "MM/dd/yyyy")}
                        </TableCell>
                        <TableCell className="py-4 text-sm text-slate-500 font-medium">
                          {sub.gradedAt
                            ? format(new Date(sub.gradedAt), "MM/dd/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-bold text-slate-700 text-sm">
                            {sub.status === "PENDING"
                              ? "-"
                              : Math.round(
                                  (sub.totalScore / sub.maxPoints) * 100,
                                )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewSubmissionDetail(sub)}
                              className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 rounded-lg"
                            >
                              Review Attempt
                            </Button>
                            <button
                              onClick={() => viewSubmissionDetail(sub)}
                              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>

            {!isLoading && groupedSubmissions.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Inbox size={48} className="text-slate-200" />
                <p className="font-bold text-slate-400">
                  No submissions found.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </InstructorLayout>
  );
};

export default InstructorSubmissions;
