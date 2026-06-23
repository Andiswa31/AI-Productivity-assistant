import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAttempt, submitAttempt, type QuizQuestion } from "@/lib/quiz.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Brain, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/quiz/$attemptId")({
  head: () => ({ meta: [{ title: "Quiz — QuizAI" }] }),
  component: QuizPage,
});

const SECONDS_PER_QUESTION = 45;

function QuizPage() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const get = useServerFn(getAttempt);
  const submit = useServerFn(submitAttempt);

  const { data: attempt, isLoading } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => get({ data: { id: attemptId } }),
  });

  const questions = (attempt?.questions as QuizQuestion[] | undefined) ?? [];
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const startRef = useRef<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (attempt && answers.length === 0) {
      setAnswers((attempt.answers as (number | null)[]) ?? Array(questions.length).fill(null));
      startRef.current = Date.now();
    }
  }, [attempt, answers.length, questions.length]);

  // Already completed -> route to results
  useEffect(() => {
    if (attempt?.status === "completed") {
      navigate({ to: "/results/$attemptId", params: { attemptId }, replace: true });
    }
  }, [attempt, attemptId, navigate]);

  // Per-question timer
  useEffect(() => {
    setTimeLeft(SECONDS_PER_QUESTION);
  }, [idx]);

  useEffect(() => {
    if (!questions.length) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          // auto-advance
          if (idx < questions.length - 1) setIdx(idx + 1);
          return SECONDS_PER_QUESTION;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [idx, questions.length]);

  const current = questions[idx];
  const progressPct = useMemo(
    () => (questions.length ? Math.round(((idx + 1) / questions.length) * 100) : 0),
    [idx, questions.length],
  );
  const answeredCount = answers.filter((a) => a !== null).length;

  function choose(optionIdx: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = optionIdx;
      return next;
    });
  }

  async function finalize() {
    setSubmitting(true);
    try {
      const durationSeconds = Math.round((Date.now() - startRef.current) / 1000);
      await submit({ data: { id: attemptId, answers, durationSeconds } });
      navigate({ to: "/results/$attemptId", params: { attemptId } });
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit");
      setSubmitting(false);
    }
  }

  if (isLoading || !attempt) {
    return (
      <div className="grid h-[calc(100vh-3.25rem)] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={<Brain className="h-5 w-5" />}
        title={attempt.topic}
        description={`${attempt.difficulty} · ${questions.length} questions`}
        actions={
          <Badge variant={timeLeft <= 10 ? "destructive" : "secondary"} className="gap-1">
            <Clock className="h-3 w-3" /> {timeLeft}s
          </Badge>
        }
      />
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>Question {idx + 1} of {questions.length}</span>
          <span>{answeredCount}/{questions.length} answered</span>
        </div>
        <Progress value={progressPct} className="mb-6" />

        {current && (
          <Card>
            <CardContent className="space-y-5 p-6">
              <h2 className="text-lg font-semibold leading-snug">{current.q}</h2>
              <div className="grid gap-2">
                {current.options.map((opt, i) => {
                  const selected = answers[idx] === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => choose(i)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition ${
                        selected ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                      }`}
                    >
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded border text-xs font-medium ${
                        selected ? "border-primary bg-primary text-primary-foreground" : ""
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
            <ArrowLeft className="h-4 w-4" /> Prev
          </Button>
          {idx < questions.length - 1 ? (
            <Button onClick={() => setIdx(idx + 1)}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finalize} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
