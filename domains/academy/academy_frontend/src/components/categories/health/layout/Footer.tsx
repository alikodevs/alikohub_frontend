import { Link } from "react-router-dom";
import { useStateConfig } from "@/hooks/categories/health/useStateConfig";
import { Mail, Phone, MapPin, Clock, ArrowRight } from "lucide-react";
import logo from "@/assets/categories/health/logo-new.png";

const footerLinks = {
  programs: [
    { name: "View All Programs", href: "/health/programs" },
    { name: "CNA Training", href: "/health/programs/cna" },
    {
      name: "Medical Billing & Coding",
      href: "/health/programs/medical-billing",
    },
    { name: "Start Dates & Schedule", href: "/health/schedule" },
  ],
  admissions: [
    { name: "How to Apply", href: "/health/admissions" },
    { name: "Tuition & Payment", href: "/health/tuition" },
    { name: "Financial Assistance", href: "/health/tuition#assistance" },
    { name: "Contact Admissions", href: "/health/contact" },
  ],
  about: [
    { name: "About Aliko Academy", href: "/health/about" },
    { name: "Accreditation & Compliance", href: "/health/accreditation" },
    { name: "Career Services", href: "/health/career-services" },
    { name: "Partners", href: "/health/partners" },
  ],
  policies: [
    { name: "Student Handbook", href: "/health/policies" },
    { name: "Refund Policy", href: "/health/policies#refund" },
    { name: "Privacy Policy", href: "/health/policies#privacy" },
    { name: "ADA Accommodations", href: "/health/policies#ada" },
  ],
};

export function Footer() {
  const { currentState } = useStateConfig();

  return (
    <footer className="relative overflow-hidden">
      {/* Gradient Top Bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-teal to-accent" />

      {/* Main Footer — Deep Blue */}
      <div className="bg-footer-bg relative">
        <div className="container-academy py-12 lg:py-16 relative z-10">
          {/* CTA Section */}
          <div className="mb-12 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary/20 via-teal/10 to-primary/20 border border-teal/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Ready to Start Your Healthcare Career?
                </h3>
                <p className="text-white/70 text-sm md:text-base">
                  Join our next cohort and take the first step towards a
                  rewarding future.
                </p>
              </div>
              <button
                onClick={() =>
                  (window.location.href = "https://lms.alikohub.com")
                }
                className="group flex items-center gap-2 px-6 py-3 bg-teal text-teal-foreground font-semibold rounded-lg hover:bg-teal/90 transition-all duration-300 shadow-lg whitespace-nowrap"
              >
                Access LMS
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {Object.entries(footerLinks).map(([key, links]) => (
              <div key={key}>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-accent">
                  {key}
                </h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-sm text-white/70 hover:text-accent transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact Info */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <Link
                  to="/health"
                  className="inline-block mb-4 bg-white/10 rounded-lg p-2"
                >
                  <img src={logo} alt="Aliko Academy" className="h-20 w-auto" />
                </Link>
                <p className="text-sm text-white/70 max-w-xs">
                  Industry-aligned healthcare training with clear cohort start
                  dates. Your pathway to a rewarding healthcare career.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  Contact Us
                </h4>
                <div className="space-y-2 text-sm text-white/70">
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>{currentState.contact.address}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>
                      {currentState.contact.additionalAddress ||
                        "Addis Ababa, Bole Dembel, Tigi's Building, 12th Floor"}
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                    <span className="flex flex-wrap gap-x-1.5">
                      <a href={`tel:${currentState.contact.phone}`} className="hover:text-accent transition-colors">
                        {currentState.contact.phone}
                      </a>
                      <span className="text-white/40">|</span>
                      <a href="tel:+251920907878" className="hover:text-accent transition-colors">
                        +251 920 907 878
                      </a>
                      <span className="text-white/40">|</span>
                      <a href="tel:+251910813571" className="hover:text-accent transition-colors">
                        +251 910 813 571
                      </a>
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-accent" />
                    <a
                      href={`mailto:${currentState.contact.email}`}
                      className="hover:text-accent transition-colors"
                    >
                      {currentState.contact.email}
                    </a>
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  Office Hours
                </h4>
                <div className="space-y-2 text-sm text-white/70">
                  <p>{currentState.officeHours.weekday}</p>
                  <p>{currentState.officeHours.saturday}</p>
                  <p>{currentState.officeHours.sunday}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white/80">
                © {new Date().getFullYear()}{" "}
                <span className="text-accent">Aliko Academy</span>. All rights
                reserved.
              </p>
              <p className="text-xs text-white/60 text-center md:text-right max-w-xl">
                Aliko Academy is designed to align with {currentState.name}{" "}
                State training requirements and maintains an accreditation-ready
                governance framework.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
