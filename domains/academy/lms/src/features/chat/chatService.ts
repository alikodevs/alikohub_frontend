import api from "@/lib/api";
import type {
  ChatContact,
  ChatConversation,
  ChatMessagesResponse,
  ChatMessage,
  CreateConversationPayload,
} from "./types";

export const chatService = {
  /** GET /academy/chat/contacts */
  getContacts(): Promise<ChatContact[]> {
    return api
      .get("/academy/chat/contacts")
      .then((r) => r.data)
      .catch((err) => {
        // Backend returns 403 Forbidden for first-time users with no contacts/conversations yet.
        // Return empty array to render user-friendly initial/empty state for this specific endpoint.
        if (err.response?.status === 403) {
          return [];
        }
        throw err;
      });
  },

  /** POST /academy/chat/conversations */
  createConversation(
    payload: CreateConversationPayload,
  ): Promise<ChatConversation> {
    return api.post("/academy/chat/conversations", payload).then((r) => r.data);
  },

  /** GET /academy/chat/conversations */
  getConversations(): Promise<ChatConversation[]> {
    return api
      .get("/academy/chat/conversations")
      .then((r) => r.data)
      .catch((err) => {
        if (err.response?.status === 403) {
          return [];
        }
        throw err;
      });
  },

  /** GET /academy/chat/conversations/:id/messages */
  getMessages(conversationId: number): Promise<ChatMessage[]> {
    return api
      .get(`/academy/chat/conversations/${conversationId}/messages`)
      .then((r) => {
        // API returns { conversationId, messages: [...] }
        const data = r.data as ChatMessagesResponse | ChatMessage[];
        if (Array.isArray(data)) return data;
        return data.messages ?? [];
      });
  },

  /** POST /academy/chat/conversations/:id/messages */
  sendMessage(conversationId: number, body: string): Promise<ChatMessage> {
    return api
      .post(`/academy/chat/conversations/${conversationId}/messages`, { body })
      .then((r) => r.data);
  },

  /** PATCH /academy/chat/conversations/:id/read */
  markConversationRead(conversationId: number): Promise<void> {
    return api
      .patch(`/academy/chat/conversations/${conversationId}/read`)
      .then(() => undefined);
  },
};
