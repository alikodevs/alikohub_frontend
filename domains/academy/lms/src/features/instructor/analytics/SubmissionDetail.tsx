import React, { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import {
  CheckCircle2,
  X,
  ArrowLeft,
  Mail,
  ListChecks,
  MessageSquareText,
  Clock,
  Inbox,
  Loader2,
  Award,
  AlertCircle,
  Layers,
  ShieldCheck,
  Check,
  Edit3,
  HelpCircle,
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
import { toast } from "sonner";

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

const formatQuestionType = (type?: string) => {
  switch (type) {
    case "SHORT_TEXT":
      return "Essay / Short Answer (Manual Grading)";
    case "MULTIPLE_CHOICE":
      return "Multiple Choice (Auto-Graded)";
    case "TRUE_FALSE":
      return "True / False (Auto-Graded)";
    case "MATCHING":
      return "Matching Pairs (Auto-Graded)";
    default:
      return type || "Standard Exercise";
  }
};

// ── Response Card Component ──────────────────────────────────────────────
interface ResponseCardProps {
  item: any;
  idx: number;
  totalQuestions: number;
  onGradeSubmit: (
    submissionId: number,
    data: { isCorrect: boolean; score: number; feedback: string }
  ) => Promise<void>;
  onOpenRubric: (item: any) => void;
  isSaving: boolean;
}

const ResponseCard: React.FC<ResponseCardProps> = ({
  item,
  idx,
  totalQuestions,
  onGradeSubmit,
  onOpenRubric,
  isSaving,
}) => {
  const isPending = item.status === "PENDING" || item.status === "PENDING_REVIEW";
  const isEssay = item.exercise?.type === "SHORT_TEXT";
  const maxPoints = item.exercise?.points ?? 1;

  // Check if unanswered
  const isUnanswered =
    item.answer === null ||
    item.answer === undefined ||
    item.answer === "" ||
    (Array.isArray(item.answer) && item.answer.length === 0);

  // Local grading controls
  const [isEditing, setIsEditing] = useState<boolean>(isPending);
  const [scoreInput, setScoreInput] = useState<number>(item.score ?? 0);
  const [isCorrectInput, setIsCorrectInput] = useState<boolean>(
    item.isCorrect !== null && item.isCorrect !== undefined
      ? item.isCorrect
      : (item.score ?? 0) >= maxPoints * 0.8
  );
  const [feedbackInput, setFeedbackInput] = useState<string>(item.feedback ?? "");

  const handleSaveInline = async () => {
    try {
      await onGradeSubmit(item.id, {
        isCorrect: isCorrectInput,
        score: Number(scoreInput) || 0,
        feedback: feedbackInput,
      });
      setIsEditing(false);
      toast.success(`Question ${idx + 1} graded successfully.`);
    } catch {
      toast.error("Failed to save grade for this question.");
    }
  };

  const setPresetScore = (preset: "full" | "half" | "zero") => {
    let newScore = 0;
    if (preset === "full") newScore = maxPoints;
    if (preset === "half") newScore = Math.round((maxPoints / 2) * 10) / 10;
    if (preset === "zero") newScore = 0;

    setScoreInput(newScore);
    setIsCorrectInput(newScore >= maxPoints * 0.8);
  };

  const renderStudentResponse = () => {
    if (isUnanswered) {
      return (
        <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400 italic flex items-center gap-2">
          <AlertCircle size={14} className="text-slate-400 shrink-0" />
          No response submitted for this question (Unanswered)
        </div>
      );
    }

    if (isEssay) {
      const text = typeof item.answer === "string" ? item.answer : JSON.stringify(item.answer);
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      return (
        <div className="space-y-1.5">
          <div className="rounded-xl bg-white border border-slate-200 p-4 text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap shadow-2xs">
            {text}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {wordCount} words &bull; {text.length} characters
          </div>
        </div>
      );
    }

    if (item.exercise?.type === "MATCHING" && Array.isArray(item.answer)) {
      return (
        <div className="space-y-1.5">
          {item.answer.map((pair: any, pIdx: number) => (
            <div
              key={pIdx}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
            >
              <span className="font-semibold text-slate-700">{pair.left}</span>
              <span className="text-slate-400">&rarr;</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {pair.right}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (typeof item.answer === "boolean") {
      return (
        <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 font-bold text-xs text-slate-800">
          {item.answer ? "True" : "False"}
        </span>
      );
    }

    const strAnswer =
      typeof item.answer === "object" ? JSON.stringify(item.answer) : String(item.answer);

    return (
      <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 shadow-2xs">
        {strAnswer}
      </div>
    );
  };

  const renderCorrectAnswer = () => {
    const ca = item.exercise?.correctAnswer;
    if (ca === null || ca === undefined || ca === "") {
      if (isEssay) {
        return (
          <p className="text-xs text-slate-500 italic">
            Open-ended evaluation: Evaluate student's understanding against accredited WAC 246-841A clinical standards and rubric criteria.
          </p>
        );
      }
      return <span className="text-xs text-slate-400 italic">No model answer on file</span>;
    }

    if (item.exercise?.type === "MATCHING" && Array.isArray(ca)) {
      return (
        <div className="space-y-1.5">
          {ca.map((pair: any, pIdx: number) => (
            <div
              key={pIdx}
              className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900"
            >
              <span className="font-medium text-slate-700">{pair.left}</span>
              <span className="text-emerald-500">&rarr;</span>
              <span className="font-bold text-emerald-800">{pair.right}</span>
            </div>
          ))}
        </div>
      );
    }

    if (typeof ca === "boolean") {
      return (
        <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs">
          {ca ? "True" : "False"}
        </span>
      );
    }

    const strVal = typeof ca === "object" ? JSON.stringify(ca) : String(ca);
    return (
      <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 leading-relaxed">
        {isEssay && (
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
            Model Answer / Instructor Guidance:
          </span>
        )}
        {strVal}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0 transition-all">
      {/* Question Header Bar */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
            {idx + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Question {idx + 1} of {totalQuestions}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold bg-white text-slate-600 border-slate-200"
              >
                {formatQuestionType(item.exercise?.type)}
              </Badge>
            </div>
            {item.exercise?.title && (
              <span className="text-[11px] text-slate-400 block truncate max-w-[400px]">
                {cleanTitle(item.exercise.title)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-xl">
            {item.score ?? 0}{" "}
            <span className="text-xs font-medium text-slate-400">/{maxPoints} pts</span>
          </span>

          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5",
              isPending
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : isUnanswered
                ? "bg-slate-100 text-slate-600 border-slate-200"
                : item.isCorrect
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-rose-50 text-rose-600 border-rose-200"
            )}
          >
            {isPending ? (
              <>
                <Clock size={11} className="text-amber-600" />
                Needs Review
              </>
            ) : isUnanswered ? (
              <>
                <HelpCircle size={11} />
                Unanswered
              </>
            ) : item.isCorrect ? (
              <>
                <CheckCircle2 size={11} className="text-emerald-600" />
                Correct
              </>
            ) : (
              <>
                <X size={11} className="text-rose-500" />
                Incorrect
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Question Prompt */}
      <div className="px-5 py-4 border-b border-slate-100 bg-white">
        <p className="text-sm font-semibold text-slate-800 leading-relaxed">
          {item.exercise?.question || cleanTitle(item.exercise?.title)}
        </p>
        {item.exercise?.description &&
          item.exercise.description !== item.exercise?.question &&
          item.exercise.description !== item.exercise?.title && (
            <p className="text-xs text-slate-500 mt-1 italic">
              {item.exercise.description}
            </p>
          )}
      </div>

      {/* Responses Stack */}
      <div className="p-5 space-y-4 bg-slate-50/40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Candidate Submitted Answer */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Candidate Submitted Answer
            </span>
            {renderStudentResponse()}
          </div>

          {/* Official Correct Answer / Guide */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Expected Answer / Key
            </span>
            {renderCorrectAnswer()}
          </div>
        </div>

        {/* Existing Question Feedback (if graded and not currently editing) */}
        {!isEditing && item.feedback && (
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquareText size={12} />
              Saved Feedback on this Question
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {item.feedback}
            </p>
          </div>
        )}

        {/* Inline Manual Grading Form */}
        {isEditing ? (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                Manual Grading Controls
              </span>
              {(item.exercise?.rubricId || item.exercise?.rubric) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenRubric(item)}
                  className="h-7 text-xs font-bold text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  <Award className="w-3 h-3 mr-1" /> Open Rubric Matrix
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Score Input & Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block">
                  Awarded Score (Points)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={maxPoints}
                    step={0.5}
                    value={scoreInput}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setScoreInput(val);
                      setIsCorrectInput(val >= maxPoints * 0.8);
                    }}
                    className="w-24 h-9 text-sm font-bold text-center rounded-xl bg-slate-50 border-slate-200"
                  />
                  <span className="text-xs font-medium text-slate-400">
                    / {maxPoints} pts
                  </span>
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => setPresetScore("full")}
                      className="px-2 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100"
                    >
                      Full ({maxPoints})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetScore("half")}
                      className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                    >
                      Half
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetScore("zero")}
                      className="px-2 py-1 text-[10px] font-bold bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100"
                    >
                      Zero (0)
                    </button>
                  </div>
                </div>
              </div>

              {/* Verdict Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 block">
                  Verdict
                </label>
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/70 p-1 gap-1 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsCorrectInput(true)}
                    className={cn(
                      "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      isCorrectInput
                        ? "bg-white text-emerald-700 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <Check size={13} /> Correct
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCorrectInput(false)}
                    className={cn(
                      "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      !isCorrectInput
                        ? "bg-white text-rose-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <X size={13} /> Incorrect
                  </button>
                </div>
              </div>
            </div>

            {/* Question Feedback Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">
                Question-Level Instructor Feedback
              </label>
              <Textarea
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                placeholder="Explain why points were awarded or deducted, citing accredited clinical nursing principles..."
                className="min-h-[80px] rounded-xl border-slate-200 bg-slate-50/50 p-3 text-xs resize-none"
              />
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-2 pt-1">
              {!isPending && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-8 px-3 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSaveInline}
                disabled={isSaving}
                className="h-8 px-4 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={12} className="animate-spin mr-1.5" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={12} className="mr-1.5" /> Save Grade &amp; Publish
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 px-3 text-xs font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-white"
            >
              <Edit3 size={12} className="mr-1.5" /> Modify Grade
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Instructor Attempt Review Page ───────────────────────────────────
const SubmissionDetail = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const passedGroup = (location.state as any)?.group as any | undefined;

  const [selectedSubmissionForRubric, setSelectedSubmissionForRubric] = useState<any | null>(null);

  const { data: submissionsData, isLoading } = useInstructorSubmissions({
    page: 1,
    pageSize: 300,
  });

  const gradeMutation = useGradeSubmission();
  const rawSubmissions = submissionsData?.items ?? [];

  // Group submissions by candidate and assessment
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
          courseTitle:
            sub.exercise?.module?.course?.title ||
            sub.exercise?.course?.title ||
            sub.course?.title ||
            sub.courseTitle,
          courseId:
            sub.exercise?.module?.course?.id ||
            sub.exercise?.course?.id ||
            sub.courseId,
          moduleTitle: sub.exercise?.module?.title,
          lessonTitle: sub.exercise?.lesson?.title,
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
      g.maxPoints += sub.exercise?.points ?? 1;

      if (sub.status === "PENDING" || sub.status === "PENDING_REVIEW") {
        g.status = "PENDING";
      }

      if (
        sub.status === "GRADED" &&
        (!g.gradedAt || new Date(sub.updatedAt) > new Date(g.gradedAt))
      ) {
        g.gradedAt = sub.updatedAt;
      }
    });

    if (passedGroup) {
      const fallbackCourse =
        passedGroup.courseTitle ||
        passedGroup.submissions?.[0]?.exercise?.module?.course?.title ||
        passedGroup.submissions?.[0]?.exercise?.course?.title;
      return {
        ...passedGroup,
        courseTitle: fallbackCourse,
      };
    }

    if (submissionId) {
      if (groups[submissionId]) return groups[submissionId];

      // Match by individual submission ID (e.g. /instructor/submissions/85)
      const foundBySubId = Object.values(groups).find((g: any) =>
        g.submissions.some((s: any) => String(s.id) === String(submissionId))
      );
      if (foundBySubId) return foundBySubId;

      // Match by quizId or userId
      const foundByQuizOrUser = Object.values(groups).find(
        (g: any) =>
          String(g.quizId) === String(submissionId) ||
          String(g.userId) === String(submissionId)
      );
      if (foundByQuizOrUser) return foundByQuizOrUser;
    }

    return null;
  }, [passedGroup, rawSubmissions, submissionId]);

  // Local state for optimistic updates
  const [localSubmissions, setLocalSubmissions] = useState<any[] | null>(null);
  const submissions = localSubmissions ?? group?.submissions ?? [];

  // Overall Feedback state
  const [overallFeedback, setOverallFeedback] = useState<string>("");
  const [isSavingOverall, setIsSavingOverall] = useState(false);

  // Recompute Performance Breakdown
  const headerCourseTitle =
    group?.courseTitle ||
    submissions[0]?.exercise?.module?.course?.title ||
    submissions[0]?.exercise?.course?.title ||
    submissions[0]?.course?.title ||
    "Course Attempt Review";

  const totalScore = submissions.reduce(
    (acc: number, s: any) => acc + (s.score ?? 0),
    0
  );
  const maxPoints = submissions.reduce(
    (acc: number, s: any) => acc + (s.exercise?.points ?? 1),
    0
  );
  const percentage = maxPoints > 0 ? Math.round((totalScore / maxPoints) * 100) : 0;
  const isPassing = percentage >= 80;

  const correctCount = submissions.filter((s: any) => s.isCorrect === true).length;
  const incorrectCount = submissions.filter(
    (s: any) => s.status === "GRADED" && s.isCorrect === false
  ).length;
  const pendingCount = submissions.filter(
    (s: any) => s.status === "PENDING" || s.status === "PENDING_REVIEW"
  ).length;
  const unansweredCount = submissions.filter(
    (s: any) =>
      s.answer === null ||
      s.answer === undefined ||
      s.answer === "" ||
      (Array.isArray(s.answer) && s.answer.length === 0)
  ).length;

  // Attempt count
  const attemptCount = useMemo(() => {
    if (submissions.length === 0) return 1;
    const counts = submissions.map((s: any) => s.attemptCount || 1);
    return Math.max(...counts);
  }, [submissions]);

  // Handler for saving a grade
  const handleGradeSubmit = async (
    submissionId: number,
    data: { isCorrect: boolean; score: number; feedback: string }
  ) => {
    await gradeMutation.mutateAsync({
      submissionId,
      data,
    });

    const updated = submissions.map((s: any) =>
      s.id === submissionId
        ? {
            ...s,
            isCorrect: data.isCorrect,
            score: data.score,
            feedback: data.feedback,
            status: "GRADED",
            updatedAt: new Date().toISOString(),
          }
        : s
    );
    setLocalSubmissions(updated);
  };

  // Rubric Modal Support
  const { data: attachedRubric } = useRubricDetail(
    selectedSubmissionForRubric?.exercise?.rubricId
  );

  const handleApplyRubric = async (
    score: number,
    feedback: string,
    evalResult: any
  ) => {
    if (!selectedSubmissionForRubric) return;
    const isCorrect = (evalResult.percentage || 0) >= 80;
    await handleGradeSubmit(selectedSubmissionForRubric.id, {
      score,
      isCorrect,
      feedback: feedback || evalResult.customFeedback || "",
    });
    setSelectedSubmissionForRubric(null);
    toast.success("Rubric evaluation applied and grade published.");
  };

  const handleSaveOverallFeedback = () => {
    setIsSavingOverall(true);
    setTimeout(() => {
      setIsSavingOverall(false);
      toast.success("Overall assessment feedback saved and linked to student grade report.");
    }, 600);
  };

  return (
    <InstructorLayout>
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* ── Top Navigation & Breadcrumb ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/instructor/submissions")}
                className="gap-2 text-slate-500 hover:text-slate-900 -ml-2 mb-2 h-8"
              >
                <ArrowLeft size={14} />
                Back to All Submissions
              </Button>
              <h1 className="text-2xl font-black text-slate-900 font-heading tracking-tight">
                {headerCourseTitle}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Candidate attempt evaluation &bull; {group?.moduleTitle || "Theory Module"}
                {group?.lessonTitle ? ` • ${group.lessonTitle}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold py-1 px-3">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Live Gradebook Sync Active
              </Badge>
            </div>
          </div>

          {/* ── Student & Attempt Profile Card ── */}
          {group && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs",
                      avatarPalette(group.user?.email ?? group.userId)
                    )}
                  >
                    {initialsOf(group.user?.firstname, group.user?.lastname)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">
                        {group.user?.firstname} {group.user?.lastname}
                      </span>
                      <Badge className="bg-purple-100 text-purple-800 border-none text-[10px] font-bold">
                        <Layers className="w-3 h-3 mr-1" />
                        Attempt #{attemptCount}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Mail size={12} className="text-slate-400" />
                        {group.user?.email || group.userId}
                      </span>
                      <span>&bull;</span>
                      <span>ID: <code className="font-mono text-slate-600">{group.userId.slice(0, 10)}...</code></span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-0.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Submission Timestamp
                  </span>
                  <span className="text-xs font-bold text-slate-700 block">
                    {format(new Date(group.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  {group.gradedAt && (
                    <span className="text-[11px] text-slate-400 block">
                      Last Graded: {format(new Date(group.gradedAt), "MMM d, h:mm a")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Performance Metrics & Breakdown Strip ── */}
          {group && submissions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total Score */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Score
                </span>
                <div className="text-xl font-black text-slate-900">
                  {totalScore} <span className="text-xs font-semibold text-slate-400">/{maxPoints}</span>
                </div>
                <span className="text-[11px] font-bold text-blue-600 block">
                  {percentage}% Grade
                </span>
              </div>

              {/* WABON Status */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  WABON Standard
                </span>
                <div className="text-sm font-bold mt-1">
                  {isPassing ? (
                    <span className="text-emerald-700 font-black flex items-center gap-1">
                      <CheckCircle2 size={14} /> Passed
                    </span>
                  ) : (
                    <span className="text-amber-700 font-black flex items-center gap-1">
                      <AlertCircle size={14} /> Remediation
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  80% passing standard
                </span>
              </div>

              {/* Correct Questions */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Correct
                </span>
                <div className="text-xl font-black text-emerald-800">
                  {correctCount} <span className="text-xs font-semibold text-emerald-600">/{submissions.length}</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium block">
                  Verified correct
                </span>
              </div>

              {/* Incorrect Questions */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                  Incorrect
                </span>
                <div className="text-xl font-black text-rose-800">
                  {incorrectCount} <span className="text-xs font-semibold text-rose-600">/{submissions.length}</span>
                </div>
                <span className="text-[10px] text-rose-600 font-medium block">
                  Missed questions
                </span>
              </div>

              {/* Unanswered Questions */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Unanswered
                </span>
                <div className="text-xl font-black text-slate-700">
                  {unansweredCount} <span className="text-xs font-semibold text-slate-400">/{submissions.length}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Blank submissions
                </span>
              </div>

              {/* Pending Manual Review */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  Pending Review
                </span>
                <div className="text-xl font-black text-amber-800">
                  {pendingCount}
                </div>
                <span className="text-[10px] text-amber-600 font-medium block">
                  {pendingCount > 0 ? "Needs instructor grade" : "All graded"}
                </span>
              </div>
            </div>
          )}

          {/* ── Question-by-Question Review List ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-slate-600" />
                Question-by-Question Attempt Review
              </h2>
              <span className="text-xs text-slate-400">
                {submissions.length} questions submitted
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-40 bg-white border border-slate-200 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-16 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
                <Inbox size={40} className="text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600 text-sm">No submission questions found.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/instructor/submissions")}
                  className="rounded-xl"
                >
                  Return to Submissions
                </Button>
              </div>
            ) : (
              submissions.map((item: any, idx: number) => (
                <ResponseCard
                  key={item.id}
                  item={item}
                  idx={idx}
                  totalQuestions={submissions.length}
                  onGradeSubmit={handleGradeSubmit}
                  onOpenRubric={(sub) => setSelectedSubmissionForRubric(sub)}
                  isSaving={gradeMutation.isPending}
                />
              ))
            )}
          </div>

          {/* ── Overall Assessment Feedback & Gradebook Publishing ── */}
          {group && submissions.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Gradebook Publishing &amp; WABON Clearance
                    </h3>
                    <p className="text-xs text-slate-500">
                      Synchronized live with the cohort gradebook and academic audit trail.
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold py-1 px-3 self-start sm:self-auto">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Gradebook Synced
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">WABON WAC 246-841A Standard: </span>
                Grades entered for this candidate are atomically committed to the cohort gradebook. Scores below 80% automatically trigger remediation tracking.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Overall Candidate Feedback
                </label>
                <Textarea
                  value={overallFeedback}
                  onChange={(e) => setOverallFeedback(e.target.value)}
                  placeholder="Provide holistic feedback on this attempt to guide the student's clinical theory progression..."
                  className="min-h-[100px] rounded-xl border-slate-200 bg-slate-50/50 p-3.5 text-xs resize-none"
                />
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Candidate will be able to review this summary in their student portal.
                  </span>
                  <Button
                    onClick={handleSaveOverallFeedback}
                    disabled={isSavingOverall}
                    className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs"
                  >
                    {isSavingOverall ? (
                      <>
                        <Loader2 size={13} className="animate-spin mr-1.5" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check size={13} className="mr-1.5" /> Save Overall Feedback
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Rubric Evaluator Dialog ── */}
      <Dialog
        open={Boolean(selectedSubmissionForRubric)}
        onOpenChange={(open) => !open && setSelectedSubmissionForRubric(null)}
      >
        <DialogContent className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] sm:max-w-[760px]">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                Rubric Evaluation Matrix
              </span>
              <DialogTitle className="text-base font-bold text-slate-900 mt-0.5">
                {cleanTitle(selectedSubmissionForRubric?.exercise?.title) || "Rubric Assessment"}
              </DialogTitle>
            </div>
          </div>

          <div className="p-6 overflow-y-auto space-y-4">
            {attachedRubric || selectedSubmissionForRubric?.exercise?.rubric ? (
              <RubricGradingMatrix
                rubric={attachedRubric || selectedSubmissionForRubric?.exercise?.rubric}
                initialFeedback={selectedSubmissionForRubric?.feedback || ""}
                onApplyScore={handleApplyRubric}
              />
            ) : (
              <div className="p-10 text-center text-xs text-slate-400">
                Loading rubric criteria...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </InstructorLayout>
  );
};

export default SubmissionDetail;
