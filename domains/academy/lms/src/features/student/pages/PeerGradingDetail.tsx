import { useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import StudentLayout from "@/features/student/components/StudentLayout";
import { useEnrollments } from "@/hooks/useAcademy";
import { academyService } from "@/services/academyService";
import { useQueries } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquareText,
  Inbox,
  Loader2,
  ArrowLeft,
  Award,
} from "lucide-react";
import { RubricStudentResultView } from "@/features/rubric/components/RubricStudentResultView";

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
      return Array.isArray(p)
        ? p
        : opts.split(",").map((o: string) => o.trim());
    } catch {
      return opts.split(",").map((o: string) => o.trim());
    }
  }
  return [];
};

// ── Types ─────────────────────────────────────────────────────────────────
interface FlatSubmission {
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

// ── Hook (same logic as PeerGrading, scoped to one course by title) ──────
const useCourseSubmissions = (courseTitleParam: string) => {
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();

  // Find the courseId matching this title
  const courseId = useMemo(() => {
    if (!enrollments || !courseTitleParam) return "";
    const match = enrollments.find(
      (e: any) =>
        (e.course?.title ?? "").toLowerCase() ===
        courseTitleParam.toLowerCase(),
    );
    return match ? String(match.courseId ?? match.course?.id ?? "") : "";
  }, [enrollments, courseTitleParam]);

  const reportQuery = useQueries({
    queries: [
      {
        queryKey: ["course-report", courseId],
        queryFn: () => academyService.getCourseReport(courseId),
        staleTime: 2 * 60 * 1000,
        enabled: !!courseId,
      },
    ],
  });

  const report = reportQuery[0]?.data;
  const reportsLoading = reportQuery[0]?.isLoading ?? false;

  const courseTitle = useMemo(() => {
    return (
      enrollments?.find(
        (e: any) => String(e.courseId ?? e.course?.id) === String(courseId),
      )?.course?.title ?? "Course"
    );
  }, [enrollments, courseId]);

  // Collect submitted exercise ids from report
  const submittedItems: Array<{
    exerciseId: string;
    lessonTitle: string;
    reportEx: any;
  }> = useMemo(() => {
    if (!report || !Array.isArray(report)) return [];
    const result: Array<{
      exerciseId: string;
      lessonTitle: string;
      reportEx: any;
    }> = [];
    report.forEach((moduleObj: any) => {
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
              lessonTitle,
              reportEx: rex,
            });
          }
        });
      });
    });
    return result;
  }, [report]);

  // Fetch full exercise details for each submitted exercise
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
      .map(({ lessonTitle, reportEx }, idx) => {
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
          exerciseTitle: cleanTitle(detail?.title),
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
        return (
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
      });
  }, [submittedItems, detailQueries, detailsLoading, courseTitle]);

  return { submissions, isLoading, courseTitle };
};

// ── Submission Card ────────────────────────────────────────────────────────
const SubmissionCard = ({ sub }: { sub: FlatSubmission }) => {
  const isGraded = sub.status === "GRADED";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-slate-100">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            {sub.exerciseTitle}
          </p>
          {sub.question && sub.question !== sub.exerciseTitle && (
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {sub.question}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {isGraded && (
            <span className="text-base font-bold text-slate-900">
              {sub.score ?? 0}
              <span className="text-xs font-medium text-slate-400">
                /{sub.maxPoints}
              </span>
            </span>
          )}
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5",
              isGraded
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
            )}
          >
            {isGraded ? <CheckCircle2 size={11} /> : <Clock size={11} />}
            {isGraded ? "Graded" : "Awaiting grade"}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4 bg-slate-50/40">
        {/* Your answer */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Your Answer
          </p>
          {sub.options.length > 0 ? (
            <div className="space-y-1.5">
              {sub.options.map((opt, i) => {
                const isChosen = sub.answer === opt;
                const isCorrectOpt =
                  sub.correctAnswer !== null && sub.correctAnswer === opt;
                const isWrong = isChosen && sub.isCorrect === false;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium",
                      isChosen && sub.isCorrect === true
                        ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                        : isWrong
                          ? "border-rose-400 bg-rose-50 text-rose-800"
                          : isCorrectOpt && !isChosen
                            ? "border-emerald-200 bg-emerald-50/50 text-emerald-700"
                            : isChosen
                              ? "border-primary/50 bg-primary/5 text-slate-800"
                              : "border-slate-200 bg-white text-slate-400",
                    )}
                  >
                    {isChosen && sub.isCorrect === true ? (
                      <CheckCircle2
                        size={14}
                        className="text-emerald-500 shrink-0"
                      />
                    ) : isWrong ? (
                      <XCircle size={14} className="text-rose-500 shrink-0" />
                    ) : isCorrectOpt && !isChosen ? (
                      <CheckCircle2
                        size={14}
                        className="text-emerald-400 shrink-0"
                      />
                    ) : (
                      <div className="w-3 h-3 rounded-full border-2 border-current shrink-0 opacity-40" />
                    )}
                    <span className="flex-1">{opt}</span>
                    {isChosen && (
                      <span className="text-[10px] font-bold uppercase tracking-wide opacity-60">
                        Your choice
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm text-slate-700 leading-relaxed">
              {sub.answer || (
                <span className="italic text-slate-400">
                  No response recorded
                </span>
              )}
            </div>
          )}
        </div>

        {/* Verdict for open-ended */}
        {isGraded && sub.isCorrect !== null && sub.options.length === 0 && (
          <div className="flex items-center gap-2">
            {sub.isCorrect ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-emerald-700">
                  Correct
                </span>
              </>
            ) : (
              <>
                <XCircle size={14} className="text-rose-500 shrink-0" />
                <span className="text-sm font-semibold text-rose-700">
                  Incorrect
                </span>
              </>
            )}
          </div>
        )}

        {/* Rubric scorecard evaluation if present */}
        {isGraded && (sub as any).rubricEvaluation && (
          <div className="pt-2">
            <RubricStudentResultView evaluation={(sub as any).rubricEvaluation} />
          </div>
        )}

        {/* Instructor feedback */}
        {isGraded && sub.feedback && !(sub as any).rubricEvaluation ? (
          <div>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquareText size={11} />
              Instructor Feedback
            </p>
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-slate-700 leading-relaxed">
              {sub.feedback}
            </div>
          </div>
        ) : isGraded && !(sub as any).rubricEvaluation ? (
          <p className="text-xs text-slate-400 italic">
            No written feedback provided.
          </p>
        ) : !isGraded ? (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <Clock size={13} />
            <span>Your instructor hasn't graded this yet.</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────
const PeerGradingDetail = () => {
  // The URL param is actually the encoded course title (not a numeric id)
  const { courseId: courseTitleEncoded } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateTitle = (location.state as any)?.courseTitle as string | undefined;

  const decodedTitle = courseTitleEncoded
    ? decodeURIComponent(courseTitleEncoded)
    : "";
  const { submissions, isLoading, courseTitle } =
    useCourseSubmissions(decodedTitle);

  const graded = submissions.filter((s) => s.status === "GRADED").length;
  const pending = submissions.filter((s) => s.status === "PENDING").length;
  const withFeedback = submissions.filter((s) => s.feedback).length;

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Back + header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/peer-grading")}
            className="gap-2 text-slate-500 hover:text-slate-800 -ml-2 mb-3"
          >
            <ArrowLeft size={15} />
            Back to courses
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
            {stateTitle ?? courseTitle ?? decodedTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your submissions and instructor feedback for this course.
          </p>
        </div>

        {/* Summary pills */}
        {!isLoading && submissions.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm shadow-sm">
              <span className="font-bold text-slate-800">
                {submissions.length}
              </span>
              <span className="text-slate-500">Total submissions</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 text-sm">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span className="font-bold text-emerald-700">{graded}</span>
              <span className="text-emerald-600">Graded</span>
            </div>
            {pending > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 text-sm">
                <Clock size={13} className="text-amber-600" />
                <span className="font-bold text-amber-700">{pending}</span>
                <span className="text-amber-600">Pending</span>
              </div>
            )}
            {withFeedback > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm">
                <MessageSquareText size={13} className="text-blue-600" />
                <span className="font-bold text-blue-700">{withFeedback}</span>
                <span className="text-blue-600">With feedback</span>
              </div>
            )}
          </div>
        )}

        {/* Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-white border border-slate-200 rounded-xl animate-pulse"
              />
            ))}
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-2">
              <Loader2 size={14} className="animate-spin" />
              Loading submissions...
            </div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Inbox size={40} className="text-slate-200" />
            <p className="text-sm font-semibold text-slate-400">
              No submissions found for this course.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub, idx) => (
              <SubmissionCard key={`${sub.exerciseId}-${idx}`} sub={sub} />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default PeerGradingDetail;
