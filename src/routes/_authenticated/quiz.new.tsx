import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateQuiz } from "@/lib/quiz.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, PlusSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/quiz/new")({
  head: () => ({ meta: [{ title: "New Quiz — QuizAI" }] }),
  component: NewQuiz,
});

const SUGGESTIONS = [
  "World capitals",
  "JavaScript fundamentals",
  "Human anatomy",
  "World War II",
  "Algebra basics",
  "Cognitive biases",
];

function NewQuiz() {
  const navigate = useNavigate();
  const gen = useServerFn(generateQuiz);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [num, setNum] = useState(5);
  const [loading, setLoading] = useState(false);

  async function start(e?: React.FormEvent) {
    e?.preventDefault();
    if (!topic.trim()) return toast.error("Enter a topic");
    setLoading(true);
    try {
      const { attemptId } = await gen({ data: { topic: topic.trim(), difficulty, numQuestions: num } });
      navigate({ to: "/quiz/$attemptId", params: { attemptId } });
    } catch (e: any) {
      const msg = e?.message || "Failed to generate quiz";
      if (msg.includes("429")) toast.error("Rate limit hit. Try again shortly.");
      else if (msg.includes("402")) toast.error("AI credits exhausted.");
      else toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        icon={<PlusSquare className="h-5 w-5" />}
        title="New Quiz"
        description="Pick any topic. AI generates fresh questions every time."
      />
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardContent className="space-y-6 p-6">
            <form onSubmit={start} className="space-y-5">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input
                  autoFocus
                  placeholder="e.g. Photosynthesis, React hooks, Roman empire…"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={120}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTopic(s)}
                      className="rounded-full border bg-accent/40 px-3 py-1 text-xs hover:bg-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <RadioGroup
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v as any)}
                  className="grid grid-cols-3 gap-2"
                >
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <label
                      key={d}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-sm capitalize ${
                        difficulty === d ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <RadioGroupItem value={d} className="sr-only" />
                      {d}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Questions: {num}</Label>
                <input
                  type="range"
                  min={3}
                  max={15}
                  value={num}
                  onChange={(e) => setNum(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating…" : "Generate quiz"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                AI-generated content may contain errors. Verify important facts.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
