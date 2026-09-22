import InstructorLayout from "@/features/instructor/components/InstructorLayout";
import ChatPage from "@/features/chat/ChatPage";

/**
 * Chat page for the Instructor dashboard.
 * Reuses the shared ChatPage component inside the Instructor layout.
 * The layout provides its own header/sidebar, so ChatPage renders
 * inside <main> — we override its StudentLayout wrapper by passing
 * the raw content directly.
 */
const InstructorChat = () => {
  return (
    <InstructorLayout>
      <ChatPage layoutless />
    </InstructorLayout>
  );
};

export default InstructorChat;
