import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Send,
  MessageSquare,
  ArrowLeft,
  Users,
  Loader2,
  AlertCircle,
  CheckCheck,
  Plus,
  ExternalLink,
  X,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUser } from "@/features/auth/hooks/useAuth";
import StudentLayout from "@/features/student/components/StudentLayout";
import { isValid, format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import {
  useChatContacts,
  useChatConversations,
  useChatMessages,
  useCreateConversation,
  useMarkConversationRead,
  useJoinConversation,
  useSendMessage,
  useMessageListener,
} from "./useChat";

import type { ChatContact, ChatConversation, ChatMessage } from "./types";

// ── Design Tokens V2 ────────────────────────────────────────────────────────
// Outgoing bubble: Blue #2B5E9C (AA verified contrast)
// CTA & Action: Orange #FF9147 / #F26B1D
// Canvas: #F7F9FC, Sidebar: #FFFFFF

interface ChatPageProps {
  /** When true, renders without StudentLayout (for instructor/admin layouts) */
  layoutless?: boolean;
}

interface PeerInfo {
  userId: string;
  firstname?: string;
  lastname?: string;
  name?: string;
  role?: string;
  courseTitle?: string;
}

type FilterCategory = "ALL" | "INSTRUCTORS" | "COHORT" | "SUPPORT";

// ── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (first?: string, last?: string, name?: string) => {
  if (first || last) {
    return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase() || "?";
  }
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return "?";
};

// Soft avatar color palettes matching roles from V2 design
const getAvatarTheme = (role?: string) => {
  const r = (role || "").toUpperCase();
  if (r.includes("INSTRUCTOR")) {
    return "bg-[#EDE9FE] text-[#7C3AED]"; // Soft Purple
  }
  if (r.includes("SUPPORT") || r.includes("ADMIN")) {
    return "bg-[#FEF3C7] text-[#D97706]"; // Soft Amber
  }
  if (r.includes("GROUP") || r.includes("COHORT")) {
    return "bg-[#FFE4E6] text-[#E11D48]"; // Soft Rose
  }
  return "bg-[#E0F2FE] text-[#0284C7]"; // Soft Blue
};

const formatMsgTime = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (!isValid(d)) return "";
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
};

const formatGroupDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (!isValid(d)) return "Earlier";
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d, yyyy");
};

const getCourseTag = (conv: ChatConversation) => {
  const c = conv.course as any;
  if (c?.code) return c.code;
  if (c?.title) {
    return c.title.includes("CNA")
      ? "CNA"
      : c.title.includes("Civil")
      ? "AutoCAD"
      : c.title.slice(0, 8);
  }
  const r = (conv.with?.role || "").toUpperCase();
  if (r.includes("INSTRUCTOR")) return "CNA";
  if (r.includes("SUPPORT") || r.includes("ADMIN")) return "Support";
  return "Cohort";
};

// ── Main Component ──────────────────────────────────────────────────────────

export const ChatPage = ({ layoutless = false }: ChatPageProps) => {
  const { data: user } = useUser();
  const currentUserId = (user as any)?.id || (user as any)?.userId || "";

  // State
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [activePeer, setActivePeer] = useState<PeerInfo | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState("");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Data hooks
  const {
    data: contacts,
    isLoading: contactsLoading,
    isError: contactsError,
    refetch: refetchContacts,
  } = useChatContacts();

  const {
    data: conversations,
    isLoading: convsLoading,
    isError: convsError,
    refetch: refetchConversations,
  } = useChatConversations();

  const { data: messages, isLoading: msgsLoading } = useChatMessages(activeConversationId);

  const createConversation = useCreateConversation();
  const markRead = useMarkConversationRead();
  const sendMessage = useSendMessage();

  // WebSockets
  useJoinConversation(activeConversationId);
  useMessageListener(activeConversationId);

  // Auto-scroll
  useEffect(() => {
    if (messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input on active conversation
  useEffect(() => {
    if (activeConversationId != null) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConversationId]);

  // Mark read
  useEffect(() => {
    if (activeConversationId != null) {
      markRead.mutate(activeConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  // Open conversation
  const openConversation = useCallback((conv: ChatConversation) => {
    setActiveConversationId(conv.conversationId);
    setActivePeer({
      userId: conv.with?.userId,
      firstname: conv.with?.firstname,
      lastname: conv.with?.lastname,
      name: conv.with?.name,
      role: conv.with?.role,
      courseTitle: getCourseTag(conv),
    });
    setMobileShowChat(true);
  }, []);

  // Open / create conversation from contact
  const openContactChat = useCallback(
    async (contact: ChatContact) => {
      setIsNewMessageOpen(false);

      const existing = conversations?.find((c) => c.with?.userId === contact.userId);
      if (existing) {
        openConversation(existing);
        return;
      }

      try {
        const conv = await createConversation.mutateAsync({
          recipientId: contact.userId,
          courseId: contact.courseIds?.[0],
        });
        setActiveConversationId(conv.conversationId);
        setActivePeer({
          userId: contact.userId,
          firstname: contact.firstname,
          lastname: contact.lastname,
          name: contact.name,
          role: contact.role,
        });
        setMobileShowChat(true);
      } catch (err) {
        console.error("Failed to create conversation", err);
      }
    },
    [conversations, createConversation, openConversation]
  );

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || activeConversationId == null || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({
        conversationId: activeConversationId,
        body: messageInput.trim(),
      });
      setMessageInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  }, [messageInput, activeConversationId, isSending, sendMessage]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];

    return conversations.filter((c) => {
      // Role / category filter
      const r = (c.with?.role || "").toUpperCase();
      if (filterCategory === "INSTRUCTORS" && !r.includes("INSTRUCTOR")) {
        return false;
      }
      if (filterCategory === "COHORT" && (r.includes("INSTRUCTOR") || r.includes("ADMIN") || r.includes("SUPPORT"))) {
        return false;
      }
      if (filterCategory === "SUPPORT" && !(r.includes("SUPPORT") || r.includes("ADMIN"))) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const peer = c.with;
        const matchesName =
          (peer?.name ?? "").toLowerCase().includes(q) ||
          `${peer?.firstname ?? ""} ${peer?.lastname ?? ""}`.toLowerCase().includes(q) ||
          (peer?.email ?? "").toLowerCase().includes(q);
        const matchesLastMsg = (c.lastMessage?.body ?? "").toLowerCase().includes(q);
        return matchesName || matchesLastMsg;
      }

      return true;
    });
  }, [conversations, filterCategory, searchQuery]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!messages?.length) return [];
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";

    for (const msg of messages) {
      const dateKey = format(new Date(msg.sentAt), "yyyy-MM-dd");
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groups.push({ date: msg.sentAt, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [messages]);

  const getPeerDisplayName = (peer: PeerInfo | null) => {
    if (!peer) return "Conversation";
    if (peer.firstname || peer.lastname) {
      return `${peer.firstname || ""} ${peer.lastname || ""}`.trim();
    }
    return peer.name || "Conversation";
  };

  // Contacts for "New Message" dialog
  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!contactSearchQuery.trim()) return contacts;
    const q = contactSearchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        (c.firstname ?? "").toLowerCase().includes(q) ||
        (c.lastname ?? "").toLowerCase().includes(q) ||
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
  }, [contacts, contactSearchQuery]);

  // ── Render: Left Sidebar ────────────────────────────────────────────────────
  const renderSidebar = () => (
    <div
      className={cn(
        "flex flex-col h-full bg-white border-r border-slate-200/80",
        "w-full md:w-80 lg:w-[360px] shrink-0",
        mobileShowChat ? "hidden md:flex" : "flex"
      )}
    >
      {/* Top search & filter bar */}
      <div className="shrink-0 p-4 pb-3 space-y-3 border-b border-slate-100">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search people or messages…"
            className="pl-9 h-9 bg-slate-50 border-slate-200/80 text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Neutral Filter Pills matching V2 Design */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {(
            [
              { id: "ALL", label: "All" },
              { id: "INSTRUCTORS", label: "Instructors" },
              { id: "COHORT", label: "Cohort" },
              { id: "SUPPORT", label: "Support" },
            ] as const
          ).map((tab) => {
            const isSelected = filterCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0",
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80">
        {convsLoading ? (
          <div className="p-3 space-y-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex gap-3 p-2.5 items-center">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
          </div>
        ) : convsError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-xs font-semibold text-slate-800">
              Unable to load conversations
            </p>
            <p className="text-[11px] text-slate-400">
              Please check your connection and retry.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchConversations()}
              className="h-8 text-xs font-medium rounded-xl mt-1"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">
                {searchQuery ? "No matches found" : "No conversations yet"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {searchQuery ? "Try searching a different name" : "Start a chat with an instructor or classmate"}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsNewMessageOpen(true)}
              className="bg-[#FF9147] hover:bg-[#F26B1D] text-white text-xs font-medium rounded-xl h-8 px-3"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Start New Chat
            </Button>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conv) => {
              const peer = conv.with;
              const lastMsg = conv.lastMessage;
              const isActive = conv.conversationId === activeConversationId;
              const unreadCount = conv.unreadCount || 0;
              const hasUnread = unreadCount > 0;
              const courseTag = getCourseTag(conv);
              const avatarTheme = getAvatarTheme(peer?.role);
              const peerName = peer
                ? peer.firstname || peer.lastname
                  ? `${peer.firstname || ""} ${peer.lastname || ""}`.trim()
                  : peer.name || "User"
                : "User";

              return (
                <button
                  key={conv.conversationId}
                  onClick={() => openConversation(conv)}
                  className={cn(
                    "w-full text-left px-4 py-3 flex gap-3 items-center transition-all relative",
                    isActive
                      ? "bg-slate-50/90 border-l-2 border-[#FF9147]"
                      : "hover:bg-slate-50/60"
                  )}
                >
                  {/* Soft Avatar with Online Indicator */}
                  <div className="relative shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={cn("text-xs font-semibold", avatarTheme)}>
                        {getInitials(peer?.firstname, peer?.lastname, peer?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>

                  {/* Thread details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          "text-xs truncate leading-tight",
                          hasUnread ? "font-bold text-slate-900" : "font-semibold text-slate-900"
                        )}
                      >
                        {peerName}
                      </p>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatMsgTime(lastMsg.sentAt)}
                        </span>
                      )}
                    </div>

                    <p
                      className={cn(
                        "text-[11px] truncate mt-0.5",
                        hasUnread ? "font-medium text-slate-800" : "text-slate-500"
                      )}
                    >
                      {lastMsg
                        ? lastMsg.sender?.userId?.toString() === currentUserId?.toString()
                          ? `You: ${lastMsg.body}`
                          : lastMsg.body
                        : "No messages yet"}
                    </p>

                    {/* Bottom row: Course Tag + Unread Badge Only */}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {courseTag}
                      </span>

                      {hasUnread && (
                        <span className="w-5 h-5 rounded-full bg-[#FF9147] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Right Chat Panel ────────────────────────────────────────────────
  const renderChatPanel = () => {
    if (activeConversationId == null) {
      return (
        <div className="flex-1 flex-col items-center justify-center p-8 text-center hidden md:flex bg-slate-50/40">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3 text-emerald-600">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-base font-heading font-semibold text-slate-900">
            Select a conversation
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Choose a thread from the list or start a new message with an instructor or classmate.
          </p>
          <Button
            size="sm"
            onClick={() => setIsNewMessageOpen(true)}
            className="mt-4 bg-[#FF9147] hover:bg-[#F26B1D] text-white text-xs font-medium rounded-xl h-9 px-4"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Start New Chat
          </Button>
        </div>
      );
    }

    const peerAvatarTheme = getAvatarTheme(activePeer?.role);

    return (
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-white",
          !mobileShowChat && "hidden md:flex"
        )}
      >
        {/* Chat Pane Header matching V2 Page 23 */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-slate-200/80 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                setMobileShowChat(false);
                setActiveConversationId(null);
                setActivePeer(null);
              }}
              className="md:hidden p-1.5 -ml-1 hover:bg-slate-50 rounded-lg text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Soft Avatar with Online Indicator */}
            <div className="relative shrink-0">
              <Avatar className="w-9 h-9">
                <AvatarFallback className={cn("text-xs font-semibold", peerAvatarTheme)}>
                  {getInitials(activePeer?.firstname, activePeer?.lastname, activePeer?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="min-w-0">
              <h2 className="text-xs font-heading font-semibold text-slate-900 truncate leading-tight">
                {getPeerDisplayName(activePeer)}
              </h2>
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  Online · {activePeer?.courseTitle || (activePeer?.role === "INSTRUCTOR" ? "Certified Nursing Assistant (CNA)" : "Online")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = "/learn";
              }}
              className="h-8 text-xs font-medium text-slate-700 border-slate-200 rounded-xl bg-white hover:bg-slate-50"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Open course
            </Button>
          </div>
        </div>

        {/* Messages Stream Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-white">
          {msgsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[#0A65A0]" />
            </div>
          ) : !messages?.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-900">
                No messages in this chat yet
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Type below to start the conversation with {getPeerDisplayName(activePeer)}.
              </p>
            </div>
          ) : (
            <>
              {groupedMessages.map((group) => (
                <div key={group.date} className="space-y-3">
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-4">
                    <span className="text-[11px] font-medium text-slate-400 px-3 py-0.5 bg-slate-50 rounded-full border border-slate-200/60">
                      {formatGroupDate(group.date)}
                    </span>
                  </div>

                  {/* Messages list */}
                  <AnimatePresence initial={false}>
                    {group.messages.map((msg) => {
                      const isMine =
                        msg.mine === true ||
                        msg.sender?.userId?.toString() === currentUserId?.toString();

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] md:max-w-[62%] px-4 py-2.5 text-xs leading-relaxed break-words",
                              isMine
                                ? "bg-[#2B5E9C] text-white rounded-2xl rounded-tr-sm shadow-xs" // Blue outgoing bubbles (AA)
                                : "bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm" // Light incoming bubble
                            )}
                          >
                            <p className="whitespace-pre-wrap">{msg.body}</p>
                          </div>

                          <div
                            className={cn(
                              "flex items-center gap-1 text-[10px] text-slate-400 mt-1",
                              isMine ? "pr-1" : "pl-1"
                            )}
                          >
                            <span>{format(new Date(msg.sentAt), "h:mm a")}</span>
                            {isMine && <CheckCheck className="w-3 h-3 text-slate-400" />}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Footer Area */}
        <div className="shrink-0 p-4 border-t border-slate-200/80 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Write a message…"
              className="flex-1 h-10 bg-slate-50 border-slate-200/80 rounded-xl text-xs pl-4 focus-visible:ring-1 focus-visible:ring-slate-300"
              disabled={isSending}
            />

            <Button
              type="submit"
              disabled={!messageInput.trim() || isSending}
              className={cn(
                "h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors",
                messageInput.trim()
                  ? "bg-[#FF9147] hover:bg-[#F26B1D] text-white"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Send</span>
            </Button>
          </form>
        </div>
      </div>
    );
  };

  // ── Main Layout ─────────────────────────────────────────────────────────────
  const chatWindow = (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex h-[calc(100vh-13.5rem)] min-h-[580px]">
      {renderSidebar()}
      {renderChatPanel()}
    </div>
  );

  const content = (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Bar matching V2 Page 23 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-[#059669]" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-semibold tracking-tight text-slate-900">
                  Messages
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Chat with instructors, classmates and student support
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setIsNewMessageOpen(true)}
            className="bg-[#FF9147] hover:bg-[#F26B1D] text-white font-semibold text-xs h-9 rounded-xl shadow-xs px-4"
          >
            <Plus className="w-4 h-4 mr-1.5" /> New message
          </Button>
        </div>

        {/* 2-Column Chat Window */}
        {chatWindow}

        {/* Start New Message Dialog */}
        <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
          <DialogContent className="max-w-md">
            <DialogTitle className="text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              New Message
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Select an instructor, classmate, or staff member to begin a conversation.
            </DialogDescription>

            <div className="space-y-3 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  placeholder="Search contacts by name or email…"
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200/80 rounded-xl">
                {contactsLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary mb-1" />
                    <p className="text-xs text-slate-400 font-medium">Loading contacts…</p>
                  </div>
                ) : contactsError ? (
                  <div className="p-4 text-center text-xs text-rose-500 font-medium">
                    Failed to load contacts.
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">
                    No contacts found.
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const displayName =
                      contact.firstname || contact.lastname
                        ? `${contact.firstname || ""} ${contact.lastname || ""}`.trim()
                        : contact.name || contact.email || "Contact";
                    const isInstructor = contact.role === "INSTRUCTOR";

                    return (
                      <button
                        key={contact.userId}
                        onClick={() => openContactChat(contact)}
                        className="w-full p-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback
                            className={cn("text-xs font-semibold", getAvatarTheme(contact.role))}
                          >
                            {getInitials(contact.firstname, contact.lastname, contact.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {displayName}
                            </p>
                            <span
                              className={cn(
                                "text-[9px] font-medium uppercase px-1.5 py-0.5 rounded",
                                isInstructor
                                  ? "bg-purple-50 text-purple-700"
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              {contact.role}
                            </span>
                          </div>
                          {contact.email && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {contact.email}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  if (layoutless) {
    return (
      <div className="h-full w-full bg-white flex overflow-hidden">
        {renderSidebar()}
        {renderChatPanel()}
      </div>
    );
  }

  return <StudentLayout>{content}</StudentLayout>;
};

export default ChatPage;
