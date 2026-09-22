import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useRef } from "react";
import { chatService } from "./chatService";
import { getChatSocket } from "./chatSocket";
import type {
  ChatMessage,
  ChatConversation,
  CreateConversationPayload,
  SendMessagePayload,
} from "./types";

// ── Query keys ────────────────────────────────────────────────────────────

export const chatKeys = {
  contacts: ["chat", "contacts"] as const,
  conversations: ["chat", "conversations"] as const,
  messages: (conversationId: number) =>
    ["chat", "messages", conversationId] as const,
};

// ── REST hooks ────────────────────────────────────────────────────────────

export function useChatContacts() {
  return useQuery({
    queryKey: chatKeys.contacts,
    queryFn: () => chatService.getContacts(),
    staleTime: 60_000,
  });
}

export function useChatConversations() {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: () => chatService.getConversations(),
    staleTime: 30_000,
  });
}

export function useChatMessages(conversationId: number | null) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId!),
    queryFn: async () => {
      const msgs = await chatService.getMessages(conversationId!);
      if (!Array.isArray(msgs)) return [];
      return [...msgs].sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
      );
    },
    enabled: conversationId != null,
    staleTime: 15_000,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConversationPayload) =>
      chatService.createConversation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) =>
      chatService.markConversationRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}

// ── Socket hooks ──────────────────────────────────────────────────────────

/**
 * Join/leave a conversation room via Socket.IO.
 * Automatically leaves the previous room when conversationId changes.
 */
export function useJoinConversation(conversationId: number | null) {
  const prevId = useRef<number | null>(null);

  useEffect(() => {
    const socket = getChatSocket();

    // Leave previous room
    if (prevId.current != null && prevId.current !== conversationId) {
      socket.emit("leave_conversation", { conversationId: prevId.current });
    }

    // Join new room
    if (conversationId != null) {
      socket.emit("join_conversation", { conversationId });
    }

    prevId.current = conversationId;

    return () => {
      if (conversationId != null) {
        socket.emit("leave_conversation", { conversationId });
      }
    };
  }, [conversationId]);
}

/**
 * Send a message via REST POST.
 * Returns a promise that resolves to the saved message.
 */
export function useSendMessage() {
  const qc = useQueryClient();

  const send = useCallback(
    async (payload: SendMessagePayload): Promise<ChatMessage> => {
      const message = await chatService.sendMessage(
        payload.conversationId,
        payload.body,
      );
      // Ensure our own message is always flagged as mine
      const ownMessage: ChatMessage = { ...message, mine: true };
      // Optimistically append to cache and sort
      qc.setQueryData<ChatMessage[]>(
        chatKeys.messages(payload.conversationId),
        (old) => {
          const list = old ? [...old] : [];
          if (list.some((m) => m.id === ownMessage.id)) return list;
          list.push(ownMessage);
          return list.sort(
            (a, b) =>
              new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
          );
        },
      );
      // Refresh conversation list to update last message preview
      qc.invalidateQueries({ queryKey: chatKeys.conversations });
      return ownMessage;
    },
    [qc],
  );

  return send;
}

/**
 * Listen for real-time `message_created` events.
 * - If the message belongs to the active conversation, append it to cache.
 * - Always refresh the conversation list for preview/badge updates.
 */
export function useMessageListener(activeConversationId: number | null) {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getChatSocket();

    const handler = (msg: ChatMessage) => {
      // Incoming socket messages are from the other participant, mark as not mine
      const incomingMsg: ChatMessage = { ...msg, mine: false };

      // If message is for the active conversation, append it
      if (incomingMsg.conversationId === activeConversationId) {
        qc.setQueryData<ChatMessage[]>(
          chatKeys.messages(activeConversationId),
          (old) => {
            const list = old ? [...old] : [];
            if (list.some((m) => m.id === incomingMsg.id)) return list;
            list.push(incomingMsg);
            return list.sort(
              (a, b) =>
                new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
            );
          },
        );
      }
      // Always update conversations for last message / unread badge
      qc.invalidateQueries({ queryKey: chatKeys.conversations });
    };

    socket.on("message_created", handler);
    return () => {
      socket.off("message_created", handler);
    };
  }, [activeConversationId, qc]);
}
