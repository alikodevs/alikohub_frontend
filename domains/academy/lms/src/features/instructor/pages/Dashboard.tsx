import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import {
  Users,
  BookOpen,
  PlusCircle,
  FileText,
  PlayCircle,
  BellRing,
  Star,
  Award,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstructorStats, useInstructorCourses } from "@/hooks/useAcademy";
import { Link } from "react-router-dom";

const InstructorDashboard = () => {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useInstructorStats();
  const {
    data: coursesData,
    isLoading: coursesLoading,
    isError: coursesError,
    refetch: refetchCourses,
  } = useInstructorCourses({ pageSize: 3 });

  const instructorStats =
    (stats as any)?.stats || (stats as any)?.data || stats;

  const statCards = [
    {
      label: "Total Students",
      value: instructorStats?.totalStudents || 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "All Courses",
      value: instructorStats?.totalCourses || 0,
      icon: BookOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Avg Rating",
      value: instructorStats?.averageRating?.toFixed(1) || "0.0",
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Experience",
      value: `${instructorStats?.yearsOfExperience || 0} Years`,
      icon: Award,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <InstructorLayout>
      <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-6">
        {(statsError || coursesError) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">
                  Failed to load dashboard data
                </p>
                <p className="text-xs text-red-600">
                  Some metrics or course information could not be retrieved from the server.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                refetchStats();
                refetchCourses();
              }}
              className="gap-2 border-red-300 text-red-700 hover:bg-red-100 shrink-0 rounded-full font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </Button>
          </div>
        )}

        {/* ── Instructor Console Banner ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 border border-blue-100/80 shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, #eef5ff 0%, #f4f8ff 55%, #fff7ed 100%)",
          }}
        >
          {/* Soft warm glow top-right */}
          <div
            className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at top right, rgba(254,215,170,0.45) 0%, rgba(253,230,138,0.2) 35%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <p className="text-[#5a6e8c] text-[11px] font-bold uppercase tracking-widest">
                Instructor Dashboard
              </p>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#0b1a40] leading-tight">
                Instructor Console
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                Manage your curriculum, track student progress, and analyze your
                performance all in one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                asChild
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-white bg-white/80 font-semibold rounded-full px-5 py-2.5 text-sm"
              >
                <Link to="/instructor/analytics">View Analytics</Link>
              </Button>
              <Button
                asChild
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-full px-6 py-2.5 shadow-md shadow-primary/20 border-0"
              >
                <Link to="/instructor/courses/new">
                  <PlusCircle className="w-4 h-4" /> Create New Course
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-6 rounded-xl border border-border shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Courses */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold text-slate-900">
                Your Recent Courses
              </h2>
              <Link
                to="/instructor/courses"
                className="text-sm font-medium text-accent hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {coursesLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-slate-200 rounded-lg" />
                  ))}
                </div>
              ) : !coursesData?.courses || coursesData.courses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">
                    No courses yet
                  </h3>
                  <p className="text-slate-500 mb-6">
                    Start your journey as an instructor by creating your first
                    course.
                  </p>
                  <Button asChild>
                    <Link to="/instructor/courses/new">Create Course</Link>
                  </Button>
                </div>
              ) : (
                coursesData?.courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex gap-4">
                      <div className="w-32 h-20 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PlayCircle className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              course.status === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-600"
                                : course.status === "PENDING"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {course.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            • {course.enrolledCount || 0} students
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-accent transition-colors">
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <BookOpen className="w-3.5 h-3.5" />{" "}
                            {course.modulesCount || 0} Modules
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Users className="w-3.5 h-3.5" />{" "}
                            {course.enrolledCount || 0} Enrolled
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/instructor/courses/${course.id}`}>
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Tasks / Notifications */}
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-slate-900">
              Quick Actions
            </h2>
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Create Cohort
                    </p>
                    <p className="text-xs text-slate-500">
                      Schedule a new student group
                    </p>
                  </div>
                </button>
                <Link
                  to="/instructor/submissions"
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-pink-50 text-pink-600 transition-colors group-hover:bg-pink-600 group-hover:text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Grade Submissions
                    </p>
                    <p className="text-xs text-slate-500">
                      View all student work
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
};

export default InstructorDashboard;
