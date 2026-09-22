import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import logo from "@/assets/Aliko Consultancy - tbg (V).png";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Business Consulting", href: "/business-consulting" },
      { label: "Career Guidance & Mentorship", href: "/career-guidance" },
      {
        label: "Study Abroad & Travel Advisory",
        href: "/travel-advisory",
        children: [
          { label: "High School", href: "/travel-advisory/high-school" },
          { label: "Undergraduate", href: "/travel-advisory/undergraduate" },
          { label: "Graduate", href: "/travel-advisory/graduate" },
          { label: "PhD", href: "/travel-advisory/phd" },
        ],
      },
    ],
  },
  { label: "Resources", href: "/resources" },
  { label: "Webinars", href: "/webinars" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileTravelOpen, setMobileTravelOpen] = useState(false);
  const location = useLocation();

  const isServicesActive =
    location.pathname.startsWith("/business-consulting") ||
    location.pathname.startsWith("/career-guidance") ||
    location.pathname.startsWith("/travel-advisory");

  return (
    <header className="sticky top-0 z-50 bg-navy backdrop-blur-md border-b border-white/20">
      <div className="container-wide flex items-center justify-between h-20 lg:h-24 px-4 lg:px-8">
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="Aliko Consultancy Logo"
            className="h-12 md:h-16 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center justify-center gap-2 flex-1">
          {navItems.map((item) =>
              item.children ? (
                <div key={item.label} className="relative group/services">
                  <Link
                    to={item.href}
                    className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:text-accent ${
                      isServicesActive
                        ? "text-accent"
                        : "text-primary-foreground/70"
                    }`}
                  >
                    {item.label}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Link>
                  <div className="absolute top-full left-0 pt-2 opacity-0 invisible -translate-y-2 group-hover/services:translate-y-0 group-hover/services:opacity-100 group-hover/services:visible transition-all duration-300 ease-in-out">
                    <div className="bg-navy/90 backdrop-blur-md shadow-xl py-2 min-w-[260px]">
                      {item.children.map((child, index) =>
                        child.children ? (
                          <div key={child.label} className="relative group/travel">
                            <Link
                              to={child.href}
                              className="flex items-center justify-between px-5 py-3 text-sm text-primary-foreground/80 hover:text-accent hover:bg-white/5 transition-colors"
                            >
                              {child.label}
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                            <div className="absolute top-0 left-full opacity-0 invisible -translate-x-2 group-hover/travel:translate-x-0 group-hover/travel:opacity-100 group-hover/travel:visible transition-all duration-300 ease-in-out">
                              <div className="bg-navy/90 backdrop-blur-md shadow-xl py-2 min-w-[200px]">
                                {child.children.map((grandchild) => (
                                  <Link
                                    key={grandchild.href}
                                    to={grandchild.href}
                                    className="block px-5 py-3 text-sm text-primary-foreground/80 hover:text-accent hover:bg-white/5 transition-colors"
                                  >
                                    {grandchild.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            key={child.href}
                            to={child.href}
                            className={`block px-5 py-3 text-sm text-primary-foreground/80 hover:text-accent hover:bg-white/5 transition-colors ${
                              index === 0 ? "mt-1" : ""
                            }`}
                          >
                            {child.label}
                          </Link>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors hover:text-accent ${
                    location.pathname === item.href
                      ? "text-accent"
                      : "text-primary-foreground/70"
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/book">
            <Button className="bg-gold text-navy hover:bg-gold/90 font-semibold text-sm hidden sm:inline-flex">
              Book Consultation
            </Button>
          </Link>
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-primary-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-primary-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-background border-t border-border">
          <nav className="container-wide px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <button
                    onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                    className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-md ${
                      isServicesActive
                        ? "text-accent bg-muted"
                        : "text-foreground"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        mobileServicesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileServicesOpen && (
                    <div className="pl-4">
                      {item.children.map((child) =>
                        child.children ? (
                          <div key={child.label}>
                            <button
                              onClick={() => setMobileTravelOpen(!mobileTravelOpen)}
                              className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-muted-foreground hover:text-accent"
                            >
                              {child.label}
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                  mobileTravelOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            {mobileTravelOpen && (
                              <div className="pl-4">
                                {child.children.map((grandchild) => (
                                  <Link
                                    key={grandchild.href}
                                    to={grandchild.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-accent"
                                  >
                                    {grandchild.label}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-accent"
                          >
                            {child.label}
                          </Link>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-3 text-sm font-medium rounded-md ${
                    location.pathname === item.href
                      ? "text-accent bg-muted"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
            <Link to="/book" onClick={() => setMobileOpen(false)}>
              <Button className="w-full mt-2 bg-gold text-navy hover:bg-gold/90 font-semibold">
                Book Consultation
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
