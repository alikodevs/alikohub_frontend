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
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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

// ── Brand tokens ─────────────────────────────────────────────────────────
// AlikoHub brand: blue → orange diagonal gradient, link/focus blue.

const BRAND_BLUE = "#0095DA";
const BRAND_BLUE_DARK = "#0077B3";
const BRAND_ORANGE = "#F37E28";
const BRAND_FOCUS = "#2C5F96";

// ── Props ─────────────────────────────────────────────────────────────────

interface ChatPageProps {
  /** When true, renders without StudentLayout (for use inside other layouts) */
  layoutless?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const getInitials = (first?: string, last?: string) =>
  `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase() || "?";

// Alternating brand-blue / brand-orange avatar gradients, with a couple of
// blended in-between tones for variety across a longer contact list.
const avatarColors = [
  "from-[#0095DA] to-[#0077B3]",
  "from-[#F37E28] to-[#D9661E]",
  "from-[#2C5F96] to-[#0095DA]",
  "from-[#F37E28] to-[#0095DA]",
  "from-[#0095DA] to-[#2C5F96]",
  "from-[#D9661E] to-[#F37E28]",
];

const getAvatarColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
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
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d, yyyy");
};

// ── Sidebar Tab ───────────────────────────────────────────────────────────

type SidebarTab = "conversations" | "contacts";

// ── Peer state type ───────────────────────────────────────────────────────

interface PeerInfo {
  userId: string;
  firstname?: string;
  lastname?: string;
  name?: string;
  role?: string;
}

// ── Main Component ────────────────────────────────────────────────────────

const ChatPage = ({ layoutless = false }: ChatPageProps) => {
  const { data: user } = useUser();
  const currentUserId = (user as any)?.id || (user as any)?.userId || "";

  // Sidebar state
  const [activeTab, setActiveTab] = useState<SidebarTab>("conversations");
  const [contactSearch, setContactSearch] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");

  // Active chat state
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [activePeer, setActivePeer] = useState<PeerInfo | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Data hooks ──────────────────────────────────────────────────────────

  const {
    data: contacts,
    isLoading: contactsLoading,
    isError: contactsError,
  } = useChatContacts();
  const {
    data: conversations,
    isLoading: convsLoading,
    isError: convsError,
  } = useChatConversations();
  const { data: messages, isLoading: msgsLoading } =
    useChatMessages(activeConversationId);

  const createConversation = useCreateConversation();
  const markRead = useMarkConversationRead();
  const sendMessage = useSendMessage();

  // Socket hooks
  useJoinConversation(activeConversationId);
  useMessageListener(activeConversationId);

  // ── Auto-scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── Focus input on conversation open ────────────────────────────────────

  useEffect(() => {
    if (activeConversationId != null) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConversationId]);

  // ── Mark as read ────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeConversationId != null) {
      markRead.mutate(activeConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  // ── Open conversation ───────────────────────────────────────────────────

  const openConversation = useCallback((conv: ChatConversation) => {
    // API returns conversationId, not id
    setActiveConversationId(conv.conversationId);
    // Peer is the "with" field from the API
    setActivePeer({
      userId: conv.with.userId,
      firstname: conv.with.firstname,
      lastname: conv.with.lastname,
      name: conv.with.name,
      role: conv.with.role,
    });
    setMobileShowChat(true);
  }, []);

  // ── Open / create conversation from contact ─────────────────────────────

  const openContactChat = useCallback(
    async (contact: ChatContact) => {
      // Check if conversation already exists with this contact
      const existing = conversations?.find(
        (c) => c.with?.userId === contact.userId,
      );

      if (existing) {
        openConversation(existing);
        return;
      }

      // Create new conversation
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
        setActiveTab("conversations");
      } catch (err) {
        console.error("Failed to create conversation", err);
      }
    },
    [conversations, createConversation, openConversation],
  );

  // ── Send message handler ────────────────────────────────────────────────

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || activeConversationId == null || isSending)
      return;

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

  // ── Filtered contacts ───────────────────────────────────────────────────

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!contactSearch.trim()) return contacts;
    const q = contactSearch.toLowerCase();
    return contacts.filter(
      (c) =>
        (c.firstname ?? "").toLowerCase().includes(q) ||
        (c.lastname ?? "").toLowerCase().includes(q) ||
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [contacts, contactSearch]);

  // ── Filtered conversations ──────────────────────────────────────────────

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!conversationSearch.trim()) return conversations;
    const q = conversationSearch.toLowerCase();
    return conversations.filter((c) => {
      const w = c.with;
      if (!w) return false;
      return (
        (w.name ?? "").toLowerCase().includes(q) ||
        `${w.firstname ?? ""} ${w.lastname ?? ""}`.toLowerCase().includes(q) ||
        (w.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [conversations, conversationSearch]);

  // ── Group messages by date ──────────────────────────────────────────────

  const groupedMessages = useMemo(() => {
    if (!messages?.length) return [];
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";

    for (const msg of messages) {
      // API uses sentAt, not createdAt
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

  // ── Peer display name helper ────────────────────────────────────────────

  const getPeerDisplayName = (peer: PeerInfo | null) => {
    if (!peer) return "Chat";
    if (peer.firstname || peer.lastname) {
      return `${peer.firstname || ""} ${peer.lastname || ""}`.trim();
    }
    return peer.name || "Chat";
  };

  // ── Render: Sidebar ─────────────────────────────────────────────────────

  const renderSidebar = () => (
    <div
      className={cn(
        "flex flex-col h-full bg-white border-r border-slate-100",
        "w-full md:w-80 lg:w-96 shrink-0",
        mobileShowChat ? "hidden md:flex" : "flex",
      )}
    >
      {/* Sidebar Header */}
      <div className="shrink-0 px-4 pt-5 pb-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search"
            className="pl-10 h-10 bg-slate-50 border-0 focus-visible:ring-1 text-sm rounded-full"
            style={{ "--tw-ring-color": BRAND_FOCUS } as React.CSSProperties}
            value={
              activeTab === "contacts" ? contactSearch : conversationSearch
            }
            onChange={(e) =>
              activeTab === "contacts"
                ? setContactSearch(e.target.value)
                : setConversationSearch(e.target.value)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-base font-heading font-bold text-slate-900">
            Messages
          </h1>

          {/* Tabs */}
          <div className="flex bg-slate-50 rounded-full p-0.5 gap-0.5">
            <button
              onClick={() => setActiveTab("conversations")}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200",
                activeTab === "conversations"
                  ? "text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600",
              )}
              style={
                activeTab === "conversations"
                  ? { backgroundColor: BRAND_BLUE }
                  : undefined
              }
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab("contacts")}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 flex items-center gap-1",
                activeTab === "contacts"
                  ? "text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600",
              )}
              style={
                activeTab === "contacts"
                  ? { backgroundColor: BRAND_BLUE }
                  : undefined
              }
            >
              <Users className="w-3 h-3" />
              Contacts
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "conversations"
          ? renderConversationsList()
          : renderContactsList()}
      </div>
    </div>
  );

  // ── Render: Conversations List ──────────────────────────────────────────

  const renderConversationsList = () => {
    if (convsLoading) {
      return (
        <div className="p-3 space-y-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex gap-3 p-3">
                <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
        </div>
      );
    }

    if (convsError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-300 mb-2" />
          <p className="text-sm font-semibold text-red-500">
            Failed to load conversations
          </p>
          <p className="text-xs text-slate-400 mt-1">Please try again later</p>
        </div>
      );
    }

    if (!filteredConversations?.length) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ backgroundColor: `${BRAND_BLUE}14` }}
          >
            <MessageSquare className="w-7 h-7" style={{ color: BRAND_BLUE }} />
          </div>
          <p className="text-sm font-semibold text-slate-900">
            No conversations yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Start a new chat from the Contacts tab
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 text-xs font-bold gap-1.5 rounded-full"
            style={{ borderColor: `${BRAND_BLUE}55`, color: BRAND_BLUE }}
            onClick={() => setActiveTab("contacts")}
          >
            <Users className="w-3.5 h-3.5" />
            Browse Contacts
          </Button>
        </div>
      );
    }

    return (
      <div>
        {filteredConversations.map((conv) => {
          const peer = conv.with;
          const lastMsg = conv.lastMessage;
          // API uses conversationId, not id
          const isActive = conv.conversationId === activeConversationId;
          const unread = (conv.unreadCount || 0) > 0;
          const peerName = peer
            ? peer.firstname || peer.lastname
              ? `${peer.firstname || ""} ${peer.lastname || ""}`.trim()
              : peer.name || "Unknown"
            : "Unknown";

          return (
            <button
              key={conv.conversationId}
              onClick={() => openConversation(conv)}
              className={cn(
                "text-left px-4 py-3 flex gap-3 items-center transition-all duration-150 rounded-2xl mx-2 my-0.5",
                !isActive && "hover:bg-slate-50",
              )}
              style={{
                width: "calc(100% - 1rem)",
                backgroundColor: isActive ? `${BRAND_BLUE}0F` : undefined,
              }}
            >
              <Avatar className="w-11 h-11 shrink-0">
                <AvatarFallback
                  className={cn(
                    "bg-gradient-to-br text-white text-sm font-bold",
                    getAvatarColor(peer?.userId || ""),
                  )}
                >
                  {getInitials(peer?.firstname, peer?.lastname)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm truncate leading-snug",
                      unread
                        ? "font-bold text-slate-900"
                        : "font-semibold text-slate-800",
                    )}
                  >
                    {peerName}
                  </p>
                  {lastMsg && (
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatMsgTime(lastMsg.sentAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p
                    className={cn(
                      "text-xs truncate flex-1",
                      unread ? "text-slate-700 font-medium" : "text-slate-400",
                    )}
                  >
                    {lastMsg
                      ? lastMsg.sender?.userId?.toString() ===
                        currentUserId?.toString()
                        ? `You: ${lastMsg.body}`
                        : lastMsg.body
                      : "No messages yet"}
                  </p>
                  {unread && (
                    <span
                      className="shrink-0 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: BRAND_ORANGE }}
                    >
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // ── Render: Contacts List ───────────────────────────────────────────────

  const renderContactsList = () => {
    if (contactsLoading) {
      return (
        <div className="p-3 space-y-2">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex gap-3 p-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
        </div>
      );
    }

    if (contactsError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-300 mb-2" />
          <p className="text-sm font-semibold text-red-500">
            Failed to load contacts
          </p>
        </div>
      );
    }

    if (!filteredContacts?.length) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Users className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-900">
            {contactSearch ? "No contacts found" : "No contacts available"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {contactSearch
              ? "Try a different search term"
              : "Contacts will appear once you're enrolled"}
          </p>
        </div>
      );
    }

    return (
      <div>
        {filteredContacts.map((contact) => {
          const displayName =
            contact.firstname || contact.lastname
              ? `${contact.firstname || ""} ${contact.lastname || ""}`.trim()
              : contact.name || contact.email;
          const isInstructor = contact.role === "INSTRUCTOR";

          return (
            <button
              key={contact.userId}
              onClick={() => openContactChat(contact)}
              className="text-left px-4 py-3 flex gap-3 items-center transition-all duration-150 hover:bg-slate-50 rounded-2xl mx-2 my-0.5"
              style={{ width: "calc(100% - 1rem)" }}
            >
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarFallback
                  className={cn(
                    "bg-gradient-to-br text-white text-xs font-bold",
                    getAvatarColor(contact.userId),
                  )}
                >
                  {getInitials(contact.firstname, contact.lastname)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate leading-snug">
                  {displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={
                      isInstructor
                        ? {
                            backgroundColor: `${BRAND_ORANGE}1F`,
                            color: BRAND_ORANGE,
                          }
                        : {
                            backgroundColor: `${BRAND_BLUE}1F`,
                            color: BRAND_BLUE,
                          }
                    }
                  >
                    {contact.role}
                  </span>
                  {(contact.courseIds?.length ?? 0) > 0 && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Hash className="w-2.5 h-2.5" />
                      {contact.courseIds!.length} course
                      {contact.courseIds!.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // ── Render: Chat Panel ──────────────────────────────────────────────────

  const renderChatPanel = () => {
    if (activeConversationId == null) {
      return (
        <div className="flex-1 flex-col items-center justify-center p-8 text-center hidden md:flex bg-slate-50/50">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
            style={{ backgroundColor: `${BRAND_BLUE}14` }}
          >
            <MessageSquare
              className="w-10 h-10"
              style={{ color: BRAND_BLUE }}
            />
          </div>
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
            Welcome to Messages
          </h2>
          <p className="text-sm text-slate-400 max-w-xs">
            Select a conversation or start a new chat from the Contacts tab to
            begin messaging.
          </p>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-slate-50/50",
          !mobileShowChat && "hidden md:flex",
        )}
      >
        {/* Chat Header */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => {
              setMobileShowChat(false);
              setActiveConversationId(null);
              setActivePeer(null);
            }}
            className="md:hidden p-1.5 -ml-1 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>

          <Avatar className="w-10 h-10 shrink-0">
            <AvatarFallback
              className={cn(
                "bg-gradient-to-br text-white text-sm font-bold",
                getAvatarColor(activePeer?.userId || ""),
              )}
            >
              {getInitials(activePeer?.firstname, activePeer?.lastname)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-heading font-bold text-slate-900 truncate">
              {getPeerDisplayName(activePeer)}
            </p>
            {activePeer?.role && (
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                style={
                  activePeer.role === "INSTRUCTOR"
                    ? {
                        backgroundColor: `${BRAND_ORANGE}1F`,
                        color: BRAND_ORANGE,
                      }
                    : { backgroundColor: `${BRAND_BLUE}1F`, color: BRAND_BLUE }
                }
              >
                {activePeer.role}
              </span>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {msgsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: BRAND_BLUE }}
              />
            </div>
          ) : !messages?.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${BRAND_BLUE}14` }}
              >
                <MessageSquare
                  className="w-8 h-8"
                  style={{ color: BRAND_BLUE }}
                />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                No messages yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Send the first message to start the conversation!
              </p>
            </div>
          ) : (
            <>
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 bg-white rounded-full border border-slate-100">
                      {formatGroupDate(group.date)}
                    </span>
                  </div>

                  {/* Messages */}
                  <AnimatePresence initial={false}>
                    {group.messages.map((msg) => {
                      const isMine =
                        msg.mine === true ||
                        msg.sender?.userId?.toString() ===
                          currentUserId?.toString();

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "flex mb-2 items-end gap-2",
                            isMine ? "justify-end" : "justify-start",
                          )}
                        >
                          {isMine && (
                            <span className="text-[10px] text-slate-400 shrink-0 mb-1">
                              {format(new Date(msg.sentAt), "h:mm a")}
                            </span>
                          )}
                          <div
                            className={cn(
                              "max-w-[75%] md:max-w-[60%] px-4 py-2.5 rounded-2xl relative group transition-shadow",
                              isMine
                                ? "text-white rounded-br-md"
                                : "bg-white border border-slate-100 text-slate-800 rounded-bl-md shadow-sm",
                            )}
                            style={
                              isMine
                                ? { backgroundColor: BRAND_BLUE }
                                : undefined
                            }
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.body}
                            </p>
                          </div>
                          {!isMine && (
                            <span className="text-[10px] text-slate-400 shrink-0 mb-1">
                              {format(new Date(msg.sentAt), "h:mm a")}
                            </span>
                          )}
                          {isMine && (
                            <CheckCheck
                              className="w-3.5 h-3.5 shrink-0 mb-1"
                              style={{ color: `${BRAND_BLUE}99` }}
                            />
                          )}
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

        {/* Message Input */}
        <div className="shrink-0 bg-slate-50/50 px-4 py-3">
          <div className="flex items-center gap-2 bg-slate-50 rounded-full px-2 py-1.5">
            <Input
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Write your message..."
              className="flex-1 h-9 bg-transparent border-0 focus-visible:ring-0 shadow-none text-sm pl-3"
              disabled={isSending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isSending}
              size="icon"
              className={cn(
                "w-9 h-9 rounded-full shrink-0 transition-all duration-200",
                !messageInput.trim() && "bg-slate-200 text-slate-400",
              )}
              style={
                messageInput.trim()
                  ? {
                      backgroundColor: BRAND_BLUE,
                      color: "white",
                      boxShadow: `0 4px 10px ${BRAND_BLUE}40`,
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (messageInput.trim())
                  e.currentTarget.style.backgroundColor = BRAND_BLUE_DARK;
              }}
              onMouseLeave={(e) => {
                if (messageInput.trim())
                  e.currentTarget.style.backgroundColor = BRAND_BLUE;
              }}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────

  const content = (
    <div className="flex h-full overflow-hidden bg-white">
      {renderSidebar()}
      {renderChatPanel()}
    </div>
  );

  if (layoutless) return content;

  return <StudentLayout>{content}</StudentLayout>;
};

export default ChatPage;
