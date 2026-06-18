import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import {
  LayoutDashboard,
  Mail,
  FileText,
  ListChecks,
  Search,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Workplace AI" },
      { name: "description", content: "Your AI workplace productivity dashboard." },
    ],
  }),
  component: Dashboard,
});

const tools = [
  {
    title: "Smart Email Generator",
    description: "Draft professional emails from a short brief.",
    href: "/email",
    icon: Mail,
  },
  {
    title: "Meeting Notes Summarizer",
    description: "Turn raw notes or transcripts into clear summaries.",
    href: "/notes",
    icon: FileText,
  },
  {
    title: "AI Task Planner",
    description: "Break down goals into actionable, prioritized tasks.",
    href: "/tasks",
    icon: ListChecks,
  },
  {
    title: "AI Research Assistant",
    description: "Get a structured briefing on any topic.",
    href: "/research",
    icon: Search,
  },
  {
    title: "AI Chatbot",
    description: "Ask anything — a general-purpose work assistant.",
    href: "/chat",
    icon: MessageSquare,
  },
] as const;

function Dashboard() {
  return (
    <div>
      <PageHeader
        icon={<LayoutDashboard className="h-5 w-5" />}
        title="Welcome back"
        description="Choose a tool to get started."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Link
              key={t.href}
              to={t.href}
              className="group rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                <t.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold tracking-tight">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
                Open <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-accent/30 p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <div className="font-medium">Responsible AI use</div>
            <p className="text-muted-foreground">
              Outputs are AI-generated and may be inaccurate or biased. Always review,
              fact-check, and edit before sharing. Avoid entering confidential information
              you wouldn't share with a third-party service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
