"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface PetProfile {
  id: number;
  user_id: string;
  pet_name: string;
  breed: string;
  pet_type: string;
  city: string;
  city_normalized: string;
  breed_normalized: string;
  contact_email: string;
  contact_phone: string | null;
  share_contact: boolean;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface ConnectRequest {
  id: number;
  sender_id: string;
  receiver_id: string;
  status: string;
  matched_at: string | null;
  created_at: string;
}

type ConnectionStatus = "none" | "sent" | "received" | "matched";

/* ─── Constants ─────────────────────────────────────────────────────── */

const COMMON_BREEDS = [
  "Labrador Retriever",
  "German Shepherd",
  "Golden Retriever",
  "French Bulldog",
  "Bulldog",
  "Poodle",
  "Beagle",
  "Rottweiler",
  "Dachshund",
  "Yorkshire Terrier",
  "Boxer",
  "Cavalier King Charles Spaniel",
  "Miniature Schnauzer",
  "Shih Tzu",
  "Border Collie",
  "Cocker Spaniel",
  "Chihuahua",
  "Pug",
  "Staffordshire Bull Terrier",
  "Whippet",
  "Jack Russell Terrier",
  "Springer Spaniel",
  "Dalmatian",
  "Siberian Husky",
  "Doberman",
  "Great Dane",
  "Maltese",
  "Bernese Mountain Dog",
  "Corgi",
  "Bichon Frise",
];

const PET_TYPES = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "other", label: "Other" },
];

/* ─── Helpers ───────────────────────────────────────────────────────── */

function generateDisplayName(email: string): string {
  const local = email.split("@")[0] || "user";
  // Take the first part up to a dot or plus, then append the first char after dot if exists
  const parts = local.split(".");
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[1].charAt(0)}`;
  }
  return local;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ─── Spinner ───────────────────────────────────────────────────────── */

function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-10 w-10" : "h-7 w-7";
  return (
    <div className="flex justify-center items-center py-8">
      <div
        className={`${dims} border-3 border-deep-green/20 border-t-deep-green rounded-full animate-spin`}
        style={{ borderWidth: "3px" }}
      />
    </div>
  );
}

/* ─── Pet Type Icon ─────────────────────────────────────────────────── */

function PetTypeIcon({ type }: { type: string }) {
  if (type === "cat") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-deep-green/60">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-1c-2 0-3.5-1.5-3.5-3.5h1.5c0 1.1.9 2 2 2s2-.9 2-2h1.5c0 2-1.5 3.5-3.5 3.5v1h-1zm4.89-6.24c-.41.37-.91.59-1.48.62-.03 0-.05.01-.08.01-.42 0-.82-.15-1.14-.42l-.19-.17-.19.17c-.32.27-.72.42-1.14.42-.03 0-.05 0-.08-.01-.57-.03-1.07-.25-1.48-.62C9.42 9.62 9 8.73 9 7.75V5h1.5v2.75c0 .56.23 1.07.62 1.38.17.14.36.22.55.24.18-.02.37-.1.54-.24.39-.31.62-.82.62-1.38V5H14.33v2.75c0 .56.23 1.07.62 1.38.17.14.36.22.55.24.18-.02.37-.1.54-.24.39-.31.62-.82.62-1.38V5H18v2.75c0 .98-.42 1.87-1.11 2.51z" />
      </svg>
    );
  }
  // Default: dog paw
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-deep-green/60">
      <ellipse cx="8" cy="6.5" rx="2.2" ry="2.8" />
      <ellipse cx="16" cy="6.5" rx="2.2" ry="2.8" />
      <ellipse cx="4.5" cy="12" rx="2" ry="2.5" />
      <ellipse cx="19.5" cy="12" rx="2" ry="2.5" />
      <path d="M7.5 16.5C7.5 14 9.5 12.5 12 12.5C14.5 12.5 16.5 14 16.5 16.5C16.5 19 14.5 21 12 21C9.5 21 7.5 19 7.5 16.5Z" />
    </svg>
  );
}

/* ─── Login CTA ─────────────────────────────────────────────────────── */

function LoginCTA() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 lg:py-16">
      <div className="bg-white shadow-sm border border-deep-green/10 w-full rounded-xl p-6 lg:rounded-2xl lg:p-10">
        {/* Illustration */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gold/15 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#274C46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>
        <h2 className="font-rubik font-bold text-2xl text-deep-green mb-3">
          Find Pet Owners Near You
        </h2>
        <p className="text-deep-green/70 text-[15px] leading-relaxed mb-8">
          Connect with owners of the same breed in your area. Share tips,
          arrange playdates, and build a community around your pet.
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-gold text-deep-green font-rubik font-semibold text-[16px] px-8 py-3 rounded-lg hover:bg-[#d99500] transition-colors"
        >
          Log in to get started
        </Link>
        <p className="mt-4 text-deep-green/50 text-[13px]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-gold hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ─── Profile Prompt ────────────────────────────────────────────────── */

function ProfilePrompt({
  existingProfile,
  userEmail,
  userId,
  onComplete,
}: {
  existingProfile: PetProfile | null;
  userEmail: string;
  userId: string;
  onComplete: (profile: PetProfile) => void;
}) {
  const [petName, setPetName] = useState(existingProfile?.pet_name || "");
  const [breed, setBreed] = useState(existingProfile?.breed || "");
  const [petType, setPetType] = useState(existingProfile?.pet_type || "dog");
  const [city, setCity] = useState(existingProfile?.city || "");
  const [contactPhone, setContactPhone] = useState(existingProfile?.contact_phone || "");
  const [shareContact, setShareContact] = useState(existingProfile?.share_contact ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
  const breedInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredBreeds = COMMON_BREEDS.filter((b) =>
    b.toLowerCase().includes(breed.toLowerCase())
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        breedInputRef.current &&
        !breedInputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowBreedSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!petName.trim() || !breed.trim() || !city.trim()) {
      setError("Please fill in your pet's name, breed, and city.");
      return;
    }

    setSaving(true);

    const displayName = generateDisplayName(userEmail);
    const profileData = {
      user_id: userId,
      pet_name: petName.trim(),
      breed: breed.trim(),
      pet_type: petType,
      city: city.trim(),
      city_normalized: city.trim().toLowerCase(),
      breed_normalized: breed.trim().toLowerCase(),
      contact_email: userEmail,
      contact_phone: contactPhone.trim() || null,
      share_contact: shareContact,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    };

    try {
      if (existingProfile) {
        const { data, error: updateError } = await supabase
          .from("pet_profiles")
          .update(profileData)
          .eq("id", existingProfile.id)
          .select()
          .single();

        if (updateError) throw updateError;
        onComplete(data as PetProfile);
      } else {
        const { data, error: insertError } = await supabase
          .from("pet_profiles")
          .insert(profileData)
          .select()
          .single();

        if (insertError) throw insertError;
        onComplete(data as PetProfile);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center py-4 lg:py-6">
      <div className="bg-white shadow-sm border border-deep-green/10 w-full rounded-xl p-6 lg:rounded-2xl lg:p-10 xl:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-deep-green/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#274C46">
              <ellipse cx="8" cy="6.5" rx="2.2" ry="2.8" />
              <ellipse cx="16" cy="6.5" rx="2.2" ry="2.8" />
              <ellipse cx="4.5" cy="12" rx="2" ry="2.5" />
              <ellipse cx="19.5" cy="12" rx="2" ry="2.5" />
              <path d="M7.5 16.5C7.5 14 9.5 12.5 12 12.5C14.5 12.5 16.5 14 16.5 16.5C16.5 19 14.5 21 12 21C9.5 21 7.5 19 7.5 16.5Z" />
            </svg>
          </div>
          <h2 className="font-rubik font-bold text-xl text-deep-green">
            {existingProfile ? "Update Your Pet Profile" : "Set Up Your Pet Profile"}
          </h2>
          <p className="text-deep-green/60 text-[14px] mt-2">
            Tell us about your pet so we can match you with nearby owners of the same breed.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-[14px] px-4 py-3 rounded-lg mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pet Name */}
          <div>
            <label className="block text-deep-green font-medium text-[14px] mb-1.5">
              Pet&apos;s Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="e.g. Buddy"
              className="w-full px-4 py-2.5 rounded-lg border border-deep-green/20 text-deep-green text-[15px] placeholder-deep-green/30 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
            />
          </div>

          {/* Breed with autocomplete */}
          <div className="relative">
            <label className="block text-deep-green font-medium text-[14px] mb-1.5">
              Breed <span className="text-red-400">*</span>
            </label>
            <input
              ref={breedInputRef}
              type="text"
              value={breed}
              onChange={(e) => {
                setBreed(e.target.value);
                setShowBreedSuggestions(true);
              }}
              onFocus={() => setShowBreedSuggestions(true)}
              placeholder="Start typing a breed..."
              className="w-full px-4 py-2.5 rounded-lg border border-deep-green/20 text-deep-green text-[15px] placeholder-deep-green/30 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
              autoComplete="off"
            />
            {showBreedSuggestions && breed.length > 0 && filteredBreeds.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-deep-green/15 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                {filteredBreeds.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setBreed(b);
                      setShowBreedSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[14px] text-deep-green hover:bg-gold/10 transition-colors"
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pet Type */}
          <div>
            <label className="block text-deep-green font-medium text-[14px] mb-1.5">
              Pet Type
            </label>
            <select
              value={petType}
              onChange={(e) => setPetType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-deep-green/20 text-deep-green text-[15px] focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors bg-white"
            >
              {PET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-deep-green font-medium text-[14px] mb-1.5">
              City <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. London"
              className="w-full px-4 py-2.5 rounded-lg border border-deep-green/20 text-deep-green text-[15px] placeholder-deep-green/30 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
            />
          </div>

          {/* Phone (optional) */}
          <div>
            <label className="block text-deep-green font-medium text-[14px] mb-1.5">
              Phone <span className="text-deep-green/40 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. +44 7700 900000"
              className="w-full px-4 py-2.5 rounded-lg border border-deep-green/20 text-deep-green text-[15px] placeholder-deep-green/30 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
            />
          </div>

          {/* Share Contact */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={shareContact}
              onChange={(e) => setShareContact(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-deep-green/30 text-gold focus:ring-gold/50 accent-[#F2A900]"
            />
            <div>
              <span className="text-deep-green text-[14px] font-medium">
                Share my contact info with connections
              </span>
              <p className="text-deep-green/50 text-[13px] mt-0.5">
                Your email and phone will be visible to matched owners.
              </p>
            </div>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gold text-deep-green font-rubik font-semibold text-[16px] px-6 py-3 rounded-lg hover:bg-[#d99500] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : existingProfile ? "Update Profile" : "Create Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Match Card ────────────────────────────────────────────────────── */

function MatchCard({
  profile,
  connectionStatus,
  onConnect,
  onAccept,
  connecting,
}: {
  profile: PetProfile;
  connectionStatus: ConnectionStatus;
  onConnect: () => void;
  onAccept: () => void;
  connecting: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-deep-green/10 p-5 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-deep-green/10 flex items-center justify-center flex-shrink-0">
          <span className="text-deep-green font-rubik font-bold text-[15px]">
            {profile.display_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="font-rubik font-semibold text-deep-green text-[15px] truncate">
            {profile.display_name}
          </h3>
          <p className="text-deep-green/50 text-[13px] flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {profile.city}
          </p>
        </div>
      </div>

      {/* Pet info */}
      <div className="bg-off-white/60 rounded-lg px-4 py-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <PetTypeIcon type={profile.pet_type} />
          <span className="font-medium text-deep-green text-[14px]">
            {profile.pet_name}
          </span>
        </div>
        <p className="text-deep-green/60 text-[13px]">{profile.breed}</p>
      </div>

      {/* Action */}
      {connectionStatus === "none" && (
        <button
          onClick={onConnect}
          disabled={connecting}
          className="w-full bg-deep-green text-white font-rubik font-medium text-[14px] py-2.5 rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {connecting ? "Sending..." : "Connect"}
        </button>
      )}
      {connectionStatus === "sent" && (
        <button
          disabled
          className="w-full bg-gray-100 text-deep-green/40 font-rubik font-medium text-[14px] py-2.5 rounded-lg cursor-not-allowed"
        >
          Request Sent
        </button>
      )}
      {connectionStatus === "received" && (
        <button
          onClick={onAccept}
          disabled={connecting}
          className="w-full bg-gold text-deep-green font-rubik font-semibold text-[14px] py-2.5 rounded-lg hover:bg-[#d99500] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {connecting ? "Accepting..." : "Accept Request"}
        </button>
      )}
      {connectionStatus === "matched" && (
        <div className="w-full text-center text-deep-green font-rubik font-semibold text-[14px] py-2.5">
          Connected &#10003;
        </div>
      )}
    </div>
  );
}

/* ─── Connection Card ───────────────────────────────────────────────── */

function ConnectionCard({
  profile,
  matchedAt,
}: {
  profile: PetProfile;
  matchedAt: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-deep-green/10 p-5 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
          <span className="text-deep-green font-rubik font-bold text-[15px]">
            {profile.display_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="font-rubik font-semibold text-deep-green text-[15px] truncate">
            {profile.display_name}
          </h3>
          <p className="text-deep-green/50 text-[13px] flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {profile.city}
          </p>
        </div>
        <span className="ml-auto text-deep-green/30 text-[12px] whitespace-nowrap">
          Matched {formatDate(matchedAt)}
        </span>
      </div>

      {/* Pet info */}
      <div className="bg-off-white/60 rounded-lg px-4 py-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <PetTypeIcon type={profile.pet_type} />
          <span className="font-medium text-deep-green text-[14px]">
            {profile.pet_name}
          </span>
        </div>
        <p className="text-deep-green/60 text-[13px]">{profile.breed}</p>
      </div>

      {/* Contact info */}
      {profile.share_contact ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[13px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#274C46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 flex-shrink-0">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <a
              href={`mailto:${profile.contact_email}`}
              className="text-deep-green hover:text-gold transition-colors truncate"
            >
              {profile.contact_email}
            </a>
          </div>
          {profile.contact_phone && (
            <div className="flex items-center gap-2 text-[13px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#274C46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 flex-shrink-0">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <a
                href={`tel:${profile.contact_phone}`}
                className="text-deep-green hover:text-gold transition-colors"
              >
                {profile.contact_phone}
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-deep-green/40 text-[13px]">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Contact info not shared
        </div>
      )}
    </div>
  );
}

/* ─── Main Match Page ───────────────────────────────────────────────── */

function MatchPage({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [profile, setProfile] = useState<PetProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  const [activeTab, setActiveTab] = useState<"nearby" | "connections">("nearby");

  // Nearby state
  const [nearbyProfiles, setNearbyProfiles] = useState<PetProfile[]>([]);
  const [connectRequests, setConnectRequests] = useState<ConnectRequest[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // Connections state
  const [connections, setConnections] = useState<{ profile: PetProfile; matchedAt: string }[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  // Action state
  const [connectingTo, setConnectingTo] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("pet_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setProfile(data as PetProfile);
        const p = data as PetProfile;
        if (p.breed && p.city && p.pet_name) {
          setProfileComplete(true);
        }
      }
      setProfileLoading(false);
    }
    fetchProfile();
  }, [user.id]);

  // Fetch nearby owners
  const fetchNearby = useCallback(async () => {
    if (!profile) return;
    setNearbyLoading(true);

    try {
      // Get nearby profiles with same breed in same city
      const { data: profiles } = await supabase
        .from("pet_profiles")
        .select("*")
        .eq("breed_normalized", profile.breed_normalized)
        .eq("city_normalized", profile.city_normalized)
        .neq("user_id", user.id);

      // Get all connect_requests involving the current user
      const { data: requests } = await supabase
        .from("connect_requests")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      setNearbyProfiles((profiles as PetProfile[]) || []);
      setConnectRequests((requests as ConnectRequest[]) || []);
    } catch {
      // Silently handle
    } finally {
      setNearbyLoading(false);
    }
  }, [profile, user.id]);

  // Fetch my connections
  const fetchConnections = useCallback(async () => {
    if (!profile) return;
    setConnectionsLoading(true);

    try {
      // Get all matched requests involving me
      const { data: matchedRequests } = await supabase
        .from("connect_requests")
        .select("*")
        .eq("status", "matched")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (!matchedRequests || matchedRequests.length === 0) {
        setConnections([]);
        setConnectionsLoading(false);
        return;
      }

      // Get the other user IDs
      const otherUserIds = matchedRequests.map((r: ConnectRequest) =>
        r.sender_id === user.id ? r.receiver_id : r.sender_id
      );

      // Fetch their profiles
      const { data: profiles } = await supabase
        .from("pet_profiles")
        .select("*")
        .in("user_id", otherUserIds);

      const profileMap = new Map<string, PetProfile>();
      (profiles as PetProfile[] || []).forEach((p) => profileMap.set(p.user_id, p));

      const result = matchedRequests
        .map((r: ConnectRequest) => {
          const otherId = r.sender_id === user.id ? r.receiver_id : r.sender_id;
          const otherProfile = profileMap.get(otherId);
          if (!otherProfile) return null;
          return {
            profile: otherProfile,
            matchedAt: r.matched_at || r.created_at,
          };
        })
        .filter(Boolean) as { profile: PetProfile; matchedAt: string }[];

      setConnections(result);
    } catch {
      // Silently handle
    } finally {
      setConnectionsLoading(false);
    }
  }, [profile, user.id]);

  // Load data when profile is complete and tab changes
  useEffect(() => {
    if (!profileComplete || !profile) return;
    if (activeTab === "nearby") {
      fetchNearby();
    } else {
      fetchConnections();
    }
  }, [profileComplete, profile, activeTab, fetchNearby, fetchConnections]);

  // Get connection status for a given profile
  function getConnectionStatus(targetUserId: string): ConnectionStatus {
    const sentByMe = connectRequests.find(
      (r) => r.sender_id === user.id && r.receiver_id === targetUserId
    );
    const sentToMe = connectRequests.find(
      (r) => r.sender_id === targetUserId && r.receiver_id === user.id
    );

    if (sentByMe?.status === "matched" || sentToMe?.status === "matched") {
      return "matched";
    }
    if (sentByMe && sentToMe) {
      return "matched";
    }
    if (sentByMe) {
      return "sent";
    }
    if (sentToMe) {
      return "received";
    }
    return "none";
  }

  // Send a connect request
  async function handleConnect(targetUserId: string) {
    setConnectingTo(targetUserId);
    try {
      // Insert connect request
      const { error: insertError } = await supabase
        .from("connect_requests")
        .insert({
          sender_id: user.id,
          receiver_id: targetUserId,
          status: "pending",
        });

      if (insertError) throw insertError;

      // Check if mutual match exists (other person already sent request to me)
      const { data: reverseRequest } = await supabase
        .from("connect_requests")
        .select("*")
        .eq("sender_id", targetUserId)
        .eq("receiver_id", user.id)
        .single();

      if (reverseRequest) {
        const now = new Date().toISOString();
        // Update both to matched
        await supabase
          .from("connect_requests")
          .update({ status: "matched", matched_at: now })
          .eq("sender_id", user.id)
          .eq("receiver_id", targetUserId);

        await supabase
          .from("connect_requests")
          .update({ status: "matched", matched_at: now })
          .eq("sender_id", targetUserId)
          .eq("receiver_id", user.id);
      }

      // Re-fetch nearby data
      await fetchNearby();
    } catch {
      // Silently handle
    } finally {
      setConnectingTo(null);
    }
  }

  // Accept an incoming request (create reverse + mark both matched)
  async function handleAccept(targetUserId: string) {
    setConnectingTo(targetUserId);
    try {
      const now = new Date().toISOString();

      // Insert our reverse request as matched
      const { error: insertError } = await supabase
        .from("connect_requests")
        .insert({
          sender_id: user.id,
          receiver_id: targetUserId,
          status: "matched",
          matched_at: now,
        });

      if (insertError) throw insertError;

      // Update the original request to matched
      await supabase
        .from("connect_requests")
        .update({ status: "matched", matched_at: now })
        .eq("sender_id", targetUserId)
        .eq("receiver_id", user.id);

      // Re-fetch nearby data
      await fetchNearby();
    } catch {
      // Silently handle
    } finally {
      setConnectingTo(null);
    }
  }

  // Handle profile creation/update completion
  function handleProfileComplete(newProfile: PetProfile) {
    setProfile(newProfile);
    if (newProfile.breed && newProfile.city && newProfile.pet_name) {
      setProfileComplete(true);
    }
  }

  /* ── Loading ── */
  if (profileLoading) {
    return <Spinner size="lg" />;
  }

  /* ── Profile not complete → show form ── */
  if (!profileComplete) {
    return (
      <ProfilePrompt
        existingProfile={profile}
        userEmail={user.email || ""}
        userId={user.id}
        onComplete={handleProfileComplete}
      />
    );
  }

  /* ── Profile complete → show tabs ── */
  const tabs = [
    { key: "nearby" as const, label: "Owners Near You" },
    { key: "connections" as const, label: "My Connections" },
  ];

  return (
    <div className="py-6">
      <div>
        {/* Page header */}
        <div className="text-center mb-3">
          <h1 className="font-rubik font-bold text-3xl text-deep-green mb-3">
            Breed Match
          </h1>
          <p className="text-deep-green/60 text-[15px] leading-relaxed">
            Find {profile!.breed} owners in {profile!.city} and connect.
          </p>
        </div>

        {/* Edit profile link */}
        <div className="text-center mb-8">
          <button
            onClick={() => {
              setProfileComplete(false);
            }}
            className="text-gold hover:text-[#d99500] text-[13px] font-medium transition-colors"
          >
            Edit profile
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center gap-8 border-b border-deep-green/10 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 pb-3 text-[15px] font-medium transition-colors relative ${
                activeTab === tab.key
                  ? "text-deep-green"
                  : "text-deep-green/50 hover:text-deep-green/70"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gold rounded-t-sm" />
              )}
            </button>
          ))}
        </div>

        {/* ── Nearby Tab ── */}
        {activeTab === "nearby" && (
          <>
            {nearbyLoading ? (
              <Spinner />
            ) : nearbyProfiles.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-deep-green/5 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#274C46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <h3 className="font-rubik font-semibold text-deep-green text-lg mb-2">
                  No matches found in your area
                </h3>
                <p className="text-deep-green/50 text-[14px] max-w-sm mx-auto">
                  We couldn&apos;t find other {profile!.breed} owners in {profile!.city} yet.
                  Check back soon as more owners join.
                </p>
              </div>
            ) : (
              <div className={"grid gap-5 grid-cols-1 lg:grid-cols-2 lg:gap-6"}>
                {nearbyProfiles.map((p) => {
                  const status = getConnectionStatus(p.user_id);
                  return (
                    <MatchCard
                      key={p.id}
                      profile={p}
                      connectionStatus={status}
                      onConnect={() => handleConnect(p.user_id)}
                      onAccept={() => handleAccept(p.user_id)}
                      connecting={connectingTo === p.user_id}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Connections Tab ── */}
        {activeTab === "connections" && (
          <>
            {connectionsLoading ? (
              <Spinner />
            ) : connections.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-deep-green/5 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#274C46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="font-rubik font-semibold text-deep-green text-lg mb-2">
                  No connections yet
                </h3>
                <p className="text-deep-green/50 text-[14px] max-w-sm mx-auto">
                  When you and another owner both connect, you&apos;ll see them here
                  with their contact details.
                </p>
                <button
                  onClick={() => setActiveTab("nearby")}
                  className="mt-6 bg-gold text-deep-green font-rubik font-semibold text-[14px] px-6 py-2.5 rounded-lg hover:bg-[#d99500] transition-colors"
                >
                  Find owners nearby
                </button>
              </div>
            ) : (
              <div className={"grid gap-5 grid-cols-1 lg:grid-cols-2 lg:gap-6"}>
                {connections.map((c) => (
                  <ConnectionCard
                    key={c.profile.id}
                    profile={c.profile}
                    matchedAt={c.matchedAt}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Page Root ──────────────────────────────────────────────────────── */

export default function FindOwnersPage() {
  const { user, loading } = useAuth();

  return (
    <>
      <Header />
      <main className="bg-off-white min-h-screen pb-24">
        <div className="w-full px-4 lg:max-w-[780px] lg:mx-auto lg:px-12">
          {loading ? (
            <Spinner size="lg" />
          ) : !user ? (
            <LoginCTA />
          ) : (
            <MatchPage user={user} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
