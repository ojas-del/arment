"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PetCandidate {
  id: number;
  user_id: string;
  pet_name: string;
  breed: string | null;
  pet_type: string | null;
  city: string | null;
  city_normalized: string | null;
  breed_normalized: string | null;
  display_name: string | null;
  avatar_url: string | null;
  profile_photo_url: string | null;
  dog_age_years: number | null;
  weight_kg: number | null;
  gender: string | null;
  temperament: string | null;
  activity_level: string | null;
  favorite_activity: string | null;
  walk_preference: string | null;
  gets_along_with_dogs: boolean | null;
  looking_for_mate: boolean | null;
  owner_name?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BATCH_SIZE = 10;
const PRELOAD_THRESHOLD = 3;
const SWIPE_THRESHOLD = 120;

const TEMPERAMENT_ICONS: Record<string, string> = {
  playful: "🎾",
  calm: "😌",
  friendly: "🤗",
  shy: "🙈",
  energetic: "⚡",
  gentle: "🕊️",
  protective: "🛡️",
  independent: "🐺",
  affectionate: "💕",
  curious: "🔍",
};

const ACTIVITY_ICONS: Record<string, string> = {
  high: "🔥",
  medium: "💪",
  low: "🛋️",
  "very high": "🚀",
};

const FAVORITE_ACTIVITY_ICONS: Record<string, string> = {
  fetch: "🎾",
  swimming: "🏊",
  running: "🏃",
  hiking: "🥾",
  cuddling: "🤱",
  "tug of war": "🪢",
  agility: "🏅",
  walking: "🚶",
  playing: "🎮",
  frisbee: "🥏",
};

// ---------------------------------------------------------------------------
// Confetti CSS keyframes (injected once)
// ---------------------------------------------------------------------------

const confettiCSS = `
@keyframes confetti-fall {
  0% {
    transform: translateY(-10vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(720deg);
    opacity: 0;
  }
}
@keyframes confetti-sway {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(15px); }
  75% { transform: translateX(-15px); }
}
@keyframes card-fly-left {
  to {
    transform: translateX(-150vw) rotate(-30deg);
    opacity: 0;
  }
}
@keyframes card-fly-right {
  to {
    transform: translateX(150vw) rotate(30deg);
    opacity: 0;
  }
}
@keyframes card-enter {
  from {
    transform: scale(0.92) translateY(20px);
    opacity: 0.5;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
@keyframes pulse-match {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// ---------------------------------------------------------------------------
// ConfettiOverlay
// ---------------------------------------------------------------------------

function ConfettiOverlay() {
  const colors = [
    "#F2A900",
    "#274C46",
    "#E65A1E",
    "#5F295E",
    "#ff6b6b",
    "#48dbfb",
    "#ff9ff3",
    "#feca57",
    "#54a0ff",
    "#5f27cd",
  ];

  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2.5 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: Math.random() > 0.5 ? "circle" : "rect",
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-10px",
            width: p.shape === "circle" ? p.size : p.size * 0.6,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards, confetti-sway ${p.duration * 0.5}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MatchModal
// ---------------------------------------------------------------------------

function MatchModal({
  myPet,
  theirPet,
  onMessage,
  onKeepSwiping,
}: {
  myPet: PetCandidate | null;
  theirPet: PetCandidate;
  onMessage: () => void;
  onKeepSwiping: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-deep-green/80 backdrop-blur-md"
        onClick={onKeepSwiping}
      />

      {/* Confetti */}
      <ConfettiOverlay />

      {/* Content */}
      <div
        className="relative z-10 bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
        style={{ animation: "fade-in-up 0.5s ease-out" }}
      >
        <h2
          className="font-rubik font-bold text-3xl text-gold mb-2"
          style={{ animation: "pulse-match 1.5s ease-in-out infinite" }}
        >
          It&apos;s a Match! 🎉
        </h2>
        <p className="text-deep-green/70 mb-6 font-rubik">
          You and {theirPet.pet_name} like each other!
        </p>

        {/* Dog photos side by side */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {/* My dog */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gold shadow-lg bg-off-white">
              {myPet?.profile_photo_url || myPet?.avatar_url ? (
                <Image
                  src={(myPet.profile_photo_url || myPet.avatar_url)!}
                  alt={myPet.pet_name || "My dog"}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-deep-green/40">
                  <PawIcon size={40} />
                </div>
              )}
            </div>
            <span className="text-sm font-rubik font-semibold text-deep-green mt-2">
              {myPet?.pet_name || "Your dog"}
            </span>
          </div>

          {/* Heart */}
          <div className="text-3xl" style={{ animation: "pulse-match 1s ease-in-out infinite" }}>
            ❤️
          </div>

          {/* Their dog */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gold shadow-lg bg-off-white">
              {theirPet.profile_photo_url || theirPet.avatar_url ? (
                <Image
                  src={(theirPet.profile_photo_url || theirPet.avatar_url)!}
                  alt={theirPet.pet_name || "Their dog"}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-deep-green/40">
                  <PawIcon size={40} />
                </div>
              )}
            </div>
            <span className="text-sm font-rubik font-semibold text-deep-green mt-2">
              {theirPet.pet_name}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onMessage}
            className="w-full bg-gold text-deep-green font-rubik font-bold text-lg py-3 rounded-xl hover:bg-[#d99500] transition-colors shadow-md"
          >
            Send a Message
          </button>
          <button
            onClick={onKeepSwiping}
            className="w-full bg-off-white text-deep-green font-rubik font-semibold text-lg py-3 rounded-xl hover:bg-off-white/80 transition-colors"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PawIcon (fallback for missing photos)
// ---------------------------------------------------------------------------

function PawIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="opacity-40"
    >
      <ellipse cx="8" cy="6.5" rx="2.2" ry="2.8" />
      <ellipse cx="16" cy="6.5" rx="2.2" ry="2.8" />
      <ellipse cx="4.5" cy="12" rx="2" ry="2.5" />
      <ellipse cx="19.5" cy="12" rx="2" ry="2.5" />
      <path d="M7.5 16.5C7.5 14 9.5 12.5 12 12.5C14.5 12.5 16.5 14 16.5 16.5C16.5 19 14.5 21 12 21C9.5 21 7.5 19 7.5 16.5Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SwipeCard
// ---------------------------------------------------------------------------

function SwipeCard({
  candidate,
  isTop,
  onSwipe,
}: {
  candidate: PetCandidate;
  isTop: boolean;
  onSwipe: (direction: "left" | "right") => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    currentX: 0,
    dx: 0,
  });
  const [flyDirection, setFlyDirection] = useState<"left" | "right" | null>(null);
  const animatingRef = useRef(false);

  const photoUrl = candidate.profile_photo_url || candidate.avatar_url;
  const ageText = candidate.dog_age_years
    ? candidate.dog_age_years === 1
      ? "1 year old"
      : `${candidate.dog_age_years} years old`
    : null;

  // Gesture handlers
  const handleStart = useCallback(
    (clientX: number) => {
      if (!isTop || animatingRef.current) return;
      setDragState({ isDragging: true, startX: clientX, currentX: clientX, dx: 0 });
    },
    [isTop]
  );

  const handleMove = useCallback(
    (clientX: number) => {
      setDragState((prev) => {
        if (!prev.isDragging) return prev;
        return { ...prev, currentX: clientX, dx: clientX - prev.startX };
      });
    },
    []
  );

  const handleEnd = useCallback(() => {
    setDragState((prev) => {
      if (!prev.isDragging) return prev;
      const dx = prev.dx;
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        const dir = dx > 0 ? "right" : "left";
        setFlyDirection(dir);
        animatingRef.current = true;
        setTimeout(() => {
          animatingRef.current = false;
          onSwipe(dir);
          setFlyDirection(null);
        }, 350);
      }
      return { isDragging: false, startX: 0, currentX: 0, dx: 0 };
    });
  }, [onSwipe]);

  // Touch events
  useEffect(() => {
    if (!isTop) return;
    const card = cardRef.current;
    if (!card) return;

    const onTouchStart = (e: TouchEvent) => handleStart(e.touches[0].clientX);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => handleEnd();

    card.addEventListener("touchstart", onTouchStart, { passive: true });
    card.addEventListener("touchmove", onTouchMove, { passive: false });
    card.addEventListener("touchend", onTouchEnd);

    return () => {
      card.removeEventListener("touchstart", onTouchStart);
      card.removeEventListener("touchmove", onTouchMove);
      card.removeEventListener("touchend", onTouchEnd);
    };
  }, [isTop, handleStart, handleMove, handleEnd]);

  // Mouse events
  useEffect(() => {
    if (!isTop || !dragState.isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isTop, dragState.isDragging, handleMove, handleEnd]);

  // Trigger swipe from buttons
  const triggerSwipe = useCallback(
    (dir: "left" | "right") => {
      if (animatingRef.current) return;
      setFlyDirection(dir);
      animatingRef.current = true;
      setTimeout(() => {
        animatingRef.current = false;
        onSwipe(dir);
        setFlyDirection(null);
      }, 350);
    },
    [onSwipe]
  );

  // Expose trigger to parent via data attribute
  useEffect(() => {
    const card = cardRef.current;
    if (!card || !isTop) return;
    (card as HTMLDivElement & { triggerSwipe?: (dir: "left" | "right") => void }).triggerSwipe =
      triggerSwipe;
  }, [isTop, triggerSwipe]);

  const dx = dragState.isDragging ? dragState.dx : 0;
  const likeOpacity = Math.min(Math.max(dx / SWIPE_THRESHOLD, 0), 1);
  const nopeOpacity = Math.min(Math.max(-dx / SWIPE_THRESHOLD, 0), 1);

  let cardStyle: React.CSSProperties;
  if (flyDirection) {
    cardStyle = {
      animation: `card-fly-${flyDirection} 0.35s ease-in forwards`,
    };
  } else if (dragState.isDragging) {
    cardStyle = {
      transform: `translateX(${dx}px) rotate(${dx * 0.1}deg)`,
      transition: "none",
      cursor: "grabbing",
    };
  } else if (isTop) {
    cardStyle = {
      transform: "translateX(0) rotate(0deg)",
      transition: "transform 0.3s ease-out",
      cursor: "grab",
      animation: "card-enter 0.35s ease-out",
    };
  } else {
    cardStyle = {
      transform: "scale(0.95) translateY(10px)",
      opacity: 0.7,
      transition: "all 0.35s ease-out",
    };
  }

  // Fun fact pills
  const pills: { icon: string; label: string }[] = [];
  if (candidate.temperament) {
    const key = candidate.temperament.toLowerCase();
    pills.push({
      icon: TEMPERAMENT_ICONS[key] || "🐕",
      label: candidate.temperament,
    });
  }
  if (candidate.activity_level) {
    const key = candidate.activity_level.toLowerCase();
    pills.push({
      icon: ACTIVITY_ICONS[key] || "💪",
      label: `${candidate.activity_level} energy`,
    });
  }
  if (candidate.favorite_activity) {
    const key = candidate.favorite_activity.toLowerCase();
    pills.push({
      icon: FAVORITE_ACTIVITY_ICONS[key] || "🎯",
      label: candidate.favorite_activity,
    });
  }

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 select-none"
      style={{ ...cardStyle, zIndex: isTop ? 10 : 5 }}
      onMouseDown={(e) => {
        e.preventDefault();
        handleStart(e.clientX);
      }}
    >
      <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col relative">
        {/* LIKE / NOPE overlay stamps */}
        {isTop && (
          <>
            <div
              className="absolute top-8 left-6 z-20 border-4 border-green-500 text-green-500 font-rubik font-bold text-3xl px-4 py-1 rounded-lg -rotate-12"
              style={{ opacity: likeOpacity, transition: dragState.isDragging ? "none" : "opacity 0.2s" }}
            >
              LIKE ❤️
            </div>
            <div
              className="absolute top-8 right-6 z-20 border-4 border-red-500 text-red-500 font-rubik font-bold text-3xl px-4 py-1 rounded-lg rotate-12"
              style={{ opacity: nopeOpacity, transition: dragState.isDragging ? "none" : "opacity 0.2s" }}
            >
              NOPE ✕
            </div>
          </>
        )}

        {/* Photo section (~60% height) */}
        <div className="relative w-full" style={{ height: "60%" }}>
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={candidate.pet_name || "Dog"}
              fill
              className="object-cover"
              unoptimized
              sizes="400px"
            />
          ) : (
            <div className="w-full h-full bg-off-white flex items-center justify-center">
              <PawIcon size={80} />
            </div>
          )}
          {/* Gradient overlay at bottom of photo */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/90 to-transparent" />
        </div>

        {/* Info section (~40% height) */}
        <div className="flex-1 px-5 py-4 flex flex-col gap-2 overflow-y-auto">
          {/* Name + age row */}
          <div className="flex items-baseline gap-2">
            <h3 className="font-rubik font-bold text-2xl text-deep-green">
              {candidate.pet_name}
            </h3>
            {ageText && (
              <span className="text-deep-green/60 font-rubik text-base">
                {ageText}
              </span>
            )}
            {candidate.gender && (
              <span className="text-deep-green/50 text-sm ml-auto">
                {candidate.gender === "male" ? "♂" : candidate.gender === "female" ? "♀" : ""}
              </span>
            )}
          </div>

          {/* Breed & city pills */}
          <div className="flex flex-wrap gap-2">
            {candidate.breed && (
              <span className="inline-flex items-center gap-1 bg-off-white text-deep-green text-sm font-medium px-3 py-1 rounded-full">
                🐕 {candidate.breed}
              </span>
            )}
            {candidate.city && (
              <span className="inline-flex items-center gap-1 bg-off-white text-deep-green text-sm font-medium px-3 py-1 rounded-full">
                📍 {candidate.city}
              </span>
            )}
            {candidate.weight_kg && (
              <span className="inline-flex items-center gap-1 bg-off-white text-deep-green text-sm font-medium px-3 py-1 rounded-full">
                ⚖️ {candidate.weight_kg}kg
              </span>
            )}
          </div>

          {/* Fun facts */}
          {pills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {pills.map((pill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-gold/15 text-deep-green text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {pill.icon} {pill.label}
                </span>
              ))}
            </div>
          )}

          {/* Gets along with dogs */}
          {candidate.gets_along_with_dogs !== null && candidate.gets_along_with_dogs !== undefined && (
            <div className="mt-1">
              {candidate.gets_along_with_dogs ? (
                <span className="text-green-600 text-sm font-medium">
                  ✓ Gets along with dogs
                </span>
              ) : (
                <span className="text-red-500 text-sm font-medium">
                  ✗ Prefers solo
                </span>
              )}
            </div>
          )}

          {/* Owner name (subtle) */}
          {candidate.owner_name && (
            <p className="text-deep-green/40 text-xs mt-auto">
              Owner: {candidate.owner_name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AuthGate: not logged in
// ---------------------------------------------------------------------------

function NotLoggedInCTA() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
          <PawIcon size={48} />
        </div>
        <h2 className="font-rubik font-bold text-2xl text-deep-green mb-3">
          Find Playmates for Your Pup
        </h2>
        <p className="text-deep-green/60 mb-6 leading-relaxed">
          Swipe through local dogs, match with compatible playmates, and set up
          the perfect doggy date. Sign up or log in to get started!
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth/login"
            className="flex-1 bg-gold text-deep-green font-rubik font-bold text-lg py-3 rounded-xl hover:bg-[#d99500] transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="flex-1 bg-deep-green text-white font-rubik font-bold text-lg py-3 rounded-xl hover:bg-deep-green/90 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AuthGate: no pet profile
// ---------------------------------------------------------------------------

function NoPetProfileCTA() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center text-4xl">
          🐶
        </div>
        <h2 className="font-rubik font-bold text-2xl text-deep-green mb-3">
          Complete Your Pet Profile
        </h2>
        <p className="text-deep-green/60 mb-6 leading-relaxed">
          Before you can start swiping, we need to know about your furry friend.
          Create a pet profile to get matched with compatible playmates!
        </p>
        <Link
          href="/find-owners"
          className="inline-block bg-gold text-deep-green font-rubik font-bold text-lg px-8 py-3 rounded-xl hover:bg-[#d99500] transition-colors"
        >
          Complete Profile
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-off-white rounded-full flex items-center justify-center text-4xl">
          🐾
        </div>
        <h2 className="font-rubik font-bold text-2xl text-deep-green mb-3">
          No More Dogs Nearby!
        </h2>
        <p className="text-deep-green/60 mb-6 leading-relaxed">
          You&apos;ve seen all available dogs for now. Check back later or
          explore the community to find new friends!
        </p>
        <Link
          href="/community"
          className="inline-block bg-gold text-deep-green font-rubik font-bold text-lg px-8 py-3 rounded-xl hover:bg-[#d99500] transition-colors"
        >
          Explore Community
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatsBar
// ---------------------------------------------------------------------------

function StatsBar({
  likesToday,
  matchCount,
}: {
  likesToday: number;
  matchCount: number;
}) {
  return (
    <div className="flex items-center justify-center gap-6 py-3">
      <div className="flex items-center gap-1.5 text-deep-green/70 text-sm font-rubik">
        <span className="text-lg">❤️</span>
        <span className="font-semibold">{likesToday}</span>
        <span>likes today</span>
      </div>
      <div className="w-px h-4 bg-deep-green/20" />
      <div className="flex items-center gap-1.5 text-deep-green/70 text-sm font-rubik">
        <span className="text-lg">🎉</span>
        <span className="font-semibold">{matchCount}</span>
        <span>matches</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function SwipePage() {
  const { user, loading: authLoading } = useAuth();
  // Profile states
  const [myPetProfile, setMyPetProfile] = useState<PetCandidate | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  // Candidate queue
  const [candidates, setCandidates] = useState<PetCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [allExhausted, setAllExhausted] = useState(false);
  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);

  // Stats
  const [likesToday, setLikesToday] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  // Match modal
  const [matchModalPet, setMatchModalPet] = useState<PetCandidate | null>(null);

  // Card ref for triggering swipe from buttons
  const topCardContainerRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Load my pet profile
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("pet_profiles")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        setMyPetProfile(data as PetCandidate);
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    })();
  }, [user]);

  // ---------------------------------------------------------------------------
  // Load stats
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Likes today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: todayLikes } = await supabase
        .from("swipe_actions")
        .select("*", { count: "exact", head: true })
        .eq("swiper_id", user.id)
        .eq("action", "like")
        .gte("created_at", todayStart.toISOString());
      setLikesToday(todayLikes ?? 0);

      // Total matches
      const { count: totalMatches } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq("is_active", true);
      setMatchCount(totalMatches ?? 0);
    })();
  }, [user]);

  // ---------------------------------------------------------------------------
  // Load candidates
  // ---------------------------------------------------------------------------

  const loadCandidates = useCallback(
    async (append = false) => {
      if (!user || loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      if (!append) setLoadingCandidates(true);

      try {
        // Get already-swiped IDs
        const { data: swipedRows } = await supabase
          .from("swipe_actions")
          .select("swiped_id")
          .eq("swiper_id", user.id);
        const swipedIds = (swipedRows || []).map((r) => r.swiped_id);
        swipedIds.push(user.id); // exclude self

        // Build query — prefer looking_for_mate, same city, same breed
        // We fetch in two passes: first looking_for_mate=true, then the rest
        let allCandidates: PetCandidate[] = [];

        // Pass 1: looking_for_mate candidates
        const q1 = supabase
          .from("pet_profiles")
          .select("*")
          .not("user_id", "in", `(${swipedIds.join(",")})`)
          .eq("looking_for_mate", true)
          .limit(BATCH_SIZE * 2);

        const { data: pass1 } = await q1;
        if (pass1) allCandidates.push(...(pass1 as PetCandidate[]));

        // Pass 2: if not enough, get others
        if (allCandidates.length < BATCH_SIZE) {
          const excludeIds = [...swipedIds, ...allCandidates.map((c) => c.user_id)];
          const q2 = supabase
            .from("pet_profiles")
            .select("*")
            .not("user_id", "in", `(${excludeIds.join(",")})`)
            .limit(BATCH_SIZE);

          const { data: pass2 } = await q2;
          if (pass2) allCandidates.push(...(pass2 as PetCandidate[]));
        }

        // Sort: same city first, then same breed, then random
        const myCity = myPetProfile?.city_normalized || "";
        const myBreed = myPetProfile?.breed_normalized || "";

        allCandidates.sort((a, b) => {
          const aCity = a.city_normalized === myCity ? 0 : 1;
          const bCity = b.city_normalized === myCity ? 0 : 1;
          if (aCity !== bCity) return aCity - bCity;

          const aBreed = a.breed_normalized === myBreed ? 0 : 1;
          const bBreed = b.breed_normalized === myBreed ? 0 : 1;
          if (aBreed !== bBreed) return aBreed - bBreed;

          return Math.random() - 0.5;
        });

        // Trim to batch size
        const batch = allCandidates.slice(0, BATCH_SIZE);

        // Fetch owner names for the batch
        if (batch.length > 0) {
          const userIds = batch.map((c) => c.user_id);
          const { data: profiles } = await supabase
            .from("user_profiles")
            .select("user_id, full_name")
            .in("user_id", userIds);

          if (profiles) {
            const nameMap = new Map(profiles.map((p) => [p.user_id, p.full_name]));
            batch.forEach((c) => {
              c.owner_name = nameMap.get(c.user_id) || null;
            });
          }
        }

        if (batch.length === 0) {
          setAllExhausted(true);
        }

        if (append) {
          setCandidates((prev) => [...prev, ...batch]);
        } else {
          setCandidates(batch);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error("Failed to load candidates:", err);
      } finally {
        setLoadingCandidates(false);
        loadingMoreRef.current = false;
      }
    },
    [user, myPetProfile]
  );

  useEffect(() => {
    if (hasProfile === true) {
      loadCandidates(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProfile]);

  // Preload next batch when few remain
  useEffect(() => {
    const remaining = candidates.length - currentIndex;
    if (remaining <= PRELOAD_THRESHOLD && remaining > 0 && !allExhausted) {
      loadCandidates(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, candidates.length, allExhausted]);

  // ---------------------------------------------------------------------------
  // Swipe handler
  // ---------------------------------------------------------------------------

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      const candidate = candidates[currentIndex];
      if (!candidate || !user) return;

      const action = direction === "right" ? "like" : "pass";

      // Insert swipe action
      await supabase.from("swipe_actions").upsert(
        {
          swiper_id: user.id,
          swiped_id: candidate.user_id,
          action,
        },
        { onConflict: "swiper_id,swiped_id" }
      );

      // Update likes stat
      if (action === "like") {
        setLikesToday((prev) => prev + 1);

        // Check for mutual match
        const { data: mutual } = await supabase
          .from("swipe_actions")
          .select("id")
          .eq("swiper_id", candidate.user_id)
          .eq("swiped_id", user.id)
          .eq("action", "like")
          .maybeSingle();

        if (mutual) {
          // It's a match!
          const [userA, userB] =
            user.id < candidate.user_id
              ? [user.id, candidate.user_id]
              : [candidate.user_id, user.id];

          // Insert match
          const { data: matchRow } = await supabase
            .from("matches")
            .upsert(
              {
                user_a_id: userA,
                user_b_id: userB,
                is_active: true,
              },
              { onConflict: "user_a_id,user_b_id" }
            )
            .select("id")
            .single();

          // Insert conversation
          if (matchRow) {
            await supabase
              .from("conversations")
              .upsert(
                {
                  match_id: matchRow.id,
                  participant_a: userA,
                  participant_b: userB,
                },
                { onConflict: "participant_a,participant_b" }
              );
          }

          setMatchCount((prev) => prev + 1);
          setMatchModalPet(candidate);
        }
      }

      // Advance to next card
      setCurrentIndex((prev) => prev + 1);
    },
    [candidates, currentIndex, user]
  );

  // ---------------------------------------------------------------------------
  // Button handlers (trigger card fly animation)
  // ---------------------------------------------------------------------------

  const handleButtonSwipe = useCallback(
    (dir: "left" | "right") => {
      const container = topCardContainerRef.current;
      if (!container) return;
      const topCard = container.querySelector("[style*='z-index: 10']") as
        | (HTMLDivElement & { triggerSwipe?: (d: "left" | "right") => void })
        | null;
      if (topCard?.triggerSwipe) {
        topCard.triggerSwipe(dir);
      } else {
        // Fallback: just process swipe
        handleSwipe(dir);
      }
    },
    [handleSwipe]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const currentCandidate = candidates[currentIndex] || null;
  const nextCandidate = candidates[currentIndex + 1] || null;
  const showEmptyState =
    !loadingCandidates && (allExhausted || !currentCandidate) && currentIndex >= candidates.length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: confettiCSS }} />

      <div className="min-h-screen flex flex-col bg-off-white">
        <Header />

        {/* Auth loading */}
        {authLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Not logged in */}
        {!authLoading && !user && (
          <div className="flex-1 flex flex-col pb-24 lg:pb-0">
            <NotLoggedInCTA />
          </div>
        )}

        {/* Logged in but no pet profile */}
        {!authLoading && user && hasProfile === false && (
          <div className="flex-1 flex flex-col pb-24 lg:pb-0">
            <NoPetProfileCTA />
          </div>
        )}

        {/* Logged in, checking profile */}
        {!authLoading && user && hasProfile === null && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Swipe interface */}
        {!authLoading && user && hasProfile === true && (
          <div className="flex-1 flex flex-col items-center px-4 pb-24">
            {/* Stats bar */}
            <StatsBar likesToday={likesToday} matchCount={matchCount} />

            {/* Loading candidates */}
            {loadingCandidates && candidates.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-deep-green/60 font-rubik">
                    Finding dogs near you...
                  </p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {showEmptyState && <EmptyState />}

            {/* Card stack */}
            {currentCandidate && (
              <>
                <div
                  ref={topCardContainerRef}
                  className="relative w-full flex-1 my-4 max-w-full lg:max-w-[500px] max-h-[75vh] lg:max-h-[70vh]"
                >
                  {/* Next card (behind) */}
                  {nextCandidate && (
                    <SwipeCard
                      key={`card-${nextCandidate.user_id}`}
                      candidate={nextCandidate}
                      isTop={false}
                      onSwipe={() => {}}
                    />
                  )}

                  {/* Top card */}
                  <SwipeCard
                    key={`card-${currentCandidate.user_id}`}
                    candidate={currentCandidate}
                    isTop={true}
                    onSwipe={handleSwipe}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-8 mt-2 mb-4">
                  {/* Pass button */}
                  <button
                    onClick={() => handleButtonSwipe("left")}
                    className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-red-400 flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 active:scale-95 transition-all"
                    aria-label="Pass"
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                  {/* Like button */}
                  <button
                    onClick={() => handleButtonSwipe("right")}
                    className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-green-400 flex items-center justify-center text-green-500 hover:bg-green-50 hover:scale-110 active:scale-95 transition-all"
                    aria-label="Like"
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Match modal */}
        {matchModalPet && (
          <MatchModal
            myPet={myPetProfile}
            theirPet={matchModalPet}
            onMessage={() => {
              setMatchModalPet(null);
              window.location.href = "/messages";
            }}
            onKeepSwiping={() => setMatchModalPet(null)}
          />
        )}

        <Footer />
      </div>
    </>
  );
}
