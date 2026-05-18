"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bot, LockKeyhole, MessageCircle, ShoppingCart } from "lucide-react";
import FallbackImage from "@/components/FallbackImage";

interface CartItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  priceAmount: number;
  imageUrl: string;
  lenderName: string;
  days: number;
  startDate: string | null;
  endDate: string | null;
}

type Step = "cart" | "billing" | "confirm";

interface ConfirmedOrder {
  orderId: string;
  items: CartItem[];
  total: number;
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("cart");
  const [method, setMethod] = useState<"bkash" | "nagad" | "card">("bkash");
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "", expiry: "", cvv: "" });
  const [placing, setPlacing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data: CartItem[]) => setCartItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const subtotal = cartItems.reduce((s, i) => s + i.priceAmount * i.days, 0);
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const removeItem = async (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/cart/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const adjustDays = async (id: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, days: Math.max(1, i.days + delta) } : i)),
    );
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    const newDays = Math.max(1, item.days + delta);
    await fetch(`/api/cart/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: newDays }),
    }).catch(() => {});
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const res = await fetch("/api/cart/lent-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: method,
          billingName: form.name || null,
          billingContact: form.phone || null,
          address: form.address || null,
          note: form.note || null,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { orderId?: string; checkouts?: { id: string }[] };
        setConfirmedOrder({ orderId: data.orderId ?? data.checkouts?.[0]?.id ?? "pending", items: cartItems, total });
        setCartItems([]);
        setStep("confirm");
      }
    } catch {
      // stay on billing step
    } finally {
      setPlacing(false);
    }
  };

  // ── Confirmation ────────────────────────────────────────────────────────────
  if (step === "confirm" && confirmedOrder) {
    return (
      <div className="mx-auto max-w-[600px] py-12 text-center">
        <div
          className="mx-auto mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#059669,#10b981)] text-white"
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="mb-2 text-[2rem] font-black tracking-tight text-(--ink)">Borrow Request Sent!</h1>
        <p className="mb-2 text-[0.78rem] font-semibold text-(--text-muted)">Order ID: {confirmedOrder.orderId}</p>
        <p className="mb-7 text-[0.92rem] leading-relaxed text-(--text-secondary)">
          Your borrow requests have been sent to the lenders. You&apos;ll receive confirmation shortly.
        </p>

        <div className="mb-6 rounded-[20px] border border-[var(--border)] bg-white p-6 text-left shadow-lg">
          <p className="mb-4 text-[0.92rem] font-black text-(--ink)">Order Summary</p>
          {confirmedOrder.items.map((item) => (
            <div key={item.id} className="mb-3.5 flex items-center gap-3.5">
              <div className="relative h-[42px] w-[42px] flex-shrink-0 overflow-hidden rounded-[10px] bg-(--surface-soft)">
                <FallbackImage src={item.imageUrl} alt={item.name} fill sizes="42px" className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-[0.88rem] font-bold text-(--ink)">{item.name}</p>
                <p className="text-[0.78rem] text-(--text-muted)">{item.days} day{item.days > 1 ? "s" : ""} · TK {(item.priceAmount * item.days).toLocaleString()}</p>
              </div>
            </div>
          ))}
          <div className="flex justify-between border-t border-(--surface-soft) pt-3.5 font-black text-(--ink)">
            <span>Total charged</span>
            <span>TK {confirmedOrder.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/messages" className="flex-1 rounded-full border border-(--border) bg-(--surface-soft) py-3.5 text-center text-[0.9rem] font-bold text-(--primary)">
            View Messages
          </Link>
          <Link href="/dashboard/browse" className="flex-1 rounded-full bg-[#3b2a80] py-3.5 text-center text-[0.9rem] font-black text-white shadow-[0_8px_24px_rgba(47,35,106,0.3)]">
            Browse More →
          </Link>
        </div>
      </div>
    );
  }

  // ── Main ────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1000px]">
      {/* Step indicator */}
      <div className="mb-5 flex items-center gap-1">
        {(["cart", "billing"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.72rem] font-black ${
                  step === s || (step === "billing" && s === "cart") ? "bg-[#3b2a80] text-white" : "bg-[#e3dcf3] text-[#9187b0]"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-[0.88rem] font-bold ${step === s ? "text-[#1b1530]" : "text-[#9187b0]"}`}>
                {s === "cart" ? "Cart" : "Payment"}
              </span>
            </div>
            {i < 1 && <div className="mx-2 h-px min-w-8 flex-1 bg-(--border)" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] gap-6">
        {/* Left panel */}
        <div>
          {step === "cart" ? (
            <div className="rounded-[20px] border border-[var(--border)] bg-white p-6 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
              <div className="mb-5">
                <p className="mb-0.5 text-[0.7rem] font-black uppercase tracking-[0.1em] text-(--text-muted)">Your Cart</p>
                <h1 className="text-[1.5rem] font-black tracking-tight text-(--ink)">
                  {loading ? "Loading…" : `${cartItems.length} item${cartItems.length !== 1 ? "s" : ""} ready to borrow`}
                </h1>
              </div>

              {loading ? (
                <div className="flex flex-col gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-(--surface-soft)" />
                  ))}
                </div>
              ) : cartItems.length === 0 ? (
                <div className="py-12 text-center text-(--text-muted)">
                  <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-[var(--border)]" strokeWidth={1.8} />
                  <p className="mb-1 font-black text-(--ink)">Your cart is empty</p>
                  <p className="mb-4 text-[0.85rem]">Browse items and add them to your cart</p>
                  <Link href="/dashboard/browse">
                    <button className="rounded-full bg-(--primary) px-6 py-2.5 text-sm font-bold text-white">
                      Browse Items
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[#f8f7fc] p-[1.1rem]"
                    >
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-(--surface-soft)">
                        <FallbackImage src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${item.slug}`} className="text-[0.95rem] font-black text-(--ink) hover:underline">
                          {item.name}
                        </Link>
                        <p className="mb-3 text-[0.8rem] text-(--text-muted)">{item.lenderName} · {item.location}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5">
                            <button
                              onClick={() => adjustDays(item.id, -1)}
                              className="px-1 text-[0.9rem] font-black text-(--text-secondary) leading-none"
                            >
                              −
                            </button>
                            <span className="min-w-[20px] text-center text-[0.88rem] font-bold text-(--ink)">
                              {item.days}
                            </span>
                            <button
                              onClick={() => adjustDays(item.id, 1)}
                              className="px-1 text-[0.9rem] font-black text-(--text-secondary) leading-none"
                            >
                              +
                            </button>
                            <span className="ml-1 text-[0.75rem] text-(--text-muted)">
                              day{item.days > 1 ? "s" : ""}
                            </span>
                          </div>
                          <span className="font-black text-(--ink)">TK {(item.priceAmount * item.days).toLocaleString()}</span>
                          <span className="text-[0.78rem] text-(--text-muted)">TK {item.priceAmount.toLocaleString()} / day</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-(--danger-soft) text-(--danger)"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => setStep("billing")}
                    className="mt-2 w-full rounded-full bg-[#3b2a80] py-4 text-[0.95rem] font-black text-white shadow-[0_8px_24px_rgba(47,35,106,0.3)] transition-opacity hover:opacity-90"
                  >
                    Proceed to Payment →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[20px] border border-[var(--border)] bg-white p-7 shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
              <p className="mb-1 text-[0.7rem] font-black uppercase tracking-[0.1em] text-(--text-muted)">Payment</p>
              <h1 className="mb-6 text-[1.5rem] font-black tracking-tight text-(--ink)">Complete your borrow</h1>

              <div className="mb-6">
                <p className="mb-3.5 text-[0.92rem] font-black text-(--ink)">Payment Method</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {([["bkash", "bKash"], ["nagad", "Nagad"], ["card", "Card"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setMethod(val)}
                      className={`rounded-xl border-2 py-3.5 text-center text-[0.88rem] font-black transition-all ${
                        method === val
                          ? val === "bkash"
                            ? "border-[#e91e8c] bg-[#e91e8c]/[0.07] text-[#e91e8c]"
                            : val === "nagad"
                              ? "border-[#f05a28] bg-[#f05a28]/[0.07] text-[#f05a28]"
                              : "border-[#3b2a80] bg-[#3b2a80]/[0.07] text-[#3b2a80]"
                          : "border-[#e3dcf3] bg-[#f8f7fc] text-[#675d8b]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 grid gap-3.5">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1.5 block text-[0.78rem] font-bold text-(--ink)">Full Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-3.5 py-2.5 text-[0.88rem] text-(--ink) outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.78rem] font-bold text-(--ink)">
                      {method === "card" ? "Card Number" : "Mobile Number"}
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder={method === "card" ? "1234 5678 9012 3456" : "017XXXXXXXX"}
                      className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-3.5 py-2.5 text-[0.88rem] text-(--ink) outline-none"
                    />
                  </div>
                </div>
                {method === "card" && (
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="mb-1.5 block text-[0.78rem] font-bold text-(--ink)">Expiry Date</label>
                      <input placeholder="MM/YY" value={form.expiry} onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))} className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-3.5 py-2.5 text-[0.88rem] text-(--ink) outline-none" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.78rem] font-bold text-(--ink)">CVV</label>
                      <input type="password" placeholder="•••" value={form.cvv} onChange={(e) => setForm((f) => ({ ...f, cvv: e.target.value }))} className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-3.5 py-2.5 text-[0.88rem] text-(--ink) outline-none" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-[0.78rem] font-bold text-(--ink)">Pickup Address</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Enter your address for item pickup/delivery"
                    className="w-full rounded-xl border border-(--border) bg-(--surface-soft) px-3.5 py-2.5 text-[0.88rem] text-(--ink) outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.78rem] font-bold text-(--ink)">Note to Lender (optional)</label>
                  <textarea
                    rows={2}
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Any special instructions or requests…"
                    className="w-full resize-none rounded-xl border border-(--border) bg-(--surface-soft) px-3.5 py-2.5 text-[0.88rem] text-(--ink) outline-none"
                  />
                </div>
              </div>

              <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.8rem] text-emerald-700">
                <ShieldIcon />
                <span>Your payment is secured with 256-bit encryption. Deposits are held in escrow until item is returned.</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#3b2a80] py-4 text-[0.95rem] font-black text-white shadow-[0_8px_24px_rgba(47,35,106,0.3)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placing ? "⏳ Processing…" : `Confirm Borrow · TK ${total.toLocaleString()}`}
              </button>
            </div>
          )}
        </div>

        {/* Right: order summary */}
        <div className="flex flex-col gap-4 self-start">
          <div className="rounded-[20px] border border-[var(--border)] bg-white p-[1.4rem] shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
            <p className="mb-4 text-[1rem] font-black text-(--ink)">Order Summary</p>
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between border-b border-[#e3dcf3] py-[0.7rem]">
                <div>
                  <p className="text-[0.85rem] font-bold text-(--ink)">{item.name}</p>
                  <p className="text-[0.75rem] text-(--text-muted)">{item.days} day{item.days > 1 ? "s" : ""} × TK {item.priceAmount.toLocaleString()}</p>
                </div>
                <p className="text-[0.88rem] font-black text-(--ink)">TK {(item.priceAmount * item.days).toLocaleString()}</p>
              </div>
            ))}
            <div className="flex flex-col gap-2 pt-3">
              <div className="flex justify-between text-[0.85rem]">
                <span className="font-semibold text-(--text-secondary)">Subtotal</span>
                <span className="font-bold text-(--ink)">TK {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[0.85rem]">
                <span className="font-semibold text-(--text-secondary)">Service fee (5%)</span>
                <span className="font-bold text-(--ink)">TK {serviceFee.toLocaleString()}</span>
              </div>
              <div className="my-1 h-px bg-(--border)" />
              <div className="flex justify-between">
                <span className="font-black text-(--ink)">Total</span>
                <span className="text-[1.1rem] font-black text-(--primary)">TK {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--border)] bg-white p-[1.4rem] shadow-[0_12px_40px_rgba(12,32,30,0.07)]">
            <p className="mb-3.5 text-[0.92rem] font-black text-(--ink)">Borrow Protection</p>
            {[
              { Icon: LockKeyhole, title: "Secure payment", sub: "Encrypted via SSL" },
              { Icon: Bot, title: "AI damage check", sub: "Auto photo comparison" },
              { Icon: MessageCircle, title: "Direct chat", sub: "Message your lender" },
              { Icon: BadgeCheck, title: "Trust system", sub: "Verified lenders only" },
            ].map(({ Icon, title, sub }, i) => (
              <div key={title} className={`flex items-start gap-2.5 ${i < 3 ? "mb-3" : ""}`}>
                <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--primary)]" strokeWidth={2.2} />
                <div>
                  <p className="text-[0.82rem] font-bold text-(--ink)">{title}</p>
                  <p className="text-[0.75rem] text-(--text-muted)">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
