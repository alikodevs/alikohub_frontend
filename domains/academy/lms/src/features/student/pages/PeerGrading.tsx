import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "@/features/student/components/StudentLayout";
import { useEnrollments } from "@/hooks/useAcademy";
import { academyService } from "@/services/academyService";
import { useQueries } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────
const cleanTitle = (raw: string | undefined | null) => {
  if (!raw) return "Untitled exercise";
  return raw.split("|||")[0].trim();
};

const parseOptions = (opts: any): string[] => {
  if (!opts) return [];
  if (Array.isArray(opts)) return opts;
  if (typeof opts === "string") {
    try {
      const p = JSON.parse(opts);
      return Array.isArray(p) ? p : opts.split(",").map((o: string) => o.trim());
    } catch {
      return opts.split(",").map((o: string) => o.trim());
    }
  }
  return [];
};

// ── Types ─────────────────────────────────────────────────────────────────
export interface FlatSubmission {
  id: string | number;
  exerciseId: string | number;
  exerciseTitle: string;
  question: string;
  lessonTitle: string;
  courseTitle: string;
  answer: string;
  options: string[];
  correctAnswer: string | null;
  status: "GRADED" | "PENDING";
  score: number | null;
  maxPoints: number;
  feedback: string | null;
  isCorrect: boolean | null;
  submittedAt: string;
  gradedAt: string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────
export const useMyGradedSubmissions = () => {
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();

  const courseIds: string[] = useMemo(() => {
    if (!enrollments) return [];
    return enrollments
      .filter(
        (e: any) =>
          e.status === "ACTIVE" ||
          e.status === "COMPLETED" ||
          e.status === "ENROLLED",
      )
      .map((e: any) => String(e.courseId ?? e.course?.id))
      .filter(Boolean);
  }, [enrollments]);

  const reportQueries = useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: ["course-report", courseId],
      queryFn: () => academyService.getCourseReport(courseId),
      staleTime: 2 * 60 * 1000,
      enabled: courseIds.length > 0,
    })),
  });

  const reportsLoading = reportQueries.some((q) => q.isLoading);

  const submittedItems = useMemo(() => {
    if (reportsLoading) return [];
    const result: Array<{
      exerciseId: string;
      courseId: string;
      lessonTitle: string;
      courseTitle: string;
      reportEx: any;
    }> = [];

    reportQueries.forEach((query, idx) => {
      const report = query.data;
      const courseId = courseIds[idx];
      if (!report || !Array.isArray(report)) return;

      const fallbackTitle =
        enrollments?.find(
          (e: any) => String(e.courseId ?? e.course?.id) === String(courseId),
        )?.course?.title ?? "Unknown Course";

      report.forEach((moduleObj: any) => {
        const courseTitle = moduleObj.course?.title || fallbackTitle;
        (moduleObj.lessons || []).forEach((lesson: any) => {
          const lessonTitle = lesson.title || lesson.lessonTitle || "";
          (lesson.exercises || []).forEach((rex: any) => {
            if (
              rex.status === "GRADED" ||
              rex.status === "COMPLETED" ||
              rex.status === "PENDING" ||
              rex.answer
            ) {
              result.push({
                exerciseId: String(rex.exerciseId),
                courseId,
                lessonTitle,
                courseTitle,
                reportEx: rex,
              });
            }
          });
        });
      });
    });

    return result;
  }, [reportQueries, courseIds, enrollments, reportsLoading]);

  const detailQueries = useQueries({
    queries: submittedItems.map(({ exerciseId }) => ({
      queryKey: ["exercise", exerciseId],
      queryFn: () => academyService.getExerciseDetails(exerciseId),
      staleTime: 5 * 60 * 1000,
      enabled: submittedItems.length > 0,
    })),
  });

  const detailsLoading = detailQueries.some((q) => q.isLoading);
  const isLoading = enrollmentsLoading || reportsLoading || detailsLoading;

  const submissions: FlatSubmission[] = useMemo(() => {
    if (detailsLoading || submittedItems.length === 0) return [];

    return submittedItems
      .map(({ lessonTitle, courseTitle, reportEx }, idx) => {
        const detail = detailQueries[idx]?.data;
        const mySubmission = detail?.mySubmission || detail?.submission;

        const answer =
          mySubmission?.answer || reportEx?.answer || detail?.userAnswer || "";
        const status: "GRADED" | "PENDING" =
          mySubmission?.status === "GRADED" ||
          reportEx?.status === "GRADED" ||
          reportEx?.status === "COMPLETED"
            ? "GRADED"
            : "PENDING";
        const score =
          mySubmission?.score !== undefined
            ? mySubmission.score
            : reportEx?.score !== undefined
              ? reportEx.score
              : null;
        const feedback = mySubmission?.feedback || reportEx?.feedback || null;
        const isCorrect =
          mySubmission?.isCorrect !== undefined
            ? mySubmission.isCorrect
            : reportEx?.isCorrect !== undefined
              ? reportEx.isCorrect
              : null;
        const submittedAt =
          mySubmission?.createdAt ||
          reportEx?.createdAt ||
          reportEx?.submittedAt ||
          new Date().toISOString();
        const gradedAt =
          status === "GRADED"
            ? mySubmission?.updatedAt || reportEx?.updatedAt || null
            : null;

        return {
          id: mySubmission?.id || reportEx?.exerciseId,
          exerciseId: reportEx?.exerciseId,
          exerciseTitle: cleanTitle(detail?.title || detail?.exerciseTitle),
          question: detail?.question || cleanTitle(detail?.title) || "",
          lessonTitle,
          courseTitle,
          answer,
          options: parseOptions(detail?.options),
          correctAnswer: detail?.correctAnswer ?? null,
          status,
          score,
          maxPoints: detail?.points || detail?.maxPoints || 1,
          feedback,
          isCorrect,
          submittedAt,
          gradedAt,
        } as FlatSubmission;
      })
      .filter((s) => s.answer || s.status === "GRADED")
      .sort((a, b) => {
        const aRank = (a.feedback ? 2 : 0) + (a.status === "GRADED" ? 1 : 0);
        const bRank = (b.feedback ? 2 : 0) + (b.status === "GRADED" ? 1 : 0);
        if (aRank !== bRank) return bRank - aRank;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }, [submittedItems, detailQueries, detailsLoading]);

  return { submissions, isLoading };
};

// ── Presentation Helpers ──────────────────────────────────────────────────
const getCourseBadge = (courseTitle: string) => {
  const lower = courseTitle.toLowerCase();
  let badgeClasses = "bg-slate-100 text-slate-700 border-slate-200";
  let label = courseTitle;

  if (lower.includes("cna") || lower.includes("nurs")) {
    badgeClasses = "bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]";
    label = "CNA";
  } else if (lower.includes("autocad") || lower.includes("cad")) {
    badgeClasses = "bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]";
    label = "AutoCAD";
  } else if (lower.includes("nutrit") || lower.includes("health")) {
    badgeClasses = "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]";
    label = "Nutrition";
  } else if (lower.includes("pharm")) {
    badgeClasses = "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]";
    label = "Pharmacy";
  } else {
    const words = courseTitle.split(" ").filter(Boolean);
    label = words.length > 2 ? words.map((w) => w[0]).join("").toUpperCase().slice(0, 4) : courseTitle.slice(0, 16);
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        badgeClasses
      )}
      title={courseTitle}
    >
      {label}
    </span>
  );
};

const getSubmissionDisplayTitle = (sub: FlatSubmission) => {
  if (sub.exerciseTitle && sub.exerciseTitle !== "Untitled exercise") {
    if (sub.exerciseTitle.endsWith("?") || sub.exerciseTitle.length > 45) {
      if (sub.lessonTitle) return sub.lessonTitle;
    }
    return sub.exerciseTitle;
  }
  if (sub.lessonTitle) return sub.lessonTitle;
  return "Exercise Submission";
};

// ── Page Component ─────────────────────────────────────────────────────────
const PeerGrading = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { submissions, isLoading } = useMyGradedSubmissions();

  const filtered = useMemo(() => {
    if (!search.trim()) return submissions;
    const query = search.toLowerCase();
    return submissions.filter(
      (s) =>
        s.courseTitle.toLowerCase().includes(query) ||
        s.exerciseTitle.toLowerCase().includes(query) ||
        s.lessonTitle.toLowerCase().includes(query),
    );
  }, [submissions, search]);

  const handleRowClick = (sub: FlatSubmission) => {
    navigate(`/peer-grading/${encodeURIComponent(sub.courseTitle)}`, {
      state: { courseTitle: sub.courseTitle },
    });
  };

  return (
    <StudentLayout>
      <div className="w-full min-h-screen bg-slate-50/50">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
              Peer Review &amp; Instructor Feedback
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review classmates' submissions and see feedback on your own work
            </p>
          </div>

          {/* Section Container with Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 font-heading tracking-tight">
                Feedback on my work
              </h2>
              <div className="relative w-full sm:w-72">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  placeholder="Search submissions or courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-white border-slate-200 text-sm rounded-lg"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-b border-slate-200/60">
                    <TableHead className="py-3.5 pl-6 font-bold text-slate-500 text-xs uppercase tracking-wider">
                      Course
                    </TableHead>
                    <TableHead className="py-3.5 font-bold text-slate-500 text-xs uppercase tracking-wider">
                      Submission
                    </TableHead>
                    <TableHead className="py-3.5 font-bold text-slate-500 text-xs uppercase tracking-wider">
                      Score
                    </TableHead>
                    <TableHead className="py-3.5 font-bold text-slate-500 text-xs uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="py-3.5 pr-6 text-right font-bold text-slate-500 text-xs uppercase tracking-wider">
                      Detail
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell colSpan={5} className="py-5 px-6">
                          <div className="h-4 bg-slate-100 rounded w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Inbox size={40} className="text-slate-200" />
                          <p className="text-sm font-semibold text-slate-400">
                            {submissions.length === 0
                              ? "No graded submissions yet."
                              : "No submissions match your search."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((sub) => {
                      const displayTitle = getSubmissionDisplayTitle(sub);

                      return (
                        <TableRow
                          key={sub.id || `${sub.courseTitle}-${sub.exerciseId}`}
                          className="group hover:bg-slate-50/60 border-b border-slate-100 transition-colors cursor-pointer"
                          onClick={() => handleRowClick(sub)}
                        >
                          {/* Course */}
                          <TableCell className="py-4 pl-6 align-middle">
                            {getCourseBadge(sub.courseTitle)}
                          </TableCell>

                          {/* Submission */}
                          <TableCell className="py-4 align-middle">
                            <div className="flex flex-col">
                              <span
                                className="font-semibold text-slate-900 text-sm truncate max-w-[280px] sm:max-w-[380px]"
                                title={displayTitle}
                              >
                                {displayTitle}
                              </span>
                              {sub.lessonTitle && sub.lessonTitle !== displayTitle && (
                                <span
                                  className="text-xs text-slate-500 truncate max-w-[280px] sm:max-w-[380px] mt-0.5"
                                  title={sub.lessonTitle}
                                >
                                  {sub.lessonTitle}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Score */}
                          <TableCell className="py-4 align-middle">
                            {sub.score !== null && sub.score !== undefined ? (
                              <span className="font-semibold text-slate-900 text-sm">
                                {sub.score}{" "}
                                <span className="text-slate-400 font-normal">
                                  / {sub.maxPoints}
                                </span>
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400 font-medium">—</span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-4 align-middle">
                            {sub.status === "GRADED" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Graded
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Pending
                              </span>
                            )}
                          </TableCell>

                          {/* Detail */}
                          <TableCell className="py-4 pr-6 text-right align-middle">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-800 transition-colors">
                              View details <span className="text-sm">→</span>
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-4 border-t border-slate-100">
                  <Loader2 size={14} className="animate-spin" />
                  Loading your submissions...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default PeerGrading;
