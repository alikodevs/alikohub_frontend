import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Globe } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Learning Pathways",
      links: [
        {
          name: "Aliko Academy Health",
          href: "/health",
        },
        {
          name: "Aliko Academy Tech",
          href: "/technology",
        },
        {
          name: "Aliko Academy STEM",
          href: "/stem",
        },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Course Catalog", href: "#" },
        { name: "Student Portal", href: "https://lms.alikohub.com" },
        { name: "Scholarships", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "https://career.alikohub.com/" },
        { name: "Contact Us", href: "/contact" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Mail, href: "mailto:academy@alikohub.com", name: "Email" },
    { icon: Phone, href: "tel:+1 (206) 353 5373", name: "Phone" },
  ];

  return (
    <footer className="bg-[#0f172a] text-white pt-12 pb-10 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 -z-10" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[100px] translate-y-1/2 -z-10" />

      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 py-8">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block group mb-2">
              <img
                src="/AlikoLogo.svg"
                alt="AlikoHub Academy"
                className="h-20 w-auto"
              />
            </Link>
            <p className="mt-4 text-slate-400 leading-relaxed max-w-sm">
              Honoring youth potential where opportunity meets dignity,
              transforming Africa's future through Digital Health, STEM, and
              innovation pathways.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors cursor-default">
                <a
                  href="mailto:academy@alikohub.com"
                  className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                    <Mail className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium">
                    academy@alikohub.com
                  </span>
                </a>
              </div>
              <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors cursor-default">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                  <Phone className="w-4 h-4 text-accent" />
                </div>
                <div className="text-sm font-medium flex flex-wrap gap-x-1.5">
                  <a href="tel:+12063535373" className="hover:text-accent transition-colors">+1 (206) 353 5373</a>
                  <span className="text-slate-500">|</span>
                  <a href="tel:+251920907878" className="hover:text-accent transition-colors">+251 920 907 878</a>
                  <span className="text-slate-500">|</span>
                  <a href="tel:+251910813571" className="hover:text-accent transition-colors">+251 910 813 571</a>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors cursor-default">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm font-medium">
                  19550 International Blvd Suite STE 301, SeaTac, WA 98188
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors cursor-default">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm font-medium">
                  Addis Ababa, Bole Dembel, Tigi's Building, 12th Floor
                </span>
              </div>
            </div>
          </div>

          {footerLinks.map(
            (section) =>
              section.title && (
                <div key={section.title}>
                  <h4 className="font-heading font-bold text-sm uppercase tracking-widest text-white mb-6">
                    {section.title}
                  </h4>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        {link.href.startsWith("http") ? (
                          <a
                            href={link.href}
                            className="text-slate-500 hover:text-accent transition-all hover:translate-x-1 inline-block text-sm font-medium"
                          >
                            {link.name}
                          </a>
                        ) : (
                          <Link
                            to={link.href}
                            className="text-slate-500 hover:text-accent transition-all hover:translate-x-1 inline-block text-sm font-medium"
                          >
                            {link.name}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-xs text-slate-500 font-medium">
              © {currentYear} AlikoHub Academy. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Globe className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                English (US)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-accent hover:border-accent hover:text-white hover:-translate-y-1 transition-all duration-300"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
