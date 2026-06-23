import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listAllUsers } from "@/lib/jobs.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/admin")({ component: AdminPage });

function AdminPage() {
  const fetchUsers = useServerFn(listAllUsers);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"], queryFn: () => fetchUsers(), retry: false,
  });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Admins only</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Loading...</p>
            : error ? <p className="text-destructive">{(error as Error).message}</p>
            : (
              <div className="space-y-2">
                {data?.profiles.map((p) => {
                  const roles = data.roles.filter((r) => r.user_id === p.id).map((r) => r.role);
                  return (
                    <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{p.full_name ?? p.email}</span>
                        <span className="text-xs text-muted-foreground">{p.email}</span>
                      </div>
                      <div className="flex gap-1">{roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}</div>
                    </div>
                  );
                })}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}