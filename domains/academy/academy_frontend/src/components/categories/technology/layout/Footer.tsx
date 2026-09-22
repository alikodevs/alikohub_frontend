import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Youtube,
  Github,
} from "lucide-react";
import { isFeatureEnabled } from "@/lib/categories/technology/featureFlags";
import logo from "@/assets/categories/technology/logo-full.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const programLinks = [
    { title: "All Programs", href: "/technology/programs" },
    {
      title: "Software Engineering",
      href: "/technology/programs?category=Software+Engineering",
    },
    {
      title: "Data & Analytics",
      href: "/technology/programs?category=Data+%26+Analytics",
    },
    {
      title: "AI & Machine Learning",
      href: "/technology/programs?category=AI+%26+Machine+Learning",
    },
    {
      title: "UX/UI & Product",
      href: "/technology/programs?category=UX%2FUI+%26+Product",
    },
    {
      title: "Cloud & DevOps",
      href: "/technology/programs?category=Cloud+%26+DevOps",
    },
    {
      title: "Cybersecurity",
      href: "/technology/programs?category=Cybersecurity",
    },
  ];

  const resourceLinks = [
    { title: "Career Services", href: "/technology/career-services" },
    { title: "Projects & Portfolio", href: "/technology/projects" },
    { title: "Mentors & Instructors", href: "/technology/mentors" },
    { title: "Outcomes & Impact", href: "/technology/outcomes" },
    ...(isFeatureEnabled("learningPaths")
      ? [{ title: "Learning Paths", href: "/technology/learning-paths" }]
      : []),
    ...(isFeatureEnabled("skillAssessment")
      ? [{ title: "Skill Assessment", href: "/technology/skill-assessment" }]
      : []),
  ];

  const companyLinks = [
    { title: "Admissions", href: "/technology/admissions" },
    { title: "Tuition & Payment", href: "/technology/tuition" },
    { title: "Enterprise Training", href: "/technology/enterprise" },
    { title: "Partners", href: "/technology/partners" },
    { title: "Hire Graduates", href: "/technology/hire-graduates" },
    { title: "Contact", href: "/technology/contact" },
  ];

  const legalLinks = [
    { title: "Privacy Policy", href: "/technology/policies/privacy" },
    { title: "Terms of Service", href: "/technology/policies/terms" },
    { title: "Refund Policy", href: "/technology/policies/refund" },
    ...(isFeatureEnabled("credentialVerification")
      ? [{ title: "Verify Credential", href: "/technology/verify-credential" }]
      : []),
  ];

  return (
    <footer className="bg-gradient-to-br from-[hsl(210,30%,16%)] via-[hsl(215,28%,14%)] to-[hsl(207,35%,12%)] text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[140px]" />
      </div>

      {/* Main Footer */}
      <div className="relative container-padding mx-auto max-w-7xl py-20 lg:py-24">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-4 lg:col-span-1 lg:pr-8">
            <Link to="/" className="inline-flex items-center group">
              <img
                src={logo}
                alt="Aliko Academy Tech"
                className="h-14 w-auto"
              />
            </Link>
            <p className="mt-6 text-sm text-white/60 max-w-xs leading-relaxed">
              Build job-ready tech skills with mentor-guided programs and
              real-world projects.
            </p>
            <div className="mt-8 flex gap-3">
              <a
                href="#"
                className="w-11 h-11 rounded-xl bg-white/5 hover:bg-secondary/40 flex items-center justify-center transition-all duration-300 group"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
              </a>
              <a
                href="#"
                className="w-11 h-11 rounded-xl bg-white/5 hover:bg-secondary/40 flex items-center justify-center transition-all duration-300 group"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
              </a>
              <a
                href="#"
                className="w-11 h-11 rounded-xl bg-white/5 hover:bg-secondary/40 flex items-center justify-center transition-all duration-300 group"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
              </a>
              <a
                href="#"
                className="w-11 h-11 rounded-xl bg-white/5 hover:bg-secondary/40 flex items-center justify-center transition-all duration-300 group"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Programs */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-6">
              Programs
            </h3>
            <ul className="space-y-3.5">
              {programLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-secondary transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-6">
              Resources
            </h3>
            <ul className="space-y-3.5">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-secondary transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-6">
              Company
            </h3>
            <ul className="space-y-3.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-secondary transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-sm font-semibold text-white/80 mb-6">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-secondary" />
                </div>
                <a
                  href="mailto:academy-tech@alikohub.com"
                  className="text-sm text-white/60 hover:text-white transition-colors pt-2"
                >
                  academy-tech@alikohub.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-secondary" />
                </div>
                <div className="text-sm text-white/60 pt-2 flex flex-wrap gap-x-1.5">
                  <a href="tel:+12063535373" className="hover:text-white transition-colors">
                    +1 (206) 353 5373
                  </a>
                  <span className="text-white/40">|</span>
                  <a href="tel:+251920907878" className="hover:text-white transition-colors">
                    +251 920 907 878
                  </a>
                  <span className="text-white/40">|</span>
                  <a href="tel:+251910813571" className="hover:text-white transition-colors">
                    +251 910 813 571
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-secondary" />
                </div>
                <div className="text-sm text-white/60 pt-1 space-y-1">
                  <p>
                    19550 International Blvd Suite STE 301, SeaTac, WA 98188
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-secondary" />
                </div>
                <div className="text-sm text-white/60 pt-1 space-y-1">
                  <p>Addis Ababa, Bole Dembel, Tigi's Building, 12th Floor</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/10">
        <div className="container-padding mx-auto max-w-7xl py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-white/50">
              © {currentYear} Aliko Academy – Tech. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
