import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AiToolForm } from "@/components/AiToolForm";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Workplace AI" },
      { name: "description", content: "Summarize meeting notes into key points and action items." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  return (
    <div>
      <PageHeader
        icon={<FileText className="h-5 w-5" />}
        title="Meeting Notes Summarizer"
        description="Turn raw notes or transcripts into clear summaries."
      />
      <AiToolForm
        system="You summarize meeting notes for busy professionals. Always produce: 1) TL;DR (2-3 sentences), 2) Key Discussion Points (bulleted), 3) Decisions Made, 4) Action Items with owner and due date when available, 5) Open Questions."
        fields={[
          { name: "notes", label: "Raw notes / transcript", placeholder: "Paste your meeting notes or transcript here…", rows: 12, required: true },
          { name: "focus", label: "Focus areas (optional)", placeholder: "e.g. budget decisions, timeline, blockers", rows: 2 },
        ]}
        buildPrompt={(v) => `Summarize the following meeting.
${v.focus ? `Focus on: ${v.focus}\n` : ""}
Notes:
${v.notes}`}
        ctaLabel="Summarize Notes"
      />
    </div>
  );
}
