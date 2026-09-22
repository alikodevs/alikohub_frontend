import { Award } from "lucide-react";
import StudentLayout from "@/features/student/components/StudentLayout";

const Certifications = () => {
  return (
    <StudentLayout>
      <div className="section-container py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
          Certifications
        </h1>
        <p className="text-muted-foreground mb-8">
          Your earned credentials and certificates.
        </p>

        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5">
            <Award className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Certificates Coming Soon
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            We're working on digital certificates for completed courses. Once
            you finish a course, your certificate will appear here.
          </p>
        </div>
      </div>
    </StudentLayout>
  );
};

export default Certifications;
