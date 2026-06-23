import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAnalytics } from "@/lib/quiz.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Loader2 } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — QuizAI" }] }),
  component: Analytics,
});

function Analytics() {
  const fn = useServerFn(getAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: () => fn() });

  return (
    <div>
      <PageHeader icon={<BarChart3 className="h-5 w-5" />} title="Analytics" description="Spot weak topics and track progress." />
      <div className="space-y-6 p-6">
        {isLoading && <Loader2 className="mx-auto h-5 w-5 animate-spin" />}
        {!isLoading && data && data.totalAttempts === 0 && (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
            Complete a quiz to see analytics here.
          </CardContent></Card>
        )}
        {data && data.totalAttempts > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card><CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Total attempts</div>
                <div className="text-2xl font-semibold">{data.totalAttempts}</div>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Avg time / question</div>
                <div className="text-2xl font-semibold">{data.avgSecondsPerQuestion}s</div>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Weakest topic</div>
                <div className="truncate text-2xl font-semibold">{data.topics[0]?.topic ?? "—"}</div>
              </CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Accuracy over time</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Accuracy by topic</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topics}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="topic" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                      <YAxis fontSize={12} domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
