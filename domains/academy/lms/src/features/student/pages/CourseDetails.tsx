import { useParams, useNavigate, Link } from "react-router-dom";
import LmsNavbar from "@/features/student/components/LmsNavbar";
import {
  Clock,
  PlayCircle,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  Award,
  Star,
  Play,
  UserCircle,
  Calendar,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCourseDetails,
  useEnrollInCourse,
  useCohorts,
  useEnrollInCohort,
  useEnrollments,
} from "@/hooks/useAcademy";
import { useMyTransactions } from "@/features/student/hooks/usePayment";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useCourseSEO } from "@/hooks/useCourseSEO";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading } = useCourseDetails(id || "");
  const { data: cohortsData } = useCohorts(id || "");
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { data: myTransactions } = useMyTransactions();

  useCourseSEO({
    title: course?.title || "Course Details",
    description:
      course?.shortDescription ||
      course?.description ||
      "Explore this course on AlikoHub Academy.",
    image: course?.thumbnail,
    price: course?.price ?? undefined,
    currency: course?.currency || "ETB",
    category: course?.category,
    instructorName: course?.instructor
      ? `${course.instructor.firstname} ${course.instructor.lastname}`
      : (course as any)?.instructorName,
  });

  const cohorts = ((cohortsData as any)?.cohorts || []).filter(
    (c: any) => c.courseId === Number(id),
  );

  const courseEnrollment = enrollments?.find(
    (e: any) =>
      (e.course?.id === Number(id) || e.courseId === Number(id)) && !e.cohortId,
  );

  // Cross-check: if admin marked the transaction COMPLETED, the enrollment
  // might still be PENDING because the PATCH endpoint doesn't emit payment.succeeded.
  // We treat a COMPLETED transaction for this course as proof of payment.
  const hasCompletedTransaction = myTransactions?.some(
    (tx: any) =>
      tx.status === "COMPLETED" &&
      (tx.metadata as any)?.courseId === Number(id),
  );

  const isEnrolledInCourse =
    (courseEnrollment &&
      (courseEnrollment.status === "ACTIVE" ||
        courseEnrollment.status === "COMPLETED")) ||
    hasCompletedTransaction;

  const isPendingPayment =
    !hasCompletedTransaction &&
    courseEnrollment &&
    (courseEnrollment.status === "PENDING" ||
      courseEnrollment.paymentStatus === "PENDING");

  // Cohort IDs from activated enrollments OR completed transactions
  const completedCohortTxIds =
    myTransactions
      ?.filter(
        (tx: any) =>
          tx.status === "COMPLETED" &&
          (tx.metadata as any)?.courseId === Number(id) &&
          (tx.metadata as any)?.cohortId,
      )
      .map((tx: any) => (tx.metadata as any)?.cohortId) || [];

  const enrolledCohortIds = [
    ...(enrollments
      ?.filter(
        (e: any) =>
          (e.course?.id === Number(id) || e.courseId === Number(id)) &&
          e.cohortId &&
          (e.status === "ACTIVE" || e.status === "COMPLETED"),
      )
      .map((e: any) => e.cohortId) || []),
    ...completedCohortTxIds,
  ];

  const pendingCohortEnrollments =
    enrollments?.filter(
      (e: any) =>
        (e.course?.id === Number(id) || e.courseId === Number(id)) &&
        e.cohortId &&
        (e.status === "PENDING" || e.paymentStatus === "PENDING") &&
        !completedCohortTxIds.includes(e.cohortId),
    ) || [];

  const enrollMutation = useEnrollInCourse();
  const enrollInCohortMutation = useEnrollInCohort();

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedEnrollmentType, setSelectedEnrollmentType] = useState<
    "self-paced" | number
  >("self-paced");

  // A course is free if the backend marks it free OR its price is 0 / not set
  const isCourseFree = course
    ? course.isFree === true || !course.price || course.price === 0
    : false;

  const handleEnrollCourse = () => {
    if (!course) return;
    enrollMutation.mutate(
      { courseId: course.id.toString() },
      {
        onSuccess: (data: any) => {
          if (!data?.checkoutUrl) {
            navigate(`/learn/${course.id}`);
          }
        },
      },
    );
  };

  const handleEnrollCohort = (cohortId: number) => {
    if (!course) return;
    enrollInCohortMutation.mutate(
      { cohortId, courseId: course.id.toString() },
      {
        onSuccess: (data: any) => {
          if (!data?.checkoutUrl) {
            navigate(`/learn/${course.id}`);
          }
        },
      },
    );
  };

  const handleConfirmEnrollment = () => {
    if (selectedEnrollmentType === "self-paced") {
      handleEnrollCourse();
    } else {
      handleEnrollCohort(selectedEnrollmentType);
    }
    setShowEnrollModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7F9]">
        <LmsNavbar />
        <div className="section-container py-12">
          <Skeleton className="h-[400px] w-full rounded-3xl mb-8 bg-slate-200" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-12 w-3/4 bg-white/40" />
              <Skeleton className="h-32 w-full bg-white/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F5F7F9]">
        <LmsNavbar />
        <div className="section-container py-20 text-center">
          <h1 className="text-3xl font-extrabold text-[#1C2840] mb-6">
            Course not found
          </h1>
          <Button
            asChild
            className="bg-[#1C2840] hover:bg-[#141d2e] rounded-xl h-12 px-8"
          >
            <Link to="/courses">Return to Explore</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] font-montserrat">
      <LmsNavbar />

      {/* Course Hero Header */}
      <div className="relative overflow-hidden pt-6">
        <div className="section-container relative z-10 py-6 md:py-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Explore
          </button>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold bg-white text-slate-700 shadow-sm">
                  {course.category}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold bg-white text-slate-700 shadow-sm">
                  {cohorts.length > 0
                    ? "Instructor-Led Available"
                    : "Self-Paced"}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold bg-white text-slate-700 shadow-sm capitalize">
                  {course.difficulty} Level
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold text-[#1C2840] leading-tight font-roboto">
                {course.title}
              </h1>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl font-medium">
                {course.description ||
                  "Master these in-demand skills with our comprehensive, expert-led curriculum designed for career growth."}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-slate-900">4.8</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  {(
                    course.enrollmentCount ||
                    course.enrolledCount ||
                    0
                  ).toLocaleString()}{" "}
                  students
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {course.estimatedTime || "8 weeks"}
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-400" />
                  {course.modules?.length || 0} modules
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <UserCircle className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-700 font-medium">
                  Taught by{" "}
                  {course.instructor?.firstname || "Aliko Academy Expert"}
                </span>
              </div>
            </div>

            {/* Right: CTA Card */}
            <div className="lg:w-96 shrink-0 lg:transform lg:translate-y-8 z-20">
              <div className="rounded-3xl bg-white p-8 shadow-xl space-y-6 border border-slate-100">
                <div className="aspect-video rounded-xl overflow-hidden border border-slate-100 relative bg-slate-900 group">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                    <Button
                      variant="outline"
                      className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900 gap-2"
                    >
                      <Play className="w-4 h-4" /> Preview
                    </Button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-3xl font-black text-slate-900">
                    {isCourseFree
                      ? "Free"
                      : course.currency === "USD"
                        ? `$${course.price}`
                        : `${course.price?.toLocaleString()} ETB`}
                  </p>
                  {cohorts.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Flexible cohort & self-paced options
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Dual Enrollment Options when Cohorts Exist */}
                  {cohorts.length > 0 && !isEnrolledInCourse && (
                    <div className="space-y-3 pt-2">
                      {/* Self-Paced Option Card */}
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            Self-Paced
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            Lifetime Access
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">
                          Learn at your own speed with instant access to all
                          video lessons and resources.
                        </p>
                        <Button
                          size="sm"
                          className="w-full bg-[#1C2840] hover:bg-[#141d2e] text-white font-bold gap-2 rounded-lg"
                          onClick={handleEnrollCourse}
                          disabled={
                            enrollMutation.isPending || enrollmentsLoading
                          }
                        >
                          <Play className="h-3.5 w-3.5" />
                          {isCourseFree
                            ? "Enroll Self-Paced - Free"
                            : "Enroll Self-Paced"}
                        </Button>
                      </div>

                      {/* Instructor-Led Cohort Option Card */}
                      <div className="p-3.5 rounded-xl border-2 border-amber-200 bg-amber-50/50 hover:border-amber-300 transition-all">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black uppercase text-amber-800 bg-amber-200 px-2 py-0.5 rounded">
                            Instructor-Led Cohort
                          </span>
                          <span className="text-xs font-bold text-amber-900">
                            {cohorts.length} Open
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-3">
                          Structured class schedules with TA support, peer
                          reviews, and live Q&A sessions.
                        </p>
                        <Button
                          size="sm"
                          className="w-full bg-[#E6A337] hover:bg-amber-light text-slate-900 font-bold gap-2 rounded-lg"
                          onClick={() => setShowEnrollModal(true)}
                        >
                          <Users className="h-3.5 w-3.5" />
                          {enrolledCohortIds.length > 0
                            ? "View My Cohorts"
                            : "Join a Cohort"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Self-Paced Button when NO Cohorts Exist */}
                  {cohorts.length === 0 && (
                    <>
                      {isEnrolledInCourse ? (
                        <Button
                          size="lg"
                          className="w-full bg-slate-100 hover:bg-slate-200 text-[#1C2840] font-bold border border-slate-200 h-12 rounded-xl"
                          onClick={() => navigate(`/learn/${course.id}`)}
                        >
                          Go to Course
                        </Button>
                      ) : isPendingPayment ? (
                        <Button
                          size="lg"
                          className="w-full bg-amber-100 text-amber-700 font-bold h-12 rounded-xl cursor-default"
                          disabled
                        >
                          Payment Pending
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          className="w-full bg-[#1C2840] hover:bg-[#141d2e] text-white font-bold gap-2 h-12 rounded-xl"
                          onClick={handleEnrollCourse}
                          disabled={
                            enrollMutation.isPending || enrollmentsLoading
                          }
                        >
                          {enrollMutation.isPending ? (
                            "Processing..."
                          ) : (
                            <>
                              <Play className="h-4 w-4" />{" "}
                              {isCourseFree
                                ? "Enroll Self-Paced - Free"
                                : "Enroll Self-Paced"}
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>

                <p className="text-xs text-center text-slate-500 px-4 pt-1">
                  Instant access · Lifetime updates · Certificate
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <main className="section-container py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description Section */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-[#1C2840] mb-4 font-roboto">
                About this course
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                <p>
                  {course.description ||
                    course.shortDescription ||
                    `This course provides a deep dive into ${course.title}, covering everything from foundational principles to advanced techniques used by industry professionals.`}
                </p>
              </div>
            </section>

            {/* What you'll learn Section */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-[#1C2840] mb-4 font-roboto">
                What you'll learn
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {(course.outcomes?.length
                  ? course.outcomes
                  : course.skills?.length
                    ? course.skills
                    : [
                        "Interactive labs and real-world projects",
                        "Expert mentorship and peer networking",
                        "Lifetime access to course materials",
                        "Digital certification upon completion",
                      ]
                ).map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E6A337] shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 font-bold leading-tight">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Upcoming Cohorts Section */}
            {cohorts.length > 0 && (
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4 font-roboto">
                  <h2 className="text-2xl font-bold text-[#1C2840]">
                    Upcoming Cohorts
                  </h2>
                  <span className="px-3 py-1 bg-slate-100 text-[#1C2840] text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                    Instructional Program
                  </span>
                </div>
                <div className="grid gap-4">
                  {cohorts.map((cohort: any) => (
                    <div
                      key={cohort.id}
                      className="group p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-[#E6A337] hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#E6A337]" />
                          <h4 className="font-bold text-slate-900 font-roboto">
                            {cohort.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          Starts{" "}
                          {new Date(cohort.startDate).toLocaleDateString(
                            undefined,
                            { dateStyle: "long" },
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden sm:block text-right">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">
                            Availability
                          </p>
                          <p className="text-xs font-bold text-slate-900">
                            Limited Enrollment
                          </p>
                        </div>
                        <Button
                          variant={
                            enrolledCohortIds.includes(cohort.id) ||
                            pendingCohortEnrollments.some(
                              (e) => e.cohortId === cohort.id,
                            )
                              ? "outline"
                              : "ghost"
                          }
                          size="sm"
                          className={`font-black text-[11px] uppercase tracking-widest rounded-xl px-4 ${
                            enrolledCohortIds.includes(cohort.id)
                              ? "bg-slate-100 text-slate-500 border-slate-200 cursor-default"
                              : pendingCohortEnrollments.some(
                                    (e) => e.cohortId === cohort.id,
                                  )
                                ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                : "text-[#1C2840] hover:text-[#E6A337] hover:bg-[#E6A337]/5 border border-slate-200 hover:border-[#E6A337]/40"
                          }`}
                          onClick={() => {
                            if (
                              pendingCohortEnrollments.some(
                                (e) => e.cohortId === cohort.id,
                              )
                            ) {
                              handleEnrollCohort(cohort.id);
                            } else if (!enrolledCohortIds.includes(cohort.id)) {
                              setSelectedEnrollmentType(cohort.id);
                              setShowEnrollModal(true);
                            }
                          }}
                        >
                          {enrolledCohortIds.includes(cohort.id)
                            ? "Enrolled"
                            : pendingCohortEnrollments.some(
                                  (e) => e.cohortId === cohort.id,
                                )
                              ? "Complete Payment"
                              : "Select Cohort"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Curriculum Section */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-[#1C2840] mb-4 font-roboto">
                Course Curriculum
              </h2>
              <div className="space-y-4">
                {course.modules?.map((module, idx) => (
                  <div
                    key={module.id}
                    className="group rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all"
                  >
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#1C2840] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-[#1C2840]/20">
                          {idx + 1}
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm md:text-base font-roboto">
                            {module.title}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
                            {module.lessons?.length || 0} lessons
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#1C2840] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              <CardContent className="p-8">
                <h3 className="font-bold text-2xl text-[#1C2840] mb-6 font-roboto">
                  Quick Facts
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-50 text-[#1C2840] border border-slate-100">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                        Security
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        Verified Pathways
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-50 text-[#1C2840] border border-slate-100">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                        Reward
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        Aliko Hub Certificate
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-50 text-[#1C2840] border border-slate-100">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                        Support
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        Mentorship Included
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-slate-100">
                  <blockquote className="text-lg italic font-medium text-slate-600 text-center leading-relaxed">
                    &quot;This course was instrumental in helping me land my
                    current role. Highly recommended!&quot;
                  </blockquote>
                  <p className="text-sm font-bold text-slate-900 text-center mt-4">
                    — Aliko Learner
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-[#1C2840] rounded-3xl p-8 text-white text-center shadow-xl shadow-[#1C2840]/20 font-montserrat">
              <h4 className="text-xl font-bold mb-3 font-roboto">
                Enterprise Access?
              </h4>
              <p className="text-slate-300 text-sm mb-6 font-medium">
                Contact our team for bulk enrollment and custom training
                options.
              </p>
              <a
                href="https://academy.alikohub.com/contact"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="w-full border-white/30 hover:bg-white/10 text-white bg-transparent h-12 rounded-xl transition-all"
                >
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
        <DialogContent className="sm:max-w-md p-8 overflow-y-auto max-h-[90vh] border-none shadow-2xl font-montserrat rounded-2xl bg-white scrollbar-thin">
          <DialogHeader className="space-y-1 text-center pb-4 font-roboto">
            <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight">
              {cohorts.length > 0 ? "Join a Cohort" : "Enrollment Overview"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 font-medium">
              {cohorts.length > 0
                ? "Select a learning path that fits your schedule"
                : `Secure your spot in "${course.title}" and start today`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
              Select Pathway
            </p>

            {/* Self-Paced Option — only shown when no cohorts */}
            {cohorts.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  if (!isEnrolledInCourse) {
                    setSelectedEnrollmentType("self-paced");
                  }
                }}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  selectedEnrollmentType === "self-paced"
                    ? "border-[#E6A337] bg-[#E6A337]/5 shadow-sm"
                    : isEnrolledInCourse
                      ? "border-slate-100 bg-slate-50 opacity-60 cursor-default"
                      : "border-gray-100 bg-white hover:border-[#E6A337]/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-none font-roboto">
                      Self-Paced Learning
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1.5 font-bold uppercase tracking-wider">
                      {isEnrolledInCourse
                        ? "Already Enrolled"
                        : "Independent Study"}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedEnrollmentType === "self-paced"
                        ? "border-[#E6A337]"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedEnrollmentType === "self-paced" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E6A337]" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <Play className="h-3 w-3" />
                  <span>Instant access to all modules & future updates</span>
                </div>
              </button>
            )}

            {/* Cohort Options */}
            {cohorts.length > 0 &&
              cohorts.map((cohort: any) => {
                const isEnrolled = enrolledCohortIds.includes(cohort.id);
                const isPending = pendingCohortEnrollments.some(
                  (e) => e.cohortId === cohort.id,
                );
                return (
                  <button
                    key={cohort.id}
                    type="button"
                    onClick={() => {
                      if (!isEnrolled) {
                        setSelectedEnrollmentType(cohort.id);
                      }
                    }}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      selectedEnrollmentType === cohort.id
                        ? "border-[#E6A337] bg-[#E6A337]/5 shadow-sm"
                        : isEnrolled
                          ? "border-slate-100 bg-slate-50 opacity-60 cursor-default"
                          : isPending
                            ? "border-amber-200 bg-amber-50"
                            : "border-gray-100 bg-white hover:border-[#E6A337]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-none font-roboto">
                          {cohort.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1.5 font-bold uppercase tracking-wider">
                          {isEnrolled
                            ? "Already Member"
                            : isPending
                              ? "Payment Pending"
                              : "Instructor-Led Cohort"}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedEnrollmentType === cohort.id
                            ? "border-[#E6A337]"
                            : isPending
                              ? "border-amber-400"
                              : "border-gray-300"
                        }`}
                      >
                        {selectedEnrollmentType === cohort.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#E6A337]" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {new Date(cohort.startDate).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}{" "}
                          –{" "}
                          {new Date(cohort.endDate).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>Limited Seats</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Includes live sessions & instructor feedback
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="space-y-1 text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Enrollment Fee
              </p>
              <p className="text-2xl font-extrabold text-[#1C2840]">
                {isCourseFree
                  ? "FREE"
                  : course.currency === "USD"
                    ? `$${course.price}`
                    : `${course.price?.toLocaleString()} ETB`}
              </p>
            </div>
            <Button
              onClick={handleConfirmEnrollment}
              className="bg-[#E6A337] hover:bg-[#d4922b] text-white font-bold h-12 px-8 rounded-xl transition-all shadow-lg shadow-[#E6A337]/20 active:scale-95"
              disabled={
                enrollMutation.isPending ||
                enrollInCohortMutation.isPending ||
                (selectedEnrollmentType === "self-paced" &&
                  isEnrolledInCourse) ||
                (typeof selectedEnrollmentType === "number" &&
                  enrolledCohortIds.includes(selectedEnrollmentType)) ||
                (selectedEnrollmentType === "self-paced" && isPendingPayment) ||
                (typeof selectedEnrollmentType === "number" &&
                  pendingCohortEnrollments.some(
                    (e) => e.cohortId === selectedEnrollmentType,
                  ))
              }
            >
              {enrollMutation.isPending || enrollInCohortMutation.isPending
                ? "Starting..."
                : (selectedEnrollmentType === "self-paced" &&
                      isEnrolledInCourse) ||
                    (typeof selectedEnrollmentType === "number" &&
                      enrolledCohortIds.includes(selectedEnrollmentType))
                  ? "Already Enrolled"
                  : selectedEnrollmentType === "self-paced" && isPendingPayment
                    ? "Payment Pending"
                    : typeof selectedEnrollmentType === "number" &&
                        pendingCohortEnrollments.some(
                          (e) => e.cohortId === selectedEnrollmentType,
                        )
                      ? "Payment Pending"
                      : "Secure My Spot"}
            </Button>
          </div>

          <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-[0.15em]">
            Powered by Aliko Hub
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetails;
