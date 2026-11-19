import React, { useMemo, useState } from "react";
import StudentLayout from "@/features/student/components/StudentLayout";
import { useEnrollments } from "@/hooks/useAcademy";
import {
  useStudentGradeReport,
  useExportGradebookCsvMutation,
} from "@/features/rubric/hooks/useGradebook";
import { useStudentSkillsMatrix } from "@/features/rubric/hooks/useSkillsLab";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Building2,
  Gauge,
  Award,
  BookOpen,
  Download,
  HelpCircle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

  const activeEnrollment = useMemo(() => {
    return (
      cohortEnrollments.find(
        (e: any) => String(e.cohortId || e.cohort?.id) === activeCohortId,
      ) || cohortEnrollments[0]
    );
  }, [cohortEnrollments, activeCohortId]);

  const { data: report, isLoading: isReportLoading } = useStudentGradeReport(
    activeCohortId || undefined,
  );

  // Student skills matrix checkoffs for active cohort
  const { data: skillsMatrix } = useStudentSkillsMatrix(
    report?.userId,
    activeCohortId || undefined,
  );

  const exportCsvMutation = useExportGradebookCsvMutation();

  const summary = report?.summary;
  const isLoading = isEnrollmentsLoading || isReportLoading;

  // Grade Chip styling helper with AA contrast (Consistent with Dashboard)
  const getGradeChip = (grade: string, isPassing: boolean = true) => {
    const g = (grade || "").toUpperCase();
    if (g.startsWith("A")) {
      return {
        label: grade,
        className: "bg-emerald-50 text-emerald-800 border-emerald-200/90 font-semibold",
      };
    }
    if (g.startsWith("B")) {
      return {
        label: grade,
        className: "bg-blue-50 text-blue-800 border-blue-200/90 font-semibold",
      };
    }
    if (g.startsWith("C")) {
      return {
        label: grade,
        className: "bg-amber-50 text-amber-800 border-amber-200/90 font-semibold",
      };
    }
    if (g === "PASS" || (isPassing && g !== "PENDING" && g !== "—")) {
      return {
        label: grade || "Pass",
        className: "bg-emerald-50 text-emerald-800 border-emerald-200/90 font-semibold",
      };
    }
    if (g === "PENDING" || g === "—") {
      return {
        label: "Pending",
        className: "bg-slate-100 text-slate-600 border-slate-200 font-medium",
      };
    }
    return {
      label: grade || "Needs Work",
      className: "bg-rose-50 text-rose-800 border-rose-200/90 font-semibold",
    };
  };

  // Compile graded items table dynamically from backend data (V1/V2 Blend)
  const gradedItems = useMemo(() => {
    if (!summary) return [];
    const list: Array<{
      id: string;
      item: string;
      type: "Quiz" | "Exam" | "Discussion" | "Skills";
      submitted: string;
      score: string;
      grade: string;
      isPass: boolean;
      link?: string;
    }> = [];

    // 1. Quizzes
    if ((report?.details?.quizzesCompleted ?? 0) > 0 || summary.quizAveragePercent > 0) {
      list.push({
        id: "quiz-avg",
        item: "Curriculum Theory Quizzes",
        type: "Quiz",
        submitted: `${report?.details?.quizzesCompleted ?? 0} completed`,
        score: `${summary.quizAveragePercent}%`,
        grade:
          summary.quizAveragePercent >= 90
            ? "A-"
            : summary.quizAveragePercent >= 80
              ? "B"
              : summary.quizAveragePercent >= 70
                ? "C+"
                : "D+",
        isPass: summary.quizAveragePercent >= 80,
      });
    }

    // 2. Proctored Exams
    if ((report?.details?.examsCompleted ?? 0) > 0 || summary.examAveragePercent > 0) {
      list.push({
        id: "exam-avg",
        item: "Proctored Comprehensive Exams",
        type: "Exam",
        submitted: `${report?.details?.examsCompleted ?? 0} completed`,
        score: `${summary.examAveragePercent}%`,
        grade:
          summary.examAveragePercent >= 90
            ? "A"
            : summary.examAveragePercent >= 80
              ? "B+"
              : summary.examAveragePercent >= 70
                ? "C"
                : "D+",
        isPass: summary.examAveragePercent >= 80,
      });
    }

    // 3. Discussion Rubrics
    if ((report?.details?.discussionsGraded ?? 0) > 0 || summary.discussionAveragePercent > 0) {
      list.push({
        id: "disc-avg",
        item: "Clinical Reasoning Discussions",
        type: "Discussion",
        submitted: `${report?.details?.discussionsGraded ?? 0} graded`,
        score: `${summary.discussionAveragePercent}%`,
        grade: summary.discussionAveragePercent >= 80 ? "Pass" : "B-",
        isPass: summary.discussionAveragePercent >= 80,
      });
    }

    // 4. Skills Lab Checkoffs (From matrix if available, or summary fallback)
    if (Array.isArray(skillsMatrix) && skillsMatrix.length > 0) {
      skillsMatrix.forEach((m: any, idx: number) => {
        const isPassed = m.passed || m.status === "PASSED" || m.status === "SATISFACTORY";
        list.push({
          id: `skill-${m.id || idx}`,
          item: m.skill?.title || m.skill?.name || `Skill Checkoff #${m.skillId || idx + 1}`,
          type: "Skills",
          submitted: m.checkoffDate ? format(new Date(m.checkoffDate), "MMM d") : "Pending",
          score: isPassed ? "100%" : "—",
          grade: isPassed ? "Pass" : "Pending",
          isPass: isPassed,
          link: "/skills-lab",
        });
      });
    } else {
      list.push({
        id: "skills-lab-summary",
        item: "Hand Hygiene & Nursing Core Checkoffs",
        type: "Skills",
        submitted: `${summary.skillsLab.passedCount} of ${summary.skillsLab.totalRequired} verified`,
        score: `${Math.round((summary.skillsLab.passedCount / (summary.skillsLab.totalRequired || 1)) * 100)}%`,
        grade: summary.skillsLab.isSkillsLabComplete ? "Pass" : "Pending",
        isPass: summary.skillsLab.isSkillsLabComplete,
        link: "/skills-lab",
      });
    }

    // 5. Clinical Hours Fulfillment
    list.push({
      id: "clinical-hours-summary",
      item: "Supervised Clinical Training Hours",
      type: "Skills",
      submitted: `${summary.clinicalHours.totalCompleted}h logged`,
      score: `${Math.min(100, Math.round((summary.clinicalHours.totalCompleted / (summary.clinicalHours.minimumRequired || 40)) * 100))}%`,
      grade: summary.clinicalHours.isClinicalHoursMet ? "40h Met" : "Pending",
      isPass: summary.clinicalHours.isClinicalHoursMet,
      link: "/clinical",
    });

    return list;
  }, [summary, report, skillsMatrix]);

  // Actionable advice based on V2 Light Mode & WABON Compliance
  const actionableAdvice = useMemo(() => {
    if (!summary) return null;
    if (!summary.isTheoryPassed) {
      return {
        title: "Actionable tip",
        status: "Failing Theory (< 80%)",
        statusColor: "bg-rose-50 text-rose-700 border-rose-200",
        message:
          "Review Medical Terminology and Chapter flashcards before the retake to raise your theory score above 80%.",
        ctaLabel: "Review Flashcards",
        ctaLink: activeEnrollment?.courseId ? `/learn/${activeEnrollment.courseId}` : "/mylearning",
      };
    }
    if (!summary.skillsLab.isSkillsLabComplete) {
      return {
        title: "Actionable tip",
        status: "Pending Skills Lab",
        statusColor: "bg-amber-50 text-amber-700 border-amber-200",
        message:
          "Theory scores are on track! Schedule your pending Hand Hygiene and Vital Signs checkoffs with your RN instructor.",
        ctaLabel: "View Skills Matrix",
        ctaLink: "/skills-lab",
      };
    }
    if (!summary.clinicalHours.isClinicalHoursMet) {
      return {
        title: "Actionable tip",
        status: "Pending Clinical Hours",
        statusColor: "bg-blue-50 text-blue-700 border-blue-200",
        message:
          "You have clinical training shifts remaining. Check your upcoming clinical facility schedule.",
        ctaLabel: "View Clinical Log",
        ctaLink: "/clinical",
      };
    }
    return {
      title: "Actionable tip",
      status: "Ready for Certification ✓",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      message:
        "All theory, skills lab, and clinical training requirements are completed! Generate your official certificate.",
      ctaLabel: "Generate Certificate",
      ctaLink: "/certifications",
    };
  }, [summary, activeEnrollment]);

  return (
    <StudentLayout>
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 bg-[#F7F9FC]">
        {/* ── Top Header Bar (Consistent with Dashboard) ────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0A65A0] border border-blue-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-semibold text-slate-900 leading-tight m-0">
                Gradebook &amp; Progress
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium m-0 mt-0.5">
                Theory scores, skills lab competencies and clinical hours in one place
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Cohort Selector (Decreased Width, Clean Dropdown) */}
            {cohortEnrollments.length > 0 && (
              <select
                value={activeCohortId}
                onChange={(e) => setSelectedCohortId(e.target.value)}
                className="h-9 w-44 sm:w-56 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0A65A0]/20 cursor-pointer truncate"
              >
                {cohortEnrollments.map((e: any) => {
                  const cId = String(e.cohortId || e.cohort?.id);
                  return (
                    <option key={e.id || cId} value={cId}>
                      {e.course?.title || `Course #${e.courseId}`} · {e.cohort?.name || `Cohort #${cId}`}
                    </option>
                  );
                })}
              </select>
            )}

            {/* Download Transcript */}
            <Button
              variant="outline"
              size="sm"
              disabled={!activeCohortId || exportCsvMutation.isPending}
              onClick={() => activeCohortId && exportCsvMutation.mutate(activeCohortId)}
              className="h-9 px-3.5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              {exportCsvMutation.isPending ? "Exporting..." : "Download transcript"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <Skeleton className="lg:col-span-8 h-80 rounded-2xl" />
              <Skeleton className="lg:col-span-4 h-80 rounded-2xl" />
            </div>
          </div>
        ) : !activeCohortId || !summary ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 font-heading m-0">
              No cohort gradebook records found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto m-0">
              Once you enroll in an approved cohort and start completing quizzes, exams, or skills checkoffs, your scores and WABON progress will appear here.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" className="rounded-xl bg-[#D77510] hover:bg-[#AC5B0B] text-white text-xs font-medium">
                <Link to="/explore">Explore Courses</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* ── Top 4 Colored KPI Cards with Sparklines & Badges (V1 Spec) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Average score (Orange Gradient) */}
              <div className="bg-gradient-to-br from-[#D77510] to-[#F16A1C] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 z-10">
                  <span className="text-xs font-semibold text-white/90">
                    Average score
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                    +4%
                  </span>
                </div>
                <div className="mt-3.5 flex items-end justify-between z-10">
                  <div>
                    <span className="text-2xl sm:text-3xl font-heading font-semibold text-white leading-none block">
                      {summary.overallTheoryPercent}%
                    </span>
                    <span className="text-xs text-white/80 font-normal mt-1 block">
                      Across {(report.details?.quizzesCompleted ?? 0) + (report.details?.examsCompleted ?? 0) + (report.details?.discussionsGraded ?? 0)} graded items
                    </span>
                  </div>
                  {/* Subtle white sparkline */}
                  <svg className="w-14 h-6 text-white/70 opacity-80" viewBox="0 0 56 24" fill="none">
                    <path
                      d="M2 18L14 14L26 19L38 9L54 5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* 2. Theory Grade (Indigo / Royal Blue Gradient) */}
              <div className="bg-gradient-to-br from-[#4F46E5] to-[#4338CA] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 z-10">
                  <span className="text-xs font-semibold text-white/90">
                    Theory
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                    Weighted
                  </span>
                </div>
                <div className="mt-3.5 flex items-end justify-between z-10">
                  <div>
                    <span className="text-2xl sm:text-3xl font-heading font-semibold text-white leading-none block">
                      {summary.letterGrade || "B+"}
                    </span>
                    <span className="text-xs text-white/80 font-normal mt-1 block truncate">
                      Quizzes &amp; exams
                    </span>
                  </div>
                  <svg className="w-14 h-6 text-white/70 opacity-80" viewBox="0 0 56 24" fill="none">
                    <path
                      d="M2 16L16 11L30 14L42 7L54 4"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* 3. Skills passed (Emerald Gradient) */}
              <div className="bg-gradient-to-br from-[#059669] to-[#047857] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 z-10">
                  <span className="text-xs font-semibold text-white/90">
                    Skills passed
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                    +1
                  </span>
                </div>
                <div className="mt-3.5 flex items-end justify-between z-10">
                  <div>
                    <span className="text-2xl sm:text-3xl font-heading font-semibold text-white leading-none block">
                      {summary.skillsLab.passedCount} / {summary.skillsLab.totalRequired}
                    </span>
                    <span className="text-xs text-white/80 font-normal mt-1 block">
                      Skills lab competencies
                    </span>
                  </div>
                  <svg className="w-14 h-6 text-white/70 opacity-80" viewBox="0 0 56 24" fill="none">
                    <path
                      d="M2 20L18 16L32 10L44 8L54 3"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* 4. Clinical hours (Rose / Crimson Gradient) */}
              <div className="bg-gradient-to-br from-[#E11D48] to-[#BE123C] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 z-10">
                  <span className="text-xs font-semibold text-white/90">
                    Clinical hours
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                    {summary.clinicalHours.isClinicalHoursMet ? "40h Met" : "In Progress"}
                  </span>
                </div>
                <div className="mt-3.5 flex items-end justify-between z-10">
                  <div>
                    <span className="text-2xl sm:text-3xl font-heading font-semibold text-white leading-none block">
                      {summary.clinicalHours.totalCompleted} / {summary.clinicalHours.minimumRequired}
                    </span>
                    <span className="text-xs text-white/80 font-normal mt-1 block">
                      Supervised hours logged
                    </span>
                  </div>
                  <svg className="w-14 h-6 text-white/70 opacity-80" viewBox="0 0 56 24" fill="none">
                    <path
                      d="M2 19L16 19L30 14L44 14L54 10"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* ── Main Section: Graded Items Table (8 cols) + Sidebar (4 cols) ─ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Graded Items Table (V1/V2 Blend) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
                  <div>
                    <h2 className="text-sm sm:text-base font-heading font-semibold text-slate-900 m-0">
                      Graded items
                    </h2>
                  </div>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs font-medium">
                    {report.courseTitle || `Cohort #${report.cohortId}`}
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 sm:px-5">Item</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Submitted</th>
                        <th className="py-3 px-3 text-right">Score</th>
                        <th className="py-3 px-4 sm:px-5 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {gradedItems.map((item) => {
                        const chip = getGradeChip(item.grade, item.isPass);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 sm:px-5">
                              {item.link ? (
                                <Link
                                  to={item.link}
                                  className="font-semibold text-slate-900 hover:text-[#0A65A0] transition-colors flex items-center gap-1.5 group"
                                >
                                  <span>{item.item}</span>
                                  <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                                </Link>
                              ) : (
                                <span className="font-semibold text-slate-900">{item.item}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border",
                                  item.type === "Quiz"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : item.type === "Exam"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200",
                                )}
                              >
                                {item.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-slate-500 font-normal">
                              {item.submitted}
                            </td>
                            <td className="py-3.5 px-3 text-right font-semibold text-slate-900">
                              {item.score}
                            </td>
                            <td className="py-3.5 px-4 sm:px-5 text-right">
                              <span
                                className={cn(
                                  "inline-block px-2.5 py-0.5 rounded-md text-[11px] border shrink-0",
                                  chip.className,
                                )}
                              >
                                {chip.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Competency Breakdown & Actionable Tip (V1/V2 Blend) */}
              <div className="lg:col-span-4 space-y-5">
                {/* 1. Competency Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm flex flex-col gap-4">
                  <div className="pb-1 border-b border-slate-100">
                    <h3 className="font-heading font-semibold text-slate-900 text-sm m-0">
                      Competency breakdown
                    </h3>
                    <p className="text-[11px] text-slate-400 m-0 mt-0.5 font-normal">
                      Score by area
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Patient care / Theory Knowledge */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">Patient care</span>
                        <span className="font-semibold text-slate-900">{summary.overallTheoryPercent}%</span>
                      </div>
                      <Progress value={summary.overallTheoryPercent} className="h-1.5 bg-slate-100" />
                    </div>

                    {/* Infection control / Quizzes */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">Infection control</span>
                        <span className="font-semibold text-slate-900">{summary.quizAveragePercent}%</span>
                      </div>
                      <Progress value={summary.quizAveragePercent} className="h-1.5 bg-slate-100" />
                    </div>

                    {/* Safety & emergency / Exams */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">Safety &amp; emergency</span>
                        <span className="font-semibold text-slate-900">{summary.examAveragePercent || 78}%</span>
                      </div>
                      <Progress value={summary.examAveragePercent || 78} className="h-1.5 bg-slate-100" />
                    </div>

                    {/* Communication / Discussions */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">Communication</span>
                        <span className="font-semibold text-slate-900">{summary.discussionAveragePercent || 88}%</span>
                      </div>
                      <Progress value={summary.discussionAveragePercent || 88} className="h-1.5 bg-slate-100" />
                    </div>

                    {/* Medical terminology / Skills Lab */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">Medical terminology</span>
                        <span className="font-semibold text-slate-900">
                          {summary.skillsLab.totalRequired > 0
                            ? Math.round((summary.skillsLab.passedCount / summary.skillsLab.totalRequired) * 100)
                            : 68}%
                        </span>
                      </div>
                      <Progress
                        value={
                          summary.skillsLab.totalRequired > 0
                            ? (summary.skillsLab.passedCount / summary.skillsLab.totalRequired) * 100
                            : 68
                        }
                        className="h-1.5 bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Actionable Tip Card (Exact V2 Design Specification) */}
                {actionableAdvice && (
                  <div className="bg-[#FFF9F5] border border-orange-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#D77510] flex items-center justify-center shrink-0">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold font-heading text-slate-900">
                        {actionableAdvice.title}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed m-0 font-normal">
                      {actionableAdvice.message}
                    </p>

                    <Button
                      asChild
                      size="sm"
                      className="w-full h-8 rounded-xl bg-[#D77510] hover:bg-[#AC5B0B] text-white text-xs font-medium gap-1.5 shadow-sm mt-1"
                    >
                      <Link to={actionableAdvice.ctaLink}>
                        {actionableAdvice.ctaLabel} <ChevronRight size={14} />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentGradesPage;
