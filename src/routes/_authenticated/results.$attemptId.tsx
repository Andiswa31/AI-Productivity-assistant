import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAttempt, type QuizQuestion } from "@/lib/quiz.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trophy, RotateCcw, MessageSquare, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/results/$attemptId")({
  head: () => ({ meta: [{ title: "Results — QuizAI" }] }),
  component: Results,
});

function Results() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const get = useServerFn(getAttempt);
  const { data: attempt, isLoading } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => get({ data: { id: attemptId } }),
  });

  if (isLoading || !attempt) {
    return (
      <div className="grid h-[calc(100vh-3.25rem)] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const questions = attempt.questions as QuizQuestion[];
  const answers = (attempt.answers as (number | null)[]) ?? [];
  const correct = attempt.correct_count ?? 0;
  const total = attempt.num_questions;
  const pct = Math.round((correct / total) * 100);

  return (
    <div>
      <PageHeader
        icon={<Trophy className="h-5 w-5" />}
        title="Results"
        description={attempt.topic}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/chat" })}>
              <MessageSquare className="h-4 w-4" /> Ask tutor
            </Button>
            <Link to="/quiz/new">
              <Button><RotateCcw className="h-4 w-4" /> New quiz</Button>
            </Link>
          </div>
        }
      />
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Card>
          <CardContent className="grid grid-cols-2 items-center gap-4 p-6 sm:grid-cols-4">
            <Stat label="Score" value={`${correct}/${total}`} />
            <Stat label="Accuracy" value={`${pct}%`} />
            <Stat label="Difficulty" value={attempt.difficulty} />
            <Stat label="Time" value={attempt.duration_seconds ? `${attempt.duration_seconds}s` : "—"} />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const ua = answers[i];
            const isCorrect = ua === q.correct;
            return (
              <Card key={i}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium">
                      <span className="mr-2 text-muted-foreground">Q{i + 1}.</span>
                      {q.q}
                    </div>
                    <Badge variant={isCorrect ? "default" : "destructive"} className="shrink-0">
                      {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {isCorrect ? "Correct" : "Wrong"}
                    </Badge>
                  </div>
                  <div className="grid gap-1.5">
                    {q.options.map((opt, oi) => {
                      const isAns = oi === q.correct;
                      const isUser = oi === ua;
                      return (
                        <div
                          key={oi}
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                            isAns
                              ? "border-emerald-500/40 bg-emerald-500/10"
                              : isUser
                                ? "border-destructive/40 bg-destructive/10"
                                : ""
                          }`}
                        >
                          <span className="text-xs font-medium text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                          <span className="flex-1">{opt}</span>
                          {isAns && <Check className="h-4 w-4 text-emerald-600" />}
                          {isUser && !isAns && <X className="h-4 w-4 text-destructive" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-md bg-accent/40 p-3 text-sm">
                    <span className="font-medium">Explanation: </span>
                    {q.explanation}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold capitalize">{value}</div>
    </div>
  );
}
