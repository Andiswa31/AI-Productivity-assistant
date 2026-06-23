import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Loader2, Trash2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Tutor — QuizAI" }] }),
  component: ChatPage,
});

const STORAGE_KEY = "quizai-tutor-chat-v1";

function loadInitial(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch {
    return [];
  }
}

const SUGGESTIONS = [
  "Explain photosynthesis in simple terms",
  "Quiz me on JavaScript closures",
  "What's the difference between TCP and UDP?",
  "Give me a memory trick for the OSI model",
];

function ChatPage() {
  const [initial] = useState<UIMessage[]>(() => loadInitial());
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: "tutor",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => {
      const msg = err.message || "Chat failed";
      if (msg.includes("429")) toast.error("Rate limit reached. Try again shortly.");
      else if (msg.includes("402")) toast.error("AI credits exhausted.");
      else toast.error(msg);
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const loading = status === "submitted" || status === "streaming";

  async function handleSend(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    await sendMessage({ text: text.trim() });
  }

  return (
    <div className="flex h-[calc(100vh-3.25rem)] flex-col">
      <PageHeader
        icon={<MessageSquare className="h-5 w-5" />}
        title="AI Tutor"
        description="Ask for explanations, examples, or have any concept broken down."
        actions={
          <Button variant="outline" size="sm" onClick={() => { setMessages([]); localStorage.removeItem(STORAGE_KEY); }} disabled={messages.length === 0}>
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
          {messages.length === 0 && (
            <div className="grid place-items-center py-16 text-center">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-accent">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">How can I help you study?</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Ask for explanations, examples, mnemonics, or have me quiz you.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => handleSend(s)} className="rounded-full border bg-accent/40 px-3 py-1.5 text-xs hover:bg-accent">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
                {isUser ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">{text}</div>
                ) : (
                  <div className="prose-chat max-w-[90%] text-sm"><ReactMarkdown>{text}</ReactMarkdown></div>
                )}
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-card/50 p-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your tutor anything…"
              rows={1}
              className="min-h-[40px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); }
              }}
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            AI may produce inaccurate information. Verify before relying on answers.
          </p>
        </form>
      </div>
    </div>
  );
}
