import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  title,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <AdminSidebar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AdminHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
