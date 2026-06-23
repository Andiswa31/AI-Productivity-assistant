import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Trophy, BarChart3, Flame, MessageSquare, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuizAI — AI-Powered Practice Quizzes" },
      { name: "description", content: "Generate custom quizzes on any topic, learn with an AI tutor, build streaks, and earn badges." },
      { property: "og:title", content: "QuizAI — AI-Powered Practice Quizzes" },
      { property: "og:description", content: "Practice smarter with AI-generated quizzes, instant explanations, streaks, and analytics." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Sparkles, title: "AI-generated quizzes", desc: "Type any topic — get a fresh quiz tailored to your difficulty." },
  { icon: MessageSquare, title: "AI tutor chat", desc: "Ask follow-up questions and have concepts explained on demand." },
  { icon: Flame, title: "Streaks & badges", desc: "Build daily habits and unlock achievements as you grow." },
  { icon: Trophy, title: "Leaderboard", desc: "See where you rank against other learners." },
  { icon: BarChart3, title: "Analytics", desc: "Spot weak topics, track accuracy, and improve over time." },
  { icon: ShieldCheck, title: "Responsible AI", desc: "Outputs are clearly labeled and always reviewable." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            QuizAI
          </Link>
          <div className="flex gap-2">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth"><Button>Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-accent/40 px-3 py-1 text-xs font-medium">
          <Sparkles className="h-3 w-3" /> Powered by Lovable AI
        </div>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Master any subject with <span className="text-primary">AI-powered quizzes</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Generate practice quizzes on any topic, learn with an AI tutor, build streaks, earn badges, and track your progress.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth"><Button size="lg">Start learning free</Button></Link>
          <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        AI-generated content may be inaccurate. Always verify important answers.
      </footer>
    </div>
  );
}
