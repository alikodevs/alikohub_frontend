import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotificationFCMProvider from "@/components/shared/NotificationFCMProvider";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

// Auth & Layout
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import AdminRoute from "@/components/shared/AdminRoute";
import InstructorRoute from "@/components/shared/InstructorRoute";

// Pages - Auth
import LoginPage from "@/features/auth/pages/Login";
import RegisterPage from "@/features/auth/pages/Register";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPassword";
import ResetPasswordPage from "@/features/auth/pages/ResetPassword";

import NotFound from "@/components/shared/NotFound";

// Pages - Dashboard
import StudentDashboard from "@/features/student/pages/Dashboard";
import InstructorDashboard from "@/features/instructor/pages/Dashboard";
import ApplyInstructor from "@/features/student/pages/ApplyInstructor";
import PaymentSuccess from "@/features/student/pages/PaymentSuccess";

// Pages - Courses
import CourseDetails from "@/features/student/pages/CourseDetails";
import CourseExplorer from "@/features/student/pages/CourseExplorer";
import InstructorCourses from "@/features/instructor/courses/pages/InstructorCourses";
import CreateCourse from "@/features/instructor/courses/pages/CreateCourse";
import CourseEditor from "@/features/instructor/courses/pages/CourseEditor";

// Pages - Lessons
import LessonView from "@/features/student/lessons/LessonView";

// Pages - Progress
import StudentProgress from "@/features/student/pages/StudentProgress";
import InstructorAnalytics from "@/features/instructor/analytics/InstructorAnalytics";
import Submissions from "@/features/instructor/analytics/Submissions";
import SubmissionDetail from "@/features/instructor/analytics/SubmissionDetail";

// Pages - Instructor/Admin
import AdminDashboard from "@/features/admin/pages/AdminDashboard";
import AdminChat from "@/features/admin/pages/AdminChat";
import Schedules from "@/features/instructor/pages/Schedules";
import InstructorSettings from "@/features/instructor/pages/Settings";
import InstructorChat from "@/features/instructor/pages/Chat";
import InstructorNotifications from "@/features/instructor/pages/InstructorNotifications";

// Pages - Account
import Profile from "@/features/student/account/Profile";
import Settings from "@/features/student/account/Settings";
import AccountSecurity from "@/features/student/account/AccountSecurity";
import Certifications from "@/features/student/account/Certifications";
import Notifications from "@/features/student/account/Notifications";
import Photo from "@/features/student/account/Photo";
import Subscriptions from "@/features/student/account/Subscriptions";
import CareerHub from "@/features/student/account/CareerHub";
import TransactionsPage from "@/features/student/account/Transactions";
import PeerGrading from "@/features/student/pages/PeerGrading";
import PeerGradingDetail from "@/features/student/pages/PeerGradingDetail";
import StudentSchedules from "@/features/student/pages/StudentSchedules";
import Announcements from "@/features/student/pages/Announcements";
import ChatPage from "@/features/chat/ChatPage";

import { ThemeProvider } from "@/context/ThemeContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppInner = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Default Redirect */}
      <Route path="/" element={<LoginPage />} />

      {/* Protected Portal Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Student & Shared Protected Routes */}
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/courses" element={<CourseExplorer />} />
        <Route path="/courses/:id" element={<CourseDetails />} />
        <Route path="/learning" element={<StudentProgress />} />
        <Route path="/learn/:id" element={<LessonView />} />
        <Route path="/instructor/apply" element={<ApplyInstructor />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/schedules" element={<StudentSchedules />} />
        <Route path="/chat" element={<ChatPage />} />

        {/* Account Routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/photo" element={<Photo />} />
        <Route path="/account-security" element={<AccountSecurity />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/certifications" element={<Certifications />} />
        <Route path="/career-hub" element={<CareerHub />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/peer-grading" element={<PeerGrading />} />
        <Route path="/peer-grading/:courseId" element={<PeerGradingDetail />} />

        {/* Instructor Routes */}
        <Route element={<InstructorRoute />}>
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/instructor/courses" element={<InstructorCourses />} />
          <Route path="/instructor/courses/new" element={<CreateCourse />} />
          <Route path="/instructor/courses/:id" element={<CourseEditor />} />
          <Route
            path="/instructor/analytics"
            element={<InstructorAnalytics />}
          />
          <Route path="/instructor/submissions" element={<Submissions />} />
          <Route
            path="/instructor/submissions/:submissionId"
            element={<SubmissionDetail />}
          />
          <Route path="/instructor/schedules" element={<Schedules />} />
          <Route path="/instructor/settings" element={<InstructorSettings />} />
          <Route path="/instructor/chat" element={<InstructorChat />} />
          <Route
            path="/instructor/notifications"
            element={<InstructorNotifications />}
          />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/applications" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminDashboard />} />
          <Route path="/admin/transactions" element={<AdminDashboard />} />
          <Route path="/admin/announcements" element={<AdminDashboard />} />
          <Route path="/admin/chat" element={<AdminChat />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NotificationFCMProvider>
            <ErrorBoundary>
              <AppInner />
            </ErrorBoundary>
          </NotificationFCMProvider>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
