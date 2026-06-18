import { createFileRoute } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AiToolForm } from "@/components/AiToolForm";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Workplace AI" },
      { name: "description", content: "Break down goals into actionable, prioritized tasks." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  return (
    <div>
      <PageHeader
        icon={<ListChecks className="h-5 w-5" />}
        title="AI Task Planner"
        description="Break a goal into a prioritized, actionable plan."
      />
      <AiToolForm
        system="You are a project planning assistant. Break the user's goal into a clear, prioritized task list. For each task include: a short title, brief description, priority (High/Med/Low), and estimated effort. Group by phase if helpful. End with suggested next 3 steps."
        fields={[
          { name: "goal", label: "Goal or project", placeholder: "What are you trying to accomplish?", rows: 3, required: true },
          { name: "deadline", label: "Deadline / timeline", placeholder: "e.g. 2 weeks, by end of Q3", rows: 1 },
          { name: "constraints", label: "Constraints / context", placeholder: "Team size, resources, dependencies…", rows: 3 },
        ]}
        buildPrompt={(v) => `Create a task plan.
Goal: ${v.goal}
Timeline: ${v.deadline || "Not specified"}
Constraints / context: ${v.constraints || "(none)"}`}
        ctaLabel="Generate Plan"
      />
    </div>
  );
}
