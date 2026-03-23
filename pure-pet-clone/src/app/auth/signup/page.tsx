'use client';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  COMMON_BREEDS,
  PET_TYPES,
  DIET_PREFERENCES,
  ACTIVITY_LEVELS,
  TEMPERAMENTS,
  WALK_PREFERENCES,
  FAVORITE_ACTIVITIES,
  COUNTRIES,
} from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StepErrors {
  [key: string]: string;
}

/* ------------------------------------------------------------------ */
/*  Tiny reusable icon components (inline SVG)                         */
/* ------------------------------------------------------------------ */

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  );
}

function PawIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="inline-block ml-0.5">
      <ellipse cx="8" cy="6.5" rx="2.2" ry="2.8" />
      <ellipse cx="16" cy="6.5" rx="2.2" ry="2.8" />
      <ellipse cx="4.5" cy="12" rx="2" ry="2.5" />
      <ellipse cx="19.5" cy="12" rx="2" ry="2.5" />
      <path d="M7.5 16.5C7.5 14 9.5 12.5 12 12.5C14.5 12.5 16.5 14 16.5 16.5C16.5 19 14.5 21 12 21C9.5 21 7.5 19 7.5 16.5Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Step progress bar                                                  */
/* ------------------------------------------------------------------ */

const STEP_LABELS = ['Your Account', 'Your Location', 'Your Dog', 'Lifestyle'];

function StepProgress({ current, completed }: { current: number; completed: number[] }) {
  return (
    <div className="w-full max-w-lg mx-auto mb-10">
      {/* Step label */}
      <p className="text-center text-sm font-medium text-deep-green/60 mb-4">
        Step {current + 1} of {STEP_LABELS.length}
      </p>

      <div className="flex items-center justify-between relative">
        {/* Connecting line (behind circles) */}
        <div className="absolute top-4 left-0 right-0 h-[2px] bg-gray-200 mx-8" />
        <div
          className="absolute top-4 left-0 h-[2px] bg-deep-green mx-8 transition-all duration-500 ease-in-out"
          style={{
            width: `calc(${(Math.max(0, current) / (STEP_LABELS.length - 1)) * 100}% - 64px)`,
          }}
        />

        {STEP_LABELS.map((label, i) => {
          const isDone = completed.includes(i);
          const isCurrent = i === current;
          const isFuture = !isDone && !isCurrent;

          return (
            <div key={label} className="flex flex-col items-center relative z-10">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300 ease-in-out ring-4
                  ${isDone
                    ? 'bg-deep-green text-white ring-deep-green/20'
                    : isCurrent
                      ? 'bg-gold text-deep-green ring-gold/30 scale-110'
                      : 'bg-gray-200 text-gray-400 ring-transparent'
                  }
                `}
              >
                {isDone ? <CheckIcon /> : i + 1}
              </div>
              <span
                className={`
                  text-xs mt-2 font-medium whitespace-nowrap
                  transition-colors duration-300
                  ${isDone ? 'text-deep-green' : isCurrent ? 'text-gold' : 'text-gray-400'}
                `}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Breed Autocomplete component                                       */
/* ------------------------------------------------------------------ */

function BreedAutocomplete({
  value,
  onChange,
  placeholder,
  error,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMON_BREEDS;
    const q = query.toLowerCase();
    return COMMON_BREEDS.filter((b) => b.toLowerCase().includes(q));
  }, [query]);

  // Sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={id}
        type="text"
        value={query}
        placeholder={placeholder ?? 'Start typing a breed...'}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow ${
          error ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
        }`}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl bg-white border border-gray-200 shadow-lg">
          {filtered.map((breed) => (
            <li key={breed}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-deep-green/5 transition-colors text-gray-800"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(breed);
                  onChange(breed);
                  setOpen(false);
                }}
              >
                {breed}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main signup page component                                         */
/* ------------------------------------------------------------------ */

export default function SignupPage() {
  const { signUp, user, loading: authLoading } = useAuth();
  const router = useRouter();

  /* ---------- wizard state ---------- */
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [animating, setAnimating] = useState(false);

  /* ---------- form fields ---------- */
  // Step 1 - Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2 - Location
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');

  // Step 3 - Dog
  const [dogName, setDogName] = useState('');
  const [breed, setBreed] = useState('');
  const [petType, setPetType] = useState<string>('Dog');
  const [dogAge, setDogAge] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [gender, setGender] = useState('Unknown');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState('');

  // Step 4 - Lifestyle
  const [dietPreference, setDietPreference] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [temperament, setTemperament] = useState('');
  const [favoriteActivity, setFavoriteActivity] = useState('');
  const [walkPreference, setWalkPreference] = useState('');
  const [getsAlongWithDogs, setGetsAlongWithDogs] = useState(true);
  const [lookingForMate, setLookingForMate] = useState(false);
  const [preferredBreed, setPreferredBreed] = useState('');
  const [preferredRadiusKm, setPreferredRadiusKm] = useState(25);
  const [bio, setBio] = useState('');
  const [shareContact, setShareContact] = useState(true);

  /* ---------- validation & submission ---------- */
  const [errors, setErrors] = useState<StepErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- redirect if already logged in ---------- */
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/community');
    }
  }, [authLoading, user, router]);

  /* ---------- generate display name ---------- */
  function generateDisplayName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }

  /* ---------- photo upload ---------- */
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfilePhoto(file);
    setProfilePhotoPreview(URL.createObjectURL(file));

    // Upload immediately
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadedPhotoUrl(data.url);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: err instanceof Error ? err.message : 'Photo upload failed',
      }));
      setUploadedPhotoUrl('');
    } finally {
      setUploadingPhoto(false);
    }
  }

  /* ---------- step validation ---------- */
  function validateStep(s: number): boolean {
    const newErrors: StepErrors = {};

    if (s === 0) {
      if (!fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        newErrors.email = 'Please enter a valid email';
      if (!password) newErrors.password = 'Password is required';
      else if (password.length < 6)
        newErrors.password = 'Password must be at least 6 characters';
      if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (password !== confirmPassword)
        newErrors.confirmPassword = 'Passwords do not match';
      if (age && (isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120))
        newErrors.age = 'Please enter a valid age';
    }

    if (s === 1) {
      if (!city.trim()) newErrors.city = 'City is required';
      if (!state.trim()) newErrors.state = 'State/Province is required';
      if (!country) newErrors.country = 'Please select a country';
    }

    if (s === 2) {
      if (!dogName.trim()) newErrors.dogName = 'Dog name is required';
      if (!breed.trim()) newErrors.breed = 'Breed is required';
      if (!petType) newErrors.petType = 'Pet type is required';
      if (dogAge && (isNaN(Number(dogAge)) || Number(dogAge) < 0))
        newErrors.dogAge = 'Please enter a valid age';
      if (weightKg && (isNaN(Number(weightKg)) || Number(weightKg) < 0))
        newErrors.weightKg = 'Please enter a valid weight';
    }

    // Step 4 has no required fields

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /* ---------- navigation ---------- */
  const goNext = useCallback(() => {
    if (!validateStep(step)) return;
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
    setDirection('forward');
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => Math.min(s + 1, 3));
      setAnimating(false);
    }, 250);
  }, [step, fullName, email, password, confirmPassword, age, city, state, country, dogName, breed, petType, dogAge, weightKg]);

  const goBack = useCallback(() => {
    setDirection('backward');
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => Math.max(s - 1, 0));
      setAnimating(false);
    }, 250);
  }, []);

  /* ---------- submit ---------- */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateStep(step)) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      // 1. Sign up
      const { error: signUpError } = await signUp(email, password, { full_name: fullName });
      if (signUpError) {
        setSubmitError(signUpError.message || 'Signup failed. Please try again.');
        setSubmitting(false);
        return;
      }

      // 2. Wait for session to be established
      // Use a polling approach to get the session after sign up
      let userId: string | null = null;
      for (let attempt = 0; attempt < 20; attempt++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          userId = session.user.id;
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!userId) {
        // Supabase might require email confirmation
        // Try to sign in immediately after sign up
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setSubmitError(
            'Account created! Please check your email to verify your account, then log in.'
          );
          setSubmitting(false);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id ?? null;
      }

      if (!userId) {
        setSubmitError('Unable to retrieve user session. Please try logging in.');
        setSubmitting(false);
        return;
      }

      const displayName = generateDisplayName(fullName);

      // 3. Insert user_profile
      const { error: profileError } = await supabase.from('user_profiles').insert({
        user_id: userId,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        age: age ? parseInt(age) : null,
        city: city.trim(),
        state: state.trim(),
        country,
        phone: phone.trim() || null,
      });

      if (profileError) {
        console.error('Profile insert error:', profileError);
        // Don't block — the account is already created
      }

      // 4. Insert pet_profile
      const { error: petError } = await supabase.from('pet_profiles').insert({
        user_id: userId,
        pet_name: dogName.trim(),
        breed: breed.trim(),
        pet_type: petType,
        city: city.trim(),
        city_normalized: city.trim().toLowerCase(),
        breed_normalized: breed.trim().toLowerCase(),
        contact_email: email.trim().toLowerCase(),
        contact_phone: phone.trim() || null,
        share_contact: shareContact,
        display_name: displayName,
        dog_age_years: dogAge ? parseFloat(dogAge) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        gender,
        diet_preference: dietPreference || null,
        activity_level: activityLevel || null,
        temperament: temperament || null,
        looking_for_mate: lookingForMate,
        preferred_radius_km: lookingForMate ? preferredRadiusKm : null,
        preferred_breed: lookingForMate ? preferredBreed || null : null,
        favorite_activity: favoriteActivity || null,
        walk_preference: walkPreference || null,
        gets_along_with_dogs: getsAlongWithDogs,
        bio: bio.trim() || null,
        profile_photo_url: uploadedPhotoUrl || null,
      });

      if (petError) {
        console.error('Pet profile insert error:', petError);
      }

      // 5. Redirect to community
      router.push('/community');
    } catch (err) {
      console.error('Signup error:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  }

  /* ---------- loading / redirect guard ---------- */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  const slideClass = animating
    ? direction === 'forward'
      ? 'opacity-0 translate-x-8'
      : 'opacity-0 -translate-x-8'
    : 'opacity-100 translate-x-0';

  return (
    <div className="min-h-screen bg-off-white">
      {/* -------- Simple Header -------- */}
      <header className="bg-deep-green">
        <div className="max-w-5xl mx-auto px-5 h-[64px] flex items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <div className="bg-gold text-deep-green rounded-lg px-3 py-1.5 flex items-center gap-0.5 font-rubik font-bold text-[20px] tracking-wide select-none hover:bg-yellow-400 transition-colors">
              <span>PURE</span>
              <PawIcon />
            </div>
          </Link>
          <p className="text-white/70 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-gold font-semibold hover:text-yellow-300 transition-colors underline underline-offset-2">
              Log in
            </Link>
          </p>
        </div>
      </header>

      {/* -------- Main Content -------- */}
      <main className="max-w-2xl mx-auto px-5 py-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-rubik font-bold text-deep-green">
            Join the Pack
          </h1>
          <p className="text-deep-green/60 mt-2 text-base">
            Create your account and set up your dog&apos;s profile
          </p>
        </div>

        {/* Step Progress */}
        <StepProgress current={step} completed={completedSteps} />

        {/* Submit error */}
        {submitError && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm max-w-lg mx-auto">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{submitError}</span>
          </div>
        )}

        {/* Card */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
            <div className={`transition-all duration-300 ease-in-out ${slideClass}`}>
              {/* ============ STEP 1: YOUR ACCOUNT ============ */}
              {step === 0 && (
                <div>
                  <h2 className="text-xl font-rubik font-semibold text-deep-green mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold">1</span>
                    Your Account
                  </h2>

                  <div className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Sarah Miller"
                        className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow ${
                          errors.fullName ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                        }`}
                      />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sarah@example.com"
                        className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow ${
                          errors.email ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                        }`}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className={`w-full px-4 py-3 pr-12 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow ${
                            errors.password ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirm Password <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          className={`w-full px-4 py-3 pr-12 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow ${
                            errors.confirmPassword ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>

                    {/* Age & Phone - side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Age
                        </label>
                        <input
                          id="age"
                          type="number"
                          min={1}
                          max={120}
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="25"
                          className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow ${
                            errors.age ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                          }`}
                        />
                        {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Phone <span className="text-gray-400 text-xs font-normal">(optional)</span>
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+44 7700 900000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============ STEP 2: YOUR LOCATION ============ */}
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-rubik font-semibold text-deep-green mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold">2</span>
                    Your Location
                  </h2>

                  <p className="text-sm text-gray-500 mb-6">
                    This helps us connect you with nearby dog owners and local events.
                  </p>

                  <div className="space-y-5">
                    {/* City */}
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="London"
                        className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow ${
                          errors.city ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                        }`}
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>

                    {/* State / Province */}
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1.5">
                        State / Province <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="state"
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Greater London"
                        className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow ${
                          errors.state ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                        }`}
                      />
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>

                    {/* Country */}
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Country <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${
                          errors.country ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                        } ${!country ? 'text-gray-400' : ''}`}
                      >
                        <option value="" disabled>
                          Select your country
                        </option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ============ STEP 3: YOUR DOG ============ */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-rubik font-semibold text-deep-green mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold">3</span>
                    Your Dog
                  </h2>

                  <div className="space-y-5">
                    {/* Photo Upload */}
                    <div className="flex justify-center mb-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="relative group"
                      >
                        <div
                          className={`w-28 h-28 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${
                            profilePhotoPreview
                              ? 'border-deep-green'
                              : 'border-gray-300 hover:border-gold group-hover:border-gold'
                          }`}
                        >
                          {profilePhotoPreview ? (
                            <img
                              src={profilePhotoPreview}
                              alt="Dog preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center">
                              <CameraIcon />
                              <span className="text-xs text-gray-400 mt-1">Add photo</span>
                            </div>
                          )}
                          {uploadingPhoto && (
                            <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-deep-green border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        {profilePhotoPreview && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold rounded-full flex items-center justify-center shadow-md">
                            <svg className="w-4 h-4 text-deep-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                          </div>
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                    </div>
                    {errors.profilePhoto && (
                      <p className="text-red-500 text-xs text-center">{errors.profilePhoto}</p>
                    )}

                    {/* Dog Name */}
                    <div>
                      <label htmlFor="dogName" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Dog Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="dogName"
                        type="text"
                        value={dogName}
                        onChange={(e) => setDogName(e.target.value)}
                        placeholder="Buddy"
                        className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow ${
                          errors.dogName ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                        }`}
                      />
                      {errors.dogName && <p className="text-red-500 text-xs mt-1">{errors.dogName}</p>}
                    </div>

                    {/* Breed (autocomplete) */}
                    <div>
                      <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Breed <span className="text-red-400">*</span>
                      </label>
                      <BreedAutocomplete
                        id="breed"
                        value={breed}
                        onChange={setBreed}
                        placeholder="Start typing a breed..."
                        error={errors.breed}
                      />
                    </div>

                    {/* Pet Type */}
                    <div>
                      <label htmlFor="petType" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Pet Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="petType"
                        value={petType}
                        onChange={(e) => setPetType(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${
                          errors.petType ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                        }`}
                      >
                        {PET_TYPES.map((pt) => (
                          <option key={pt} value={pt}>
                            {pt}
                          </option>
                        ))}
                      </select>
                      {errors.petType && <p className="text-red-500 text-xs mt-1">{errors.petType}</p>}
                    </div>

                    {/* Dog Age & Weight - side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="dogAge" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Age (years)
                        </label>
                        <input
                          id="dogAge"
                          type="number"
                          min={0}
                          max={30}
                          step="0.5"
                          value={dogAge}
                          onChange={(e) => setDogAge(e.target.value)}
                          placeholder="3"
                          className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow ${
                            errors.dogAge ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                          }`}
                        />
                        {errors.dogAge && <p className="text-red-500 text-xs mt-1">{errors.dogAge}</p>}
                      </div>

                      <div>
                        <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Weight (kg)
                        </label>
                        <input
                          id="weightKg"
                          type="number"
                          min={0}
                          max={150}
                          step="0.1"
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          placeholder="12"
                          className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow ${
                            errors.weightKg ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
                          }`}
                        />
                        {errors.weightKg && (
                          <p className="text-red-500 text-xs mt-1">{errors.weightKg}</p>
                        )}
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2.5">Gender</label>
                      <div className="flex gap-3">
                        {['Male', 'Female', 'Unknown'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                              gender === g
                                ? 'bg-deep-green text-white border-deep-green shadow-sm'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-deep-green/40'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============ STEP 4: LIFESTYLE & PREFERENCES ============ */}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-rubik font-semibold text-deep-green mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold">4</span>
                    Lifestyle & Preferences
                  </h2>

                  <div className="space-y-5">
                    {/* Diet & Activity - side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="dietPreference" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Diet Preference
                        </label>
                        <select
                          id="dietPreference"
                          value={dietPreference}
                          onChange={(e) => setDietPreference(e.target.value)}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${!dietPreference ? 'text-gray-400' : ''}`}
                        >
                          <option value="">Select diet</option>
                          {DIET_PREFERENCES.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Activity Level
                        </label>
                        <select
                          id="activityLevel"
                          value={activityLevel}
                          onChange={(e) => setActivityLevel(e.target.value)}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${!activityLevel ? 'text-gray-400' : ''}`}
                        >
                          <option value="">Select level</option>
                          {ACTIVITY_LEVELS.map((a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Temperament & Walk Pref - side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="temperament" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Temperament
                        </label>
                        <select
                          id="temperament"
                          value={temperament}
                          onChange={(e) => setTemperament(e.target.value)}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${!temperament ? 'text-gray-400' : ''}`}
                        >
                          <option value="">Select temperament</option>
                          {TEMPERAMENTS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="walkPreference" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Walk Preference
                        </label>
                        <select
                          id="walkPreference"
                          value={walkPreference}
                          onChange={(e) => setWalkPreference(e.target.value)}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${!walkPreference ? 'text-gray-400' : ''}`}
                        >
                          <option value="">Select preference</option>
                          {WALK_PREFERENCES.map((w) => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Favorite Activity */}
                    <div>
                      <label htmlFor="favoriteActivity" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Favorite Activity
                      </label>
                      <select
                        id="favoriteActivity"
                        value={favoriteActivity}
                        onChange={(e) => setFavoriteActivity(e.target.value)}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${!favoriteActivity ? 'text-gray-400' : ''}`}
                      >
                        <option value="">Select activity</option>
                        {FAVORITE_ACTIVITIES.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    {/* Toggle: Gets along with dogs */}
                    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Gets along with other dogs?</p>
                        <p className="text-xs text-gray-400 mt-0.5">Let others know if your dog is sociable</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={getsAlongWithDogs}
                        onClick={() => setGetsAlongWithDogs(!getsAlongWithDogs)}
                        className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-deep-green focus:ring-offset-2 ${
                          getsAlongWithDogs ? 'bg-deep-green' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                            getsAlongWithDogs ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle: Looking for a mate */}
                    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Looking for a mate for your dog?</p>
                        <p className="text-xs text-gray-400 mt-0.5">We&apos;ll help you find compatible matches</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={lookingForMate}
                        onClick={() => setLookingForMate(!lookingForMate)}
                        className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-deep-green focus:ring-offset-2 ${
                          lookingForMate ? 'bg-deep-green' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                            lookingForMate ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Mate preferences (conditional) */}
                    {lookingForMate && (
                      <div className="border border-deep-green/10 rounded-xl p-5 bg-deep-green/[0.02] space-y-5 animate-[fadeSlideIn_0.3s_ease-out]">
                        <p className="text-sm font-medium text-deep-green">Mate Preferences</p>

                        {/* Preferred Breed */}
                        <div>
                          <label htmlFor="preferredBreed" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Preferred Breed
                          </label>
                          <BreedAutocomplete
                            id="preferredBreed"
                            value={preferredBreed}
                            onChange={setPreferredBreed}
                            placeholder="Any breed or start typing..."
                          />
                        </div>

                        {/* Radius Slider */}
                        <div>
                          <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Preferred Area Radius:{' '}
                            <span className="text-gold font-semibold">{preferredRadiusKm} km</span>
                          </label>
                          <input
                            id="radius"
                            type="range"
                            min={5}
                            max={100}
                            step={5}
                            value={preferredRadiusKm}
                            onChange={(e) => setPreferredRadiusKm(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-deep-green"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>5 km</span>
                            <span>100 km</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1.5">
                        What makes your dog special?{' '}
                        <span className="text-gray-400 text-xs font-normal">(optional)</span>
                      </label>
                      <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="Tell us a fun fact, a quirky habit, or what makes your pup one-of-a-kind..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green focus:border-transparent transition-shadow resize-none"
                      />
                      <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/500</p>
                    </div>

                    {/* Share Contact Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={shareContact}
                        onChange={(e) => setShareContact(e.target.checked)}
                        className="mt-0.5 w-5 h-5 text-deep-green border-gray-300 rounded focus:ring-deep-green accent-deep-green"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Share my contact info with matches</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Other dog owners nearby can see your email/phone to arrange meetups
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* -------- Navigation Buttons -------- */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={animating || submitting}
                  className="flex items-center gap-2 text-deep-green font-medium text-sm hover:text-gold transition-colors disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={animating}
                  className="bg-gold hover:bg-yellow-500 text-deep-green font-semibold py-3 px-8 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || uploadingPhoto}
                  className="bg-deep-green hover:bg-deep-green/90 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md min-w-[180px]"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Footer note */}
        <p className="text-center text-deep-green/40 text-xs mt-8">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </main>

      {/* Keyframe animation for conditional sections */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
