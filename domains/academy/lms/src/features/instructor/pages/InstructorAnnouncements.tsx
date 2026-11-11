import React from "react";
import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import { AdminAnnouncements } from "@/features/admin/components/AdminAnnouncements";

const InstructorAnnouncements: React.FC = () => {
  return (
    <InstructorLayout>
      <main className="section-container py-8 md:py-12 max-w-5xl">
        <AdminAnnouncements />
      </main>
    </InstructorLayout>
  );
};

export default InstructorAnnouncements;

