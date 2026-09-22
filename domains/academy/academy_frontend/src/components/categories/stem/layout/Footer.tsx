import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import logoImg from "@/assets/categories/stem/aliko-stem-logo.png";

const footerLinks = {
  programs: [
    { name: "All Programs", href: "/stem/programs" },
    { name: "Enterprise Training", href: "/stem/enterprise" },
    { name: "Industry Curriculum", href: "/stem/curriculum" },
    { name: "Licensure & Exams", href: "/stem/certifications" },
  ],
  company: [
    { name: "About Us", href: "/stem/about" },
    { name: "Partners", href: "/stem/partners" },
    { name: "Contact", href: "/stem/contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/stem/policies#privacy" },
    { name: "Terms of Use", href: "/stem/policies#terms" },
    { name: "Training Disclaimer", href: "/stem/policies#disclaimer" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-divider bg-card">
      <div className="container-content py-14 lg:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/stem">
              <img
                src={logoImg}
                alt="Aliko Academy STEM"
                className="h-14 w-auto"
              />
            </Link>
            <p className="mt-5 text-base text-[hsl(210_30%_78%)] max-w-xs leading-relaxed">
              Industry-aligned engineering and STEM training for students,
              professionals, and organizations.
            </p>
            <div className="mt-7 space-y-3">
              <a
                href="mailto:academy-stem@alikohub.com"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                <Mail className="h-4 w-4 text-primary shrink-0" />
                academy-stem@alikohub.com
              </a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="flex flex-wrap gap-x-1.5">
                  <a href="tel:+12063535373" className="hover:text-primary transition-colors">
                    +1 (206) 353 5373
                  </a>
                  <span className="opacity-40">|</span>
                  <a href="tel:+251920907878" className="hover:text-primary transition-colors">
                    +251 920 907 878
                  </a>
                  <span className="opacity-40">|</span>
                  <a href="tel:+251910813571" className="hover:text-primary transition-colors">
                    +251 910 813 571
                  </a>
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground font-medium">
                <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>19550 International Blvd Suite STE 301, SeaTac, WA 98188</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground font-medium">
                <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span>Addis Ababa, Bole Dembel, Tigi's Building, 12th Floor</span>
              </div>
            </div>
          </div>

          {/* Programs */}
          <div>
            <h3 className="font-display font-bold text-lg text-primary">
              Programs
            </h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.programs.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-base text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display font-bold text-lg text-accent-green">
              Company
            </h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-base text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://lms.alikohub.com"
                  className="text-base text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  Access LMS
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display font-bold text-lg text-accent">
              Legal
            </h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-base text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-divider">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground font-medium">
              © {new Date().getFullYear()} Aliko Academy STEM. All rights
              reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Certification exams are administered by third-party vendors.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
