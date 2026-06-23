import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLeaderboard } from "@/lib/quiz.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Flame, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — QuizAI" }] }),
  component: Leaderboard,
});

function Leaderboard() {
  const fn = useServerFn(getLeaderboard);
  const { data, isLoading } = useQuery({ queryKey: ["leaderboard"], queryFn: () => fn() });

  return (
    <div>
      <PageHeader icon={<Trophy className="h-5 w-5" />} title="Leaderboard" description="Top learners by XP." />
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardContent className="p-0">
            {isLoading && <div className="p-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>}
            {!isLoading && data && data.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">Nobody on the board yet. Be the first!</p>
            )}
            <ul className="divide-y">
              {data?.map((row: any, i) => {
                const acc = row.total_questions
                  ? Math.round((row.total_correct / row.total_questions) * 100)
                  : 0;
                return (
                  <li key={row.user_id} className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
                        i === 0 ? "bg-amber-400/20 text-amber-700" :
                        i === 1 ? "bg-slate-300/30 text-slate-700" :
                        i === 2 ? "bg-orange-400/20 text-orange-700" :
                        "bg-accent text-foreground/70"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{row.profiles?.display_name ?? "Learner"}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.total_quizzes} quizzes · {acc}% accuracy
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Flame className="h-3.5 w-3.5 text-orange-500" /> {row.streak_days}
                      </span>
                      <span className="font-semibold">{row.xp} XP</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
