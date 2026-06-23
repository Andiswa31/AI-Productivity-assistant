import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/quiz.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Brain, Flame, PlusCircle, Sparkles, Target, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — QuizAI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const fn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  const stats = data?.stats;
  const accuracy =
    stats && stats.total_questions > 0
      ? Math.round((stats.total_correct / stats.total_questions) * 100)
      : 0;

  return (
    <div>
      <PageHeader
        icon={<Brain className="h-5 w-5" />}
        title={`Hi${data?.profile?.display_name ? `, ${data.profile.display_name}` : ""} 👋`}
        description="Pick up where you left off or start a new quiz."
        actions={
          <Button onClick={() => navigate({ to: "/quiz/new" })}>
            <PlusCircle className="h-4 w-4" /> New Quiz
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Sparkles className="h-5 w-5" />} label="XP" value={stats?.xp ?? 0} />
          <StatCard icon={<Flame className="h-5 w-5 text-orange-500" />} label="Streak" value={`${stats?.streak_days ?? 0} days`} />
          <StatCard icon={<Target className="h-5 w-5" />} label="Accuracy" value={`${accuracy}%`} />
          <StatCard icon={<Trophy className="h-5 w-5 text-amber-500" />} label="Quizzes" value={stats?.total_quizzes ?? 0} />
        </div>

        {/* Recent attempts + badges */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent quizzes</CardTitle>
              <Link to="/quiz/new"><Button variant="ghost" size="sm">New</Button></Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
              {!isLoading && data?.recent.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">No quizzes yet.</p>
                  <Button className="mt-3" onClick={() => navigate({ to: "/quiz/new" })}>Start your first quiz</Button>
                </div>
              )}
              {data?.recent.map((a) => (
                <Link
                  key={a.id}
                  to={a.status === "completed" ? "/results/$attemptId" : "/quiz/$attemptId"}
                  params={{ attemptId: a.id }}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{a.topic}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.difficulty} · {a.num_questions} questions
                      {a.status === "in_progress" && " · in progress"}
                    </div>
                  </div>
                  {a.status === "completed" && a.correct_count !== null && (
                    <Badge variant="secondary">
                      {a.correct_count}/{a.num_questions}
                    </Badge>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4" /> Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.badges.length === 0 && (
                <p className="text-sm text-muted-foreground">Earn badges by completing quizzes and building streaks.</p>
              )}
              <div className="grid grid-cols-3 gap-3">
                {data?.badges.map((b: any) => (
                  <div key={b.badges?.code} className="rounded-lg border bg-accent/30 p-3 text-center">
                    <div className="text-2xl">🏅</div>
                    <div className="mt-1 truncate text-xs font-medium">{b.badges?.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent">{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
