"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface Conversation {
  id: number;
  match_id: number;
  participant_a: string;
  participant_b: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
}

interface PetProfile {
  user_id: string;
  pet_name: string;
  display_name: string;
  avatar_url: string | null;
  profile_photo_url: string | null;
  breed: string;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  body: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  optimistic?: boolean;
}

interface ConversationWithProfile extends Conversation {
  otherProfile: PetProfile | null;
  unreadCount: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getDateKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getInitial(name: string | null | undefined): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

/* ─── Avatar Component ───────────────────────────────────────────────── */

function Avatar({
  profile,
  size = 40,
}: {
  profile: PetProfile | null;
  size?: number;
}) {
  const url = profile?.avatar_url || profile?.profile_photo_url;
  const name = profile?.display_name || profile?.pet_name;

  if (url) {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0 bg-off-white"
        style={{ width: size, height: size }}
      >
        <Image
          src={url}
          alt={name || "Avatar"}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-full flex-shrink-0 bg-deep-green flex items-center justify-center text-white font-rubik font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {getInitial(name)}
    </div>
  );
}

/* ─── Login CTA ──────────────────────────────────────────────────────── */

function LoginCTA() {
  return (
    <div className="min-h-screen bg-off-white">
      <Header />
      <div className="pt-[140px] pb-20 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-deep-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#274C46"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="font-rubik font-bold text-2xl text-deep-green mb-3">
            Sign in to view messages
          </h2>
          <p className="text-deep-green/60 mb-8 text-[15px] leading-relaxed">
            Log in to your account to chat with other pet owners and manage your
            conversations.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-gold text-deep-green font-rubik font-semibold px-8 py-3 rounded-lg hover:bg-[#d99500] transition-colors text-[16px]"
          >
            Log in
          </Link>
          <p className="mt-4 text-deep-green/50 text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-gold font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ─── Desktop Conversation List Item ─────────────────────────────────── */

function DesktopConversationItem({
  convo,
  isActive,
  onClick,
}: {
  convo: ConversationWithProfile;
  isActive: boolean;
  onClick: () => void;
}) {
  const profile = convo.otherProfile;
  const name = profile?.display_name || profile?.pet_name || "Unknown";
  const breed = profile?.breed;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left py-4 px-5 flex items-start gap-4 transition-colors hover:bg-deep-green/5 ${
        isActive
          ? "bg-deep-green/5 border-l-[3px] border-l-gold"
          : "border-l-[3px] border-l-transparent"
      }`}
    >
      <Avatar profile={profile} size={48} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-rubik font-semibold text-deep-green text-[15px] truncate">
              {name}
            </span>
            {breed && (
              <span className="flex-shrink-0 text-[11px] bg-deep-green/8 text-deep-green/70 px-2 py-0.5 rounded-full font-medium">
                {breed}
              </span>
            )}
          </div>
          <span className="text-[12px] text-deep-green/40 flex-shrink-0 whitespace-nowrap">
            {timeAgo(convo.last_message_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[13px] text-deep-green/50 truncate flex-1">
            {convo.last_message_preview || "No messages yet"}
          </p>
          {convo.unreadCount > 0 && (
            <span className="flex-shrink-0 bg-gold text-deep-green text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {convo.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── Mobile Conversation List Item ──────────────────────────────────── */

function MobileConversationItem({
  convo,
  onClick,
}: {
  convo: ConversationWithProfile;
  onClick: () => void;
}) {
  const profile = convo.otherProfile;
  const name = profile?.display_name || profile?.pet_name || "Unknown";

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 flex items-center gap-3 active:bg-deep-green/5 transition-colors border-b border-deep-green/5"
    >
      <Avatar profile={profile} size={48} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-rubik font-bold text-deep-green text-[15px] truncate">
            {name}
          </span>
          <span className="text-[11px] text-deep-green/40 flex-shrink-0 whitespace-nowrap">
            {timeAgo(convo.last_message_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[13px] text-deep-green/50 truncate flex-1 leading-snug">
            {convo.last_message_preview || "No messages yet"}
          </p>
          {convo.unreadCount > 0 && (
            <span className="flex-shrink-0 bg-gold text-deep-green text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
              {convo.unreadCount}
            </span>
          )}
        </div>
      </div>
      {/* Chevron right */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#274C46"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-20 flex-shrink-0"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

/* ─── Desktop Date Separator ─────────────────────────────────────────── */

function DesktopDateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-5 px-6">
      <div className="flex-1 h-px bg-deep-green/10" />
      <span className="text-[12px] text-deep-green/40 font-medium">
        {formatDateSeparator(date)}
      </span>
      <div className="flex-1 h-px bg-deep-green/10" />
    </div>
  );
}

/* ─── Mobile Date Separator (pill style) ─────────────────────────────── */

function MobileDateSeparator({ date }: { date: string }) {
  return (
    <div className="flex justify-center my-4">
      <span className="bg-deep-green/8 text-deep-green/50 text-[11px] font-medium px-3 py-1 rounded-full">
        {formatDateSeparator(date)}
      </span>
    </div>
  );
}

/* ─── Desktop Message Bubble ─────────────────────────────────────────── */

function DesktopMessageBubble({
  message,
  isMine,
}: {
  message: Message;
  isMine: boolean;
}) {
  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} px-6 mb-2`}
    >
      <div
        className={`max-w-[60%] ${
          isMine
            ? "bg-gold text-deep-green rounded-2xl rounded-br-sm"
            : "bg-white border border-deep-green/10 text-deep-green rounded-2xl rounded-bl-sm"
        } ${message.optimistic ? "opacity-70" : ""}`}
      >
        {message.image_url && (
          <div className="p-1.5 pb-0">
            <Image
              src={message.image_url}
              alt="Shared image"
              width={300}
              height={300}
              className="rounded-xl max-w-[300px] w-full h-auto object-cover"
              unoptimized
            />
          </div>
        )}
        {message.body && (
          <p className="px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words">
            {message.body}
          </p>
        )}
        <div
          className={`px-4 pb-2 -mt-0.5 text-[11px] ${
            isMine ? "text-deep-green/50 text-right" : "text-deep-green/35"
          }`}
        >
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}

/* ─── Mobile Message Bubble (WhatsApp-style with tail) ───────────────── */

function MobileMessageBubble({
  message,
  isMine,
  showTail,
}: {
  message: Message;
  isMine: boolean;
  showTail: boolean;
}) {
  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} px-3 mb-1`}
    >
      <div className="relative">
        <div
          className={`max-w-[280px] relative ${
            isMine
              ? `bg-gold/20 text-deep-green ${
                  showTail ? "rounded-2xl rounded-tr-sm" : "rounded-2xl"
                }`
              : `bg-white text-deep-green shadow-sm ${
                  showTail ? "rounded-2xl rounded-tl-sm" : "rounded-2xl"
                }`
          } ${message.optimistic ? "opacity-70" : ""}`}
        >
          {message.image_url && (
            <div className="p-1.5 pb-0">
              <Image
                src={message.image_url}
                alt="Shared image"
                width={250}
                height={250}
                className="rounded-xl max-w-[250px] w-full h-auto object-cover"
                unoptimized
              />
            </div>
          )}
          {message.body && (
            <p className="px-3 py-2 text-[14px] leading-relaxed whitespace-pre-wrap break-words">
              {message.body}
            </p>
          )}
          <div
            className={`px-3 pb-1.5 -mt-0.5 text-[10px] ${
              isMine ? "text-deep-green/40 text-right" : "text-deep-green/30"
            }`}
          >
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Desktop Chat View ──────────────────────────────────────────────── */

function DesktopChatView({
  conversation,
  userId,
}: {
  conversation: ConversationWithProfile;
  userId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = conversation.otherProfile;
  const name = profile?.display_name || profile?.pet_name || "Unknown";

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 50);
  }, []);

  // Fetch messages
  useEffect(() => {
    let cancelled = false;
    async function fetchMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      if (!cancelled && !error && data) {
        setMessages(data as Message[]);
      }
      if (!cancelled) setLoading(false);
    }
    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [conversation.id]);

  // Mark as read
  useEffect(() => {
    async function markRead() {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversation.id)
        .neq("sender_id", userId)
        .eq("is_read", false);
    }
    markRead();
  }, [conversation.id, userId, messages.length]);

  // Auto-scroll
  useEffect(() => {
    if (!loading) {
      scrollToBottom(messages.length <= 20 ? "instant" : "smooth");
    }
  }, [messages, loading, scrollToBottom]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id !== userId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then();
            scrollToBottom();
          } else {
            setMessages((prev) => {
              const withoutOptimistic = prev.filter(
                (m) =>
                  !(
                    m.optimistic &&
                    m.body === newMsg.body &&
                    m.sender_id === newMsg.sender_id
                  )
              );
              if (withoutOptimistic.some((m) => m.id === newMsg.id))
                return withoutOptimistic;
              return [...withoutOptimistic, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, userId, scrollToBottom]);

  // Send message
  const handleSend = useCallback(async () => {
    const trimmedBody = body.trim();
    if ((!trimmedBody && !imageUrl) || sending) return;

    setSending(true);
    const tempId = -Date.now();
    const now = new Date().toISOString();

    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: userId,
      body: trimmedBody,
      image_url: imageUrl,
      is_read: false,
      created_at: now,
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setBody("");
    setImageUrl(null);
    scrollToBottom();

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: userId,
      body: trimmedBody,
      image_url: imageUrl,
    });

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setBody(trimmedBody);
      setImageUrl(imageUrl);
    } else {
      await supabase
        .from("conversations")
        .update({
          last_message_at: now,
          last_message_preview: trimmedBody || "(image)",
        })
        .eq("id", conversation.id);
    }

    setSending(false);
  }, [body, imageUrl, sending, conversation.id, userId, scrollToBottom]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBodyChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    const maxLines = 4;
    const lineHeight = 22;
    const maxHeight = lineHeight * maxLines + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url || data.publicUrl || data.imageUrl);
      }
    } catch {
      // Upload failed silently
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Group messages by date
  const groupedMessages: {
    dateKey: string;
    date: string;
    messages: Message[];
  }[] = [];
  let currentDateKey = "";
  for (const msg of messages) {
    const dk = getDateKey(msg.created_at);
    if (dk !== currentDateKey) {
      currentDateKey = dk;
      groupedMessages.push({ dateKey: dk, date: msg.created_at, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  const canSend = (body.trim().length > 0 || imageUrl) && !sending;

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-white border-b border-deep-green/10 px-6 py-4 flex items-center gap-4">
        <Avatar profile={profile} size={42} />
        <div className="min-w-0">
          <h3 className="font-rubik font-semibold text-deep-green text-[16px] truncate">
            {name}
          </h3>
          {profile?.breed && (
            <p className="text-[12px] text-deep-green/50 truncate">
              {profile.breed}
            </p>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-off-white/40 py-4"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-deep-green/20 border-t-deep-green rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-6">
            <div>
              <div className="w-16 h-16 bg-deep-green/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#274C46"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-40"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-deep-green/50 text-[15px]">
                Say hi! Send the first message
              </p>
            </div>
          </div>
        ) : (
          <>
            {groupedMessages.map((group) => (
              <div key={group.dateKey}>
                <DesktopDateSeparator date={group.date} />
                {group.messages.map((msg) => (
                  <DesktopMessageBubble
                    key={msg.id}
                    message={msg}
                    isMine={msg.sender_id === userId}
                  />
                ))}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imageUrl && (
        <div className="flex-shrink-0 bg-white border-t border-deep-green/10 px-6 py-3">
          <div className="relative inline-block">
            <Image
              src={imageUrl}
              alt="Attachment"
              width={80}
              height={80}
              className="rounded-lg object-cover w-20 h-20"
              unoptimized
            />
            <button
              onClick={() => setImageUrl(null)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 bg-white border-t border-deep-green/10 px-5 py-3 flex items-end gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-deep-green/5 transition-colors text-deep-green/40 hover:text-deep-green/60 disabled:opacity-40 mb-0.5"
          aria-label="Attach image"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-deep-green/20 border-t-deep-green rounded-full animate-spin" />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </button>

        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleBodyChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none bg-off-white/60 border border-deep-green/10 rounded-xl px-4 py-2.5 text-[14px] text-deep-green placeholder-deep-green/30 outline-none focus:border-deep-green/25 transition-colors leading-[22px]"
          style={{ maxHeight: 104 }}
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gold text-deep-green hover:bg-[#d99500] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Mobile Chat View (WhatsApp-style) ──────────────────────────────── */

function MobileChatView({
  conversation,
  userId,
  onBack,
}: {
  conversation: ConversationWithProfile;
  userId: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = conversation.otherProfile;
  const name = profile?.display_name || profile?.pet_name || "Unknown";

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 50);
  }, []);

  // Fetch messages
  useEffect(() => {
    let cancelled = false;
    async function fetchMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      if (!cancelled && !error && data) {
        setMessages(data as Message[]);
      }
      if (!cancelled) setLoading(false);
    }
    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [conversation.id]);

  // Mark as read
  useEffect(() => {
    async function markRead() {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversation.id)
        .neq("sender_id", userId)
        .eq("is_read", false);
    }
    markRead();
  }, [conversation.id, userId, messages.length]);

  // Auto-scroll
  useEffect(() => {
    if (!loading) {
      scrollToBottom(messages.length <= 20 ? "instant" : "smooth");
    }
  }, [messages, loading, scrollToBottom]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:mobile:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id !== userId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then();
            scrollToBottom();
          } else {
            setMessages((prev) => {
              const withoutOptimistic = prev.filter(
                (m) =>
                  !(
                    m.optimistic &&
                    m.body === newMsg.body &&
                    m.sender_id === newMsg.sender_id
                  )
              );
              if (withoutOptimistic.some((m) => m.id === newMsg.id))
                return withoutOptimistic;
              return [...withoutOptimistic, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, userId, scrollToBottom]);

  // Send message
  const handleSend = useCallback(async () => {
    const trimmedBody = body.trim();
    if ((!trimmedBody && !imageUrl) || sending) return;

    setSending(true);
    const tempId = -Date.now();
    const now = new Date().toISOString();

    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: userId,
      body: trimmedBody,
      image_url: imageUrl,
      is_read: false,
      created_at: now,
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setBody("");
    setImageUrl(null);
    scrollToBottom();

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: userId,
      body: trimmedBody,
      image_url: imageUrl,
    });

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setBody(trimmedBody);
      setImageUrl(imageUrl);
    } else {
      await supabase
        .from("conversations")
        .update({
          last_message_at: now,
          last_message_preview: trimmedBody || "(image)",
        })
        .eq("id", conversation.id);
    }

    setSending(false);
  }, [body, imageUrl, sending, conversation.id, userId, scrollToBottom]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBodyChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    const maxLines = 3;
    const lineHeight = 22;
    const maxHeight = lineHeight * maxLines + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url || data.publicUrl || data.imageUrl);
      }
    } catch {
      // Upload failed silently
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Group messages by date
  const groupedMessages: {
    dateKey: string;
    date: string;
    messages: Message[];
  }[] = [];
  let currentDateKey = "";
  for (const msg of messages) {
    const dk = getDateKey(msg.created_at);
    if (dk !== currentDateKey) {
      currentDateKey = dk;
      groupedMessages.push({ dateKey: dk, date: msg.created_at, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  const canSend = (body.trim().length > 0 || imageUrl) && !sending;

  return (
    <div className="flex-1 bg-off-white flex flex-col min-h-0">
      {/* Chat Top Bar */}
      <div className="flex-shrink-0 bg-white border-b border-deep-green/10 px-3 py-2.5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-deep-green/5 active:bg-deep-green/10 transition-colors"
          aria-label="Back to conversations"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#274C46"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar profile={profile} size={36} />
        <div className="flex-1 min-w-0">
          <h3 className="font-rubik font-bold text-deep-green text-[15px] truncate">
            {name}
          </h3>
          {profile?.breed && (
            <p className="text-[11px] text-deep-green/50 truncate">
              {profile.breed}
            </p>
          )}
        </div>
        {/* More options */}
        <button
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-deep-green/5 transition-colors"
          aria-label="More options"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="#274C46"
          >
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-off-white/60 py-2"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-deep-green/20 border-t-deep-green rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-6">
            <div>
              <div className="w-14 h-14 bg-deep-green/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#274C46"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-40"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-deep-green/50 text-[14px]">
                Say hi! Send the first message
              </p>
            </div>
          </div>
        ) : (
          <>
            {groupedMessages.map((group) => (
              <div key={group.dateKey}>
                <MobileDateSeparator date={group.date} />
                {group.messages.map((msg, idx) => {
                  const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                  const showTail =
                    !prevMsg || prevMsg.sender_id !== msg.sender_id;
                  return (
                    <MobileMessageBubble
                      key={msg.id}
                      message={msg}
                      isMine={msg.sender_id === userId}
                      showTail={showTail}
                    />
                  );
                })}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imageUrl && (
        <div className="flex-shrink-0 bg-white border-t border-deep-green/10 px-4 py-2">
          <div className="relative inline-block">
            <Image
              src={imageUrl}
              alt="Attachment"
              width={64}
              height={64}
              className="rounded-lg object-cover w-16 h-16"
              unoptimized
            />
            <button
              onClick={() => setImageUrl(null)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Sticky Input Bar */}
      <div className="flex-shrink-0 bg-white border-t border-deep-green/10 px-3 py-2 flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-deep-green/5 active:bg-deep-green/10 transition-colors text-deep-green/40 disabled:opacity-40 mb-0.5"
          aria-label="Attach image"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-deep-green/20 border-t-deep-green rounded-full animate-spin" />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </button>

        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleBodyChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none bg-off-white/70 border border-deep-green/10 rounded-2xl px-4 py-2.5 text-[14px] text-deep-green placeholder-deep-green/30 outline-none focus:border-deep-green/20 transition-colors leading-[22px]"
          style={{ maxHeight: 82 }}
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gold text-deep-green active:bg-[#d99500] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
          aria-label="Send message"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* ─── Main Messages Page ─────────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithProfile[]>(
    []
  );
  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  const userId = user?.id;

  // Fetch conversations + profiles + unread counts
  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    setLoadingConvos(true);

    const { data: convos, error: convoError } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (convoError || !convos) {
      setLoadingConvos(false);
      return;
    }

    // Collect other user IDs
    const otherUserIds = convos.map((c: Conversation) =>
      c.participant_a === userId ? c.participant_b : c.participant_a
    );

    // Fetch pet profiles for other users
    let profileMap: Record<string, PetProfile> = {};
    if (otherUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("pet_profiles")
        .select(
          "user_id, pet_name, display_name, avatar_url, profile_photo_url, breed"
        )
        .in("user_id", otherUserIds);

      if (profiles) {
        profileMap = {};
        for (const p of profiles as PetProfile[]) {
          profileMap[p.user_id] = p;
        }
      }
    }

    // Fetch unread counts per conversation
    const convoIds = convos.map((c: Conversation) => c.id);
    const unreadMap: Record<number, number> = {};
    if (convoIds.length > 0) {
      const { data: unreadData } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convoIds)
        .neq("sender_id", userId)
        .eq("is_read", false);

      if (unreadData) {
        for (const row of unreadData) {
          const cid = row.conversation_id as number;
          unreadMap[cid] = (unreadMap[cid] || 0) + 1;
        }
      }
    }

    // Combine
    const enriched: ConversationWithProfile[] = convos.map(
      (c: Conversation) => {
        const otherId =
          c.participant_a === userId ? c.participant_b : c.participant_a;
        return {
          ...c,
          otherProfile: profileMap[otherId] || null,
          unreadCount: unreadMap[c.id] || 0,
        };
      }
    );

    setConversations(enriched);

    const total = Object.values(unreadMap).reduce((sum, n) => sum + n, 0);
    setTotalUnread(total);

    setLoadingConvos(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, fetchConversations]);

  // Refresh conversation list periodically
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      fetchConversations();
    }, 15000);
    return () => clearInterval(interval);
  }, [userId, fetchConversations]);

  // Handle conversation selection
  const handleSelectConversation = (id: number) => {
    setActiveConvoId(id);
    setMobileShowChat(true);

    // Clear unread for selected conversation locally
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );

    setTotalUnread((prev) => {
      const convo = conversations.find((c) => c.id === id);
      return Math.max(0, prev - (convo?.unreadCount || 0));
    });
  };

  const handleBack = () => {
    setMobileShowChat(false);
    fetchConversations();
  };

  const activeConversation =
    conversations.find((c) => c.id === activeConvoId) || null;

  // Auth loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-off-white">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-deep-green/20 border-t-deep-green rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <LoginCTA />;
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /* ─── Unified Responsive Layout ────────────────────────────────── */
  /* ═══════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-off-white flex flex-col font-rubik">
      <Header />

      <div className="flex-1 pt-[140px] pb-6 lg:pb-12 px-0 lg:px-12">
        <div className="max-w-[1400px] mx-auto h-full">
          {/* Page Title - desktop only */}
          <div className="hidden lg:flex items-center gap-3 mb-6">
            <h1 className="font-rubik font-bold text-deep-green text-2xl">
              Messages
            </h1>
            {totalUnread > 0 && (
              <span className="bg-gold text-deep-green text-[12px] font-bold min-w-[22px] h-[22px] px-2 rounded-full flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </div>

          {/* ─── Desktop: Split Panel (lg+) ─── */}
          <div
            className="hidden lg:flex bg-white rounded-2xl shadow-sm border border-deep-green/8 overflow-hidden"
            style={{ minHeight: "600px" }}
          >
            {/* Left Panel: Conversation List */}
            <div className="w-[400px] flex-shrink-0 border-r border-deep-green/8 flex flex-col overflow-hidden">
              {loadingConvos ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-deep-green/20 border-t-deep-green rounded-full animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center px-8 text-center">
                  <div>
                    <div className="w-16 h-16 bg-deep-green/5 rounded-full flex items-center justify-center mx-auto mb-5">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#274C46"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-40"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <p className="text-deep-green/50 text-[15px] leading-relaxed mb-4">
                      No messages yet. Match with other pet owners to start
                      chatting!
                    </p>
                    <Link
                      href="/swipe"
                      className="inline-block bg-gold text-deep-green font-rubik font-semibold px-6 py-2.5 rounded-lg hover:bg-[#d99500] transition-colors text-[14px]"
                    >
                      Find matches
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((convo) => (
                    <DesktopConversationItem
                      key={convo.id}
                      convo={convo}
                      isActive={convo.id === activeConvoId}
                      onClick={() => handleSelectConversation(convo.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel: Chat View */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {activeConversation ? (
                <DesktopChatView
                  key={activeConversation.id}
                  conversation={activeConversation}
                  userId={user.id}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-center px-8">
                  <div>
                    <div className="w-20 h-20 bg-deep-green/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#274C46"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-30"
                      >
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    </div>
                    <p className="text-deep-green/40 text-[17px] font-rubik font-medium mb-2">
                      Select a conversation
                    </p>
                    <p className="text-deep-green/30 text-[14px]">
                      Choose a chat from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Mobile: Full-width panels (below lg) ─── */}
          <div className="flex lg:hidden flex-col min-h-[60vh]">
            {/* Mobile: Conversation List (hidden when chat is active) */}
            {!mobileShowChat && (
              <div className="flex-1 bg-white flex flex-col">
                {/* Mobile title bar */}
                <div className="flex-shrink-0 bg-white border-b border-deep-green/5 px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <h1 className="font-rubik font-bold text-deep-green text-[22px]">
                        Messages
                      </h1>
                      {totalUnread > 0 && (
                        <span className="bg-gold text-deep-green text-[12px] font-bold min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center">
                          {totalUnread}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Search bar (visual only) */}
                  <div className="relative mb-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#274C46"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-30"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      className="w-full bg-off-white/60 border border-deep-green/8 rounded-xl pl-9 pr-4 py-2.5 text-[14px] text-deep-green placeholder-deep-green/30 outline-none focus:border-deep-green/15 transition-colors font-rubik"
                      readOnly
                    />
                  </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                  {loadingConvos ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-6 h-6 border-2 border-deep-green/20 border-t-deep-green rounded-full animate-spin" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="flex items-center justify-center px-8 py-20 text-center">
                      <div>
                        <div className="w-16 h-16 bg-deep-green/5 rounded-full flex items-center justify-center mx-auto mb-5">
                          <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#274C46"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-40"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </div>
                        <p className="text-deep-green/50 text-[15px] leading-relaxed mb-4">
                          No messages yet. Match with other pet owners to start
                          chatting!
                        </p>
                        <Link
                          href="/swipe"
                          className="inline-block bg-gold text-deep-green font-rubik font-semibold px-6 py-2.5 rounded-lg hover:bg-[#d99500] transition-colors text-[14px]"
                        >
                          Find matches
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {conversations.map((convo) => (
                        <MobileConversationItem
                          key={convo.id}
                          convo={convo}
                          onClick={() => handleSelectConversation(convo.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile: Chat View (shown when a conversation is selected) */}
            {mobileShowChat && activeConversation && (
              <MobileChatView
                key={activeConversation.id}
                conversation={activeConversation}
                userId={user.id}
                onBack={handleBack}
              />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
