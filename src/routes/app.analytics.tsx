import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/lib/analytics.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const fetchFn = useServerFn(getAnalytics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetchFn(),
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Admins only — usage across all tools</p>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : error ? (
        <p className="text-destructive">{(error as Error).message}</p>
      ) : data ? (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat label="Total jobs" value={data.total} />
            <Stat label="Last 7 days" value={data.last7d} />
            <Stat label="Unique users" value={data.uniqueUsers} />
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>By status</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(data.byStatus).map(([k, v]) => (
                  <Row key={k} label={k} value={v} />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>By tool</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(data.byTool)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => <Row key={k} label={k} value={v} />)}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent><div className="text-3xl font-bold">{value}</div></CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border rounded-lg px-3 py-2">
      <span className="text-sm">{label}</span>
      <Badge variant="outline">{value}</Badge>
    </div>
  );
}