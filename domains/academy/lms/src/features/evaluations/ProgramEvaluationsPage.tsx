import React, { useEffect, useMemo, useState } from "react";
import StudentLayout from "@/features/student/components/StudentLayout";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import { usePortalMode } from "@/features/auth/hooks/useAuth";
import { useEnrollments } from "@/hooks/useAcademy";
import { useInstructorCohortsList } from "@/features/rubric/hooks/useSeatTime";
import {
  useMyEvaluationSurvey,
  useCohortEvaluations,
  useSubmitEvaluationMutation,
} from "@/features/rubric/hooks/useEvaluations";
import { Star, Loader2, MessageSquareText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const RatingInput: React.FC<{
  label: string;
  description: string;
  value: number;
  onChange: (val: number) => void;
}> = ({ label, description, value, onChange }) => (
  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
    <div>
      <span className="text-sm font-bold text-slate-900 block">{label}</span>
      <span className="text-xs text-slate-500">{description}</span>
    </div>
    <div className="flex items-center gap-2 pt-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
            value === score
              ? "bg-amber-500 text-white border-amber-500"
              : value > score
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${value >= score ? "fill-current" : ""}`} />
          {score}
        </button>
      ))}
    </div>
  </div>
);

export const ProgramEvaluationsPage: React.FC = () => {
  const { isInstructorView } = usePortalMode();
  const { data: enrollments = [] } = useEnrollments();
  const { data: staffCohorts = [] } = useInstructorCohortsList(isInstructorView);

  const studentCohorts = useMemo(
    () =>
      enrollments
        .filter((e: any) => Boolean(e.cohortId || e.cohort?.id))
        .map((e: any) => ({
          id: Number(e.cohortId || e.cohort?.id),
          name: `${e.course?.title || "Course"} · ${e.cohort?.name || `Cohort #${e.cohortId}`}`,
        })),
    [enrollments],
  );

  const cohortOptions = isInstructorView ? staffCohorts : studentCohorts;
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");

  const activeCohortId = useMemo(() => {
    if (selectedCohortId) return selectedCohortId;
    if (cohortOptions.length > 0) return String(cohortOptions[0].id);
    return "";
  }, [selectedCohortId, cohortOptions]);

  // Student queries & form state
  const { data: mySurvey, isLoading: isMyLoading } = useMyEvaluationSurvey(
    !isInstructorView ? activeCohortId : null,
  );
  const submitMutation = useSubmitEvaluationMutation();

  const [courseRating, setCourseRating] = useState(5);
  const [platformRating, setPlatformRating] = useState(5);
  const [instructorRating, setInstructorRating] = useState(5);
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (mySurvey) {
      setCourseRating(mySurvey.courseRating || 5);
      setPlatformRating(mySurvey.platformRating || 5);
      setInstructorRating(mySurvey.instructorRating || 5);
      setComments(mySurvey.comments || "");
    } else {
      setCourseRating(5);
      setPlatformRating(5);
      setInstructorRating(5);
      setComments("");
    }
  }, [mySurvey, activeCohortId]);

  // Instructor / Auditor metrics query
  const { data: cohortMetrics, isLoading: isMetricsLoading } =
    useCohortEvaluations(activeCohortId, isInstructorView);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCohortId) return;
    await submitMutation.mutateAsync({
      cohortId: Number(activeCohortId),
      courseRating,
      platformRating,
      instructorRating,
      comments: comments.trim() || undefined,
    });
  };

  const inner = (
    <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Program &amp; Platform Evaluations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isInstructorView
              ? "Cohort student evaluation metrics covering course curriculum, LMS platform, and instruction."
              : "End-of-course evaluation feedback on curriculum quality, technical platform usability, and instructor support."}
          </p>
        </div>

        {cohortOptions.length > 0 && (
          <select
            value={activeCohortId}
            onChange={(e) => setSelectedCohortId(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
          >
            {cohortOptions.map((c: any) => (
              <option key={c.id} value={String(c.id)}>
                {c.name || `Cohort #${c.id}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {!activeCohortId ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
          No cohort available for program evaluations.
        </div>
      ) : isInstructorView ? (
        isMetricsLoading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading cohort evaluation metrics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Total Surveys
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {cohortMetrics?.totalSurveys ?? 0}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Avg Course Rating
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {Number(cohortMetrics?.averageCourseRating ?? 0).toFixed(1)} / 5
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Avg Platform Rating
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {Number(cohortMetrics?.averagePlatformRating ?? 0).toFixed(1)} / 5
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Avg Instructor Rating
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {Number(cohortMetrics?.averageInstructorRating ?? 0).toFixed(1)} / 5
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-primary" />
                Submitted Cohort Surveys
              </h2>
              {cohortMetrics?.surveys?.length ? (
                <div className="space-y-3">
                  {cohortMetrics.surveys.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Course: {s.courseRating}/5</Badge>
                          <Badge variant="outline">Platform: {s.platformRating}/5</Badge>
                          <Badge variant="outline">Instructor: {s.instructorRating}/5</Badge>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {s.submittedAt
                            ? format(new Date(s.submittedAt), "MMM d, yyyy")
                            : ""}
                        </span>
                      </div>
                      {s.comments && (
                        <p className="text-xs text-slate-700 leading-relaxed">
                          &ldquo;{s.comments}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No evaluation surveys submitted yet for this cohort.
                </p>
              )}
            </div>
          </div>
        )
      ) : isMyLoading ? (
        <div className="py-12 text-center text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading your evaluation...</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
        >
          {mySurvey && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              You submitted an evaluation on{" "}
              {mySurvey.submittedAt
                ? format(new Date(mySurvey.submittedAt), "MMM d, yyyy")
                : "record"}
              . You can update your feedback below anytime.
            </div>
          )}

          <RatingInput
            label="Course Curriculum & Theory Content"
            description="Alignment of online lessons, textbook readings, discussions, and quizzes."
            value={courseRating}
            onChange={setCourseRating}
          />
          <RatingInput
            label="Online Learning Platform & Technical Reliability"
            description="LMS navigation, exam security, responsiveness, and technical support."
            value={platformRating}
            onChange={setPlatformRating}
          />
          <RatingInput
            label="Instructor Supervision & Feedback"
            description="Responsiveness, individualized feedback, skills lab coaching, and clinical guidance."
            value={instructorRating}
            onChange={setInstructorRating}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Additional Comments &amp; Suggestions (Optional)
            </label>
            <Textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share what worked well or how we can strengthen future cohorts..."
              className="text-xs"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="bg-primary text-white font-semibold"
            >
              {submitMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              )}
              {mySurvey ? "Update Program Evaluation" : "Submit Program Evaluation"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );

  return isInstructorView ? (
    <InstructorLayout>{inner}</InstructorLayout>
  ) : (
    <StudentLayout>{inner}</StudentLayout>
  );
};

export default ProgramEvaluationsPage;

