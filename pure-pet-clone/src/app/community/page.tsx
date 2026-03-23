"use client";

import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Post {
  id: number;
  user_id: string;
  author_name: string;
  caption: string;
  image_url: string | null;
  breed_tag: string | null;
  city_tag: string | null;
  likes_count: number;
  comments_count: number;
  report_count: number;
  share_count: number;
  is_flagged: boolean;
  is_deleted: boolean;
  created_at: string;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  author_name: string;
  body: string;
  is_deleted: boolean;
  created_at: string;
}

interface PetProfile {
  display_name: string | null;
  breed: string | null;
  city: string | null;
  avatar_url: string | null;
  profile_photo_url: string | null;
}

type FeedTab = "all" | "following" | "trending";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function AvatarCircle({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-10 h-10 text-lg",
    lg: "w-12 h-12 text-xl",
  };

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={48}
        height={48}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        unoptimized
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-deep-green/10 flex items-center justify-center text-deep-green font-rubik font-bold flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function HeartIcon({ filled = false, size = 22 }: { filled?: boolean; size?: number }) {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function CommentIcon({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function ShareIcon({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function ImageIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function FlagIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function CloseIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CommunityIcon({ size = 26 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#274C46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function ChatBubbleIcon({ size = 28 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#274C46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// PostCreator
// ---------------------------------------------------------------------------

function PostCreator({
  userId,
  petProfile,
  isAdmin,
  onPostCreated,
  variant = "inline",
  onClose,
}: {
  userId: string;
  petProfile: PetProfile | null;
  isAdmin: boolean;
  onPostCreated: (post: Post) => void;
  variant?: "inline" | "modal";
  onClose?: () => void;
}) {
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authorName = petProfile?.display_name || "Anonymous";
  const avatarUrl = petProfile?.avatar_url || petProfile?.profile_photo_url || null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }

    setImageFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!caption.trim() && !imageFile) return;

    setSubmitting(true);
    setError(null);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Image upload failed");
        }

        const data = await res.json();
        imageUrl = data.url;
      }

      const { data: newPost, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          author_name: authorName,
          caption: caption.trim(),
          image_url: imageUrl,
          breed_tag: petProfile?.breed || null,
          city_tag: petProfile?.city || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setCaption("");
      clearImage();
      onPostCreated(newPost as Post);
      if (onClose) onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    (caption.trim().length > 0 || imageFile !== null) && !submitting;

  const isModal = variant === "modal";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isModal
          ? "flex flex-col h-full"
          : "bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8"
      }
    >
      {/* Modal header */}
      {isModal && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 p-1"
          >
            <CloseIcon size={22} />
          </button>
          <h2 className="font-rubik font-bold text-deep-green text-[17px]">New Post</h2>
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-gold hover:bg-[#d99500] disabled:bg-gray-200 disabled:text-gray-400 text-deep-green font-rubik font-semibold px-5 py-2 rounded-full text-sm transition-all"
          >
            {submitting ? <Spinner /> : "Post"}
          </button>
        </div>
      )}

      <div className={isModal ? "flex-1 overflow-y-auto px-4 pt-4 pb-4" : ""}>
        <div className="flex items-center gap-3 mb-4">
          <AvatarCircle name={authorName} avatarUrl={avatarUrl} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-rubik font-semibold text-deep-green text-[15px]">
                {authorName}
              </p>
              {isAdmin && (
                <span className="inline-block bg-gold/30 text-deep-green text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Admin
                </span>
              )}
            </div>
            {petProfile?.breed && (
              <p className="text-xs text-gray-500">{petProfile.breed}</p>
            )}
          </div>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 500))}
          placeholder="Share something about your pet..."
          rows={isModal ? 5 : 3}
          className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green/40 transition-all"
        />

        <div className="flex items-center justify-between mt-2 mb-3">
          <span
            className={`text-xs ${
              caption.length >= 480
                ? "text-red-500 font-medium"
                : "text-gray-400"
            }`}
          >
            {caption.length}/500
          </span>
        </div>

        {imagePreview && (
          <div className="relative mb-4 rounded-xl overflow-hidden">
            <Image
              src={imagePreview}
              alt="Upload preview"
              width={600}
              height={400}
              className="w-full h-auto rounded-xl"
              unoptimized
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg transition-colors"
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>

      {/* Bottom action bar */}
      <div
        className={
          isModal
            ? "flex items-center justify-between px-4 py-3 border-t border-gray-100"
            : "flex items-center justify-between"
        }
      >
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            id={isModal ? "post-image-upload-modal" : "post-image-upload"}
          />
          <label
            htmlFor={isModal ? "post-image-upload-modal" : "post-image-upload"}
            className="inline-flex items-center gap-2 cursor-pointer text-deep-green hover:text-deep-green/80 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-deep-green/5"
          >
            <ImageIcon size={20} />
            Add photo
          </label>
        </div>

        {!isModal && (
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-gold hover:bg-[#d99500] disabled:bg-gray-200 disabled:text-gray-400 text-deep-green font-rubik font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Posting...
              </span>
            ) : (
              "Post"
            )}
          </button>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// CommentThread
// ---------------------------------------------------------------------------

function CommentThread({
  postId,
  commentsCount,
  userId,
  onCommentAdded,
}: {
  postId: number;
  commentsCount: number;
  userId: string | null;
  onCommentAdded: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchComments() {
      setLoading(true);
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        if (!error && data) setComments(data as Comment[]);
        setLoading(false);
      }
    }

    fetchComments();
    return () => {
      cancelled = true;
    };
  }, [postId, commentsCount]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() || !userId) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data: profile } = await supabase
        .from("pet_profiles")
        .select("display_name")
        .eq("user_id", userId)
        .single();

      const authorName = profile?.display_name || "Anonymous";

      const { data: newComment, error: insertError } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: userId,
          author_name: authorName,
          body: body.trim(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await supabase.rpc("increment_field", {
        row_id: postId,
        table_name: "posts",
        field_name: "comments_count",
        increment_by: 1,
      }).then(({ error: rpcError }) => {
        if (rpcError) {
          return supabase
            .from("posts")
            .update({ comments_count: commentsCount + 1 })
            .eq("id", postId);
        }
      });

      setComments((prev) => [...prev, newComment as Comment]);
      setBody("");
      onCommentAdded();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add comment";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const visibleComments = showAll ? comments : comments.slice(0, 3);
  const hasHidden = comments.length > 3 && !showAll;

  return (
    <div className="border-t border-gray-100 mt-3 pt-3 px-4 pb-4">
      {loading ? (
        <div className="flex items-center gap-2 py-4 justify-center text-gray-400 text-sm">
          <Spinner />
          Loading comments...
        </div>
      ) : (
        <>
          {comments.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-3">
              No comments yet. Be the first!
            </p>
          )}

          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {visibleComments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                <AvatarCircle name={comment.author_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-deep-green text-[13px]">
                      {comment.author_name}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-[13px] leading-relaxed break-words">
                    {comment.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {hasHidden && (
            <button
              onClick={() => setShowAll(true)}
              className="text-deep-green text-[13px] font-medium mt-2 hover:underline"
            >
              View all {comments.length} comments
            </button>
          )}
        </>
      )}

      {userId ? (
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment..."
            maxLength={500}
            className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green/30 transition-all"
          />
          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="bg-deep-green hover:bg-deep-green/90 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium px-4 py-2 rounded-lg text-[13px] transition-all flex-shrink-0"
          >
            {submitting ? "..." : "Reply"}
          </button>
        </form>
      ) : (
        <p className="text-center text-gray-400 text-xs mt-3 py-2">
          <Link href="/auth/login" className="text-deep-green underline">
            Log in
          </Link>{" "}
          to comment
        </p>
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop PostCard (masonry pin)
// ---------------------------------------------------------------------------

function DesktopPostCard({
  post,
  userId,
  isAdmin,
  isLiked,
  isFollowing,
  onLikeToggle,
  onFollowToggle,
  onDelete,
}: {
  post: Post;
  userId: string | null;
  isAdmin: boolean;
  isLiked: boolean;
  isFollowing: boolean;
  onLikeToggle: (postId: number, currentlyLiked: boolean) => void;
  onFollowToggle: (targetUserId: string, currentlyFollowing: boolean) => void;
  onDelete: (postId: number) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(
    post.comments_count
  );
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [loginTooltip, setLoginTooltip] = useState<string | null>(null);
  const loginTooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuthor = userId === post.user_id;
  const canDelete = isAuthor || isAdmin;
  const showFollowButton = userId && !isAuthor;

  function flashLoginTooltip(action: string) {
    setLoginTooltip(`Log in to ${action}`);
    if (loginTooltipTimer.current) clearTimeout(loginTooltipTimer.current);
    loginTooltipTimer.current = setTimeout(() => setLoginTooltip(null), 2000);
  }

  async function handleReport() {
    if (!userId || isAuthor || reported) return;
    setReporting(true);

    try {
      const { error: rpcError } = await supabase.rpc("increment_field", {
        row_id: post.id,
        table_name: "posts",
        field_name: "report_count",
        increment_by: 1,
      });

      if (rpcError) {
        const { data: current } = await supabase
          .from("posts")
          .select("report_count")
          .eq("id", post.id)
          .single();

        const newCount = (current?.report_count || 0) + 1;

        await supabase
          .from("posts")
          .update({
            report_count: newCount,
            is_flagged: newCount >= 3,
          })
          .eq("id", post.id);
      }

      setReported(true);
    } catch {
      // Report is best-effort
    } finally {
      setReporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ is_deleted: true })
        .eq("id", post.id);

      if (error) throw error;
      onDelete(post.id);
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/community?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);

      await supabase.rpc("increment_field", {
        row_id: post.id,
        table_name: "posts",
        field_name: "share_count",
        increment_by: 1,
      }).then(({ error: rpcError }) => {
        if (rpcError) {
          return supabase
            .from("posts")
            .update({ share_count: (post.share_count || 0) + 1 })
            .eq("id", post.id);
        }
      });
    } catch {
      // Clipboard fallback - silently fail
    }
  }

  const captionNeedsClamp =
    post.caption && post.caption.length > 150 && !captionExpanded;

  return (
    <article className="break-inside-avoid mb-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
      {/* Image */}
      {post.image_url && (
        <Image
          src={post.image_url}
          alt={`Photo by ${post.author_name}`}
          width={600}
          height={600}
          className="w-full h-auto"
          unoptimized
        />
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-3 pb-1">
          <p
            className={`text-gray-800 text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
              captionNeedsClamp ? "line-clamp-3" : ""
            }`}
          >
            {post.caption}
          </p>
          {captionNeedsClamp && (
            <button
              onClick={() => setCaptionExpanded(true)}
              className="text-deep-green text-[13px] font-medium mt-0.5 hover:underline"
            >
              more
            </button>
          )}
        </div>
      )}

      {/* Author row */}
      <div className="px-4 pt-2 pb-2 flex items-center gap-2">
        <AvatarCircle name={post.author_name} size="sm" />
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="font-rubik font-semibold text-deep-green text-[13px] truncate">
            {post.author_name}
          </span>
          {post.breed_tag && (
            <span className="inline-block bg-deep-green/10 text-deep-green text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
              {post.breed_tag}
            </span>
          )}
          {post.city_tag && (
            <span className="inline-block bg-gold/20 text-deep-green text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
              {post.city_tag}
            </span>
          )}
        </div>
        {showFollowButton && (
          <button
            onClick={() => onFollowToggle(post.user_id, isFollowing)}
            className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all flex-shrink-0 ${
              isFollowing
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-deep-green text-white hover:bg-deep-green/90"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
        {!userId && (
          <button
            onClick={() => flashLoginTooltip("follow")}
            className="text-[11px] font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-500 flex-shrink-0"
          >
            Follow
          </button>
        )}
      </div>

      {/* Time + admin actions */}
      <div className="px-4 pb-1 flex items-center justify-between">
        <span className="text-gray-400 text-[11px]">
          {timeAgo(post.created_at)}
        </span>
        <div className="flex items-center gap-1">
          {canDelete && (
            <div className="relative">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-500 hover:bg-red-50 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                  >
                    {deleting ? "..." : "Confirm"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-gray-400 hover:bg-gray-50 text-xs px-2 py-1 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                  aria-label="Delete post"
                  title={isAdmin && !isAuthor ? "Delete (Admin)" : "Delete post"}
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          )}
          {!isAuthor && userId && (
            <button
              onClick={handleReport}
              disabled={reporting || reported}
              className={`p-1.5 rounded-lg transition-colors text-xs ${
                reported
                  ? "text-orange-400 cursor-default"
                  : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
              }`}
              aria-label="Report post"
              title={reported ? "Reported" : "Report post"}
            >
              {reported ? (
                <span className="text-[10px] font-medium">Reported</span>
              ) : (
                <FlagIcon />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Login tooltip */}
      {loginTooltip && (
        <div className="px-4 pb-2">
          <p className="text-[11px] text-gold bg-gold/10 rounded-lg px-3 py-1.5 text-center font-medium">
            {loginTooltip} &mdash;{" "}
            <Link href="/auth/login" className="underline text-deep-green">
              Log in
            </Link>
          </p>
        </div>
      )}

      {/* Action bar */}
      <div className="px-4 pb-3 flex items-center gap-3 relative">
        {/* Like */}
        <button
          onClick={() => {
            if (!userId) {
              flashLoginTooltip("like");
              return;
            }
            onLikeToggle(post.id, isLiked);
          }}
          className={`flex items-center gap-1 text-[13px] font-medium transition-all py-1.5 px-2 -ml-2 rounded-lg ${
            isLiked
              ? "text-red-500 hover:bg-red-50"
              : "text-gray-500 hover:text-red-500 hover:bg-red-50"
          }`}
        >
          <HeartIcon filled={isLiked} size={18} />
          <span>{post.likes_count}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => {
            if (!userId) {
              flashLoginTooltip("comment");
              return;
            }
            setShowComments(!showComments);
          }}
          className={`flex items-center gap-1 text-[13px] font-medium transition-all py-1.5 px-2 rounded-lg ${
            showComments
              ? "text-deep-green bg-deep-green/5"
              : "text-gray-500 hover:text-deep-green hover:bg-deep-green/5"
          }`}
        >
          <CommentIcon size={18} />
          <span>{localCommentsCount}</span>
        </button>

        {/* Share */}
        <div className="relative">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-deep-green hover:bg-deep-green/5 py-1.5 px-2 rounded-lg transition-all"
          >
            <ShareIcon size={18} />
          </button>
          {showCopied && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-deep-green text-white text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg">
              Copied!
            </span>
          )}
        </div>
      </div>

      {/* Comment thread */}
      {showComments && (
        <CommentThread
          postId={post.id}
          commentsCount={localCommentsCount}
          userId={userId}
          onCommentAdded={() =>
            setLocalCommentsCount((prev) => prev + 1)
          }
        />
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Mobile PostCard (Instagram-style)
// ---------------------------------------------------------------------------

function MobilePostCard({
  post,
  userId,
  isAdmin,
  isLiked,
  isFollowing,
  onLikeToggle,
  onFollowToggle,
  onDelete,
}: {
  post: Post;
  userId: string | null;
  isAdmin: boolean;
  isLiked: boolean;
  isFollowing: boolean;
  onLikeToggle: (postId: number, currentlyLiked: boolean) => void;
  onFollowToggle: (targetUserId: string, currentlyFollowing: boolean) => void;
  onDelete: (postId: number) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(
    post.comments_count
  );
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [loginTooltip, setLoginTooltip] = useState<string | null>(null);
  const loginTooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuthor = userId === post.user_id;
  const canDelete = isAuthor || isAdmin;
  const showFollowButton = userId && !isAuthor;

  function flashLoginTooltip(action: string) {
    setLoginTooltip(`Log in to ${action}`);
    if (loginTooltipTimer.current) clearTimeout(loginTooltipTimer.current);
    loginTooltipTimer.current = setTimeout(() => setLoginTooltip(null), 2000);
  }

  async function handleReport() {
    if (!userId || isAuthor || reported) return;
    setReporting(true);

    try {
      const { error: rpcError } = await supabase.rpc("increment_field", {
        row_id: post.id,
        table_name: "posts",
        field_name: "report_count",
        increment_by: 1,
      });

      if (rpcError) {
        const { data: current } = await supabase
          .from("posts")
          .select("report_count")
          .eq("id", post.id)
          .single();

        const newCount = (current?.report_count || 0) + 1;

        await supabase
          .from("posts")
          .update({
            report_count: newCount,
            is_flagged: newCount >= 3,
          })
          .eq("id", post.id);
      }

      setReported(true);
    } catch {
      // Report is best-effort
    } finally {
      setReporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ is_deleted: true })
        .eq("id", post.id);

      if (error) throw error;
      onDelete(post.id);
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/community?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);

      await supabase.rpc("increment_field", {
        row_id: post.id,
        table_name: "posts",
        field_name: "share_count",
        increment_by: 1,
      }).then(({ error: rpcError }) => {
        if (rpcError) {
          return supabase
            .from("posts")
            .update({ share_count: (post.share_count || 0) + 1 })
            .eq("id", post.id);
        }
      });
    } catch {
      // Clipboard fallback - silently fail
    }
  }

  const captionNeedsClamp =
    post.caption && post.caption.length > 150 && !captionExpanded;

  return (
    <article className="bg-white border-b border-gray-100">
      {/* Author row ABOVE image */}
      <div className="flex items-center gap-3 px-4 py-3">
        <AvatarCircle name={post.author_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-rubik font-semibold text-deep-green text-[14px] truncate">
              {post.author_name}
            </span>
            {post.breed_tag && (
              <span className="inline-block bg-deep-green/10 text-deep-green text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                {post.breed_tag}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {post.city_tag && (
              <span className="text-gray-400 text-[12px]">{post.city_tag}</span>
            )}
            <span className="text-gray-300 text-[11px]">{timeAgo(post.created_at)}</span>
          </div>
        </div>

        {/* Follow button */}
        {showFollowButton && (
          <button
            onClick={() => onFollowToggle(post.user_id, isFollowing)}
            className={`text-[12px] font-semibold px-4 py-1.5 rounded-full transition-all flex-shrink-0 ${
              isFollowing
                ? "bg-gray-100 text-gray-600"
                : "bg-deep-green text-white"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
        {!userId && (
          <button
            onClick={() => flashLoginTooltip("follow")}
            className="text-[12px] font-semibold px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0"
          >
            Follow
          </button>
        )}

        {/* More actions (delete / report) */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {canDelete && (
            <div className="relative">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-500 text-[11px] font-medium px-2 py-1 rounded-lg"
                  >
                    {deleting ? "..." : "Delete"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-gray-400 text-[11px] px-1 py-1 rounded-lg"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                  aria-label="Delete post"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          )}
          {!isAuthor && userId && (
            <button
              onClick={handleReport}
              disabled={reporting || reported}
              className={`p-1.5 rounded-lg transition-colors ${
                reported
                  ? "text-orange-400"
                  : "text-gray-400 hover:text-orange-500"
              }`}
              aria-label="Report post"
            >
              {reported ? (
                <span className="text-[10px] font-medium">!</span>
              ) : (
                <FlagIcon />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Image - full width, edge-to-edge */}
      {post.image_url && (
        <Image
          src={post.image_url}
          alt={`Photo by ${post.author_name}`}
          width={800}
          height={800}
          className="w-full h-auto"
          unoptimized
        />
      )}

      {/* Login tooltip */}
      {loginTooltip && (
        <div className="px-4 pt-2">
          <p className="text-[12px] text-gold bg-gold/10 rounded-lg px-3 py-2 text-center font-medium">
            {loginTooltip} &mdash;{" "}
            <Link href="/auth/login" className="underline text-deep-green">
              Log in
            </Link>
          </p>
        </div>
      )}

      {/* Action bar below image */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Like */}
        <button
          onClick={() => {
            if (!userId) {
              flashLoginTooltip("like");
              return;
            }
            onLikeToggle(post.id, isLiked);
          }}
          className={`flex items-center gap-1.5 transition-all ${
            isLiked ? "text-red-500" : "text-gray-700"
          }`}
        >
          <HeartIcon filled={isLiked} size={24} />
          <span className="text-[14px] font-semibold">{post.likes_count}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => {
            if (!userId) {
              flashLoginTooltip("comment");
              return;
            }
            setShowComments(!showComments);
          }}
          className={`flex items-center gap-1.5 transition-all ${
            showComments ? "text-deep-green" : "text-gray-700"
          }`}
        >
          <CommentIcon size={24} />
          <span className="text-[14px] font-semibold">{localCommentsCount}</span>
        </button>

        {/* Share */}
        <div className="relative">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-gray-700 transition-all"
          >
            <ShareIcon size={24} />
          </button>
          {showCopied && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-deep-green text-white text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg z-10">
              Copied!
            </span>
          )}
        </div>
      </div>

      {/* Caption below actions */}
      {post.caption && (
        <div className="px-4 pb-2">
          <p
            className={`text-gray-800 text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
              captionNeedsClamp ? "line-clamp-2" : ""
            }`}
          >
            <span className="font-semibold text-deep-green mr-1.5">{post.author_name}</span>
            {post.caption}
          </p>
          {captionNeedsClamp && (
            <button
              onClick={() => setCaptionExpanded(true)}
              className="text-gray-400 text-[13px] mt-0.5"
            >
              more
            </button>
          )}
        </div>
      )}

      {/* Comment count link */}
      {localCommentsCount > 0 && !showComments && (
        <button
          onClick={() => {
            if (!userId) {
              flashLoginTooltip("comment");
              return;
            }
            setShowComments(true);
          }}
          className="px-4 pb-3 block"
        >
          <span className="text-gray-400 text-[13px]">
            View all {localCommentsCount} comment{localCommentsCount !== 1 ? "s" : ""}
          </span>
        </button>
      )}

      {/* Comment thread */}
      {showComments && (
        <CommentThread
          postId={post.id}
          commentsCount={localCommentsCount}
          userId={userId}
          onCommentAdded={() =>
            setLocalCommentsCount((prev) => prev + 1)
          }
        />
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// FeedTabs - Desktop (border-bottom style)
// ---------------------------------------------------------------------------

function DesktopFeedTabs({
  activeTab,
  onTabChange,
  isLoggedIn,
}: {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  isLoggedIn: boolean;
}) {
  const tabs: { key: FeedTab; label: string }[] = [
    { key: "all", label: "All Posts" },
    { key: "following", label: "Following" },
    { key: "trending", label: "Trending" },
  ];

  return (
    <div className="flex items-center gap-1 mb-8 border-b border-gray-200">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const isDisabled = tab.key === "following" && !isLoggedIn;

        return (
          <button
            key={tab.key}
            onClick={() => {
              if (!isDisabled) onTabChange(tab.key);
            }}
            disabled={isDisabled}
            className={`relative px-6 py-3.5 text-sm font-rubik font-semibold transition-colors ${
              isActive
                ? "text-deep-green"
                : isDisabled
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:text-deep-green"
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gold rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeedTabs - Mobile (horizontal scrollable pills)
// ---------------------------------------------------------------------------

function MobileFeedTabs({
  activeTab,
  onTabChange,
  isLoggedIn,
}: {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  isLoggedIn: boolean;
}) {
  const tabs: { key: FeedTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "following", label: "Following" },
    { key: "trending", label: "Trending" },
  ];

  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-gray-100" style={{ scrollbarWidth: "none" }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const isDisabled = tab.key === "following" && !isLoggedIn;

        return (
          <button
            key={tab.key}
            onClick={() => {
              if (!isDisabled) onTabChange(tab.key);
            }}
            disabled={isDisabled}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-[13px] font-rubik font-semibold transition-all flex-shrink-0 ${
              isActive
                ? "bg-deep-green text-white shadow-sm"
                : isDisabled
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GuestBanner - Desktop
// ---------------------------------------------------------------------------

function DesktopGuestBanner() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-10 text-center max-w-[640px] mx-auto">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
        <CommunityIcon />
      </div>
      <h2 className="font-rubik font-bold text-deep-green text-xl mb-2">
        Join the community!
      </h2>
      <p className="text-gray-600 text-[15px] mb-5 max-w-md mx-auto leading-relaxed">
        Sign up to post, like, and comment. Connect with pet parents everywhere.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/auth/signup"
          className="bg-gold hover:bg-[#d99500] text-deep-green font-rubik font-semibold px-7 py-3 rounded-xl text-sm transition-colors"
        >
          Sign up
        </Link>
        <Link
          href="/auth/login"
          className="bg-white hover:bg-gray-50 border border-gray-200 text-deep-green font-rubik font-semibold px-7 py-3 rounded-xl text-sm transition-colors"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GuestBanner - Mobile
// ---------------------------------------------------------------------------

function MobileGuestBanner() {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold/20 flex items-center justify-center">
        <CommunityIcon size={22} />
      </div>
      <h2 className="font-rubik font-bold text-deep-green text-lg mb-1">
        Join the community!
      </h2>
      <p className="text-gray-500 text-[14px] mb-4 max-w-sm mx-auto">
        Sign up to post, like, and comment.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/auth/signup"
          className="bg-gold hover:bg-[#d99500] text-deep-green font-rubik font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
        >
          Sign up
        </Link>
        <Link
          href="/auth/login"
          className="bg-white hover:bg-gray-50 border border-gray-200 text-deep-green font-rubik font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile PostCreator Modal / Bottom Sheet
// ---------------------------------------------------------------------------

function PostCreatorSheet({
  open,
  onClose,
  userId,
  petProfile,
  isAdmin,
  onPostCreated,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  petProfile: PetProfile | null;
  isAdmin: boolean;
  onPostCreated: (post: Post) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative mt-auto bg-white rounded-t-2xl max-h-[90vh] flex flex-col animate-slide-up">
        <PostCreator
          userId={userId}
          petProfile={petProfile}
          isAdmin={isAdmin}
          onPostCreated={onPostCreated}
          variant="modal"
          onClose={onClose}
        />
      </div>
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton - Desktop
// ---------------------------------------------------------------------------

function DesktopSkeleton() {
  return (
    <div className="columns-2 xl:columns-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="break-inside-avoid mb-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
        >
          {i % 2 === 0 && <div className="w-full h-48 bg-gray-200" />}
          <div className="p-4">
            <div className="w-full h-3 bg-gray-100 rounded mb-2" />
            <div className="w-3/4 h-3 bg-gray-100 rounded mb-4" />
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-200" />
              <div className="w-20 h-3 bg-gray-200 rounded" />
            </div>
            <div className="flex gap-4 pt-3 mt-3 border-t border-gray-100">
              <div className="w-12 h-5 bg-gray-100 rounded" />
              <div className="w-12 h-5 bg-gray-100 rounded" />
              <div className="w-8 h-5 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton - Mobile
// ---------------------------------------------------------------------------

function MobileSkeleton() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white border-b border-gray-100 animate-pulse"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="w-24 h-3 bg-gray-200 rounded mb-1.5" />
              <div className="w-16 h-2.5 bg-gray-100 rounded" />
            </div>
            <div className="w-16 h-7 bg-gray-100 rounded-full" />
          </div>
          <div className="w-full h-64 bg-gray-200" />
          <div className="px-4 py-3 flex gap-4">
            <div className="w-12 h-5 bg-gray-100 rounded" />
            <div className="w-12 h-5 bg-gray-100 rounded" />
            <div className="w-8 h-5 bg-gray-100 rounded" />
          </div>
          <div className="px-4 pb-3">
            <div className="w-3/4 h-3 bg-gray-100 rounded mb-2" />
            <div className="w-1/2 h-3 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState({ activeTab }: { activeTab: FeedTab }) {
  return (
    <div className="px-4 py-16 text-center lg:bg-white lg:rounded-xl lg:shadow-sm lg:border lg:border-gray-100 lg:p-12">
      <div className="w-14 h-14 lg:w-16 lg:h-16 mx-auto mb-4 rounded-full bg-deep-green/5 flex items-center justify-center">
        <ChatBubbleIcon size={28} />
      </div>
      <h3 className="font-rubik font-semibold text-deep-green text-base lg:text-lg mb-1">
        {activeTab === "following"
          ? "No posts from people you follow"
          : activeTab === "trending"
          ? "No trending posts this week"
          : "No posts yet"}
      </h3>
      <p className="text-gray-500 text-sm">
        {activeTab === "following"
          ? "Follow some pet parents to see their posts here!"
          : "Be the first to share something with the community!"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeedPage (main export)
// ---------------------------------------------------------------------------

export default function FeedPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  // Track highlighted post from URL
  const highlightPostId = searchParams.get("post")
    ? Number(searchParams.get("post"))
    : null;

  // -----------------------------------------------------------------------
  // Fetch pet profile
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setPetProfile(null);
      return;
    }

    async function fetchProfile() {
      const { data } = await supabase
        .from("pet_profiles")
        .select("display_name, breed, city, avatar_url, profile_photo_url")
        .eq("user_id", user!.id)
        .single();

      if (data) setPetProfile(data as PetProfile);
    }

    fetchProfile();
  }, [user]);

  // -----------------------------------------------------------------------
  // Fetch liked post IDs
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setLikedPostIds(new Set());
      return;
    }

    async function fetchLikes() {
      const { data } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user!.id);

      if (data) {
        setLikedPostIds(new Set(data.map((row) => row.post_id)));
      }
    }

    fetchLikes();
  }, [user]);

  // -----------------------------------------------------------------------
  // Fetch following IDs
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setFollowingIds(new Set());
      return;
    }

    async function fetchFollowing() {
      const { data } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user!.id);

      if (data) {
        setFollowingIds(new Set(data.map((row) => row.following_id)));
      }
    }

    fetchFollowing();
  }, [user]);

  // -----------------------------------------------------------------------
  // Fetch posts
  // -----------------------------------------------------------------------
  const fetchPosts = useCallback(
    async (offset: number = 0) => {
      const isInitial = offset === 0;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      try {
        let data: Post[] | null = null;
        let fetchError: { message: string } | null = null;

        if (activeTab === "all") {
          const result = await supabase
            .from("posts")
            .select("*")
            .eq("is_deleted", false)
            .eq("is_flagged", false)
            .order("created_at", { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

          data = result.data as Post[] | null;
          fetchError = result.error;
        } else if (activeTab === "following" && user) {
          // Get following IDs then fetch their posts
          const { data: followData } = await supabase
            .from("user_follows")
            .select("following_id")
            .eq("follower_id", user.id);

          const followedUserIds = (followData || []).map(
            (r) => r.following_id
          );

          if (followedUserIds.length === 0) {
            data = [];
          } else {
            const result = await supabase
              .from("posts")
              .select("*")
              .eq("is_deleted", false)
              .eq("is_flagged", false)
              .in("user_id", followedUserIds)
              .order("created_at", { ascending: false })
              .range(offset, offset + PAGE_SIZE - 1);

            data = result.data as Post[] | null;
            fetchError = result.error;
          }
        } else if (activeTab === "trending") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const result = await supabase
            .from("posts")
            .select("*")
            .eq("is_deleted", false)
            .eq("is_flagged", false)
            .gte("created_at", sevenDaysAgo.toISOString())
            .order("likes_count", { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

          data = result.data as Post[] | null;
          fetchError = result.error;
        }

        if (fetchError) throw new Error(fetchError.message);

        const fetched = (data || []) as Post[];

        if (isInitial) {
          setPosts(fetched);
        } else {
          setPosts((prev) => [...prev, ...fetched]);
        }

        setHasMore(fetched.length === PAGE_SIZE);
        setError(null);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load posts";
        setError(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, user]
  );

  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  // -----------------------------------------------------------------------
  // Like / unlike handler
  // -----------------------------------------------------------------------
  async function handleLikeToggle(postId: number, currentlyLiked: boolean) {
    if (!user) return;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes_count: currentlyLiked
                ? Math.max(0, p.likes_count - 1)
                : p.likes_count + 1,
            }
          : p
      )
    );

    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (currentlyLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });

    try {
      if (currentlyLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        const { error: rpcError } = await supabase.rpc("increment_field", {
          row_id: postId,
          table_name: "posts",
          field_name: "likes_count",
          increment_by: -1,
        });

        if (rpcError) {
          const post = posts.find((p) => p.id === postId);
          const newCount = Math.max(0, (post?.likes_count || 1) - 1);
          await supabase
            .from("posts")
            .update({ likes_count: newCount })
            .eq("id", postId);
        }
      } else {
        await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });

        const { error: rpcError } = await supabase.rpc("increment_field", {
          row_id: postId,
          table_name: "posts",
          field_name: "likes_count",
          increment_by: 1,
        });

        if (rpcError) {
          const post = posts.find((p) => p.id === postId);
          const newCount = (post?.likes_count || 0) + 1;
          await supabase
            .from("posts")
            .update({ likes_count: newCount })
            .eq("id", postId);
        }
      }
    } catch {
      // Revert optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count: currentlyLiked
                  ? p.likes_count + 1
                  : Math.max(0, p.likes_count - 1),
              }
            : p
        )
      );

      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (currentlyLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
    }
  }

  // -----------------------------------------------------------------------
  // Follow / unfollow handler
  // -----------------------------------------------------------------------
  async function handleFollowToggle(
    targetUserId: string,
    currentlyFollowing: boolean
  ) {
    if (!user) return;

    // Optimistic update
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (currentlyFollowing) next.delete(targetUserId);
      else next.add(targetUserId);
      return next;
    });

    try {
      if (currentlyFollowing) {
        await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
      } else {
        await supabase
          .from("user_follows")
          .insert({ follower_id: user.id, following_id: targetUserId });
      }
    } catch {
      // Revert optimistic update
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (currentlyFollowing) next.add(targetUserId);
        else next.delete(targetUserId);
        return next;
      });
    }
  }

  // -----------------------------------------------------------------------
  // Delete handler
  // -----------------------------------------------------------------------
  function handleDelete(postId: number) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  // -----------------------------------------------------------------------
  // New post handler
  // -----------------------------------------------------------------------
  function handlePostCreated(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  // -----------------------------------------------------------------------
  // Tab change
  // -----------------------------------------------------------------------
  function handleTabChange(tab: FeedTab) {
    setActiveTab(tab);
    setPosts([]);
    setHasMore(true);
  }

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------
  const showSkeleton = authLoading || loading;

  // Suppress unused var lint (highlightPostId is available for future scroll-to-post)
  void highlightPostId;

  // =======================================================================
  // UNIFIED LAYOUT (Header + Footer on all screen sizes)
  // =======================================================================
  return (
    <>
      <Header />
      <main className="bg-off-white min-h-screen pt-[140px] pb-24 font-rubik">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-12">
          {/* Title section */}
          <div className="text-center mb-8 lg:mb-14">
            <h1 className="font-rubik font-bold text-deep-green text-3xl lg:text-4xl xl:text-5xl mb-3 lg:mb-4">
              Community
            </h1>
            <p className="text-deep-green/60 text-[15px] lg:text-[17px] max-w-lg mx-auto leading-relaxed">
              Share moments, connect with fellow pet parents, and celebrate your
              furry friends.
            </p>
          </div>

          {/* Auth banner for guests */}
          {!authLoading && !user && (
            <>
              <div className="hidden lg:block">
                <DesktopGuestBanner />
              </div>
              <div className="lg:hidden">
                <MobileGuestBanner />
              </div>
            </>
          )}

          {/* Post creator (logged-in only) */}
          {!authLoading && user && (
            <>
              {/* Desktop: inline post creator */}
              <div className="hidden lg:block max-w-[640px] mx-auto">
                <PostCreator
                  userId={user.id}
                  petProfile={petProfile}
                  isAdmin={isAdmin}
                  onPostCreated={handlePostCreated}
                />
              </div>
              {/* Mobile: button to open post creator sheet */}
              <div className="lg:hidden px-4 py-3">
                <button
                  onClick={() => setShowCreateSheet(true)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 text-left shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <AvatarCircle
                    name={petProfile?.display_name || "Anonymous"}
                    avatarUrl={petProfile?.avatar_url || petProfile?.profile_photo_url || null}
                    size="sm"
                  />
                  <span className="text-gray-400 text-[14px]">Share something about your pet...</span>
                </button>
              </div>
            </>
          )}

          {/* Feed Tabs - desktop style on lg+, mobile pill style below */}
          <div className="hidden lg:block">
            <DesktopFeedTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isLoggedIn={!!user}
            />
          </div>
          <div className="lg:hidden">
            <MobileFeedTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isLoggedIn={!!user}
            />
          </div>

          {/* Loading skeleton */}
          {showSkeleton && (
            <>
              <div className="hidden lg:block">
                <DesktopSkeleton />
              </div>
              <div className="lg:hidden">
                <MobileSkeleton />
              </div>
            </>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-center mb-6">
              <p className="text-red-600 text-sm mb-3">{error}</p>
              <button
                onClick={() => fetchPosts(0)}
                className="text-red-600 underline text-sm font-medium hover:text-red-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Posts feed - responsive masonry layout */}
          {!loading && !error && (
            <>
              {posts.length === 0 ? (
                <EmptyState activeTab={activeTab} />
              ) : (
                <>
                  {/* Desktop: masonry with DesktopPostCard */}
                  <div className="hidden lg:block columns-2 xl:columns-3 gap-6">
                    {posts.map((post) => (
                      <DesktopPostCard
                        key={post.id}
                        post={post}
                        userId={user?.id || null}
                        isAdmin={isAdmin}
                        isLiked={likedPostIds.has(post.id)}
                        isFollowing={followingIds.has(post.user_id)}
                        onLikeToggle={handleLikeToggle}
                        onFollowToggle={handleFollowToggle}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                  {/* Mobile: single-column feed with MobilePostCard */}
                  <div className="lg:hidden">
                    {posts.map((post) => (
                      <MobilePostCard
                        key={post.id}
                        post={post}
                        userId={user?.id || null}
                        isAdmin={isAdmin}
                        isLiked={likedPostIds.has(post.id)}
                        isFollowing={followingIds.has(post.user_id)}
                        onLikeToggle={handleLikeToggle}
                        onFollowToggle={handleFollowToggle}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Load more */}
              {hasMore && posts.length > 0 && (
                <div className="text-center mt-6 lg:mt-10">
                  <button
                    onClick={() => fetchPosts(posts.length)}
                    disabled={loadingMore}
                    className="bg-white hover:bg-gray-50 border border-gray-200 text-deep-green font-rubik font-semibold px-8 lg:px-10 py-3 lg:py-3.5 rounded-full lg:rounded-xl text-sm transition-all shadow-sm disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2 justify-center">
                        <Spinner />
                        Loading...
                      </span>
                    ) : (
                      "Load more posts"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Post creator sheet for mobile */}
      {user && (
        <PostCreatorSheet
          open={showCreateSheet}
          onClose={() => setShowCreateSheet(false)}
          userId={user.id}
          petProfile={petProfile}
          isAdmin={isAdmin}
          onPostCreated={handlePostCreated}
        />
      )}

      <Footer />
    </>
  );
}
