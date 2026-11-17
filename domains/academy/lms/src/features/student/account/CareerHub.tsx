import { FileText, Video, Briefcase, Upload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import LmsNavbar from "@/features/student/components/LmsNavbar";

const careerTools = [
  {
    icon: FileText,
    title: "Resume Builder",
    desc: "Create a professional resume tailored to your skills and career goals.",
    cta: "Build Resume",
    bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Video,
    title: "Mock Interview",
    desc: "Practice with industry-aligned mock interviews and get feedback.",
    cta: "Schedule Session",
    bg: "bg-gradient-to-br from-amber-50 to-orange-100/50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: Briefcase,
    title: "Internship Board",
    desc: "Browse internship opportunities matched to your stream and skill level.",
    cta: "View Opportunities",
    bg: "bg-gradient-to-br from-emerald-50 to-green-100/50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: Upload,
    title: "Portfolio Upload",
    desc: "Showcase your projects and certifications to potential employers.",
    cta: "Upload Work",
    bg: "bg-gradient-to-br from-[#F4F8FB] to-[#EAF3F9]",
    iconBg: "bg-[#EAF3F9]",
    iconColor: "text-primary",
  },
];

const CareerHub = () => {
  return (
    <div className="min-h-screen bg-background">
      <LmsNavbar />

      <div className="section-container py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-heading font-semibold text-foreground mb-2">
          Career Hub
        </h1>
        <p className="text-muted-foreground mb-8">
          Tools and resources to transition from learning to career.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {careerTools.map((tool) => (
            <div
              key={tool.title}
              className={`${tool.bg} rounded-lg border p-6 hover:shadow-md transition-shadow duration-200`}
            >
              <div
                className={`w-10 h-10 rounded-lg ${tool.iconBg} flex items-center justify-center mb-4`}
              >
                <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-2">
                {tool.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {tool.desc}
              </p>
              <Button variant="outline" size="sm" className="gap-1">
                {tool.cta} <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerHub;
