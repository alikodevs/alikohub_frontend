import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import AdminLayout from "@/components/admin/AdminLayout";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import BusinessConsulting from "./pages/BusinessConsulting";
import CareerGuidance from "./pages/CareerGuidance";
import TravelAdvisory from "./pages/TravelAdvisory";
import StudentLevelPage from "./pages/StudentLevelPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Resources from "./pages/Resources";
import Webinars from "./pages/Webinars";
import BookConsultation from "./pages/BookConsultation";
import Apply from "./pages/Apply";
import ApplicationStatus from "./pages/ApplicationStatus";
import FAQ from "./pages/FAQ";
import { Privacy, Terms, Refund, Cookies } from "./pages/LegalPages";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminResources from "./pages/admin/AdminResources";
import AdminWebinars from "./pages/admin/AdminWebinars";
import AdminWebinarRegistrations from "./pages/admin/AdminWebinarRegistrations";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminPages from "./pages/admin/AdminPages";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            {/* Public routes */}
            <Route
              element={
                <Layout>
                  <></>
                </Layout>
              }
            />
            <Route
              path="/"
              element={
                <Layout>
                  <Index />
                </Layout>
              }
            />
            <Route
              path="/business-consulting"
              element={
                <Layout>
                  <BusinessConsulting />
                </Layout>
              }
            />
            <Route
              path="/career-guidance"
              element={
                <Layout>
                  <CareerGuidance />
                </Layout>
              }
            />
            <Route
              path="/travel-advisory"
              element={
                <Layout>
                  <TravelAdvisory />
                </Layout>
              }
            />
            <Route
              path="/travel-advisory/:level"
              element={
                <Layout>
                  <StudentLevelPage />
                </Layout>
              }
            />
            <Route
              path="/resources"
              element={
                <Layout>
                  <Resources />
                </Layout>
              }
            />
            <Route
              path="/webinars"
              element={
                <Layout>
                  <Webinars />
                </Layout>
              }
            />
            <Route
              path="/webinars/:slug"
              element={
                <Layout>
                  <Webinars />
                </Layout>
              }
            />
            <Route
              path="/about"
              element={
                <Layout>
                  <About />
                </Layout>
              }
            />
            <Route
              path="/contact"
              element={
                <Layout>
                  <Contact />
                </Layout>
              }
            />
            <Route
              path="/book"
              element={
                <Layout>
                  <BookConsultation />
                </Layout>
              }
            />
            <Route
              path="/apply"
              element={
                <Layout>
                  <Apply />
                </Layout>
              }
            />
            <Route
              path="/application-status/:code"
              element={
                <Layout>
                  <ApplicationStatus />
                </Layout>
              }
            />
            <Route
              path="/faq"
              element={
                <Layout>
                  <FAQ />
                </Layout>
              }
            />
            <Route
              path="/privacy"
              element={
                <Layout>
                  <Privacy />
                </Layout>
              }
            />
            <Route
              path="/terms"
              element={
                <Layout>
                  <Terms />
                </Layout>
              }
            />
            <Route
              path="/refund"
              element={
                <Layout>
                  <Refund />
                </Layout>
              }
            />
            <Route
              path="/cookies"
              element={
                <Layout>
                  <Cookies />
                </Layout>
              }
            />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="resources" element={<AdminResources />} />
              <Route path="webinars" element={<AdminWebinars />} />
              <Route path="webinar-registrations" element={<AdminWebinarRegistrations />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="pages" element={<AdminPages />} />
              <Route path="contacts" element={<AdminContacts />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route
              path="*"
              element={
                <Layout>
                  <NotFound />
                </Layout>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
