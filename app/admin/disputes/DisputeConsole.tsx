"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, Clock, MessageSquare, ShieldAlert } from "lucide-react";
import CaseQueue from "@/components/admin/disputes/CaseQueue";
import PartyCards from "@/components/admin/disputes/PartyCards";
import AIEvidencePanel from "@/components/admin/disputes/AIEvidencePanel";
import TransactionTimeline from "@/components/admin/disputes/TransactionTimeline";
import ChatLog from "@/components/admin/disputes/ChatLog";
import DecisionPanel from "@/components/admin/disputes/DecisionPanel";
import { MOCK_CHAT } from "@/lib/disputes/mock-data";
import type { DisputeListItem, DisputeDetail } from "@/lib/disputes/types";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  OPEN:         { bg: "bg-amber-50",   text: "text-amber-700",   label: "Open"       },
  UNDER_REVIEW: { bg: "bg-blue-50",    text: "text-blue-700",    label: "Reviewing"  },
  ESCALATED:    { bg: "bg-red-50",     text: "text-red-600",     label: "Escalated"  },
  RESOLVED:     { bg: "bg-emerald-50", text: "text-emerald-700", label: "Resolved"   },
  CLOSED:       { bg: "bg-gray-100",   text: "text-gray-500",    label: "Closed"     },
};

function Section({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--border)]">
        <span className="text-[var(--text-muted)]">{icon}</span>
        <span className="font-extrabold text-[var(--ink)] text-sm flex-1">{title}</span>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="px-6 py-5 space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-[var(--surface-soft)]" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-36 rounded-2xl bg-[var(--surface-soft)]" />
        <div className="h-36 rounded-2xl bg-[var(--surface-soft)]" />
      </div>
      <div className="h-64 rounded-2xl bg-[var(--surface-soft)]" />
      <div className="h-40 rounded-2xl bg-[var(--surface-soft)]" />
    </div>
  );
}

export default function DisputeConsole() {
  const [cases, setCases]         = useState<DisputeListItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [detail, setDetail]             = useState<DisputeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load case list
  useEffect(() => {
    setCasesLoading(true);
    fetch("/api/admin/disputes")
      .then((r) => r.ok ? r.json() as Promise<DisputeListItem[]> : Promise.reject())
      .then((data) => {
        setCases(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => setCases([]))
      .finally(() => setCasesLoading(false));
  }, []);

  // Load case detail whenever selection changes
  const fetchDetail = useCallback((id: string) => {
    setDetailLoading(true);
    setDetail(null);
    fetch(`/api/admin/disputes/${id}`)
      .then((r) => r.ok ? r.json() as Promise<DisputeDetail> : Promise.reject())
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  const s = detail ? (STATUS_STYLES[detail.status] ?? STATUS_STYLES.OPEN) : STATUS_STYLES.OPEN;
  const isEscalated = detail?.status === "ESCALATED";

  // Chat: real dispute messages come from DisputeEvent.type === "message".
  // For disputes without message events, fall back to mock chat for demo.
  const messageEvents = detail?.events.filter((e) => e.type === "message") ?? [];
  const chatMessages = messageEvents.length > 0
    ? messageEvents.map((e) => ({
        from:     (e.actorRole === "lender" ? "lender" : "borrower") as "lender" | "borrower",
        name:     e.actorName,
        initials: e.actorName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
        text:     e.body ?? "",
        time:     new Date(e.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      }))
    : MOCK_CHAT;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Case Queue sidebar ── */}
      <div className="w-72 shrink-0 overflow-hidden flex flex-col bg-[#12082e] shadow-[1px_0_0_0_rgba(255,255,255,0.07)]">
        {casesLoading ? (
          <div className="flex-1 bg-[#18122e] p-3 space-y-2 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5" />
            ))}
          </div>
        ) : (
          <CaseQueue
            cases={cases}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
      </div>

      {/* ── Case detail ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {detailLoading || !detail ? (
          <DetailSkeleton />
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* Case header */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-xl font-black text-[var(--ink)] tracking-tight">
                    #{detail.id.slice(-6).toUpperCase()}
                  </span>
                  <span className={`text-[0.68rem] font-extrabold rounded-full px-2.5 py-1 ${s.bg} ${s.text} ${isEscalated ? "animate-pulse" : ""}`}>
                    {s.label}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Raised{" "}
                  <strong className="text-[var(--text-secondary)]">
                    {new Date(detail.raisedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </strong>
                  {" · "}
                  <strong className="text-[var(--ink)]">{detail.itemName}</strong>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-bold px-4 py-2 hover:bg-[var(--primary)]/20 transition-colors">
                  View transaction
                </button>
                <button className="rounded-full bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-muted)] text-xs font-bold px-4 py-2 hover:bg-[var(--border)] transition-colors">
                  Export case
                </button>
              </div>
            </div>

            {/* Party cards */}
            <PartyCards
              borrower={detail.borrower}
              lender={detail.lender}
              verdict={detail.aiVerdict}
            />

            {/* AI Evidence */}
            <Section
              title="AI Arbitration Evidence"
              icon={<Zap className="h-3.5 w-3.5" />}
              action={
                <span className="text-[0.62rem] font-extrabold bg-amber-50 text-amber-700 rounded-full px-2.5 py-1">
                  Auto-loaded
                </span>
              }
            >
              <AIEvidencePanel
                aiVerdict={detail.aiVerdict}
                aiConfidence={detail.aiConfidence}
                aiNotes={detail.aiNotes}
                beforePhotoUrl={detail.beforePhotoUrl}
                afterPhotoUrl={detail.afterPhotoUrl}
                raisedAt={detail.raisedAt}
              />
            </Section>

            {/* Timeline */}
            <Section title="Transaction Timeline" icon={<Clock className="h-3.5 w-3.5" />}>
              <TransactionTimeline events={detail.events} />
            </Section>

            {/* Chat log */}
            <Section
              title="Party Communication"
              icon={<MessageSquare className="h-3.5 w-3.5" />}
              action={
                <span className="text-xs text-[var(--text-muted)]">{chatMessages.length} messages</span>
              }
            >
              <ChatLog messages={chatMessages} />
            </Section>
          </div>
        )}
      </div>

      {/* ── Decision panel ── */}
      <div className="w-[300px] shrink-0 border-l border-[var(--border)] overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="text-[0.65rem] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">
            Decision
          </span>
        </div>
        {detail ? (
          <DecisionPanel
            depositAmount={detail.depositAmount}
            caseId={detail.id}
            onResolved={() => {
              // Refresh case list to update status badge
              fetch("/api/admin/disputes")
                .then((r) => r.json() as Promise<DisputeListItem[]>)
                .then(setCases)
                .catch(() => null);
              // Refresh detail
              if (selectedId) fetchDetail(selectedId);
            }}
          />
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] h-48 animate-pulse" />
        )}
      </div>
    </div>
  );
}
