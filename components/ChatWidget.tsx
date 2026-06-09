"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type LeadStatus = "idle" | "needed" | "submitting" | "sent" | "error";

const STORAGE_DISMISSED = "lia-bubble-dismissed";
const ATTENTION_DELAY_MS = 10_000;
const LEAD_MARKER = "[LEAD_REQUEST]";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! Ich bin Lia, die digitale Assistentin von Haarstudio Graziella ✨ Was möchtest du wissen?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Lead-Capture-Flow
  const [leadStatus, setLeadStatus] = useState<LeadStatus>("idle");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadQuestion, setLeadQuestion] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Attention-Bubble nach Delay, nur wenn nicht vorher dismissed
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_DISMISSED)) return;
    const t = setTimeout(() => setBubbleVisible(true), ATTENTION_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Auto-scroll zu neuster Nachricht
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamText, leadStatus]);

  // Focus aufs Eingabefeld wenn Chat öffnet
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function openChat() {
    setOpen(true);
    setBubbleVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_DISMISSED, "1");
    }
  }

  function dismissBubble(e: React.MouseEvent) {
    e.stopPropagation();
    setBubbleVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_DISMISSED, "1");
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setStreamText("");
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error("Keine Antwort vom Server");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.error) throw new Error(payload.error);
            if (payload.text) {
              fullText += payload.text;
              setStreamText(fullText);
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message) {
              throw parseErr;
            }
          }
        }
      }

      // Strip Lead-Marker und prüfen
      const wantsLead = fullText.includes(LEAD_MARKER);
      const cleanText = fullText.replace(LEAD_MARKER, "").trim();

      setMessages((m) => [...m, { role: "assistant", content: cleanText }]);
      setStreamText("");

      if (wantsLead) {
        setLeadQuestion(text);
        setLeadStatus("needed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setStreamText("");
    } finally {
      setStreaming(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!leadName.trim() || !leadEmail.trim()) return;
    setLeadStatus("submitting");
    try {
      const res = await fetch("/api/chat-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadEmail.trim(),
          question: leadQuestion,
          history: messages,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Konnte nicht gesendet werden");
      }
      setLeadStatus("sent");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Super, danke ${leadName}! 💌 Graziella oder Aurelia meldet sich bei dir per Mail. Bis dahin — schau gerne noch durch unsere Leistungen weiter oben.`,
        },
      ]);
    } catch (err) {
      setLeadStatus("error");
      setError(err instanceof Error ? err.message : "Fehler beim Senden");
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Attention-Bubble */}
      {!open && bubbleVisible && (
        <button
          type="button"
          onClick={openChat}
          className="fixed bottom-24 right-5 z-40 max-w-[260px] rounded-2xl bg-white px-4 py-3 text-left text-sm text-ink shadow-2xl ring-1 ring-cream-dark transition hover:scale-[1.02] sm:bottom-28 sm:right-7"
        >
          <span
            role="button"
            onClick={dismissBubble}
            className="absolute -right-2 -top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-ink text-cream shadow"
            aria-label="Schließen"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-base">👋</span>
            <span>Hi! Ich bin Lia — hast du Fragen?</span>
          </div>
        </button>
      )}

      {/* Floating Button */}
      {!open && (
        <button
          type="button"
          onClick={openChat}
          aria-label="Chat mit Lia öffnen"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-cream shadow-xl ring-2 ring-rose/60 transition hover:scale-110 hover:bg-accent-dark sm:bottom-7 sm:right-7"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat-Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-0 sm:items-end sm:justify-end sm:p-4">
          {/* Mobile-Overlay */}
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-cream-dark sm:h-[640px] sm:max-h-[85vh] sm:w-[400px] sm:rounded-3xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-cream-dark bg-cream px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark font-display text-base text-cream">
                    L
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-cream bg-green-500" />
                </div>
                <div className="leading-tight">
                  <div className="font-display text-base text-ink">Lia</div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-soft">
                    Haarstudio Graziella
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chat schließen"
                className="rounded-full p-1.5 text-ink-soft transition hover:bg-cream-dark/50 hover:text-ink"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto bg-cream/30 px-4 py-5"
            >
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <MessageBubble key={i} role={m.role} content={m.content} />
                ))}
                {streaming && streamText && (
                  <MessageBubble role="assistant" content={streamText} />
                )}
                {streaming && !streamText && (
                  <div className="flex items-end gap-2">
                    <Avatar />
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-cream-dark">
                      <Dot delay="0" />
                      <Dot delay="0.15s" />
                      <Dot delay="0.3s" />
                    </div>
                  </div>
                )}
                {error && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}
              </div>

              {/* Lead-Capture-Form */}
              {(leadStatus === "needed" || leadStatus === "submitting") && (
                <form
                  onSubmit={submitLead}
                  className="mt-4 space-y-2 rounded-2xl border border-accent/40 bg-white p-4 shadow-sm"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-accent-dark">
                    Deine Kontaktdaten
                  </div>
                  <input
                    type="text"
                    placeholder="Dein Name"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    required
                    disabled={leadStatus === "submitting"}
                    className="w-full rounded-lg border border-cream-dark bg-cream/40 px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none disabled:opacity-60"
                  />
                  <input
                    type="email"
                    placeholder="Deine E-Mail"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    required
                    disabled={leadStatus === "submitting"}
                    className="w-full rounded-lg border border-cream-dark bg-cream/40 px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={leadStatus === "submitting"}
                    className="w-full rounded-lg bg-ink py-2 text-xs font-semibold uppercase tracking-wider text-cream transition hover:bg-accent-dark disabled:opacity-60"
                  >
                    {leadStatus === "submitting" ? "Sende…" : "Absenden"}
                  </button>
                </form>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-cream-dark bg-white px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Frag mich etwas…"
                  rows={1}
                  disabled={streaming}
                  className="flex-1 resize-none rounded-2xl border border-cream-dark bg-cream/40 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none disabled:opacity-60"
                  style={{ maxHeight: "120px" }}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={streaming || !input.trim()}
                  aria-label="Senden"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l14-7-7 14-2-5-5-2z" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 text-center text-[10px] text-ink-soft">
                Lia ist eine KI · Bei Notfällen ruf bitte 06108 / 79 98 65 an
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : ""}`}>
      {!isUser && <Avatar />}
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-sm bg-ink text-cream"
            : "rounded-bl-sm bg-white text-ink ring-1 ring-cream-dark"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark font-display text-xs text-cream">
      L
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="typing-dot inline-block h-2 w-2 rounded-full bg-ink-soft"
      style={{ animationDelay: delay }}
    />
  );
}
