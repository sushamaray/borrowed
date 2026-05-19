"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Camera, Check, Clock, Lightbulb, Loader, MapPin, Pencil, Search, ShieldCheck, Star, User, X } from "lucide-react";
import { LocationPickerModal } from "@/components/LocationPickerModal";
import CategoryPicker from "@/components/dashboard/CategoryPicker";
import { getCategoryForSub } from "@/lib/categories";

type VerificationKey = "identity" | "contact" | "nid" | "address" | "meetup";

const MAX_BROWSER_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 450 * 1024;
const NID_MAX_DIMENSION = 1600;
const SELFIE_MAX_DIMENSION = 1280;

const verificationFlags: Record<VerificationKey, boolean> = {
  identity: false,
  contact: false,
  nid: false,
  address: false,
  meetup: false,
};

const registrationMetadata = {
  memberSince: "2026",
  accountType: "Personal account",
  trustScore: 42,
};

const steps = [
  { label: "Email verified", done: true, locked: false },
  { label: "Phone number", done: verificationFlags.contact, locked: false },
  { label: "NID scan", done: verificationFlags.nid, locked: false },
  { label: "Face match", done: false, locked: !verificationFlags.nid },
  { label: "Borrow location", done: verificationFlags.address, locked: !verificationFlags.nid },
];

function SegmentedProgress({ value, fillClass = "bg-[var(--primary)]" }: { value: number; fillClass?: string }) {
  const active = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="flex h-full w-full overflow-hidden rounded-full">
      {Array.from({ length: 100 }, (_, i) => (
        <span key={i} className={`h-full flex-1 ${i < active ? fillClass : "bg-transparent"}`} />
      ))}
    </div>
  );
}

type MentorData = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  specialty: string;
  category: string;
  subcategories: string[];
  bio: string;
  tags: string[];
  rating: number;
  sessions: number;
  pricePerSession: number;
  available: boolean;
  responseTime: string;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  // 0=idle, 1=intro, 2=phone, 3=nid-upload, 4=face-scan, 5=matching, 6=done
  const [nidStep, setNidStep] = useState(0);
  const [faceProgress, setFaceProgress] = useState(0);
  const [matchScore, setMatchScore] = useState(0);
  const [faceVerificationStatus, setFaceVerificationStatus] = useState<"verified" | "rejected" | null>(null);
  const [uploadedNidName, setUploadedNidName] = useState("");
  const [uploadedSelfieName, setUploadedSelfieName] = useState("");
  const [nidPreviewUrl, setNidPreviewUrl] = useState("");
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorForm, setMentorForm] = useState({
    name: "", handle: "", specialty: "", category: "",
    subcategories: [] as string[],
    bio: "", pricePerSession: "500", responseTime: "Within 24 hours", tags: "",
  });
  const [submittingMentor, setSubmittingMentor] = useState(false);
  const [mentorError, setMentorError] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState<"user" | "mentor">("user");

  // Mentor profile state (for Mentor Profile tab)
  const [mentorProfile, setMentorProfile] = useState<MentorData | null>(null);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<MentorData> & { tagsInput?: string }>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const nidInputRef = useRef<HTMLInputElement | null>(null);
  const selfieCameraInputRef = useRef<HTMLInputElement | null>(null);
  const selfieUploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (nidPreviewUrl) {
        URL.revokeObjectURL(nidPreviewUrl);
      }
      if (selfiePreviewUrl) {
        URL.revokeObjectURL(selfiePreviewUrl);
      }
    };
  }, [nidPreviewUrl, selfiePreviewUrl]);

  const profileName = session?.user?.name || "Borrowed Member";
  const profileEmail = session?.user?.email || "No email available";
  const profileInitials = useMemo(() => {
    return profileName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [profileName]);
  const userHandle = profileEmail.includes("@")
    ? `@${profileEmail.split("@")[0]}`
    : "@borrowed-user";
  const currentLocation = location;

  const completedCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done && !s.locked);

  const mentorInitials = mentorProfile?.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") ?? "";

  // Init active tab from URL query param (?tab=mentor)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "mentor") setActiveTab("mentor");
  }, []);

  // Fetch fresh location from DB on mount (session JWT is stale after updates)
  useEffect(() => {
    fetch("/api/user/location")
      .then((r) => r.json())
      .then((data) => {
        if (data.location) setLocation(data.location);
        if (typeof data.latitude === "number") setLatitude(data.latitude);
        if (typeof data.longitude === "number") setLongitude(data.longitude);
      })
      .catch(() => {})
      .finally(() => setLocationLoading(false));
  }, []);

  // Fetch mentor profile data for the Mentor Profile tab
  useEffect(() => {
    if (!session?.user?.isMentor) return;
    setMentorLoading(true);
    fetch("/api/mentors/me")
      .then((r) => r.json())
      .then((data) => setMentorProfile(data))
      .catch(() => {})
      .finally(() => setMentorLoading(false));
  }, [session?.user?.isMentor]);

  const replacePreviewUrl = (
    currentPreviewUrl: string,
    nextFile: File,
    setPreviewUrl: (previewUrl: string) => void,
  ) => {
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
    }

    setPreviewUrl(URL.createObjectURL(nextFile));
  };

  const canvasToBlob = (
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality?: number,
  ) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to process image"));
          return;
        }

        resolve(blob);
      }, mimeType, quality);
    });

  const optimizeImageForUpload = async (
    file: File,
    maxDimension: number,
  ) => {
    if (file.size > MAX_BROWSER_IMAGE_BYTES) {
      throw new Error("Image must be 10MB or smaller");
    }

    const sourceUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const nextImage = new window.Image();
        nextImage.onload = () => resolve(nextImage);
        nextImage.onerror = () => reject(new Error("Failed to load image preview"));
        nextImage.src = sourceUrl;
      });

      let width = image.width;
      let height = image.height;
      const initialScale = Math.min(1, maxDimension / Math.max(width, height));

      width = Math.max(1, Math.round(width * initialScale));
      height = Math.max(1, Math.round(height * initialScale));

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Failed to prepare image processing");
      }

      let quality = file.type === "image/webp" ? 0.9 : 0.86;
      const mimeType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
      let blob: Blob | null = null;

      for (let attempt = 0; attempt < 6; attempt += 1) {
        canvas.width = width;
        canvas.height = height;
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        blob = await canvasToBlob(canvas, mimeType, quality);

        if (blob.size <= MAX_STORED_IMAGE_BYTES) {
          break;
        }

        quality = Math.max(0.55, quality - 0.08);
        width = Math.max(720, Math.round(width * 0.88));
        height = Math.max(720, Math.round(height * 0.88));
      }

      if (!blob) {
        throw new Error("Failed to process image");
      }

      return new File([blob], file.name, {
        type: mimeType,
        lastModified: Date.now(),
      });
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }
  };

  const uploadVerificationImage = async (kind: "front" | "selfie", file: File) => {
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    const response = await fetch("/api/nid-verification", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const messageParts = [
        typeof data?.error === "string" ? data.error : "Failed to upload image",
        typeof data?.details === "string" ? data.details : null,
      ].filter(Boolean);

      throw new Error(
        messageParts.join(": "),
      );
    }
  };

  const handleNidFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setVerificationLoading(true);
    setMessage(null);

    try {
      const optimizedFile = await optimizeImageForUpload(file, NID_MAX_DIMENSION);
      await uploadVerificationImage("front", optimizedFile);
      setUploadedNidName(file.name);
      replacePreviewUrl(nidPreviewUrl, optimizedFile, setNidPreviewUrl);
      setMessage({ type: "success", text: "NID photo uploaded successfully." });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Failed to upload NID photo";
      setMessage({ type: "error", text });
    } finally {
      setVerificationLoading(false);
      event.target.value = "";
    }
  };

  const handleSelfieFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setVerificationLoading(true);
    setMessage(null);

    try {
      const optimizedFile = await optimizeImageForUpload(file, SELFIE_MAX_DIMENSION);
      await uploadVerificationImage("selfie", optimizedFile);
      setUploadedSelfieName(file.name);
      replacePreviewUrl(selfiePreviewUrl, optimizedFile, setSelfiePreviewUrl);
      setMessage({ type: "success", text: "Selfie captured successfully." });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Failed to upload selfie";
      setMessage({ type: "error", text });
    } finally {
      setVerificationLoading(false);
      event.target.value = "";
    }
  };

  const handleFaceScan = async () => {
    if (!session?.user?.id) {
      setMessage({ type: "error", text: "Please sign in again to verify your identity." });
      return;
    }

    if (!uploadedNidName) {
      setMessage({ type: "error", text: "Upload your NID photo first." });
      setNidStep(3);
      return;
    }

    if (!uploadedSelfieName) {
      setMessage({ type: "error", text: "Capture or upload your selfie first." });
      return;
    }

    setNidStep(5);
    setVerificationLoading(true);
    setFaceProgress(12);
    setFaceVerificationStatus(null);
    setMessage(null);

    const progressTimer = window.setInterval(() => {
      setFaceProgress((current) => {
        if (current >= 92) {
          return current;
        }

        return current + Math.max(3, Math.round((100 - current) / 7));
      });
    }, 180);

    try {
      const response = await fetch(
        `/api/nid-verification/face-match/${session.user.id}`,
        { method: "POST" },
      );
      const data = await response.json();

      if (!response.ok || !data?.success) {
        const messageParts = [
          typeof data?.error === "string"
            ? data.error
            : "Face verification failed",
          typeof data?.details === "string" ? data.details : null,
        ].filter(Boolean);

        throw new Error(
          messageParts.join(": "),
        );
      }

      window.clearInterval(progressTimer);
      setFaceProgress(100);
      setMatchScore(
        typeof data.similarityScore === "number"
          ? Math.round(data.similarityScore)
          : 0,
      );
      setFaceVerificationStatus(data?.status === "verified" ? "verified" : "rejected");
      setTimeout(() => setNidStep(6), 400);
    } catch (error) {
      window.clearInterval(progressTimer);
      setFaceProgress(0);
      setNidStep(4);
      const text =
        error instanceof Error ? error.message : "Face verification failed";
      setMessage({ type: "error", text });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleLocationConfirm = async (result: { location: string; latitude: number; longitude: number }) => {
    setShowLocationModal(false);
    setLocation(result.location);
    setLatitude(result.latitude);
    setLongitude(result.longitude);
    setSaving(true);
    try {
      const response = await fetch("/api/user/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (response.ok) {
        setMessage({ type: "success", text: "Location saved!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "Failed to save location" });
      }
    } catch {
      setMessage({ type: "error", text: "Error saving location" });
    } finally {
      setSaving(false);
    }
  };

  const handleBecomeMentor = async () => {
    setSubmittingMentor(true);
    setMentorError("");
    try {
      const tags = mentorForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch("/api/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...mentorForm, tags, pricePerSession: Number(mentorForm.pricePerSession), subcategories: mentorForm.subcategories }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMentorError(data.error ?? "Failed to create mentor profile");
        return;
      }
      // Hard navigation forces the server to re-run the jwt callback,
      // which queries the DB and bakes isMentor: true into the new cookie.
      window.location.href = "/dashboard/mentor";
    } catch {
      setMentorError("Something went wrong. Please try again.");
    } finally {
      setSubmittingMentor(false);
    }
  };

  const openEdit = () => {
    if (!mentorProfile) return;
    setEditForm({
      name: mentorProfile.name,
      specialty: mentorProfile.specialty,
      category: mentorProfile.category,
      subcategories: Array.isArray(mentorProfile.subcategories) ? mentorProfile.subcategories : [],
      bio: mentorProfile.bio,
      pricePerSession: mentorProfile.pricePerSession,
      responseTime: mentorProfile.responseTime,
      tagsInput: Array.isArray(mentorProfile.tags) ? mentorProfile.tags.join(", ") : "",
    });
    setEditError("");
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    setEditError("");
    try {
      const tags = (editForm.tagsInput ?? "").split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch("/api/mentors/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, tags, tagsInput: undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error ?? "Failed to save");
        return;
      }
      const updated = await res.json();
      setMentorProfile(updated);
      setShowEditModal(false);
    } finally {
      setSavingEdit(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="rounded-[1rem] border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-6">
        <p className="text-[var(--danger)]">Please log in to access your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Profile Overview
        </p>
        <h1 className="mt-1 text-[clamp(2.1rem,4vw,2.4rem)] font-black tracking-[-0.04em] text-[var(--ink)]">
          {profileName}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
          Review your account identity, track verification progress, and manage the details that
          support safe borrowing handoffs.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 rounded-[1rem] border px-4 py-3 text-sm font-semibold ${
            message.type === "success"
              ? "border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]"
              : "border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tab bar — only shown for mentors */}
      {session?.user?.isMentor && (
        <div className="flex w-fit gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-1">
          {(["user", "mentor"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-5 py-2 text-sm font-bold transition-all ${
                activeTab === tab
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--ink)]"
              }`}
            >
              {tab === "user" ? "User Info" : "Mentor Profile"}
            </button>
          ))}
        </div>
      )}

      {/* ── User Info tab ── */}
      {activeTab === "user" && (
        <>
          {/* Main two-column grid */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-4">
              {/* Identity card */}
              <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-4 border-[var(--surface-soft)] bg-[var(--primary-soft)] text-2xl font-black text-[var(--primary)]">
                    {profileInitials || "B"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-black text-[var(--ink)]">{profileName}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] ${
                          verificationFlags.identity
                            ? "bg-[var(--success-soft)] text-[var(--success)]"
                            : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
                        }`}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <path d="M12 16h.01" />
                        </svg>
                        {verificationFlags.identity ? "VERIFIED" : "UNVERIFIED"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)]">{userHandle}</p>
                    <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                      Complete verification to unlock stronger trust signals and private coordination
                      details.
                    </p>
                  </div>
                </div>

                {/* Trust score */}
                <div className="mb-4 rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                        Trust Score
                      </p>
                      <p className="mt-0.5 text-[1.5rem] font-black tracking-[-0.03em] text-[var(--ink)]">
                        {registrationMetadata.trustScore}
                        <span className="text-base font-semibold text-[var(--text-muted)]">/100</span>
                      </p>
                    </div>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                    <SegmentedProgress value={registrationMetadata.trustScore} />
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Verification Progress
                    </span>
                    <span className="text-[0.7rem] font-bold text-[var(--text-muted)]">
                      {completedCount}/{steps.length} complete
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setNidStep(1)}
                  className="w-full rounded-full bg-[var(--primary)] py-3 text-sm font-extrabold text-white transition-colors hover:bg-[var(--primary-hover)]"
                >
                  Complete Verification →
                </button>
              </div>

              {/* Verification steps */}
              <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
                <p className="mb-4 text-sm font-extrabold text-[var(--ink)]">Verification Steps</p>
                <div className="flex flex-col gap-2.5">
                  {steps.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 rounded-[0.75rem] border px-3.5 py-2.5 ${
                        s.done
                          ? "border-[var(--success)]/30 bg-[var(--success-soft)]"
                          : "border-[var(--border)] bg-[var(--surface-soft)]"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                          s.done ? "bg-[var(--success)]" : "bg-[var(--border)]"
                        }`}
                      >
                        {s.done ? (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span className="text-[0.68rem] font-extrabold text-[var(--text-muted)]">
                            {i + 1}
                          </span>
                        )}
                      </div>
                      <span
                        className={`flex-1 text-sm font-semibold ${
                          s.done ? "text-[var(--success)]" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {s.label}
                      </span>
                      {!s.done && !s.locked && i <= 2 && (
                        <button
                          type="button"
                          onClick={() => setNidStep(1)}
                          className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[0.72rem] font-bold text-[var(--primary)] transition-colors hover:bg-[var(--accent-soft)]"
                        >
                          Start
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-4">
              {/* Registration details */}
              <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-lg font-extrabold text-[var(--ink)]">Registration details</p>
                  <span className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Signup info only
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "EMAIL ADDRESS", value: profileEmail },
                    {
                      label: "ACCOUNT STATUS",
                      value: verificationFlags.identity ? "Verified member" : "Verification pending",
                    },
                    { label: "ACCOUNT HANDLE", value: userHandle },
                    { label: "MEMBER SINCE", value: registrationMetadata.memberSince },
                    { label: "ACCOUNT TYPE", value: registrationMetadata.accountType },
                    {
                      label: "NEXT STEP",
                      value: nextStep?.label ?? "All verification complete",
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="rounded-[0.75rem] border border-[var(--border)] bg-[var(--surface-soft)] p-3.5"
                    >
                      <p className="mb-1 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                        {row.label}
                      </p>
                      <p className="break-words text-sm font-bold text-[var(--ink)]">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI verification badge */}
              <div
                className="relative overflow-hidden rounded-[1.25rem] bg-[linear-gradient(140deg,#12082e_0%,#251a52_45%,#3b2a80_100%)] p-5 shadow-[0_20px_60px_rgba(18,8,46,0.35)]"
              >
                {/* Decorative radial glow top-right */}
                <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-[radial-gradient(circle,#6d5bba_0%,transparent_70%)] opacity-30" />

                <div className="relative mb-4 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.85rem] border border-white/[0.18] bg-white/12"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.8"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-white/50">
                      Powered by AI
                    </p>
                    <p className="text-base font-black text-white">Identity Verification</p>
                  </div>
                </div>

                <p className="relative mb-5 text-sm leading-6 text-white/75">
                  Upload your NID, verify your phone, and take a live selfie. Our AI matches your face
                  in under 30 seconds — fully encrypted.
                </p>

                <div className="relative mb-5 flex flex-col gap-2">
                  {[
                    "Upload National ID card",
                    "Verify your phone number",
                    "Take a live selfie",
                    "Instant AI face-match result",
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/[0.18] text-[0.65rem] font-extrabold text-white"
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-white/80">{s}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setNidStep(1)}
                  className="relative w-full rounded-full bg-white py-3 text-sm font-extrabold text-(--primary) shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-opacity hover:opacity-90"
                >
                  Start Verification →
                </button>
              </div>
            </div>
          </div>

          {/* Borrow location — full width below grid */}
          <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
            <p className="mb-1 text-sm font-extrabold text-[var(--ink)]">Borrow location</p>
            <p className="mb-3 text-sm leading-6 text-[var(--text-secondary)]">
              Set your handoff area so lenders and the emergency system can find you nearby.
            </p>
            <div className="rounded-[1rem] bg-[var(--surface-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-(--primary)" />
                  <span className="min-w-0 break-words text-sm font-medium text-(--foreground)">
                    {locationLoading ? (
                      <span className="inline-block h-3 w-32 animate-pulse rounded bg-(--border)" />
                    ) : currentLocation || (
                      <span className="text-(--text-secondary)">No location set</span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-bold text-(--primary) hover:bg-(--primary)/5 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  {currentLocation ? "Change" : "Set location"}
                </button>
              </div>
              {saving && (
                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-(--primary)">
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving…
                </div>
              )}
              {message && (
                <p className={`mt-2 text-xs font-medium ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
                  {message.text}
                </p>
              )}
            </div>
          </div>

          {/* Mentor profile — full width */}
          <div className="rounded-[1.25rem] border border-(--border) bg-(--surface) p-5 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Star className="h-4 w-4 text-(--primary)" strokeWidth={2} />
                  <p className="text-sm font-extrabold text-(--ink)">Mentor Profile</p>
                  {session?.user?.isMentor && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-(--success-soft) px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.08em] text-(--success)">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} /> Active
                    </span>
                  )}
                </div>
                <p className="text-sm leading-6 text-(--text-secondary)">
                  {session?.user?.isMentor
                    ? "Manage your sessions and availability from the mentor dashboard."
                    : "Share your expertise and help others grow. Set your own schedule and price per session."}
                </p>
              </div>
              {session?.user?.isMentor ? (
                <a
                  href="/dashboard/mentor"
                  className="shrink-0 rounded-full bg-(--primary) px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-(--primary-hover)"
                >
                  Mentor Dashboard →
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMentorForm((f) => ({ ...f, name: profileName !== "Borrowed Member" ? profileName : "" }));
                    setShowMentorModal(true);
                  }}
                  className="shrink-0 rounded-full bg-(--primary) px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-(--primary-hover)"
                >
                  Become a Mentor →
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Mentor Profile tab ── */}
      {activeTab === "mentor" && session?.user?.isMentor && (
        <div className="space-y-5">
          {mentorLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-[var(--primary)]" />
            </div>
          ) : mentorProfile ? (
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
              <div className="mb-4 flex items-start justify-between">
                <p className="text-sm font-extrabold text-[var(--ink)]">Profile</p>
                <button
                  type="button"
                  onClick={openEdit}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              </div>

              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-2xl font-black text-[var(--primary)]">
                  {mentorInitials || <User className="h-7 w-7" />}
                </div>
                <div>
                  <p className="font-black text-[var(--ink)]">{mentorProfile.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">@{mentorProfile.handle}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{mentorProfile.specialty} · {mentorProfile.category}</p>
                </div>
              </div>

              <p className="mb-4 text-sm leading-6 text-[var(--text-secondary)]">{mentorProfile.bio}</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Rating", value: `${Number(mentorProfile.rating).toFixed(1)} / 5.0`, icon: <Star className="h-3.5 w-3.5" /> },
                  { label: "Sessions", value: String(mentorProfile.sessions), icon: <User className="h-3.5 w-3.5" /> },
                  { label: "Price / session", value: `৳${mentorProfile.pricePerSession}`, icon: null },
                  { label: "Response time", value: mentorProfile.responseTime, icon: <Clock className="h-3.5 w-3.5" /> },
                ].map((row) => (
                  <div key={row.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                    <p className="mb-0.5 text-[0.65rem] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">{row.label}</p>
                    <p className="flex items-center gap-1 text-sm font-bold text-[var(--ink)]">
                      {row.icon && <span className="text-[var(--primary)]">{row.icon}</span>}
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>

              {Array.isArray(mentorProfile.tags) && mentorProfile.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {mentorProfile.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">Could not load mentor profile.</p>
            </div>
          )}
        </div>
      )}

      {showLocationModal && (
        <LocationPickerModal
          initialLocation={currentLocation || undefined}
          initialLat={latitude}
          initialLng={longitude}
          onConfirm={handleLocationConfirm}
          onClose={() => setShowLocationModal(false)}
        />
      )}

      {/* Become a Mentor Modal */}
      {showMentorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,32,30,0.8)] p-4 backdrop-blur-[4px]"
          onClick={(e) => e.target === e.currentTarget && setShowMentorModal(false)}
        >
          <div className="scrollbar-thin relative max-h-[90vh] w-full max-w-130 overflow-y-auto rounded-3xl bg-(--surface) p-8 shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
            <button
              type="button"
              onClick={() => setShowMentorModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-(--surface-soft) text-sm text-(--text-secondary) transition-colors hover:bg-(--accent-soft)"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>

            <p className="mb-1 text-xl font-black text-(--ink)">Become a Mentor</p>
            <p className="mb-6 text-sm leading-6 text-(--text-secondary)">
              Set up your mentor profile to start helping others and earning from your expertise.
            </p>

            {mentorError && (
              <div className="mb-4 rounded-xl border border-(--danger)/20 bg-(--danger-soft) px-4 py-3 text-sm font-semibold text-(--danger)">
                {mentorError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Display Name</label>
                <input
                  type="text"
                  value={mentorForm.name}
                  onChange={(e) => setMentorForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-semibold text-(--ink) placeholder:text-(--text-muted) focus:border-(--primary) focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Handle</label>
                <input
                  type="text"
                  value={mentorForm.handle}
                  onChange={(e) => setMentorForm((f) => ({ ...f, handle: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                  placeholder="e.g. john-doe"
                  className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-semibold text-(--ink) placeholder:text-(--text-muted) focus:border-(--primary) focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Specialty</label>
                <input
                  type="text"
                  value={mentorForm.specialty}
                  onChange={(e) => setMentorForm((f) => ({ ...f, specialty: e.target.value }))}
                  placeholder="e.g. Landscape Photography, Guitar Repair"
                  className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-semibold text-(--ink) placeholder:text-(--text-muted) focus:border-(--primary) focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Expertise Areas</label>
                <CategoryPicker
                  mode="multi"
                  value={mentorForm.subcategories}
                  onChange={(v) =>
                    setMentorForm((f) => ({
                      ...f,
                      subcategories: v,
                      category: v.length > 0 ? getCategoryForSub(v[0]) : f.category,
                    }))
                  }
                  disabled={submittingMentor}
                  placeholder="Select your expertise areas"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Bio</label>
                <textarea
                  rows={3}
                  value={mentorForm.bio}
                  onChange={(e) => setMentorForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell learners about your background and expertise..."
                  className="w-full resize-none rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-semibold text-(--ink) placeholder:text-(--text-muted) focus:border-(--primary) focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Price / Session (BDT)</label>
                  <input
                    type="number"
                    min={0}
                    value={mentorForm.pricePerSession}
                    onChange={(e) => setMentorForm((f) => ({ ...f, pricePerSession: e.target.value }))}
                    className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-semibold text-(--ink) focus:border-(--primary) focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Response Time</label>
                  <input
                    type="text"
                    value={mentorForm.responseTime}
                    onChange={(e) => setMentorForm((f) => ({ ...f, responseTime: e.target.value }))}
                    placeholder="e.g. Within 2 hours"
                    className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-semibold text-(--ink) placeholder:text-(--text-muted) focus:border-(--primary) focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-(--text-muted)">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={mentorForm.tags}
                  onChange={(e) => setMentorForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. Next.js, TypeScript, System Design"
                  className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-semibold text-(--ink) placeholder:text-(--text-muted) focus:border-(--primary) focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleBecomeMentor}
                disabled={submittingMentor}
                className="mt-2 flex items-center justify-center gap-2 rounded-full bg-(--primary) py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-60"
              >
                {submittingMentor && <Loader className="h-4 w-4 animate-spin" />}
                {submittingMentor ? "Creating profile…" : "Become a Mentor →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mentor Profile Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,32,30,0.8)] p-4 backdrop-blur-xs"
          onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div className="scrollbar-thin relative max-h-[90vh] w-full max-w-130 overflow-y-auto rounded-3xl bg-[var(--surface)] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-soft)]"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>

            <p className="mb-1 text-xl font-black text-[var(--ink)]">Edit Mentor Profile</p>
            <p className="mb-6 text-sm leading-6 text-[var(--text-secondary)]">Update your profile details.</p>

            {editError && (
              <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">
                {editError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {[
                { key: "name", label: "Display Name", type: "text" },
                { key: "specialty", label: "Specialty", type: "text" },
                { key: "responseTime", label: "Response Time", type: "text" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">{label}</label>
                  <input
                    type={type}
                    value={(editForm as Record<string, string | number>)[key] as string ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--ink)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">Expertise Areas</label>
                <CategoryPicker
                  mode="multi"
                  value={editForm.subcategories ?? []}
                  onChange={(v) =>
                    setEditForm((f) => ({
                      ...f,
                      subcategories: v,
                      category: v.length > 0 ? getCategoryForSub(v[0]) : f.category,
                    }))
                  }
                  disabled={savingEdit}
                  placeholder="Select your expertise areas"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">Bio</label>
                <textarea
                  rows={3}
                  value={editForm.bio ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--ink)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">Price / Session (BDT)</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.pricePerSession ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, pricePerSession: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--ink)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.tagsInput ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, tagsInput: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--ink)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-60"
              >
                {savingEdit ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.5} />}
                {savingEdit ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NID Verification Modal */}
      {nidStep > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,32,30,0.8)] p-4 backdrop-blur-[4px]"
          onClick={(e) => e.target === e.currentTarget && nidStep !== 5 && setNidStep(0)}
        >
          <div className="scrollbar-thin relative max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-[1.5rem] bg-[var(--surface)] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
            {nidStep < 6 && (
              <button
                type="button"
                onClick={() => setNidStep(0)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[0.5rem] bg-[var(--surface-soft)] text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-soft)]"
              >
                <X className="h-4 w-4" strokeWidth={2.4} />
              </button>
            )}

            {/* Step progress bars — 5 segments */}
            {nidStep < 6 && (
              <div className="mb-6 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${nidStep >= s ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
                  />
                ))}
              </div>
            )}

            {/* Step 1: Intro */}
            {nidStep === 1 && (
              <div>
                <div className="mb-6 text-center">
                  <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-[var(--primary)]" strokeWidth={1.8} />
                  <p className="mb-2 text-xl font-black text-[var(--ink)]">Verify Your Identity</p>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    We&apos;ll verify your phone, scan your NID, and match your face using AI. This
                    takes about 60 seconds and is completely secure.
                  </p>
                </div>
                <div className="mb-6 flex flex-col gap-2">
                  {[
                    "Government-issued NID card required",
                    "Photos are encrypted & not stored",
                    "Powered by on-device AI face matching",
                  ].map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-[0.65rem] border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5"
                    >
                      <Check className="h-4 w-4 flex-shrink-0 text-[var(--success)]" strokeWidth={2.6} />
                      <span className="text-sm text-[var(--text-secondary)]">{t}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setNidStep(2)}
                  className="w-full rounded-full bg-[var(--primary)] py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-[var(--primary-hover)]"
                >
                  Begin Verification →
                </button>
              </div>
            )}

            {/* Step 2: Phone verification */}
            {nidStep === 2 && (
              <div>
                <p className="mb-1 text-lg font-black text-[var(--ink)]">
                  Step 1 — Phone Verification
                </p>
                <p className="mb-5 text-sm leading-6 text-[var(--text-secondary)]">
                  Used for delivery handoff, urgent coordination, and account recovery.
                </p>
                <div className="mb-4">
                  <label className="mb-2 block text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    placeholder="+880 1X XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-[0.75rem] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--ink)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  className="mb-4 w-full rounded-full border border-[var(--border)] bg-[var(--surface-soft)] py-3 text-sm font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
                >
                  Send OTP
                </button>
                <button
                  type="button"
                  onClick={() => setNidStep(3)}
                  className="w-full rounded-full bg-[var(--primary)] py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-[var(--primary-hover)]"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Step 3: NID upload */}
            {nidStep === 3 && (
              <div>
                <input
                  ref={nidInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleNidFileChange}
                />
                <p className="mb-1 text-lg font-black text-[var(--ink)]">Step 2 — Upload NID</p>
                <p className="mb-5 text-sm leading-6 text-[var(--text-secondary)]">
                  Take a clear photo of your National Identity Card (front side).
                </p>
                <div
                  className="relative mb-4 cursor-pointer overflow-hidden rounded-[1.1rem] border-2 border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-10 text-center transition-colors hover:border-[var(--primary)]"
                  onClick={() => nidInputRef.current?.click()}
                >
                  {nidPreviewUrl && (
                    <>
                      <img
                        src={nidPreviewUrl}
                        alt="NID preview"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 py-4 text-left">
                        <p className="text-sm font-extrabold text-white">Tap to replace NID photo</p>
                        <p className="text-xs text-white/80">Max 10MB input · Optimized automatically</p>
                      </div>
                    </>
                  )}
                  <Camera
                    className={`mx-auto mb-2 h-8 w-8 text-[var(--primary)] ${nidPreviewUrl ? "opacity-0" : ""}`}
                    strokeWidth={1.8}
                  />
                  <p className={`mb-1 text-sm font-bold text-[var(--primary)] ${nidPreviewUrl ? "opacity-0" : ""}`}>
                    Tap to upload NID photo
                  </p>
                  <p className={`text-xs text-[var(--text-muted)] ${nidPreviewUrl ? "opacity-0" : ""}`}>
                    JPG, PNG · Max 10MB · Front side only
                  </p>
                </div>
                {uploadedNidName && (
                  <div className="mb-4 rounded-[0.75rem] border border-[var(--success)]/25 bg-[var(--success-soft)] px-4 py-3 text-sm font-semibold text-[var(--success)]">
                    Uploaded: {uploadedNidName}
                  </div>
                )}
                <div className="mb-5 grid grid-cols-2 gap-2">
                  {[
                    "Hold card flat under good lighting",
                    "Ensure all corners are visible",
                    "No glare or blurring",
                    "Card must not be expired",
                  ].map((tip, i) => (
                    <div
                      key={i}
                      className="flex gap-1.5 rounded-[0.65rem] border border-[var(--accent-soft)] bg-[var(--accent)] px-3 py-2 text-xs text-[var(--foreground)]"
                    >
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--primary)]" strokeWidth={2.2} />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setNidStep(4)}
                  disabled={!uploadedNidName || verificationLoading}
                  className="w-full rounded-full bg-[var(--primary)] py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Step 4: Face scan */}
            {nidStep === 4 && (
              <div>
                <input
                  ref={selfieCameraInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleSelfieFileChange}
                />
                <input
                  ref={selfieUploadInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/*"
                  className="hidden"
                  onChange={handleSelfieFileChange}
                />
                <p className="mb-1 text-lg font-black text-[var(--ink)]">Step 3 — Face Scan</p>
                <p className="mb-5 text-sm leading-6 text-[var(--text-secondary)]">
                  Look directly at the camera. Our AI will match your face to your NID photo.
                </p>
                <div className="relative mb-4 flex h-56 items-center justify-center overflow-hidden rounded-[1.1rem] bg-[var(--ink)]">
                  {selfiePreviewUrl && (
                    <img
                      src={selfiePreviewUrl}
                      alt="Selfie preview"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute h-40 w-28 rounded-[60px] border-2 border-[var(--primary)] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                  <div className="relative z-10 flex h-40 w-28 items-center justify-center rounded-[60px] bg-gradient-to-b from-[var(--primary-soft)] to-[var(--primary)]">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                    </svg>
                  </div>
                  <div className="absolute left-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" />
                  <div className="absolute left-7 top-4 text-[0.7rem] font-bold text-white/80">
                    ● LIVE
                  </div>
                  <div className="absolute bottom-3 text-xs font-semibold text-white/70">
                    Center your face in the frame
                  </div>
                </div>
                <div className="mb-5 flex items-center gap-3 rounded-[0.75rem] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>
                  Remove glasses, hats, or masks. Ensure good lighting.
                </div>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => selfieCameraInputRef.current?.click()}
                    disabled={verificationLoading}
                    className="rounded-full border border-[var(--border)] bg-white py-3 text-sm font-extrabold text-[var(--ink)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    Open Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => selfieUploadInputRef.current?.click()}
                    disabled={verificationLoading}
                    className="rounded-full border border-[var(--border)] bg-white py-3 text-sm font-extrabold text-[var(--ink)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {uploadedSelfieName ? "Upload Again" : "Upload Selfie"}
                  </button>
                </div>
                {uploadedSelfieName && (
                  <div className="mb-5 rounded-[0.75rem] border border-[var(--success)]/25 bg-[var(--success-soft)] px-4 py-3 text-sm font-semibold text-[var(--success)]">
                    Selfie ready: {uploadedSelfieName}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleFaceScan}
                  disabled={verificationLoading}
                  className="w-full rounded-full bg-[var(--primary)] py-3.5 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Capture & Analyze
                </button>
              </div>
            )}

            {/* Step 5: AI matching */}
            {nidStep === 5 && (
              <div className="py-4 text-center">
                <Search className="mx-auto mb-4 h-10 w-10 text-[var(--primary)]" strokeWidth={1.8} />
                <p className="mb-2 text-xl font-black text-[var(--ink)]">AI Matching in Progress…</p>
                <p className="mb-6 text-sm text-[var(--text-secondary)]">
                  Comparing facial features from your NID with live capture
                </p>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                  <SegmentedProgress value={faceProgress} />
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {faceProgress}% —{" "}
                  {faceProgress < 40
                    ? "Detecting facial landmarks…"
                    : faceProgress < 70
                      ? "Comparing with NID photo…"
                      : "Calculating match confidence…"}
                </p>
              </div>
            )}

            {/* Step 6: Result */}
            {nidStep === 6 && (
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success)]">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="mb-2 flex items-center justify-center gap-2 text-2xl font-black text-[var(--ink)]">
                  {faceVerificationStatus === "verified" ? (
                    <>
                      Identity Verified! <Check className="h-6 w-6 text-[var(--success)]" strokeWidth={2.6} />
                    </>
                  ) : (
                    <>
                      Identity Not Verified <X className="h-6 w-6 text-[var(--danger)]" strokeWidth={2.6} />
                    </>
                  )}
                </p>
                <p className="mb-5 text-sm leading-6 text-[var(--text-secondary)]">
                  {faceVerificationStatus === "verified"
                    ? "Your NID and face matched successfully. Your trust score has been updated."
                    : "Your face match score is below the 70% requirement, so this account was not marked as verified."}
                </p>
                <div className="mb-5 rounded-[1rem] border border-[var(--success)]/30 bg-[var(--success-soft)] p-4 text-left">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--success)]">
                      AI Match Confidence
                    </span>
                    <span className={`text-xl font-black ${faceVerificationStatus === "verified" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{matchScore}%</span>
                  </div>
                  <div className={`mb-3 h-1.5 overflow-hidden rounded-full ${faceVerificationStatus === "verified" ? "bg-[var(--success)]/20" : "bg-[var(--danger)]/20"}`}>
                    <SegmentedProgress
                      value={matchScore}
                      fillClass={faceVerificationStatus === "verified" ? "bg-[var(--success)]" : "bg-[var(--danger)]"}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["NID Scan", "Face Match", "Liveness", "Document Validity"].map(
                      (s, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 rounded-[0.5rem] bg-[var(--success)]/10 px-3 py-1.5 text-xs font-bold text-[var(--success)]"
                        >
                          <Check className="h-3 w-3" strokeWidth={2.6} />
                          {s}
                        </div>
                      ),
                    )}
                  </div>
                </div>
                <div className="mb-5 rounded-[0.75rem] bg-[var(--primary-soft)] px-4 py-3 text-sm font-semibold text-[var(--primary)]">
                  Trust Score updated: <strong>42 → 68/100</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setNidStep(0)}
                  className="rounded-full bg-[var(--primary)] px-10 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[var(--primary-hover)]"
                >
                  {faceVerificationStatus === "verified" ? "Done" : "Try Again"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
