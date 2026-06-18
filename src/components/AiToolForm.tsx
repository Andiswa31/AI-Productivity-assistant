import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, RotateCcw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { generateAi } from "@/lib/ai.functions";

export type Field = {
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
};

export function AiToolForm({
  system,
  fields,
  buildPrompt,
  ctaLabel = "Generate",
  intro,
}: {
  system: string;
  fields: Field[];
  buildPrompt: (values: Record<string, string>) => string;
  ctaLabel?: string;
  intro?: ReactNode;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, ""])),
  );
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [editing, setEditing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !values[f.name]?.trim());
    if (missing) {
      toast.error(`${missing.label} is required`);
      return;
    }
    setLoading(true);
    try {
      const { text } = await generateAi({
        data: { system, prompt: buildPrompt(values) },
      });
      setOutput(text);
      setEditing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      if (msg.includes("429")) toast.error("Rate limit reached. Please try again shortly.");
      else if (msg.includes("402")) toast.error("AI credits exhausted. Please add credits.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
        {intro && <div className="text-sm text-muted-foreground">{intro}</div>}
        {fields.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <Label htmlFor={f.name}>{f.label}</Label>
            <Textarea
              id={f.name}
              rows={f.rows ?? 3}
              placeholder={f.placeholder}
              value={values[f.name]}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              className="resize-y"
            />
          </div>
        ))}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Wand2 />
          )}
          {loading ? "Generating…" : ctaLabel}
        </Button>
      </form>

      <div className="flex flex-col rounded-xl border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b px-4 py-3">
          <h2 className="truncate text-sm font-medium">AI Output</h2>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!output}
              onClick={() => setEditing((e) => !e)}
            >
              <RotateCcw className="h-4 w-4" />
              {editing ? "Preview" : "Edit"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!output}
              onClick={() => {
                navigator.clipboard.writeText(output);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>
        <div className="min-h-[300px] flex-1 p-4">
          {!output && !loading && (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              Your AI-generated output will appear here.
            </div>
          )}
          {loading && (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {output && editing && (
            <Textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="min-h-[300px] resize-y font-mono text-sm"
            />
          )}
          {output && !editing && (
            <div className="prose-chat text-sm">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className="border-t px-4 py-2 text-[11px] text-muted-foreground">
          AI-generated content may contain errors. Review before using.
        </div>
      </div>
    </div>
  );
}
