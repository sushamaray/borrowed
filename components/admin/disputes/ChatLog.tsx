export type ChatMessage = {
  from: "borrower" | "lender";
  name: string;
  initials: string;
  text: string;
  time: string;
};

export default function ChatLog({
  messages,
}: {
  messages: ChatMessage[];
}) {
  return (
    <div className="space-y-4">
      {messages.map((m, i) => {
        const isBorrower = m.from === "borrower";
        const avatarGrad = isBorrower
          ? "from-violet-600 to-violet-800"
          : "from-indigo-800 to-indigo-900";
        const roleCls = isBorrower
          ? "bg-violet-50 text-violet-700"
          : "bg-indigo-50 text-indigo-700";

        return (
          <div key={i} className="flex gap-3 items-start">
            <div
              className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white text-[0.65rem] font-black shrink-0 shadow-sm`}
            >
              {m.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-extrabold text-[var(--ink)] text-sm">{m.name}</span>
                <span className="text-[var(--text-muted)] text-[0.65rem]">{m.time}</span>
                <span className={`text-[0.58rem] font-extrabold rounded px-1.5 py-0.5 ${roleCls}`}>
                  {m.from}
                </span>
              </div>
              <div className="bg-[var(--surface-soft)] border border-[var(--border)] rounded-tl-none rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                {m.text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
