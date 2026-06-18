import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AiToolForm } from "@/components/AiToolForm";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Workplace AI" },
      { name: "description", content: "Get a structured briefing on any topic." },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  return (
    <div>
      <PageHeader
        icon={<Search className="h-5 w-5" />}
        title="AI Research Assistant"
        description="Get a structured briefing on any topic."
      />
      <AiToolForm
        intro="Note: This assistant uses its trained knowledge and does not browse the live web."
        system="You are a research assistant. Produce a structured briefing: 1) Overview, 2) Key Concepts, 3) Current State / Trends, 4) Notable Examples or Players, 5) Pros & Cons / Considerations, 6) Suggested Further Reading topics. Be factual; flag uncertainty explicitly."
        fields={[
          { name: "topic", label: "Topic", placeholder: "e.g. Retrieval-augmented generation for legal docs", rows: 2, required: true },
          { name: "audience", label: "Audience / depth", placeholder: "e.g. Exec summary, technical deep dive", rows: 1 },
          { name: "questions", label: "Specific questions", placeholder: "Anything in particular you want answered?", rows: 3 },
        ]}
        buildPrompt={(v) => `Research briefing.
Topic: ${v.topic}
Audience / depth: ${v.audience || "General professional audience"}
Specific questions: ${v.questions || "(none)"}`}
        ctaLabel="Research Topic"
      />
    </div>
  );
}
