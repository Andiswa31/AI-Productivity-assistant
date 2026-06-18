import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AiToolForm } from "@/components/AiToolForm";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Workplace AI" },
      { name: "description", content: "Draft professional emails with AI." },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  return (
    <div>
      <PageHeader
        icon={<Mail className="h-5 w-5" />}
        title="Smart Email Generator"
        description="Generate professional emails from a short brief."
      />
      <AiToolForm
        system="You are an expert business communication assistant. Write clear, concise, professional emails. Always include a subject line, greeting, body, and sign-off. Match the requested tone."
        fields={[
          { name: "recipient", label: "Recipient / Audience", placeholder: "e.g. Hiring manager at Acme Corp", rows: 2, required: true },
          { name: "purpose", label: "Purpose of email", placeholder: "What do you want this email to achieve?", rows: 3, required: true },
          { name: "tone", label: "Tone", placeholder: "e.g. Formal, friendly, persuasive", rows: 1 },
          { name: "context", label: "Key points / context", placeholder: "Bullet points or details to include", rows: 4 },
        ]}
        buildPrompt={(v) => `Write an email.
Recipient: ${v.recipient}
Purpose: ${v.purpose}
Tone: ${v.tone || "Professional"}
Key points / context:
${v.context || "(none)"}

Format with a clear "Subject:" line at the top, then the email body.`}
        ctaLabel="Generate Email"
      />
    </div>
  );
}
