import { useState } from "react";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { AdminHeader } from "@/features/admin/components/AdminHeader";
import ChatPage from "@/features/chat/ChatPage";

/**
 * Chat page for the Admin dashboard.
 * Uses AdminSidebar + AdminHeader directly to give the chat panel
 * full remaining height without AdminLayout's content padding.
 */
const AdminChat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F4F8FB]">
      <AdminSidebar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        <AdminHeader title="Chat" onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-hidden">
          <ChatPage layoutless />
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
