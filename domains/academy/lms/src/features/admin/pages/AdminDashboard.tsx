import React, { useState } from "react";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { AdminHeader } from "@/features/admin/components/AdminHeader";
import {
  Users,
  BookOpen,
  Clock,
  ExternalLink,
  Trash2,
  Download,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  ArrowDown,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useTeacherApplications,
  useApproveTeacher,
  useRejectTeacher,
  useAdminCourses,
  useApproveCourse,
  useRejectCourse,
  useAdminAnalytics,
  useDeleteCourse,
} from "@/hooks/useAcademy";
import {
  useAllTransactions,
  useUpdateTransactionStatus,
} from "@/features/student/hooks/usePayment";
import { useAllUsers } from "@/features/auth/hooks/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import ReviewApplicationModal from "@/features/admin/components/ReviewApplicationModal";
import ReviewCourseModal from "@/features/admin/components/ReviewCourseModal";
import TransactionDetailModal from "@/features/admin/components/TransactionDetailModal";
import type { TeacherApplication, Course } from "@/types/academy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AdminAnnouncements } from "@/features/admin/components/AdminAnnouncements";

// Deterministic color assignment for applicant avatar circles
const AVATAR_COLORS = [
  { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  {
    bg: "bg-violet-500/15",
    text: "text-violet-400",
    border: "border-violet-500/30",
  },
  { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/30" },
  { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30" },
  {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  {
    bg: "bg-indigo-500/15",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
  },
];

const getAvatarColor = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const AdminDashboard = () => {
  const location = useLocation();

  // Shared color tokens for recharts
  const chartColors = {
    grid: "#E1EAF2",
    tick: "#71717a",
    tooltipBg: "#ffffff",
    tooltipBorder: "#E1EAF2",
    tooltipText: "#1e293b",
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/admin/applications") return "applications";
    if (path === "/admin/analytics") return "analytics";
    if (path === "/admin/transactions") return "transactions";
    if (path === "/admin/announcements") return "announcements";
    return "courses";
  };

  const activeTab = getActiveTab();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [appsPage, setAppsPage] = useState(1);
  const [coursesPage, setCoursesPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const pageSize = 5;

  const { data: applications, isLoading: appsLoading } = useTeacherApplications(
    appsPage,
    pageSize,
  );
  const approveMutation = useApproveTeacher();
  const rejectMutation = useRejectTeacher();

  const { data: coursesData, isLoading: coursesLoading } = useAdminCourses(
    coursesPage,
    pageSize,
  );
  const approveCourseMutation = useApproveCourse();
  const rejectCourseMutation = useRejectCourse();
  const deleteCourseMutation = useDeleteCourse();

  const { data: analyticsData, isLoading: analyticsLoading } =
    useAdminAnalytics();
  const { data: allTransactions, isLoading: allTransactionsLoading } =
    useAllTransactions();
  const updateTransactionMutation = useUpdateTransactionStatus();
  const { data: allUsers } = useAllUsers();

  // Build firebaseId → display name map
  const userMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    if (allUsers) {
      for (const u of allUsers as any[]) {
        const name = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
        map[u.firebaseId] = name || u.email || u.firebaseId;
      }
    }
    return map;
  }, [allUsers]);

  // Filter out free course enrollments (amount === 0)
  const paidTransactions = allTransactions?.filter(
    (tx: any) => Number(tx.amount) > 0,
  );

  // Client-side pagination for transactions
  const paginatedTransactions = paidTransactions?.slice(
    (transactionsPage - 1) * pageSize,
    transactionsPage * pageSize,
  );

  const exportToPdf = () => {
    if (!paidTransactions || paidTransactions.length === 0) return;

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Transaction History", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Exported on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      14,
      23,
    );

    const head = [
      [
        "Username",
        "Course Title",
        "Amount",
        "Currency",
        "Provider",
        "Status",
        "Payment Date",
      ],
    ];
    const body = paidTransactions.map((tx: any) => {
      const meta = tx.metadata as any;
      const courseTitle =
        meta?.courseTitle ||
        meta?.courseName ||
        (meta?.courseId ? `Course #${meta.courseId}` : "—");
      const username = userMap[tx.userId] || tx.userId?.substring(0, 8) || "—";
      const date = tx.createdAt
        ? new Date(tx.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";
      return [
        username,
        courseTitle,
        Number(tx.amount).toLocaleString(),
        tx.currency || "USD",
        tx.provider || "N/A",
        tx.status,
        date,
      ];
    });

    autoTable(doc, {
      head,
      body,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [39, 39, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { fontStyle: "bold" },
        2: { halign: "right" },
        5: { fontStyle: "bold" },
      },
    });

    doc.save(`transactions-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const [selectedApp, setSelectedApp] = useState<TeacherApplication | null>(
    null,
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    txId: number | string;
    newStatus: string;
  } | null>(null);
  const [deleteCourseTarget, setDeleteCourseTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] =
    useState<any>(null);

  const chartData = [
    { name: "Courses", value: analyticsData?.totalCourses || 0 },
    { name: "Progress", value: analyticsData?.totalProgress || 0 },
    { name: "Enrollments", value: analyticsData?.totalEnrollments || 0 },
  ];

  const handleReview = (application: TeacherApplication) => {
    setSelectedApp(application);
  };

  const onApprove = (id: string, notes: string) => {
    approveMutation.mutate(
      { appId: id, reviewNotes: notes },
      { onSuccess: () => setSelectedApp(null) },
    );
  };

  const onReject = (id: string, notes: string) => {
    rejectMutation.mutate(
      { appId: id, reviewNotes: notes },
      { onSuccess: () => setSelectedApp(null) },
    );
  };

  const handleReviewCourse = (course: Course) => {
    setSelectedCourse(course);
  };

  const onApproveCourse = (id: string, notes: string) => {
    approveCourseMutation.mutate(id, {
      onSuccess: () => setSelectedCourse(null),
    });
  };

  const onRejectCourse = (id: string, notes: string) => {
    rejectCourseMutation.mutate(
      { courseId: id, reason: notes },
      { onSuccess: () => setSelectedCourse(null) },
    );
  };

  const handleDeleteCourse = (courseId: string, title: string) => {
    setDeleteCourseTarget({ id: courseId, title });
  };

  const allCourses = Array.isArray(coursesData)
    ? coursesData
    : (coursesData as any)?.courses ||
      (coursesData as any)?.items ||
      (coursesData as any)?.data ||
      [];

  const allApplications = Array.isArray(applications)
    ? applications
    : (applications as any)?.applications ||
      (applications as any)?.items ||
      (applications as any)?.data ||
      [];

  const totalRevenue =
    paidTransactions
      ?.filter((tx: any) => tx.status === "COMPLETED")
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0) || 0;
  const completedTx =
    paidTransactions?.filter((tx: any) => tx.status === "COMPLETED").length ||
    0;
  const pendingTx =
    paidTransactions?.filter((tx: any) => tx.status === "PENDING").length || 0;
  const uniqueUsers =
    new Set(paidTransactions?.map((tx: any) => tx.userId)).size || 0;

  return (
    <div className="flex h-screen bg-[#F4F8FB] overflow-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          title={
            activeTab === "courses"
              ? "Course Reviews"
              : activeTab === "applications"
                ? "Teacher Applications"
                : activeTab === "transactions"
                  ? "Platform payments"
                  : activeTab === "announcements"
                    ? "Announcements Manager"
                    : "Platform Analytics"
          }
          darkTheme={false}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* ── Teacher Applications ── */}
          {activeTab === "applications" && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E1EAF2] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-slate-500 uppercase text-xs font-bold border-b border-[#E1EAF2]">
                      <tr>
                        <th className="px-6 py-4">Applicant</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Applied for</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1EAF2]">
                      {appsLoading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-zinc-500"
                          >
                            <Clock className="w-8 h-8 text-zinc-400  animate-spin mx-auto mb-4" />
                            Loading applications...
                          </td>
                        </tr>
                      ) : !allApplications || allApplications.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-zinc-500"
                          >
                            No applications found.
                          </td>
                        </tr>
                      ) : (
                        allApplications.map((app: any) => {
                          const avatarColor = getAvatarColor(
                            app.user?.email ||
                              app.id ||
                              `${app.user?.firstname}${app.user?.lastname}`,
                          );
                          return (
                            <tr
                              key={app.id}
                              className="hover:bg-[#EAF4FB] transition-colors group"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border",
                                      avatarColor.bg,
                                      avatarColor.text,
                                      avatarColor.border,
                                    )}
                                  >
                                    {app.user?.firstname?.[0] ?? ""}
                                    {app.user?.lastname?.[0] ?? ""}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-800 text-sm">
                                      {app.user?.firstname ?? ""}{" "}
                                      {app.user?.lastname ?? ""}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                {app.user?.email ?? ""}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500  border border-blue-500/20">
                                  Instructor
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                {new Date(app.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={cn(
                                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                                    (app.status === "PENDING" ||
                                      app.status === "SUBMITTED") &&
                                      "bg-amber-500/10 text-amber-600  border-amber-500/20",
                                    (app.status === "ACCEPTED" ||
                                      app.status === "APPROVED") &&
                                      "bg-emerald-500/10 text-emerald-600  border-emerald-500/20",
                                    app.status === "REJECTED" &&
                                      "bg-red-500/10 text-red-600  border-red-500/20",
                                  )}
                                >
                                  {app.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                {app.status === "PENDING" ||
                                app.status === "SUBMITTED" ? (
                                  <button
                                    className="px-3 py-1.5 bg-[#0095DA] hover:bg-[#007BB8] text-white text-xs font-bold rounded-lg transition-colors"
                                    onClick={() => handleReview(app)}
                                  >
                                    Review
                                  </button>
                                ) : (
                                  <button
                                    className="px-3 py-1.5 bg-white hover:bg-[#EAF4FB] border border-[#E1EAF2] text-slate-700 text-xs font-medium rounded-lg transition-colors"
                                    onClick={() => handleReview(app)}
                                  >
                                    View details
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-[#E1EAF2]">
                  <span className="text-xs text-zinc-500 font-medium">
                    Page {appsPage}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 bg-white hover:bg-[#EAF4FB] border border-[#E1EAF2] text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => setAppsPage((p) => Math.max(1, p - 1))}
                      disabled={appsPage === 1}
                    >
                      Previous
                    </button>
                    <button
                      className="px-3 py-1.5 bg-white hover:bg-[#EAF4FB] border border-[#E1EAF2] text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => setAppsPage((p) => p + 1)}
                      disabled={
                        !allApplications || allApplications.length < pageSize
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Course Reviews ── */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E1EAF2] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-slate-500 uppercase text-xs font-bold border-b border-[#E1EAF2]">
                      <tr>
                        <th className="px-6 py-4">Course</th>
                        <th className="px-6 py-4">Instructor</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Students</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1EAF2]">
                      {coursesLoading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-zinc-500"
                          >
                            <BookOpen className="w-8 h-8 text-zinc-400  animate-pulse mx-auto mb-4" />
                            Loading courses...
                          </td>
                        </tr>
                      ) : !allCourses || allCourses.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-zinc-500"
                          >
                            <BookOpen className="w-12 h-12 text-zinc-300  mx-auto mb-4" />
                            <p className="font-medium">
                              No courses found in the system.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        allCourses.map((course: any) => (
                          <tr
                            key={course.id}
                            className="hover:bg-[#EAF4FB] transition-colors group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span
                                  className="font-bold text-slate-800 text-sm max-w-[200px] truncate"
                                  title={course.title}
                                >
                                  {course.title}
                                </span>
                                <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                                  {course.shortDescription || "No description"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-semibold">
                              {course.instructor
                                ? `${course.instructor.firstname} ${course.instructor.lastname}`
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 bg-zinc-100  border border-zinc-200  rounded-lg text-[10px] font-bold text-slate-500 uppercase">
                                {course.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-bold">
                              {course.enrolledNum ||
                                course.enrolledCount ||
                                course.enrollmentCount ||
                                0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                                  (course.status === "PENDING" ||
                                    course.status === "PENDING_APPROVAL") &&
                                    "bg-amber-500/10 text-amber-600  border-amber-500/20",
                                  (course.status === "PUBLISHED" ||
                                    course.status === "APPROVED") &&
                                    "bg-emerald-500/10 text-emerald-600  border-emerald-500/20",
                                  course.status === "REJECTED" &&
                                    "bg-red-500/10 text-red-600  border-red-500/20",
                                  course.status === "DRAFT" &&
                                    "bg-blue-500/10 text-blue-600  border-blue-500/20",
                                )}
                              >
                                {course.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                {course.status === "PENDING" ||
                                course.status === "PENDING_APPROVAL" ||
                                course.status === "DRAFT" ? (
                                  <button
                                    className="px-3 py-1.5 bg-[#0095DA] hover:bg-[#007BB8] text-white text-xs font-bold rounded-lg transition-colors"
                                    onClick={() => handleReviewCourse(course)}
                                  >
                                    Review
                                  </button>
                                ) : (
                                  <button
                                    className="px-3 py-1.5 bg-white hover:bg-[#EAF4FB] border border-[#E1EAF2] text-slate-700 text-xs font-medium rounded-lg transition-colors"
                                    onClick={() => handleReviewCourse(course)}
                                  >
                                    View details
                                  </button>
                                )}

                                <button
                                  className="h-8 w-8 flex items-center justify-center text-red-500  hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg transition-colors disabled:opacity-40"
                                  onClick={() =>
                                    handleDeleteCourse(course.id, course.title)
                                  }
                                  disabled={deleteCourseMutation.isPending}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-[#E1EAF2]">
                  <span className="text-xs text-zinc-500 font-medium">
                    Page {coursesPage}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 bg-white hover:bg-[#EAF4FB] border border-[#E1EAF2] text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => setCoursesPage((p) => Math.max(1, p - 1))}
                      disabled={coursesPage === 1}
                    >
                      Previous
                    </button>
                    <button
                      className="px-3 py-1.5 bg-white hover:bg-[#EAF4FB] border border-[#E1EAF2] text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => setCoursesPage((p) => p + 1)}
                      disabled={!allCourses || allCourses.length < pageSize}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Analytics ── */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {analyticsLoading ? (
                <div className="py-12 text-center text-zinc-500">
                  <Clock className="w-8 h-8 text-zinc-400  animate-spin mx-auto mb-4" />
                  Loading analytics...
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-[#E1EAF2] rounded-xl p-6 flex flex-col justify-between shadow-sm">
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          Total courses
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-slate-800 mb-2">
                        {analyticsData?.totalCourses || 0}
                      </div>
                      <div className="text-slate-400 text-xs font-medium">
                        on the platform
                      </div>
                    </div>

                    <div className="bg-white border border-[#E1EAF2] rounded-xl p-6 flex flex-col justify-between shadow-sm">
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <ArrowUpRight className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          Total progress
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-slate-800 mb-2">
                        {analyticsData?.totalProgress || 0}
                      </div>
                      <div className="text-slate-400 text-xs font-medium">
                        completions logged
                      </div>
                    </div>

                    <div className="bg-white border border-[#E1EAF2] rounded-xl p-6 flex flex-col justify-between shadow-sm">
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          Total enrollments
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-slate-800 mb-2">
                        {analyticsData?.totalEnrollments || 0}
                      </div>
                      <div className="text-slate-400 text-xs font-medium">
                        across all courses
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-[#E1EAF2] rounded-xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-2 h-4 bg-[#0095DA] rounded-full"></span>
                        Overview distribution
                      </h3>
                      <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke={chartColors.grid}
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: chartColors.tick,
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: chartColors.tick, fontSize: 12 }}
                            />
                            <RechartsTooltip
                              cursor={{
                                fill: "rgba(0,0,0,0.03)",
                              }}
                              contentStyle={{
                                borderRadius: "12px",
                                border: `1px solid ${chartColors.tooltipBorder}`,
                                backgroundColor: chartColors.tooltipBg,
                                color: chartColors.tooltipText,
                                padding: "12px",
                              }}
                            />
                            <Bar
                              dataKey="value"
                              fill="#0095DA"
                              radius={[6, 6, 0, 0]}
                              barSize={50}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E1EAF2] rounded-xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-2 h-4 bg-[#F37E28] rounded-full"></span>
                        Platform trends
                      </h3>
                      <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke={chartColors.grid}
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: chartColors.tick,
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: chartColors.tick, fontSize: 12 }}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                borderRadius: "12px",
                                border: `1px solid ${chartColors.tooltipBorder}`,
                                backgroundColor: chartColors.tooltipBg,
                                color: chartColors.tooltipText,
                                padding: "12px",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#0095DA"
                              strokeWidth={4}
                              dot={{
                                r: 6,
                                fill: "#0095DA",
                                strokeWidth: 3,
                                stroke: chartColors.tooltipBg,
                              }}
                              activeDot={{ r: 8, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Transactions ── */}
          {activeTab === "transactions" && (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E1EAF2] rounded-xl p-6 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-semibold">Total revenue</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-800 mb-2">
                    ${totalRevenue.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 text-xs font-medium">
                    <ArrowUpRight className="w-3 h-3" />
                    All time
                  </div>
                </div>

                <div className="bg-white border border-[#E1EAF2] rounded-xl p-6 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">Completed</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-800 mb-2">
                    {completedTx}
                  </div>
                  <div className="text-slate-400 text-xs font-medium">
                    transactions
                  </div>
                </div>

                <div className="bg-white border border-[#E1EAF2] rounded-xl p-6 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-semibold">Pending</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-800 mb-2">
                    {pendingTx}
                  </div>
                  <div className="text-slate-400 text-xs font-medium">
                    awaiting confirmation
                  </div>
                </div>

                <div className="bg-white border border-[#E1EAF2] rounded-xl p-6 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-semibold">Unique users</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-800 mb-2">
                    {uniqueUsers}
                  </div>
                  <div className="text-slate-400 text-xs font-medium">
                    this period
                  </div>
                </div>
              </div>

              {/* Transactions Table Card */}
              <div className="bg-white border border-[#E1EAF2] rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-[#E1EAF2] flex items-center justify-between transition-colors">
                  <h2 className="text-lg font-bold text-slate-800">
                    Transaction history
                    <div className="h-0.5 w-8 bg-[#F37E28] rounded-full mt-0.5" />
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={exportToPdf}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white  hover:bg-zinc-50 dark:hover:bg-[#3f3f46] border border-zinc-200  text-slate-800 text-sm font-semibold rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-slate-500 uppercase text-xs font-bold border-b border-[#E1EAF2]">
                      <tr>
                        <th className="px-4 py-4">Username</th>
                        <th className="px-4 py-4">Course Title</th>
                        <th className="px-4 py-4">Amount</th>
                        <th className="px-4 py-4">Currency</th>
                        <th className="px-4 py-4">Provider</th>
                        <th className="px-4 py-4 text-right">Status</th>
                        <th className="px-4 py-4">Payment Date</th>
                        <th className="px-4 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1EAF2]">
                      {allTransactionsLoading ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-12 text-center text-zinc-500"
                          >
                            <Clock className="w-8 h-8 text-zinc-400  animate-spin mx-auto mb-4" />
                            Loading transactions...
                          </td>
                        </tr>
                      ) : !paidTransactions || paidTransactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-12 text-center text-zinc-500"
                          >
                            No transactions found.
                          </td>
                        </tr>
                      ) : (
                        paginatedTransactions?.map((tx: any) => {
                          const meta = tx.metadata as any;
                          const courseTitle =
                            meta?.courseTitle ||
                            meta?.courseName ||
                            (meta?.courseId ? `Course #${meta.courseId}` : "—");
                          const username =
                            userMap[tx.userId] ||
                            (tx as any).user?.email ||
                            tx.userId?.substring(0, 8) ||
                            "—";
                          return (
                            <tr
                              key={tx.id}
                              className="hover:bg-[#EAF4FB] transition-colors"
                            >
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-zinc-800  font-medium text-sm">
                                  {username}
                                </span>
                              </td>
                              <td
                                className="px-4 py-4 whitespace-nowrap max-w-[200px] truncate"
                                title={courseTitle}
                              >
                                <span className="text-slate-600 text-sm">
                                  {courseTitle}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="font-bold text-slate-800 text-sm">
                                  {Number(tx.amount).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-slate-600 text-sm">
                                  {tx.currency || "USD"}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={cn(
                                    "text-xs font-bold uppercase px-2 py-1 rounded-md border",
                                    tx.provider === "CHAPA" &&
                                      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
                                    tx.provider === "STRIPE" &&
                                      "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
                                    !tx.provider &&
                                      "bg-zinc-500/10 text-slate-500 border-zinc-500/30",
                                  )}
                                >
                                  {tx.provider || "N/A"}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right">
                                <div className="relative inline-block text-left">
                                  <select
                                    value={tx.status}
                                    onChange={(e) => {
                                      setPendingStatusChange({
                                        txId: tx.id,
                                        newStatus: e.target.value,
                                      });
                                    }}
                                    disabled={
                                      updateTransactionMutation.isPending
                                    }
                                    className={cn(
                                      "appearance-none bg-transparent text-xs font-bold pl-3 pr-8 py-1.5 rounded-full border transition-colors cursor-pointer outline-none",
                                      tx.status === "PENDING" &&
                                        "text-amber-600 dark:text-amber-500 border-amber-500/30 hover:border-amber-500/50",
                                      tx.status === "COMPLETED" &&
                                        "text-emerald-600 dark:text-emerald-500 border-emerald-500/30 hover:border-emerald-500/50",
                                      tx.status === "FAILED" &&
                                        "text-red-600 dark:text-red-500 border-red-500/30 hover:border-red-500/50",
                                    )}
                                  >
                                    <option
                                      className="bg-white  text-amber-600 dark:text-amber-500"
                                      value="PENDING"
                                    >
                                      PENDING
                                    </option>
                                    <option
                                      className="bg-white  text-emerald-600 dark:text-emerald-500"
                                      value="COMPLETED"
                                    >
                                      COMPLETED
                                    </option>
                                    <option
                                      className="bg-white  text-red-600 dark:text-red-500"
                                      value="FAILED"
                                    >
                                      FAILED
                                    </option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                                    <ArrowDown className="w-3 h-3 text-zinc-400" />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-xs text-slate-500">
                                  {tx.createdAt
                                    ? new Date(tx.createdAt).toLocaleDateString(
                                        "en-US",
                                        {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        },
                                      )
                                    : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() =>
                                    setSelectedTransactionDetail(tx)
                                  }
                                  className="p-1.5 bg-zinc-100 hover:bg-zinc-200   border border-zinc-200  text-slate-600 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all"
                                  title="View details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-[#E1EAF2]">
                  <span className="text-xs text-zinc-500 font-medium">
                    Page {transactionsPage}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 bg-white hover:bg-[#EAF4FB] border border-[#E1EAF2] text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() =>
                        setTransactionsPage((p) => Math.max(1, p - 1))
                      }
                      disabled={transactionsPage === 1}
                    >
                      Previous
                    </button>
                    <button
                      className="px-3 py-1.5 bg-white hover:bg-[#EAF4FB] border border-[#E1EAF2] text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => setTransactionsPage((p) => p + 1)}
                      disabled={
                        !paginatedTransactions ||
                        paginatedTransactions.length < pageSize
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "announcements" && <AdminAnnouncements />}
        </main>

        {selectedApp && (
          <ReviewApplicationModal
            application={selectedApp}
            onClose={() => setSelectedApp(null)}
            onApprove={onApprove}
            onReject={onReject}
            isProcessing={approveMutation.isPending || rejectMutation.isPending}
          />
        )}

        {selectedCourse && (
          <ReviewCourseModal
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
            onApprove={onApproveCourse}
            onReject={onRejectCourse}
            isProcessing={
              approveCourseMutation.isPending || rejectCourseMutation.isPending
            }
          />
        )}

        {/* Status Change Confirmation Dialog */}
        <Dialog
          open={!!pendingStatusChange}
          onOpenChange={(open) => {
            if (!open) setPendingStatusChange(null);
          }}
        >
          <DialogContent className="sm:max-w-md bg-white  border-zinc-200  text-slate-800">
            <DialogHeader>
              <DialogTitle className="text-slate-800">
                Confirm Status Change
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Are you sure you want to change transaction #
                {pendingStatusChange?.txId} status to{" "}
                <span
                  className={cn(
                    "font-bold",
                    pendingStatusChange?.newStatus === "COMPLETED" &&
                      "text-emerald-600 ",
                    pendingStatusChange?.newStatus === "PENDING" &&
                      "text-amber-600 ",
                    pendingStatusChange?.newStatus === "FAILED" &&
                      "text-red-600 ",
                  )}
                >
                  {pendingStatusChange?.newStatus}
                </span>
                ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                onClick={() => setPendingStatusChange(null)}
                className="text-slate-700 bg-white hover:bg-[#EAF4FB] border border-[#E1EAF2]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (pendingStatusChange) {
                    updateTransactionMutation.mutate({
                      id: pendingStatusChange.txId,
                      status: pendingStatusChange.newStatus as any,
                    });
                  }
                  setPendingStatusChange(null);
                }}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Course Confirmation Dialog */}
        <Dialog
          open={!!deleteCourseTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteCourseTarget(null);
          }}
        >
          <DialogContent className="sm:max-w-[425px] bg-white border-[#E1EAF2]">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-red-50 dark:bg-red-500/10">
                  <AlertTriangle className="w-5 h-5 text-red-500 " />
                </div>
                <DialogTitle className="text-xl font-bold text-slate-800">
                  Delete Course?
                </DialogTitle>
              </div>
              <DialogDescription className="text-slate-500 pt-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-700">
                  "{deleteCourseTarget?.title}"
                </span>
                ? This action cannot be undone and all modules, lessons, and
                student progress will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex flex-row gap-3 sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setDeleteCourseTarget(null)}
                disabled={deleteCourseMutation.isPending}
                className="flex-1 sm:flex-none border border-[#E1EAF2] text-slate-700 hover:bg-[#EAF4FB]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteCourseTarget) {
                    deleteCourseMutation.mutate(deleteCourseTarget.id, {
                      onSuccess: () => setDeleteCourseTarget(null),
                    });
                  }
                }}
                disabled={deleteCourseMutation.isPending}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
              >
                {deleteCourseMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedTransactionDetail && (
          <TransactionDetailModal
            transaction={selectedTransactionDetail}
            userMap={userMap}
            onClose={() => setSelectedTransactionDetail(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
