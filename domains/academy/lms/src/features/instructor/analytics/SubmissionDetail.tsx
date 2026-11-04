import { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import {
  CheckCircle2,
  X,
  ArrowLeft,
  Mail,
  ClipboardCheck,
  Hourglass,
  ListChecks,
  MessageSquareText,
  Clock,
  Inbox,
  Loader2,
  Award,
  Sparkles,
} from "lucide-react";
import {
  useInstructorSubmissions,
  useGradeSubmission,
} from "@/hooks/useAcademy";
import { useRubricDetail } from "@/features/rubric/hooks/useRubrics";
import { RubricGradingMatrix } from "@/features/rubric/components/RubricGradingMatrix";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

// ── Submission Response Card (mirrors PeerGradingDetail's SubmissionCard) ──
const ResponseCard = ({
  item,
  idx,
  onGrade,
}: {
  item: any;
  idx: number;
  onGrade: (item: any) => void;
}) => {
  const isGraded = item.status === "GRADED";
  const isPending = item.status === "PENDING";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-slate-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-semibold shrink-0">
              {idx + 1}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Question {idx + 1}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-snug mt-1">
            {cleanTitle(item.exercise?.title)}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {isGraded && (
            <span className="text-base font-bold text-slate-900">
              {item.score ?? 0}
              <span className="text-xs font-medium text-slate-400">
                /{item.exercise?.points ?? 0}
              </span>
            </span>
          )}
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5",
              isPending
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : item.isCorrect
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-600 border-rose-200",
            )}
          >
            {isPending ? (
              <Clock size={11} />
            ) : item.isCorrect ? (
              <CheckCircle2 size={11} />
            ) : (
              <X size={11} />
            )}
            {isPending
              ? "Needs grading"
              : item.isCorrect
                ? "Correct"
                : "Incorrect"}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4 bg-slate-50/40">
        {/* Student response */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Student Response
          </p>
          <div className="rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm text-slate-700 leading-relaxed">
            {item.answer || (
              <span className="italic text-slate-400">
                No response submitted
              </span>
            )}
          </div>
        </div>

        {/* Verdict for graded */}
        {isGraded &&
          item.isCorrect !== null &&
          item.isCorrect !== undefined && (
            <div className="flex items-center gap-2">
              {item.isCorrect ? (
                <>
                  <CheckCircle2
                    size={14}
                    className="text-emerald-500 shrink-0"
                  />
                  <span className="text-sm font-semibold text-emerald-700">
                    Correct
                  </span>
                </>
              ) : (
                <>
                  <X size={14} className="text-rose-500 shrink-0" />
                  <span className="text-sm font-semibold text-rose-700">
                    Incorrect
                  </span>
                </>
              )}
            </div>
          )}

        {/* Instructor feedback */}
        {isGraded && item.feedback ? (
          <div>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquareText size={11} />
              Your Feedback
            </p>
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-slate-700 leading-relaxed">
              {item.feedback}
            </div>
          </div>
        ) : isGraded ? (
          <p className="text-xs text-slate-400 italic">
            No written feedback provided.
          </p>
        ) : null}

        {/* Grade action */}
        <div className="flex items-center justify-end pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGrade(item)}
            className="h-9 rounded-lg px-4 font-semibold text-xs border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          >
            {isPending ? "Grade question" : "Modify grade"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────
const SubmissionDetail = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // The grouped submission data may be passed via location.state
  const passedGroup = (location.state as any)?.group as any | undefined;

  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(
    null,
  );
  const [gradingForm, setGradingForm] = useState({
    score: 0,
    feedback: "",
    isCorrect: true,
  });

  // Fetch all submissions so we can find this group even without state
  const { data: submissionsData, isLoading } = useInstructorSubmissions({
    page: 1,
    pageSize: 300,
  });

  const gradeMutation = useGradeSubmission();
  const rawSubmissions = submissionsData?.items ?? [];

  // Rebuild grouped submissions and find the one matching submissionId
  const group = useMemo(() => {
    if (passedGroup) return passedGroup;

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

    return groups[submissionId ?? ""] ?? null;
  }, [passedGroup, rawSubmissions, submissionId]);

  // Local copy of submissions for optimistic updates
  const [localSubmissions, setLocalSubmissions] = useState<any[] | null>(null);
  const submissions = localSubmissions ?? group?.submissions ?? [];

  // Recompute stats
  const totalScore = submissions.reduce(
    (acc: number, s: any) => acc + (s.score ?? 0),
    0,
  );
  const maxPoints = submissions.reduce(
    (acc: number, s: any) => acc + (s.exercise?.points ?? 0),
    0,
  );
  const gradedCount = submissions.filter(
    (s: any) => s.status === "GRADED",
  ).length;
  const pendingCount = submissions.filter(
    (s: any) => s.status === "PENDING",
  ).length;
  const feedbackCount = submissions.filter((s: any) => s.feedback).length;

  // ── Handlers & Rubric State ───────────────────────────────────────────
  const [useRubricMode, setUseRubricMode] = useState(false);
  const { data: attachedRubric } = useRubricDetail(selectedSubmission?.exercise?.rubricId);

  const openGradeModal = (sub: any) => {
    setSelectedSubmission(sub);
    setUseRubricMode(Boolean(sub.exercise?.rubricId || sub.exercise?.rubric));
    setGradingForm({
      score: sub.score ?? 0,
      feedback: sub.feedback ?? "",
      isCorrect: sub.isCorrect ?? true,
    });
  };

  const submitGrade = () => {
    if (!selectedSubmission) return;
    gradeMutation.mutate(
      { submissionId: selectedSubmission.id, data: gradingForm },
      {
        onSuccess: (updatedSub) => {
          setSelectedSubmission(null);
          const updatedSubs = submissions.map((s: any) =>
            s.id === selectedSubmission.id
              ? { ...s, ...updatedSub, status: "GRADED" }
              : s,
          );
          setLocalSubmissions(updatedSubs);
        },
      },
    );
  };

  return (
    <InstructorLayout>
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Back + header */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/instructor/submissions")}
              className="gap-2 text-slate-500 hover:text-slate-800 -ml-2 mb-3"
            >
              <ArrowLeft size={15} />
              Back to submissions
            </Button>

            {group ? (
              <>
                <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
                  {group.quizTitle || "Submission Review"}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Review and grade {group.user?.firstname}{" "}
                  {group.user?.lastname}'s submissions for this assignment.
                </p>
              </>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <Loader2 size={14} className="animate-spin" />
                Loading submission details...
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
                Submission not found
              </h1>
            )}
          </div>

          {/* Student info strip */}
          {group && (
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
              <div
                className={cn(
                  "h-11 w-11 rounded-full flex items-center justify-center font-semibold text-sm shrink-0",
                  avatarPalette(group.user?.email ?? group.userId),
                )}
              >
                {initialsOf(group.user?.firstname, group.user?.lastname)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-slate-800 text-sm leading-tight">
                  {group.user?.firstname} {group.user?.lastname}
                </span>
                <span className="flex items-center gap-1 text-slate-400 text-xs leading-tight mt-0.5">
                  <Mail size={11} />
                  {group.user?.email}
                </span>
              </div>
              <div className="ml-auto text-right">
                <span className="text-xs text-slate-400 block">Course</span>
                <span className="text-sm font-medium text-slate-700 truncate max-w-[200px] block">
                  {group.courseTitle}
                </span>
              </div>
            </div>
          )}

          {/* Summary pills (PeerGradingDetail style) */}
          {group && submissions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm shadow-sm">
                <ListChecks size={13} className="text-slate-500" />
                <span className="font-bold text-slate-800">
                  {submissions.length}
                </span>
                <span className="text-slate-500">Questions</span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm shadow-sm">
                <span className="font-bold text-slate-800">{totalScore}</span>
                <span className="text-slate-400">/</span>
                <span className="font-bold text-slate-800">{maxPoints}</span>
                <span className="text-slate-500">Points</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 text-sm">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span className="font-bold text-emerald-700">
                  {gradedCount}
                </span>
                <span className="text-emerald-600">Graded</span>
              </div>
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 text-sm">
                  <Clock size={13} className="text-amber-600" />
                  <span className="font-bold text-amber-700">
                    {pendingCount}
                  </span>
                  <span className="text-amber-600">Pending</span>
                </div>
              )}
              {feedbackCount > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm">
                  <MessageSquareText size={13} className="text-blue-600" />
                  <span className="font-bold text-blue-700">
                    {feedbackCount}
                  </span>
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
          ) : !group ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Inbox size={40} className="text-slate-200" />
              <p className="text-sm font-semibold text-slate-400">
                Submission not found.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/instructor/submissions")}
                className="mt-2"
              >
                Go back to submissions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((item: any, idx: number) => (
                <ResponseCard
                  key={item.id}
                  item={item}
                  idx={idx}
                  onGrade={openGradeModal}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Grading Overlay ── */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <DialogContent
          className={cn(
            "bg-white rounded-2xl border border-slate-200 shadow-xl p-0 overflow-hidden flex flex-col max-h-[90vh] gap-0 text-left transition-all",
            useRubricMode && (attachedRubric || selectedSubmission?.exercise?.rubric)
              ? "sm:max-w-[750px]"
              : "sm:max-w-[480px]"
          )}
        >
          <div className="px-7 pt-6 pb-5 border-b border-slate-100 shrink-0 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                Grade entry
              </span>
              <DialogTitle className="text-lg font-bold text-slate-900 mt-1">
                {cleanTitle(selectedSubmission?.exercise?.title) ||
                  "Manual assessment"}
              </DialogTitle>
            </div>

            {(attachedRubric || selectedSubmission?.exercise?.rubric) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUseRubricMode(!useRubricMode)}
                className="text-xs font-bold rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 h-8"
              >
                <Award className="w-3.5 h-3.5 mr-1 text-blue-600" />
                {useRubricMode ? "Manual Override" : "Grade with Rubric"}
              </Button>
            )}
          </div>

          <div className="px-7 py-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            {useRubricMode && (attachedRubric || selectedSubmission?.exercise?.rubric) ? (
              <RubricGradingMatrix
                rubric={attachedRubric || selectedSubmission?.exercise?.rubric}
                initialFeedback={gradingForm.feedback}
                onApplyScore={(score, feedback, evalResult) => {
                  setGradingForm({
                    score,
                    isCorrect: (evalResult.percentage || 0) >= 80,
                    feedback: feedback || evalResult.customFeedback || "",
                  });
                  setUseRubricMode(false);
                }}
              />
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">
                    Score
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      max={selectedSubmission?.exercise?.points}
                      value={gradingForm.score}
                      onChange={(e) =>
                        setGradingForm({
                          ...gradingForm,
                          score: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-11 w-24 rounded-lg border-slate-200 bg-white text-base font-semibold text-center"
                    />
                    <span className="text-sm text-slate-400 font-medium">
                      out of {selectedSubmission?.exercise?.points} pts
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">
                    Verdict
                  </label>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setGradingForm({ ...gradingForm, isCorrect: true })
                      }
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-4 h-9 font-medium text-sm transition-colors",
                        gradingForm.isCorrect
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      <CheckCircle2 size={15} /> Correct
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setGradingForm({ ...gradingForm, isCorrect: false })
                      }
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-4 h-9 font-medium text-sm transition-colors",
                        !gradingForm.isCorrect
                          ? "bg-white text-rose-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      <X size={15} /> Incorrect
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">
                    Feedback for student
                  </label>
                  <Textarea
                    value={gradingForm.feedback}
                    onChange={(e) =>
                      setGradingForm({ ...gradingForm, feedback: e.target.value })
                    }
                    placeholder="Tell the student how to improve..."
                    className="min-h-[110px] rounded-lg border-slate-200 bg-white p-3.5 text-sm resize-none focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          <div className="px-7 py-4 flex justify-end gap-2.5 shrink-0 border-t border-slate-100 bg-slate-50/60">
            <Button
              variant="ghost"
              onClick={() => setSelectedSubmission(null)}
              className="h-9 px-4 rounded-lg font-medium text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={submitGrade}
              disabled={gradeMutation.isPending}
              className="h-9 px-5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700"
            >
              {gradeMutation.isPending ? "Saving..." : "Save grade"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </InstructorLayout>
  );
};

export default SubmissionDetail;
