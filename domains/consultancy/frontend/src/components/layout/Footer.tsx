import { Link } from "react-router-dom";
import logo from "@/assets/Aliko Consultancy - tbg (V).png";
import { MapPin, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-navy text-primary-foreground">
      <div className="container-wide px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src={logo} alt="Aliko Consultancy Logo" className="h-16 md:h-20 w-auto object-contain" />
            </Link>
            <p className="text-sm text-primary-foreground/70 leading-relaxed mb-4 max-w-md">
              Premium consultancy services in Business, Study Abroad & Travel Advisory, and Career Guidance & Mentorship.
              Guiding your next chapter with expertise and care.
            </p>
            <div className="space-y-2 text-xs text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gold shrink-0" />
                <a href="mailto:consultancy@alikohub.com" className="hover:text-gold transition-colors font-medium">
                  consultancy@alikohub.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                <div className="space-y-1 font-medium">
                  <div className="flex items-center gap-x-1.5">
                    <a href="tel:+12063535373" className="hover:text-gold transition-colors">+1 (206) 353 5373</a>
                    <span className="text-primary-foreground/40">|</span>
                    <a href="tel:+251920907878" className="hover:text-gold transition-colors">+251 920 907 878</a>
                  </div>
                  <div>
                    <a href="tel:+251910813571" className="hover:text-gold transition-colors">+251 910 813 571</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-gold">
              Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/business-consulting" className="text-primary-foreground/70 hover:text-gold transition-colors">Business Consulting</Link></li>
              <li><Link to="/career-guidance" className="text-primary-foreground/70 hover:text-gold transition-colors">Career Guidance & Mentorship</Link></li>
              <li><Link to="/travel-advisory" className="text-primary-foreground/70 hover:text-gold transition-colors">Study Abroad & Travel Advisory</Link></li>
              <li><Link to="/resources" className="text-primary-foreground/70 hover:text-gold transition-colors">Resources</Link></li>
              <li><Link to="/webinars" className="text-primary-foreground/70 hover:text-gold transition-colors">Webinars</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-gold">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="text-primary-foreground/70 hover:text-gold transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-primary-foreground/70 hover:text-gold transition-colors">Contact</Link></li>
              <li><Link to="/book" className="text-primary-foreground/70 hover:text-gold transition-colors">Book a Consultation</Link></li>
              <li><Link to="/apply" className="text-primary-foreground/70 hover:text-gold transition-colors">Apply</Link></li>
              <li><Link to="/faq" className="text-primary-foreground/70 hover:text-gold transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Offices */}
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-gold">
              Our Offices
            </h4>
            <div className="space-y-4 text-sm">
              <div className="flex gap-2.5 items-start">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-primary-foreground text-xs uppercase tracking-wider text-gold mb-0.5">USA</p>
                  <p className="text-xs leading-relaxed text-primary-foreground/70">19550 International Blvd Suite STE 301, SeaTac, WA 98188</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-primary-foreground text-xs uppercase tracking-wider text-gold mb-0.5">ETHIOPIA</p>
                  <p className="text-xs leading-relaxed text-primary-foreground/70">Addis Ababa, Bole Dembel, Tigi's Building, 12th Floor</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-gold">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/privacy" className="text-primary-foreground/70 hover:text-gold transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-primary-foreground/70 hover:text-gold transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund" className="text-primary-foreground/70 hover:text-gold transition-colors">Refund Policy</Link></li>
              <li><Link to="/cookies" className="text-primary-foreground/70 hover:text-gold transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/50">
          &copy; {new Date().getFullYear()} Aliko Consultancy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
