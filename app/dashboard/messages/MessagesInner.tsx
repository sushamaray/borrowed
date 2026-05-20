"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import {
  Plus,
  Package,
  Inbox,
  Star,
  X,
  Zap,
  Loader2,
} from "lucide-react";
import ItemShareModal from "@/components/dashboard/ItemShareModal";
import CategoryPicker from "@/components/dashboard/CategoryPicker";
import { LocationPickerModal } from "@/components/LocationPickerModal";

type MessageCardType = "text" | "item_share" | "item_offer" | "private_borrow_request";

interface Message {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  senderId?: string;
  senderName?: string;
  type?: MessageCardType;
  metadata?: Record<string, unknown> | null;
}

interface Conversation {
  id: string;
  with: { id: string; name: string; handle: string; avatar: string };
  lastMsg: string;
  time: string;
  unread: number;
  messages: Message[];
}

interface LentItemForShare {
  id: string;
  status: string;
  pricePerDay: number | null;
  product: { name: string; slug: string; category: string | null; imageUrl: string | null };
}

const MESSAGE_MAX_LENGTH = 1000;
const NEW_CONV_ID = "__new__";

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  const sizeClass =
    size === 40 ? "h-10 w-10 text-[13.6px]" :
    size === 38 ? "h-[38px] w-[38px] text-[13px]" :
    size === 28 ? "h-7 w-7 text-[9.5px]" : "h-9 w-9 text-[12px]";
  return (
    <div className={`flex flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b2a80bb,#3b2a80)] font-black text-white shadow-[0_2px_8px_rgba(47,35,106,0.3)] ${sizeClass}`}>
      {initials}
    </div>
  );
}

// ── Message Cards ──────────────────────────────────────────────────────────────

function ItemShareCard({ metadata, isMe, isEmergency }: { metadata: Record<string, unknown>; isMe: boolean; isEmergency?: boolean }) {
  const router = useRouter();
  if (isEmergency) {
    return (
      <div className="w-[272px] overflow-hidden rounded-2xl shadow-[0_4px_20px_rgba(255,69,32,0.3)] bg-[linear-gradient(135deg,var(--emergency),var(--emergency-end))]">
        <div className="m-[2px] overflow-hidden rounded-[11px] bg-white/15 backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-white/20 px-3.5 py-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/25">
              <Package className="h-3 w-3 text-white" />
            </div>
            <span className="text-[0.72rem] font-black uppercase tracking-wide text-white/90">Emergency Share</span>
          </div>
          <div className="p-3.5">
            <p className="text-[0.9rem] font-black text-white">{String(metadata.itemName ?? "")}</p>
            <p className="mt-0.5 text-[0.75rem] text-white/75">
              {metadata.category ? String(metadata.category) : "General"}
              {metadata.pricePerDay != null ? ` · ₹${metadata.pricePerDay}/day` : ""}
            </p>
            <button
              onClick={() => router.push(`/products/${String(metadata.slug ?? "")}`)}
              className="mt-3 w-full rounded-xl border border-white/40 bg-white/20 py-2 text-[0.78rem] font-black text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              View Item →
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`w-[272px] overflow-hidden rounded-2xl border bg-white shadow-sm ${isMe ? "border-[#3b2a80]/25" : "border-[var(--border)]"}`}>
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary-soft)]">
          <Package className="h-3 w-3 text-[var(--primary)]" />
        </div>
        <span className="text-[0.72rem] font-black uppercase tracking-wide text-[var(--text-secondary)]">Item Shared</span>
      </div>
      <div className="p-3.5">
        <p className="text-[0.9rem] font-black text-[#1b1530]">{String(metadata.itemName ?? "")}</p>
        <p className="mt-0.5 text-[0.75rem] text-[var(--text-muted)]">
          {metadata.category ? String(metadata.category) : "General"}
          {metadata.pricePerDay != null ? ` · ₹${metadata.pricePerDay}/day` : ""}
        </p>
        <button
          onClick={() => router.push(`/products/${String(metadata.slug ?? "")}`)}
          className="mt-3 w-full rounded-xl bg-[var(--primary-soft)] py-2 text-[0.78rem] font-black text-[var(--primary)] transition-colors hover:bg-[#3b2a80] hover:text-white"
        >
          View Item →
        </button>
      </div>
    </div>
  );
}

function PrivateBorrowCard({ metadata, isMe }: { metadata: Record<string, unknown>; isMe: boolean }) {
  const router = useRouter();
  const fromDate = metadata.neededFrom
    ? new Date(String(metadata.neededFrom)).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "";
  const untilDate = metadata.neededUntil
    ? new Date(String(metadata.neededUntil)).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "";
  return (
    <div className="w-[272px] overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-3.5 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100">
          <Inbox className="h-3 w-3 text-indigo-600" />
        </div>
        <span className="text-[0.72rem] font-black uppercase tracking-wide text-indigo-700">Private Request</span>
      </div>
      <div className="p-3.5">
        <p className="text-[0.9rem] font-black text-[#1b1530]">{String(metadata.title ?? "")}</p>
        {(fromDate || metadata.budgetPerDay != null) && (
          <p className="mt-0.5 text-[0.75rem] text-[var(--text-muted)]">
            {fromDate && untilDate ? `${fromDate} – ${untilDate}` : ""}
            {metadata.budgetPerDay != null ? ` · ₹${metadata.budgetPerDay}/day` : ""}
          </p>
        )}
        {!isMe && (
          <button
            onClick={() => router.push(`/dashboard/borrow-requests/${String(metadata.borrowRequestId ?? "")}`)}
            className="mt-3 w-full rounded-xl bg-indigo-50 py-2 text-[0.78rem] font-black text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
          >
            Make an Offer →
          </button>
        )}
      </div>
    </div>
  );
}

function ItemOfferCard({
  metadata,
  isMe,
  isEmergency,
  onInterested,
}: {
  metadata: Record<string, unknown>;
  isMe: boolean;
  isEmergency?: boolean;
  onInterested: () => void;
}) {
  const fromDate = metadata.availableFrom
    ? new Date(String(metadata.availableFrom)).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "";
  const untilDate = metadata.availableUntil
    ? new Date(String(metadata.availableUntil)).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "";
  if (isEmergency) {
    return (
      <div className="w-[272px] overflow-hidden rounded-2xl shadow-[0_4px_20px_rgba(255,69,32,0.3)] bg-[linear-gradient(135deg,var(--emergency),var(--emergency-end))]">
        <div className="m-[2px] overflow-hidden rounded-[11px] bg-white/15 backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-white/20 px-3.5 py-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/25">
              <Star className="h-3 w-3 text-white" />
            </div>
            <span className="text-[0.72rem] font-black uppercase tracking-wide text-white/90">Emergency Offer</span>
          </div>
          <div className="p-3.5">
            <p className="text-[0.9rem] font-black text-white">{String(metadata.name ?? "")}</p>
            {metadata.description && (
              <p className="mt-0.5 text-[0.78rem] text-white/75">{String(metadata.description)}</p>
            )}
            {(fromDate || metadata.pricePerDay != null) && (
              <p className="mt-1 text-[0.75rem] text-white/75">
                {metadata.pricePerDay != null ? `₹${metadata.pricePerDay}/day` : ""}
                {fromDate && untilDate ? ` · ${fromDate} – ${untilDate}` : ""}
              </p>
            )}
            {!isMe && (
              <button
                onClick={onInterested}
                className="mt-3 w-full rounded-xl border border-white/40 bg-white/20 py-2 text-[0.78rem] font-black text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                I&apos;m Interested →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-[272px] overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-orange-100 bg-orange-50 px-3.5 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100">
          <Star className="h-3 w-3 text-orange-600" />
        </div>
        <span className="text-[0.72rem] font-black uppercase tracking-wide text-orange-700">Private Offer</span>
      </div>
      <div className="p-3.5">
        <p className="text-[0.9rem] font-black text-[#1b1530]">{String(metadata.name ?? "")}</p>
        {metadata.description && (
          <p className="mt-0.5 text-[0.78rem] text-[var(--text-muted)]">{String(metadata.description)}</p>
        )}
        {(fromDate || metadata.pricePerDay != null) && (
          <p className="mt-1 text-[0.75rem] text-[var(--text-muted)]">
            {metadata.pricePerDay != null ? `₹${metadata.pricePerDay}/day` : ""}
            {fromDate && untilDate ? ` · ${fromDate} – ${untilDate}` : ""}
          </p>
        )}
        {!isMe && (
          <button
            onClick={onInterested}
            className="mt-3 w-full rounded-xl bg-orange-50 py-2 text-[0.78rem] font-black text-orange-600 transition-colors hover:bg-orange-500 hover:text-white"
          >
            I&apos;m Interested →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Private Borrow Request Modal ───────────────────────────────────────────────

function PrivateBorrowModal({
  partnerName,
  onClose,
  onSend,
}: {
  partnerName: string;
  onClose: () => void;
  onSend: (data: {
    title: string;
    category?: string;
    description?: string;
    location?: string;
    neededFrom: string;
    neededUntil: string;
    budgetPerDay?: number;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [budget, setBudget] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [error, setError] = useState("");

  function submit() {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!from || !until) { setError("Dates are required"); return; }
    onSend({
      title: title.trim(),
      category: category || undefined,
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      neededFrom: from,
      neededUntil: until,
      budgetPerDay: budget ? Number(budget) : undefined,
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(27,21,48,0.75)] backdrop-blur-[4px]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="relative max-h-[92vh] w-[480px] overflow-y-auto scrollbar-none rounded-3xl bg-white p-7 shadow-2xl">
          <button onClick={onClose} className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-muted)]">
            <X className="h-4 w-4" />
          </button>
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
              <Inbox className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-[1.05rem] font-black text-[var(--ink)]">Private Borrow Request</h2>
            <p className="mt-1 text-[0.8rem] text-[var(--text-muted)]">
              Only <span className="font-bold">{partnerName}</span> will see this request.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
                What do you need? <span className="text-red-400">*</span>
              </label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DSLR camera for weekend"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Category</label>
              <CategoryPicker mode="single" value={category ? [category] : []} onChange={([v]) => setCategory(v ?? "")} placeholder="Select a category…" />
            </div>
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Specific requirements…" rows={2}
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Location</label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5">
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Your area / neighbourhood"
                  className="flex-1 bg-transparent text-[0.88rem] text-[var(--ink)] outline-none placeholder:text-[var(--text-muted)]" />
                <button type="button" onClick={() => setShowLocationPicker(true)} className="flex-shrink-0 text-xs font-bold text-[var(--primary)] hover:underline">
                  Pick
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Need From <span className="text-red-400">*</span>
                </label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)]" />
              </div>
              <div>
                <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Need Until <span className="text-red-400">*</span>
                </label>
                <input type="date" value={until} onChange={(e) => setUntil(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)]" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Budget (₹ / day)</label>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Optional max budget" min={0}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
            </div>
            {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-[0.82rem] font-semibold text-red-600">{error}</p>}
            <div className="flex gap-2.5">
              <button onClick={onClose} className="flex-1 rounded-full border border-[var(--border)] py-3 text-[0.88rem] font-bold text-[var(--text-muted)] hover:text-[var(--ink)]">
                Cancel
              </button>
              <button onClick={submit} disabled={!title.trim() || !from || !until}
                className="flex-1 rounded-full bg-[linear-gradient(135deg,#4338ca,#6366f1)] py-3 text-[0.88rem] font-black text-white disabled:opacity-50">
                Send Request
              </button>
            </div>
          </div>
        </div>
      </div>
      {showLocationPicker && (
        <LocationPickerModal
          initialLocation={location}
          onConfirm={({ location: loc }) => { setLocation(loc); setShowLocationPicker(false); }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </>
  );
}

// ── Item Offer Modal (lender's private offer) ──────────────────────────────────

function ItemOfferFormModal({
  partnerName,
  onClose,
  onSend,
}: {
  partnerName: string;
  onClose: () => void;
  onSend: (data: {
    name: string;
    description?: string;
    pricePerDay?: number;
    availableFrom?: string;
    availableUntil?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim()) { setError("Item name is required"); return; }
    onSend({
      name: name.trim(),
      description: description.trim() || undefined,
      pricePerDay: price ? Number(price) : undefined,
      availableFrom: from || undefined,
      availableUntil: until || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(27,21,48,0.75)] backdrop-blur-[4px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-[440px] rounded-3xl bg-white p-7 shadow-2xl">
        <button onClick={onClose} className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-[var(--text-muted)]">
          <X className="h-4 w-4" />
        </button>
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
            <Star className="h-6 w-6 text-orange-500" />
          </div>
          <h2 className="text-[1.05rem] font-black text-[var(--ink)]">Make a Private Offer</h2>
          <p className="mt-1 text-[0.8rem] text-[var(--text-muted)]">
            Offer an item directly to <span className="font-bold">{partnerName}</span>.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Item Name <span className="text-red-400">*</span>
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Camping Tent"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, model, specs…" rows={2}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Price (₹ / day)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Optional" min={0}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Available From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-[0.75rem] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">Available Until</label>
              <input type="date" value={until} onChange={(e) => setUntil(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[0.88rem] text-[var(--ink)] outline-none focus:border-[var(--primary)]" />
            </div>
          </div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-[0.82rem] font-semibold text-red-600">{error}</p>}
          <div className="flex gap-2.5">
            <button onClick={onClose} className="flex-1 rounded-full border border-[var(--border)] py-3 text-[0.88rem] font-bold text-[var(--text-muted)] hover:text-[var(--ink)]">
              Cancel
            </button>
            <button onClick={submit} disabled={!name.trim()}
              className="flex-1 rounded-full bg-[linear-gradient(135deg,#f97316,#fb923c)] py-3 text-[0.88rem] font-black text-white disabled:opacity-50">
              Send Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function MessagesInner() {
  const searchParams = useSearchParams();
  const requestedConvId = searchParams.get("conversationId");
  const requestedUserId = searchParams.get("userId");
  const emergencyMode = searchParams.get("emergency") === "true";
  const emergencyItem = searchParams.get("item") ?? "";

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showItemShareModal, setShowItemShareModal] = useState(false);
  const [showPrivateBorrowModal, setShowPrivateBorrowModal] = useState(false);
  const [showItemOfferModal, setShowItemOfferModal] = useState(false);
  const [submittingCard, setSubmittingCard] = useState(false);
  const [emergencyDismissed, setEmergencyDismissed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const tempIdCounterRef = useRef(0);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data: Conversation[] = await fetch("/api/conversations").then((r) => r.json());

        if (requestedUserId) {
          const existing = data.find((c) => c.with.id === requestedUserId);
          if (existing) {
            setConvs(data);
            setActiveId(existing.id);
            return;
          }

          const profile = await fetch(`/api/users/${requestedUserId}`)
            .then((r) => r.ok ? r.json() : null)
            .catch(() => null) as { firstName?: string; lastName?: string; userName?: string } | null;

          const name = profile
            ? (profile.firstName && profile.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile.userName ?? "User")
            : "User";
          const avatar = name.charAt(0).toUpperCase();

          const ghost: Conversation = {
            id: NEW_CONV_ID,
            with: { id: requestedUserId, name, handle: "", avatar },
            lastMsg: "",
            time: "",
            unread: 0,
            messages: [],
          };

          setConvs([ghost, ...data]);
          setActiveId(NEW_CONV_ID);
          return;
        }

        setConvs(data);
        const target = requestedConvId && data.find((c) => c.id === requestedConvId);
        setActiveId(target ? target.id : data[0]?.id ?? null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    void loadConversations();
  }, []);

  // Socket.IO
  useEffect(() => {
    const socket = io({ path: "/api/socket", withCredentials: true });
    socketRef.current = socket;

    socket.on("message:new", (event: { conversationId: string; message: Message }) => {
      setConvs((prev) =>
        prev.map((conversation) => {
          if (conversation.id !== event.conversationId) return conversation;
          if (conversation.messages.some((m) => m.id === event.message.id)) return conversation;

          const liveMessage: Message = {
            ...event.message,
            from: event.message.senderId === conversation.with.id ? "them" : "me",
          };

          return {
            ...conversation,
            messages: [...conversation.messages, liveMessage],
            lastMsg: liveMessage.text,
            time: liveMessage.time,
            unread:
              activeIdRef.current === conversation.id || liveMessage.from === "me"
                ? conversation.unread
                : conversation.unread + 1,
          };
        }),
      );
    });

    socket.on("conversation:new", () => {
      fetch("/api/conversations")
        .then((r) => r.json())
        .then((data: Conversation[]) => setConvs(data))
        .catch(() => {});
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  // Join active conversation room
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeId) return;
    const joinActive = () => socket.emit("conversation:join", activeId);
    if (socket.connected) joinActive();
    socket.on("connect", joinActive);
    return () => socket.off("connect", joinActive);
  }, [activeId]);

  // Close attach menu on outside click
  useEffect(() => {
    if (!showAttachMenu) return;
    function handleClick(e: MouseEvent) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAttachMenu]);

  const activeConv = convs.find((c) => c.id === activeId) ?? null;

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  useEffect(() => { scrollToBottom(); }, [activeId, convs]);

  const selectConv = (id: string) => {
    setActiveId(id);
    setConvs((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    fetch(`/api/conversations/${id}/messages`).catch(() => {});
  };

  const removeOptimisticMessage = (conversationId: string, messageId: string) => {
    setConvs((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c,
      ),
    );
  };

  // ── Send plain text message ──────────────────────────────────────────────────

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || text.length > MESSAGE_MAX_LENGTH || sending || !activeId) return;
    setSending(true);
    setInput("");

    if (activeId === NEW_CONV_ID) {
      const ghostConv = convs.find((c) => c.id === NEW_CONV_ID);
      if (!ghostConv) { setSending(false); return; }
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId: ghostConv.with.id, message: text }),
        });
        if (res.ok) {
          const { conversationId } = await res.json() as { conversationId: string };
          const data: Conversation[] = await fetch("/api/conversations").then((r) => r.json());
          setConvs(data);
          setActiveId(conversationId);
        } else { setInput(text); }
      } catch { setInput(text); }
      finally { setSending(false); }
      return;
    }

    const targetConversationId = activeId;
    tempIdCounterRef.current += 1;
    const tempId = `temp-${tempIdCounterRef.current}`;
    const tempMsg: Message = { id: tempId, from: "me", text, time: "Just now", type: "text" };
    setConvs((prev) =>
      prev.map((c) =>
        c.id === targetConversationId
          ? { ...c, messages: [...c.messages, tempMsg], lastMsg: text, time: "Just now" }
          : c,
      ),
    );
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(`/api/conversations/${targetConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setConvs((prev) =>
          prev.map((c) =>
            c.id === targetConversationId
              ? { ...c, messages: c.messages.map((m) => (m.id === tempId ? msg : m)) }
              : c,
          ),
        );
        socketRef.current?.emit("message:send", { conversationId: targetConversationId, message: msg });
      } else {
        removeOptimisticMessage(targetConversationId, tempId);
        setInput(text);
      }
    } catch {
      removeOptimisticMessage(targetConversationId, tempId);
      setInput(text);
    } finally { setSending(false); }
  };

  // ── Send card message ────────────────────────────────────────────────────────

  const sendCardMessage = async (
    apiBody: Record<string, unknown>,
    optimistic: { type: MessageCardType; text: string; metadata?: Record<string, unknown> },
  ) => {
    if (!activeId || activeId === NEW_CONV_ID || submittingCard) return;
    const conversationId = activeId;
    setSubmittingCard(true);

    tempIdCounterRef.current += 1;
    const tempId = `temp-${tempIdCounterRef.current}`;
    const tempMsg: Message = {
      id: tempId,
      from: "me",
      text: optimistic.text,
      time: "Just now",
      type: optimistic.type,
      metadata: optimistic.metadata ?? null,
    };

    setConvs((prev) =>
      prev.map((c) => c.id === conversationId ? { ...c, messages: [...c.messages, tempMsg] } : c),
    );
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setConvs((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, messages: c.messages.map((m) => (m.id === tempId ? msg : m)) }
              : c,
          ),
        );
        socketRef.current?.emit("message:send", { conversationId, message: msg });
      } else {
        removeOptimisticMessage(conversationId, tempId);
      }
    } catch {
      removeOptimisticMessage(conversationId, tempId);
    } finally { setSubmittingCard(false); }
  };

  // ── Attachment handlers ──────────────────────────────────────────────────────

  const handleShareItem = async (item: LentItemForShare) => {
    setShowItemShareModal(false);
    await sendCardMessage(
      { content: `Shared item: ${item.product.name}`, type: "item_share", lentItemId: item.id },
      {
        type: "item_share",
        text: `Shared item: ${item.product.name}`,
        metadata: {
          lentItemId: item.id,
          itemName: item.product.name,
          slug: item.product.slug,
          category: item.product.category,
          pricePerDay: item.pricePerDay,
        },
      },
    );
  };

  const handlePrivateBorrowSubmit = async (data: {
    title: string; category?: string; description?: string; location?: string;
    neededFrom: string; neededUntil: string; budgetPerDay?: number;
  }) => {
    setShowPrivateBorrowModal(false);
    if (!activeConv) return;
    // Create the BorrowRequest first, then send it as a card message.
    // Do NOT set submittingCard here — sendCardMessage manages that flag.
    try {
      const res = await fetch("/api/borrow-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isPrivate: true, targetUserId: activeConv.with.id }),
      });
      if (!res.ok) return;
      const req = await res.json() as { id: string };
      const cardMeta = {
        borrowRequestId: req.id,
        title: data.title,
        category: data.category ?? null,
        neededFrom: data.neededFrom,
        neededUntil: data.neededUntil,
        budgetPerDay: data.budgetPerDay ?? null,
      };
      await sendCardMessage(
        { content: `Private request: ${data.title}`, type: "private_borrow_request", metadata: cardMeta },
        { type: "private_borrow_request", text: `Private request: ${data.title}`, metadata: cardMeta },
      );
    } catch { /* ignore */ }
  };

  const handleItemOfferSubmit = async (data: {
    name: string; description?: string; pricePerDay?: number; availableFrom?: string; availableUntil?: string;
  }) => {
    setShowItemOfferModal(false);
    await sendCardMessage(
      { content: `Private offer: ${data.name}`, type: "item_offer", metadata: data },
      { type: "item_offer", text: `Private offer: ${data.name}`, metadata: data as Record<string, unknown> },
    );
  };

  const handleInterested = () => {
    setInput("I'm interested in your offer! Can we discuss the details?");
  };

  // Emergency banner: show when emergency=true and the active conv is with the requested user
  const showEmergencyBanner =
    emergencyMode &&
    !emergencyDismissed &&
    !!activeConv &&
    activeConv.id !== NEW_CONV_ID &&
    (requestedUserId ? activeConv.with.id === requestedUserId : true);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="-mx-4 -my-6 flex h-[calc(100vh-58px)] overflow-hidden sm:-mx-6 lg:-mx-8 lg:-my-8">
        {/* Conversation list */}
        <div className="flex w-[280px] flex-shrink-0 flex-col border-r border-[var(--border)] bg-white">
          <div className="flex-shrink-0 border-b border-[var(--border)] p-5">
            <h2 className="mb-3.5 text-[1.05rem] font-black text-[var(--ink)]">Messages</h2>
            <div className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9187b0" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                placeholder="Search conversations…"
                className="w-full bg-transparent text-[0.82rem] text-[var(--ink)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-2 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--surface-soft)]" />
                ))}
              </div>
            ) : convs.length === 0 ? (
              <div className="px-5 py-8 text-center text-[0.82rem] text-[var(--text-muted)]">
                No conversations yet
              </div>
            ) : (
              convs.map((c) => {
                const isActive = activeId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectConv(c.id)}
                    className={`flex w-full items-start gap-3 border-l-[3px] px-[1.1rem] py-[0.9rem] text-left transition-colors ${
                      isActive ? "border-l-[#3b2a80] bg-[#f2eefb]" : "border-l-transparent bg-transparent hover:bg-[#f8f7fc]"
                    }`}
                  >
                    <Avatar initials={c.with.avatar} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.88rem] font-black text-[var(--ink)]">{c.with.name}</span>
                        <span className="flex-shrink-0 text-[0.7rem] text-[var(--text-muted)]">{c.time}</span>
                      </div>
                      <p className="mt-0.5 max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap text-[0.78rem] text-[var(--text-muted)]">
                        {c.lastMsg}
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <span className="mt-0.5 flex-shrink-0 rounded-full bg-[var(--primary)] px-1.5 py-[2px] text-[0.65rem] font-black text-white">
                        {c.unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex flex-1 flex-col bg-[var(--background)]">
          {!activeConv ? (
            <div className="flex flex-1 items-center justify-center text-[var(--text-muted)]">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-soft)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <p className="font-black text-[var(--ink)]">No conversation selected</p>
                <p className="mt-1 text-sm">Pick one from the list to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex flex-shrink-0 items-center gap-3.5 border-b border-[var(--border)] bg-white px-6 py-4">
                <Avatar initials={activeConv.with.avatar} size={38} />
                <div className="flex-1">
                  <p className="text-[0.92rem] font-black text-[var(--ink)]">{activeConv.with.name}</p>
                  <p className="text-[0.75rem] text-[var(--text-muted)]">
                    {activeConv.id === NEW_CONV_ID ? "New conversation" : activeConv.with.handle}
                  </p>
                </div>
                <button className="flex items-center gap-1.5 rounded-full bg-[var(--surface-soft)] px-4 py-2 text-[0.8rem] font-bold text-[var(--primary)]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
                  </svg>
                  View Borrow
                </button>
              </div>

              {/* Emergency banner */}
              {showEmergencyBanner && (
                <div className="flex-shrink-0 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                      <Zap className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.82rem] font-black text-orange-900">
                        Emergency: <span className="font-medium">{activeConv.with.name}</span> urgently needs
                        {emergencyItem ? <> &ldquo;<span className="font-black">{emergencyItem}</span>&rdquo;</> : " an item"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => setShowItemShareModal(true)}
                          className="rounded-lg bg-orange-500 px-3.5 py-1.5 text-[0.75rem] font-black text-white transition-colors hover:bg-orange-600"
                        >
                          Share One of Your Items
                        </button>
                        <button
                          onClick={() => setShowItemOfferModal(true)}
                          className="rounded-lg border border-orange-300 bg-white px-3.5 py-1.5 text-[0.75rem] font-black text-orange-700 transition-colors hover:bg-orange-50"
                        >
                          Make a Private Offer
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setEmergencyDismissed(true)}
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-orange-400 transition-colors hover:text-orange-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div ref={messagesEndRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
                {activeConv.messages.map((m) => {
                  const isMe = m.from === "me";
                  const isCard = m.type && m.type !== "text" && m.metadata;
                  const isEmergencyConv = emergencyMode && (requestedUserId ? activeConv.with.id === requestedUserId : true);

                  return (
                    <div key={m.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      {!isMe && <Avatar initials={activeConv.with.avatar} size={28} />}

                      {isCard ? (
                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          {m.type === "item_share" && (
                            <ItemShareCard metadata={m.metadata as Record<string, unknown>} isMe={isMe} isEmergency={isEmergencyConv} />
                          )}
                          {m.type === "private_borrow_request" && (
                            <PrivateBorrowCard metadata={m.metadata as Record<string, unknown>} isMe={isMe} />
                          )}
                          {m.type === "item_offer" && (
                            <ItemOfferCard
                              metadata={m.metadata as Record<string, unknown>}
                              isMe={isMe}
                              isEmergency={isEmergencyConv}
                              onInterested={handleInterested}
                            />
                          )}
                          <span className={`mt-1 text-[0.65rem] text-[var(--text-muted)] ${isMe ? "text-right" : "text-left"}`}>
                            {m.time}
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`max-w-[65%] px-4 py-[0.7rem] text-[0.88rem] leading-relaxed shadow-[0_2px_8px_rgba(12,32,30,0.08)] ${
                            isMe
                              ? "rounded-[18px_18px_4px_18px] bg-[linear-gradient(135deg,#3b2a80,#31236a)] text-white"
                              : "rounded-[18px_18px_18px_4px] border border-[#e3dcf3] bg-white text-[#1b1530]"
                          }`}
                        >
                          {m.text}
                          <div className={`mt-1 text-right text-[0.68rem] ${isMe ? "text-white/60" : "text-[#9187b0]"}`}>
                            {m.time}
                          </div>
                        </div>
                      )}

                      {isMe && (
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#31236a,#6d5bba)] text-[0.6rem] font-black text-white">
                          ME
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Input bar */}
              <div className="flex flex-shrink-0 items-end gap-2 border-t border-[var(--border)] bg-white px-5 py-4">
                {/* Attach button + popover */}
                <div className="relative" ref={attachMenuRef}>
                  <button
                    onClick={() => setShowAttachMenu((v) => !v)}
                    disabled={!activeId || activeId === NEW_CONV_ID}
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] border transition-all disabled:opacity-40 ${
                      showAttachMenu
                        ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    }`}
                    title="Attach"
                  >
                    <Plus className="h-5 w-5" />
                  </button>

                  {showAttachMenu && (
                    <div className="absolute bottom-[54px] left-0 z-30 w-[228px] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-xl">
                      <button
                        onClick={() => { setShowAttachMenu(false); setShowItemShareModal(true); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-soft)]"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)]">
                          <Package className="h-4 w-4 text-[var(--primary)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.84rem] font-bold text-[var(--ink)]">Share a Listed Item</p>
                          <p className="text-[0.72rem] text-[var(--text-muted)]">Pick from your listings</p>
                        </div>
                      </button>
                      <div className="mx-4 h-px bg-[var(--border)]" />
                      <button
                        onClick={() => { setShowAttachMenu(false); setShowPrivateBorrowModal(true); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-soft)]"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                          <Inbox className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.84rem] font-bold text-[var(--ink)]">Private Borrow Request</p>
                          <p className="text-[0.72rem] text-[var(--text-muted)]">Only this person can see</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Text input */}
                <div className="flex flex-1 items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    maxLength={MESSAGE_MAX_LENGTH}
                    placeholder="Type a message…"
                    className="flex-1 bg-transparent text-[0.9rem] text-[var(--ink)] outline-none placeholder:text-[var(--text-muted)]"
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={sendMessage}
                  disabled={sending || submittingCard || !input.trim() || input.trim().length > MESSAGE_MAX_LENGTH}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-[#3b2a80] text-white shadow-[0_4px_14px_rgba(47,35,106,0.35)] transition-all hover:scale-105 disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals (rendered outside the main layout to avoid overflow clipping) */}
      {showItemShareModal && (
        <ItemShareModal onShare={handleShareItem} onClose={() => setShowItemShareModal(false)} />
      )}
      {showPrivateBorrowModal && activeConv && (
        <PrivateBorrowModal
          partnerName={activeConv.with.name}
          onClose={() => setShowPrivateBorrowModal(false)}
          onSend={handlePrivateBorrowSubmit}
        />
      )}
      {showItemOfferModal && activeConv && (
        <ItemOfferFormModal
          partnerName={activeConv.with.name}
          onClose={() => setShowItemOfferModal(false)}
          onSend={handleItemOfferSubmit}
        />
      )}
    </>
  );
}
