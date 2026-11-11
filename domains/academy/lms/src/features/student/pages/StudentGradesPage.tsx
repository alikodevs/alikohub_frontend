import React, { useMemo, useState } from "react";
import StudentLayout from "@/features/student/components/StudentLayout";
import { useEnrollments } from "@/hooks/useAcademy";
import { useStudentGradeReport } from "@/features/rubric/hooks/useGradebook";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Building2,
  Gauge,
  Award,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const StudentGradesPage: React.FC = () => {
  const { data: enrollments = [], isLoading: isEnrollmentsLoading } =
    useEnrollments();

  const cohortEnrollments = useMemo(
    () =>
      enrollments.filter((e: any) => Boolean(e.cohortId || e.cohort?.id)),
    [enrollments],
  );

  const [selectedCohortId, setSelectedCohortId] = useState<string>("");

  const activeCohortId = useMemo(() => {
    if (selectedCohortId) return selectedCohortId;
    const first = cohortEnrollments[0];
    return first ? String(first.cohortId || first.cohort?.id) : "";
  }, [selectedCohortId, cohortEnrollments]);

  const { data: report, isLoading: isReportLoading } = useStudentGradeReport(
    activeCohortId || undefined,
  );

  const summary = report?.summary;
  const isLoading = isEnrollmentsLoading || isReportLoading;

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Electronic Gradebook &amp; Progress
              </h1>
              <p className="text-xs text-slate-500">
                Live WABON readiness across classroom theory (&ge; 80%), skills lab, and clinical hours.
              </p>
            </div>
          </div>

          {cohortEnrollments.length > 0 && (
            <select
              value={activeCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              {cohortEnrollments.map((e: any) => {
                const cId = String(e.cohortId || e.cohort?.id);
                return (
                  <option key={e.id || cId} value={cId}>
                    {e.course?.title || `Course #${e.courseId}`} ·{" "}
                    {e.cohort?.name || `Cohort #${cId}`}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading gradebook report...</p>
          </div>
        ) : !activeCohortId || !summary ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              No cohort gradebook available yet.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Enroll in a program cohort to track your theory scores, skills lab checkoffs, and clinical hours.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Summary Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {report.courseTitle || `Cohort #${report.cohortId}`}
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-slate-900">
                    {summary.overallTheoryPercent}%
                  </span>
                  <Badge className="bg-slate-900 text-white border-0 text-xs font-bold">
                    Grade: {summary.letterGrade}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      summary.isTheoryPassed
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                        : "bg-amber-50 text-amber-700 border-amber-200 font-bold"
                    }
                  >
                    {summary.isTheoryPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    )}
                    {summary.isTheoryPassed ? "Theory Passing (>= 80%)" : "Below 80% Pass Threshold"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Compliance Status:{" "}
                  <strong className="text-slate-800">{summary.complianceStatus}</strong>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to="/evaluations"
                  className="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Program Evaluation
                </Link>
                <Link
                  to="/certifications"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90"
                >
                  <Award className="w-3.5 h-3.5" /> Certificates
                </Link>
              </div>
            </div>

            {/* Theory Score Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Quizzes Average
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {summary.quizAveragePercent}%
                </div>
                <p className="text-xs text-slate-500">
                  {report.details?.quizzesCompleted ?? 0} quizzes scored
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Proctored Exams Average
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {summary.examAveragePercent}%
                </div>
                <p className="text-xs text-slate-500">
                  {report.details?.examsCompleted ?? 0} exams scored
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Discussions Rubric Average
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {summary.discussionAveragePercent}%
                </div>
                <p className="text-xs text-slate-500">
                  {report.details?.discussionsGraded ?? 0} unit discussions graded
                </p>
              </div>
            </div>

            {/* Skills Lab, Clinical Hours & 90-Day Pacing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    Skills Lab Checkoffs
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      summary.skillsLab.isSkillsLabComplete
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                        : "bg-slate-50 text-slate-600 text-[10px]"
                    }
                  >
                    {summary.skillsLab.isSkillsLabComplete ? "Complete" : "In Progress"}
                  </Badge>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {summary.skillsLab.passedCount} / {summary.skillsLab.totalRequired}
                </div>
                <Progress
                  value={
                    summary.skillsLab.totalRequired > 0
                      ? (summary.skillsLab.passedCount / summary.skillsLab.totalRequired) * 100
                      : 0
                  }
                  className="h-2"
                />
                <Link
                  to="/skills-lab"
                  className="text-xs font-semibold text-primary hover:underline block"
                >
                  View Skills Matrix &rarr;
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Clinical Hours
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      summary.clinicalHours.isClinicalHoursMet
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                        : "bg-slate-50 text-slate-600 text-[10px]"
                    }
                  >
                    {summary.clinicalHours.isClinicalHoursMet ? "40h Met" : "In Progress"}
                  </Badge>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {summary.clinicalHours.totalCompleted}h /{" "}
                  {summary.clinicalHours.minimumRequired}h
                </div>
                <Progress
                  value={
                    summary.clinicalHours.minimumRequired > 0
                      ? Math.min(
                          100,
                          (summary.clinicalHours.totalCompleted /
                            summary.clinicalHours.minimumRequired) *
                            100,
                        )
                      : 0
                  }
                  className="h-2"
                />
                <Link
                  to="/clinical"
                  className="text-xs font-semibold text-primary hover:underline block"
                >
                  View Clinical Log &rarr;
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-amber-600" />
                    90-Day Cohort Pacing
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      summary.pacing.status === "ON_TRACK"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                        : summary.pacing.status === "AT_RISK"
                          ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                          : "bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                    }
                  >
                    {summary.pacing.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {summary.pacing.daysRemainingInCohort} Days Left
                </div>
                <p className="text-xs text-slate-500">
                  Progress: <strong>{summary.pacing.actualProgressPercent}%</strong> actual vs{" "}
                  <strong>{summary.pacing.expectedProgressPercent}%</strong> expected
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentGradesPage;

