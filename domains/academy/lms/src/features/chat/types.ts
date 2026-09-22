// ── Chat Feature Types ───────────────────────────────────────────────────

export interface ChatContact {
  userId: string;
  role: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  email: string | null;
  courseIds?: number[];
}

export interface ChatMessageSender {
  userId: string;
  name?: string;
  firstname?: string;
  lastname?: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  body: string;
  sentAt: string;
  sender: ChatMessageSender;
  mine?: boolean;
}

export interface ChatLastMessage {
  id: number;
  body: string;
  sentAt: string;
  sender: {
    userId: string;
    name?: string;
  };
}

export interface ChatParticipant {
  userId: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string;
  lastReadAt?: string | null;
  joinedAt?: string;
}

export interface ChatConversationWith {
  userId: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string;
}

export interface ChatConversation {
  conversationId: number;
  title?: string;
  with: ChatConversationWith;
  me?: ChatParticipant;
  participants: ChatParticipant[];
  course?: unknown;
  lastMessage?: ChatLastMessage;
  unreadCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessagesResponse {
  conversationId: number;
  messages: ChatMessage[];
}

export interface CreateConversationPayload {
  recipientId: string;
  courseId?: number;
}

export interface SendMessagePayload {
  conversationId: number;
  body: string;
}
