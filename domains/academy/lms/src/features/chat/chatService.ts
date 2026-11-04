import api from "@/lib/api";
import type {
  ChatContact,
  ChatConversation,
  ChatMessagesResponse,
  ChatMessage,
  CreateConversationPayload,
} from "./types";

export const chatService = {
  /** GET /chat/contacts (Postman 2.7.13) */
  getContacts(): Promise<ChatContact[]> {
    return api
      .get("/chat/contacts")
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

  /** POST /chat/conversations (Postman 2.7.8) */
  createConversation(
    payload: CreateConversationPayload,
  ): Promise<ChatConversation> {
    return api.post("/chat/conversations", payload).then((r) => r.data);
  },

  /** GET /chat/conversations (Postman 2.7.9) */
  getConversations(): Promise<ChatConversation[]> {
    return api
      .get("/chat/conversations")
      .then((r) => r.data)
      .catch((err) => {
        if (err.response?.status === 403) {
          return [];
        }
        throw err;
      });
  },

  /** GET /chat/conversations/:id/messages (Postman 2.7.10) */
  getMessages(conversationId: number): Promise<ChatMessage[]> {
    return api
      .get(`/chat/conversations/${conversationId}/messages`)
      .then((r) => {
        // API returns { conversationId, messages: [...] }
        const data = r.data as ChatMessagesResponse | ChatMessage[];
        if (Array.isArray(data)) return data;
        return data.messages ?? [];
      });
  },

  /** POST /chat/conversations/:id/messages (Postman 2.7.11) */
  sendMessage(conversationId: number, body: string): Promise<ChatMessage> {
    return api
      .post(`/chat/conversations/${conversationId}/messages`, { body })
      .then((r) => r.data);
  },

  /** PUT /chat/conversations/:id/read (Postman 2.7.12) */
  markConversationRead(conversationId: number): Promise<void> {
    return api
      .put(`/chat/conversations/${conversationId}/read`)
      .then(() => undefined);
  },
};
