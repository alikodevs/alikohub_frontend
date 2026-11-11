import { useState } from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import {
  PlusCircle,
  Search,
  Filter,
  Users,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useInstructorCourses,
  useDeleteCourse,
  useInstructorStats,
} from "@/hooks/useAcademy";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { academyService } from "@/services/academyService";
import { toast } from "sonner";
import { DeleteConfirmationModal } from "@/features/instructor/components/DeleteConfirmationModal";
import { CreateCohortModal } from "@/features/instructor/courses/components/CreateCohortModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Draws a compact donut ring using SVG stroke-dasharray math
const DonutRing = ({
  segments,
  total,
  size = 56,
  strokeWidth = 7,
}: {
  segments: { value: number; color: string }[];
  total: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const gap =
    total > 0
      ? Math.min(4, circ / (segments.filter((s) => s.value > 0).length * 6))
      : 0;

  let offset = circ * 0.25; // start at top
  const arcs: { dasharray: string; dashoffset: number; color: string }[] = [];

  for (const seg of segments) {
    if (seg.value <= 0) continue;
    const arc = (seg.value / total) * circ - gap;
    arcs.push({
      dasharray: `${arc} ${circ - arc}`,
      dashoffset: -offset + circ,
      color: seg.color,
    });
    offset += (seg.value / total) * circ;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-slate-100, #f1f5f9)"
        strokeWidth={strokeWidth}
      />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={arc.dasharray}
          strokeDashoffset={arc.dashoffset}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
};

const InstructorCourses = () => {
  const {
    data: coursesData,
    isLoading,
    refetch,
  } = useInstructorCourses({ page: 1, pageSize: 100 });

  const { data: stats } = useInstructorStats();

  const deleteCourseMutation = useDeleteCourse();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);

  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmitForApproval = async (courseId: string) => {
    try {
      await academyService.instructor.submitCourseForApproval(courseId);
      toast.success("Course submitted for review successfully!");
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit course");
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteCourseMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          refetch();
          setCurrentPage((p) => Math.max(1, p));
        },
      });
    }
  };

  const allCourses = (coursesData?.courses || []).filter((course) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      course.title.toLowerCase().includes(searchLower) ||
      course.category?.toLowerCase().includes(searchLower)
    );
  });
  const totalCourses = allCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalCourses / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedCourses = allCourses.slice(startIndex, startIndex + PAGE_SIZE);

  const statusStyles: Record<string, string> = {
    PUBLISHED: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
    PENDING: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
    REJECTED: "bg-red-50 text-red-600 ring-1 ring-red-100",
    DRAFT: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  };

  // Derived metrics
  const courses = coursesData?.courses || [];
  const totalCount = courses.length;
  const publishedCount = courses.filter((c) => c.status === "PUBLISHED").length;
  const pendingCount = courses.filter(
    (c) => c.status === "PENDING" || c.status === "PENDING_APPROVAL",
  ).length;
  const draftCount = courses.filter((c) => c.status === "DRAFT").length;
  const rejectedCount = courses.filter((c) => c.status === "REJECTED").length;
  const totalStudents = courses.reduce(
    (sum, c) => sum + ((c as any)._count?.enrollments || c.enrolledCount || 0),
    0,
  );

  return (
    <InstructorLayout>
      <main className="section-container py-8 md:py-12">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
              My Courses
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage and monitor your curriculum content.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="gap-2 bg-white hover:bg-slate-50 text-slate-900 shadow-sm border border-slate-200 font-medium"
              onClick={() => setIsCohortModalOpen(true)}
            >
              <Users className="w-4 h-4 text-[#2b5f9e]" /> Create Cohort
            </Button>
            <Button
              asChild
              className="gap-2 bg-[#2b5f9e] hover:bg-[#234e83] text-white shadow-sm font-medium border-0"
            >
              <Link to="/instructor/courses/new">
                <PlusCircle className="w-4 h-4" /> Create Course
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Compact Metrics Panel ── */}
        {!isLoading && (
          <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/30">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Platform Statistics
              </span>
            </div>

            {/* Two metric cells */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Cell 1 — Course status */}
              <div className="flex items-center gap-5 px-6 py-6">
                <div className="relative flex-shrink-0">
                  <DonutRing
                    size={80}
                    strokeWidth={9}
                    total={totalCount || 1}
                    segments={[
                      { value: publishedCount, color: "#10b981" },
                      { value: pendingCount, color: "#f59e0b" },
                      { value: draftCount, color: "#f26b21" },
                      { value: rejectedCount, color: "#ef4444" },
                    ]}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-slate-900 leading-none">
                      {totalCount}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                      total
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Course status
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        label: "Published",
                        value: publishedCount,
                        color: "#10b981",
                      },
                      {
                        label: "In review",
                        value: pendingCount,
                        color: "#f59e0b",
                      },
                      { label: "Draft", value: draftCount, color: "#f26b21" },
                      ...(rejectedCount > 0
                        ? [
                            {
                              label: "Rejected",
                              value: rejectedCount,
                              color: "#ef4444",
                            },
                          ]
                        : []),
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: color }}
                        />
                        <span className="text-xs text-slate-500 flex-1">
                          {label}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cell 2 — Students */}
              <div className="flex items-center gap-5 px-6 py-6">
                <div className="relative flex-shrink-0">
                  <DonutRing
                    size={80}
                    strokeWidth={9}
                    total={Math.max(stats?.totalStudents || 0, 1)}
                    segments={[
                      { value: stats?.totalStudents || 0, color: "#0ea5e9" },
                    ]}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-slate-900 leading-none">
                      {stats?.totalStudents || 0}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                      learners
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Active learners
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0" />
                      <span className="text-xs text-slate-500 flex-1">
                        Enrolled
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {stats?.totalStudents || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-200 flex-shrink-0" />
                      <span className="text-xs text-slate-500 flex-1">
                        Across courses
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {publishedCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl border border-border flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-10 h-10 rounded-lg border-slate-200 focus-visible:ring-accent/30"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 h-10 rounded-lg border-slate-200 text-slate-600 font-medium"
            >
              <Filter className="w-3.5 h-3.5" /> Status
            </Button>
            <Button
              variant="outline"
              className="gap-2 h-10 rounded-lg border-slate-200 text-slate-600 font-medium"
            >
              <Filter className="w-3.5 h-3.5" /> Category
            </Button>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-border">
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
                    Course
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
                    Students
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
                    Price
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
                    Last Updated
                  </th>
                  <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="h-10 bg-slate-100 rounded-lg" />
                        </td>
                      </tr>
                    ))
                ) : !coursesData?.courses ||
                  coursesData.courses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500 text-sm"
                    >
                      You haven't created any courses yet.
                    </td>
                  </tr>
                ) : (
                  paginatedCourses.map((course) => (
                    <tr
                      key={course.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 rounded-md bg-slate-100 overflow-hidden shrink-0">
                            {course.thumbnail && (
                              <img
                                src={course.thumbnail}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-medium text-slate-900 truncate max-w-[200px]">
                              {course.title}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                              {course.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                            statusStyles[course.status] ||
                            "bg-slate-50 text-slate-600 ring-1 ring-slate-200"
                          }`}
                        >
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600">
                        {(course as any)._count?.enrollments ||
                          course.enrolledNum ||
                          course.enrolledCount ||
                          course.enrollmentCount ||
                          0}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600">
                        {course.isFree ? "Free" : `$${course.price}`}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-400">
                        {new Date(course.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {course.status === "DRAFT" && (
                              <DropdownMenuItem
                                className="gap-2 text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer"
                                onClick={() =>
                                  handleSubmitForApproval(course.id)
                                }
                              >
                                <Send className="w-3.5 h-3.5" /> Submit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              disabled={course.status === "REJECTED"}
                              className="gap-2 cursor-pointer"
                              asChild
                            >
                              <Link to={`/instructor/courses/${course.id}`}>
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                              onClick={() => setDeleteId(course.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {!isLoading && totalCourses > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-border bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + PAGE_SIZE, totalCourses)} of{" "}
                {totalCourses} entries
              </p>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 text-slate-600 font-medium disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === safePage ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 rounded-lg font-medium ${
                        pageNum === safePage
                          ? "bg-[#2b5f9e] text-white hover:bg-[#234e83] border-none"
                          : "border-slate-200 text-slate-600"
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ),
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 text-slate-600 font-medium disabled:opacity-40"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safePage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <DeleteConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Course?"
        description="Are you sure you want to delete this course? This action cannot be undone and all modules, lessons, and student progress will be permanently removed."
        isDeleting={deleteCourseMutation.isPending}
      />
      <CreateCohortModal
        isOpen={isCohortModalOpen}
        onClose={() => setIsCohortModalOpen(false)}
      />
    </InstructorLayout>
  );
};

export default InstructorCourses;
