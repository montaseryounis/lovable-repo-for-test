import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listJobs } from "@/lib/jobs.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/history")({ component: HistoryPage });

function HistoryPage() {
  const fetchJobs = useServerFn(listJobs);
  const { data, isLoading } = useQuery({
    queryKey: ["jobs"], queryFn: () => fetchJobs(), refetchInterval: 5000,
  });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">History</h2>
        <p className="text-muted-foreground">All previous jobs</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Jobs</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Loading...</p>
            : !data?.jobs.length ? <p className="text-muted-foreground">No jobs yet</p>
            : (
              <div className="space-y-2">
                {data.jobs.map((j) => (
                  <div key={j.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{j.tool}</span>
                      <span className="text-xs text-muted-foreground">{new Date(j.created_at).toLocaleString("en")}</span>
                    </div>
                    <Badge variant={j.status === "completed" ? "default" : j.status === "failed" ? "destructive" : "secondary"}>{j.status}</Badge>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}