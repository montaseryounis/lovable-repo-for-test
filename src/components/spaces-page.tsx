import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Users,
  Crown,
  MoreVertical,
  Trash2,
  Pencil,
  UserPlus,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  listSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  listSpaceMembers,
  addSpaceMember,
  removeSpaceMember,
  updateMemberRole,
} from "@/lib/spaces.functions";

const COLORS = [
  { id: "violet", className: "from-violet-500 to-fuchsia-500" },
  { id: "blue", className: "from-sky-500 to-blue-600" },
  { id: "emerald", className: "from-emerald-500 to-teal-500" },
  { id: "amber", className: "from-amber-400 to-orange-500" },
  { id: "rose", className: "from-rose-500 to-pink-500" },
  { id: "slate", className: "from-slate-500 to-zinc-600" },
] as const;

type ColorId = (typeof COLORS)[number]["id"];

function colorClass(id: string) {
  return COLORS.find((c) => c.id === id)?.className ?? COLORS[0].className;
}

type Space = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  member_count: number;
  is_owner: boolean;
};

export function SpacesPage() {
  const list = useServerFn(listSpaces);
  const { data, isLoading } = useQuery({
    queryKey: ["spaces"],
    queryFn: () => list({}),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editSpace, setEditSpace] = useState<Space | null>(null);
  const [membersSpace, setMembersSpace] = useState<Space | null>(null);

  const spaces = (data?.spaces ?? []) as Space[];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Spaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Collaborative team workspaces for your projects.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> New Space
            </Button>
          </DialogTrigger>
          <SpaceFormDialog
            mode="create"
            onDone={() => setCreateOpen(false)}
          />
        </Dialog>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-card/40 border border-border animate-pulse" />
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((s) => (
            <SpaceCard
              key={s.id}
              space={s}
              onEdit={() => setEditSpace(s)}
              onMembers={() => setMembersSpace(s)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!editSpace} onOpenChange={(o) => !o && setEditSpace(null)}>
        {editSpace && (
          <SpaceFormDialog
            mode="edit"
            space={editSpace}
            onDone={() => setEditSpace(null)}
          />
        )}
      </Dialog>

      <Dialog open={!!membersSpace} onOpenChange={(o) => !o && setMembersSpace(null)}>
        {membersSpace && (
          <MembersDialog space={membersSpace} onClose={() => setMembersSpace(null)} />
        )}
      </Dialog>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="mx-auto size-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
        <Layers className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">No spaces yet</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Create a space to group projects and invite teammates to collaborate.
      </p>
      <Button className="mt-5 gap-2" onClick={onCreate}>
        <Plus className="size-4" /> Create your first space
      </Button>
    </div>
  );
}

function SpaceCard({
  space,
  onEdit,
  onMembers,
}: {
  space: Space;
  onEdit: () => void;
  onMembers: () => void;
}) {
  const qc = useQueryClient();
  const del = useServerFn(deleteSpace);
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Space deleted");
      qc.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="group rounded-xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "size-11 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-semibold",
            colorClass(space.color),
          )}
        >
          {space.name.slice(0, 1).toUpperCase()}
        </div>
        {space.is_owner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="size-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMembers}>
                <UserPlus className="size-4 mr-2" /> Manage members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (confirm(`Delete "${space.name}"? This cannot be undone.`)) {
                    remove.mutate(space.id);
                  }
                }}
              >
                <Trash2 className="size-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <h3 className="mt-3 font-semibold truncate">{space.name}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
        {space.description || "No description"}
      </p>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <button
          onClick={onMembers}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Users className="size-3.5" />
          {space.member_count} {space.member_count === 1 ? "member" : "members"}
        </button>
        {space.is_owner ? (
          <Badge variant="secondary" className="gap-1">
            <Crown className="size-3" /> Owner
          </Badge>
        ) : (
          <Badge variant="outline">Member</Badge>
        )}
      </div>
    </div>
  );
}

function SpaceFormDialog({
  mode,
  space,
  onDone,
}: {
  mode: "create" | "edit";
  space?: Space;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const create = useServerFn(createSpace);
  const update = useServerFn(updateSpace);

  const [name, setName] = useState(space?.name ?? "");
  const [description, setDescription] = useState(space?.description ?? "");
  const [color, setColor] = useState<ColorId>((space?.color as ColorId) ?? "violet");

  const save = useMutation({
    mutationFn: async () => {
      if (mode === "create") {
        return create({ data: { name, description: description || null, color } });
      }
      return update({
        data: { id: space!.id, name, description: description || null, color },
      });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Space created" : "Space updated");
      qc.invalidateQueries({ queryKey: ["spaces"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Create new space" : "Edit space"}</DialogTitle>
        <DialogDescription>
          Spaces group projects so your team can collaborate.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Marketing Campaign"
            maxLength={80}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this space for?"
            rows={3}
            maxLength={500}
          />
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={cn(
                  "size-8 rounded-lg bg-gradient-to-br ring-offset-2 ring-offset-background transition-all",
                  c.className,
                  color === c.id ? "ring-2 ring-foreground" : "opacity-70 hover:opacity-100",
                )}
                aria-label={c.id}
              />
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button
          onClick={() => save.mutate()}
          disabled={!name.trim() || save.isPending}
        >
          {save.isPending ? "Saving…" : mode === "create" ? "Create space" : "Save changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function MembersDialog({ space, onClose }: { space: Space; onClose: () => void }) {
  const qc = useQueryClient();
  const listMembers = useServerFn(listSpaceMembers);
  const add = useServerFn(addSpaceMember);
  const remove = useServerFn(removeSpaceMember);
  const updateRole = useServerFn(updateMemberRole);

  const { data, isLoading } = useQuery({
    queryKey: ["space-members", space.id],
    queryFn: () => listMembers({ data: { space_id: space.id } }),
  });

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("viewer");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["space-members", space.id] });
    qc.invalidateQueries({ queryKey: ["spaces"] });
  };

  const addMut = useMutation({
    mutationFn: () => add({ data: { space_id: space.id, email, role } }),
    onSuccess: () => {
      toast.success(`${email} added`);
      setEmail("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => remove({ data: { member_id: id } }),
    onSuccess: () => {
      toast.success("Member removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMut = useMutation({
    mutationFn: ({ id, r }: { id: string; r: "owner" | "editor" | "viewer" }) =>
      updateRole({ data: { member_id: id, role: r } }),
    onSuccess: () => {
      toast.success("Role updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const profilesById = new Map((data?.profiles ?? []).map((p) => [p.id, p]));
  const owner = data?.owner_id ? profilesById.get(data.owner_id) : null;

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Members of {space.name}</DialogTitle>
        <DialogDescription>
          Invite teammates by email. They must already have an account.
        </DialogDescription>
      </DialogHeader>

      {space.is_owner && (
        <div className="flex gap-2 py-2">
          <Input
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={role} onValueChange={(v) => setRole(v as "editor" | "viewer")}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => addMut.mutate()}
            disabled={!email || addMut.isPending}
          >
            Invite
          </Button>
        </div>
      )}

      <div className="space-y-1 max-h-80 overflow-y-auto -mx-1 px-1">
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">Loading…</div>
        ) : (
          <>
            {owner && (
              <MemberRow
                name={owner.full_name || owner.email || "Owner"}
                email={owner.email || ""}
                avatar={owner.avatar_url}
                roleLabel="Owner"
                isOwner
              />
            )}
            {(data?.members ?? []).map((m) => {
              const p = profilesById.get(m.user_id);
              return (
                <MemberRow
                  key={m.id}
                  name={p?.full_name || p?.email || "User"}
                  email={p?.email || ""}
                  avatar={p?.avatar_url}
                  roleLabel={m.role}
                  canManage={space.is_owner}
                  onRoleChange={(r) => roleMut.mutate({ id: m.id, r: r as "editor" | "viewer" })}
                  onRemove={() => removeMut.mutate(m.id)}
                />
              );
            })}
            {(data?.members ?? []).length === 0 && !owner && (
              <div className="text-sm text-muted-foreground py-4 text-center">No members yet</div>
            )}
          </>
        )}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function MemberRow({
  name,
  email,
  avatar,
  roleLabel,
  isOwner,
  canManage,
  onRoleChange,
  onRemove,
}: {
  name: string;
  email: string;
  avatar?: string | null;
  roleLabel: string;
  isOwner?: boolean;
  canManage?: boolean;
  onRoleChange?: (r: string) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
      <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
        {avatar ? (
          <img src={avatar} alt="" className="size-full object-cover" />
        ) : (
          name.slice(0, 1).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{name}</div>
        <div className="text-xs text-muted-foreground truncate">{email}</div>
      </div>
      {isOwner ? (
        <Badge variant="secondary" className="gap-1">
          <Crown className="size-3" /> Owner
        </Badge>
      ) : canManage && onRoleChange && onRemove ? (
        <>
          <Select value={roleLabel} onValueChange={onRoleChange}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="size-8" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        </>
      ) : (
        <Badge variant="outline" className="capitalize">{roleLabel}</Badge>
      )}
    </div>
  );
}