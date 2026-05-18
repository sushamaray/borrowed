"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { io, type Socket } from "socket.io-client";

interface Message {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  senderId?: string;
  senderName?: string;
}

interface Conversation {
  id: string;
  with: { id: string; name: string; handle: string; avatar: string };
  lastMsg: string;
  time: string;
  unread: number;
  messages: Message[];
}

const MESSAGE_MAX_LENGTH = 1000;

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  const sizeClass = size === 40 ? "h-10 w-10 text-[13.6px]" : size === 38 ? "h-[38px] w-[38px] text-[13px]" : size === 28 ? "h-7 w-7 text-[9.5px]" : "h-9 w-9 text-[12px]";

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b2a80bb,#3b2a80)] font-black text-white shadow-[0_2px_8px_rgba(47,35,106,0.3)] ${sizeClass}`}
    >
      {initials}
    </div>
  );
}

function MessagesInner() {
  const searchParams = useSearchParams();
  const requestedConvId = searchParams.get("conversationId");

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const tempIdCounterRef = useRef(0);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data: Conversation[]) => {
        setConvs(data);
        const target = requestedConvId && data.find((c) => c.id === requestedConvId);
        setActiveId(target ? target.id : data[0]?.id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = io({
      path: "/api/socket",
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on(
      "message:new",
      (event: { conversationId: string; message: Message }) => {
        setConvs((prev) =>
          prev.map((conversation) => {
            if (conversation.id !== event.conversationId) {
              return conversation;
            }

            if (conversation.messages.some((m) => m.id === event.message.id)) {
              return conversation;
            }

            const liveMessage: Message = {
              ...event.message,
              from:
                event.message.senderId === conversation.with.id
                  ? "them"
                  : "me",
            };

            return {
              ...conversation,
              messages: [...conversation.messages, liveMessage],
              lastMsg: liveMessage.text,
              time: liveMessage.time,
              unread:
                activeIdRef.current === conversation.id ||
                liveMessage.from === "me"
                  ? conversation.unread
                  : conversation.unread + 1,
            };
          }),
        );
      },
    );

    socket.on("conversation:new", () => {
      fetch("/api/conversations")
        .then((r) => r.json())
        .then((data: Conversation[]) => setConvs(data))
        .catch(() => {});
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeId) return;

    const joinActiveConversation = () => {
      socket.emit("conversation:join", activeId);
    };

    if (socket.connected) {
      joinActiveConversation();
    }

    socket.on("connect", joinActiveConversation);

    return () => {
      socket.off("connect", joinActiveConversation);
    };
  }, [activeId]);

  const activeConv = convs.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeId, convs]);

  const selectConv = (id: string) => {
    setActiveId(id);
    setConvs((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    // Mark messages as read server-side in background
    fetch(`/api/conversations/${id}/messages`).catch(() => {});
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || text.length > MESSAGE_MAX_LENGTH || sending || !activeId) return;
    setSending(true);
    setInput("");
    const targetConversationId = activeId;

    tempIdCounterRef.current += 1;
    const tempId = `temp-${tempIdCounterRef.current}`;
    const tempMsg: Message = { id: tempId, from: "me", text, time: "Just now" };
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
        socketRef.current?.emit("message:send", {
          conversationId: targetConversationId,
          message: msg,
        });
      } else {
        removeOptimisticMessage(targetConversationId, tempId);
        setInput(text);
      }
    } catch {
      removeOptimisticMessage(targetConversationId, tempId);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const removeOptimisticMessage = (conversationId: string, messageId: string) => {
    setConvs((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          : c,
      ),
    );
  };

  return (
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
                <p className="text-[0.75rem] text-[var(--text-muted)]">{activeConv.with.handle}</p>
              </div>
              <button className="flex items-center gap-1.5 rounded-full bg-[var(--surface-soft)] px-4 py-2 text-[0.8rem] font-bold text-[var(--primary)]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
                </svg>
                View Borrow
              </button>
            </div>

            {/* Messages */}
            <div
              ref={messagesEndRef}
              className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-5"
            >
              {activeConv.messages.map((m) => {
                const isMe = m.from === "me";
                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {!isMe && <Avatar initials={activeConv.with.avatar} size={28} />}
                    <div
                      className={`max-w-[65%] px-4 py-[0.7rem] text-[0.88rem] leading-relaxed shadow-[0_2px_8px_rgba(12,32,30,0.08)] ${
                        isMe
                          ? "rounded-[18px_18px_4px_18px] border-0 bg-[linear-gradient(135deg,#3b2a80,#31236a)] text-white"
                          : "rounded-[18px_18px_18px_4px] border border-[#e3dcf3] bg-white text-[#1b1530]"
                      }`}
                    >
                      {m.text}
                      <div className={`mt-1 text-right text-[0.68rem] ${isMe ? "text-white/60" : "text-[#9187b0]"}`}>
                        {m.time}
                      </div>
                    </div>
                    {isMe && (
                      <div
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#31236a,#6d5bba)] text-[0.6rem] font-black text-white"
                      >
                        ME
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Input bar */}
            <div className="flex flex-shrink-0 items-end gap-3 border-t border-[var(--border)] bg-white px-6 py-4">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  maxLength={MESSAGE_MAX_LENGTH}
                  placeholder="Type a message…"
                  className="flex-1 bg-transparent text-[0.9rem] text-[var(--ink)] outline-none placeholder:text-[var(--text-muted)]"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim() || input.trim().length > MESSAGE_MAX_LENGTH}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-[#3b2a80] text-white shadow-[0_4px_14px_rgba(47,35,106,0.35)] transition-all hover:scale-105 disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  );
}
