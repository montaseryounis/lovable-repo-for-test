import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ColorEnum = z.enum(["violet", "blue", "emerald", "amber", "rose", "slate"]);
const RoleEnum = z.enum(["owner", "editor", "viewer"]);

export const listSpaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: spaces, error } = await supabase
      .from("spaces")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (spaces ?? []).map((s) => s.id);
    let counts: Record<string, number> = {};
    if (ids.length) {
      const { data: members } = await supabase
        .from("space_members")
        .select("space_id")
        .in("space_id", ids);
      counts = (members ?? []).reduce<Record<string, number>>((acc, m) => {
        acc[m.space_id] = (acc[m.space_id] ?? 0) + 1;
        return acc;
      }, {});
    }
    return {
      spaces: (spaces ?? []).map((s) => ({
        ...s,
        member_count: (counts[s.id] ?? 0) + 1, // include owner
        is_owner: s.owner_id === userId,
      })),
    };
  });

const CreateSpaceInput = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  color: ColorEnum.optional(),
});

export const createSpace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateSpaceInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: space, error } = await supabase
      .from("spaces")
      .insert({
        owner_id: userId,
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? "violet",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { space };
  });

const UpdateSpaceInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
  color: ColorEnum.optional(),
});

export const updateSpace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateSpaceInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { id, ...patch } = data;
    const { error } = await supabase.from("spaces").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const DeleteSpaceInput = z.object({ id: z.string().uuid() });

export const deleteSpace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteSpaceInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("spaces").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ListMembersInput = z.object({ space_id: z.string().uuid() });

export const listSpaceMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListMembersInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: space } = await supabase
      .from("spaces")
      .select("owner_id")
      .eq("id", data.space_id)
      .single();
    const { data: members, error } = await supabase
      .from("space_members")
      .select("id, user_id, role, created_at")
      .eq("space_id", data.space_id);
    if (error) throw new Error(error.message);
    const userIds = Array.from(
      new Set([...(members ?? []).map((m) => m.user_id), space?.owner_id].filter(Boolean) as string[]),
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .in("id", userIds);
    return { owner_id: space?.owner_id ?? null, members: members ?? [], profiles: profiles ?? [] };
  });

const AddMemberInput = z.object({
  space_id: z.string().uuid(),
  email: z.string().email(),
  role: RoleEnum.optional(),
});

export const addSpaceMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AddMemberInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: space } = await supabase
      .from("spaces")
      .select("owner_id")
      .eq("id", data.space_id)
      .single();
    if (!space || space.owner_id !== userId) throw new Error("Only the owner can add members");
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (!profile) throw new Error("No user found with that email");
    if (profile.id === userId) throw new Error("You are already the owner");
    const { error } = await supabase.from("space_members").insert({
      space_id: data.space_id,
      user_id: profile.id,
      role: data.role ?? "viewer",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const RemoveMemberInput = z.object({ member_id: z.string().uuid() });

export const removeSpaceMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RemoveMemberInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("space_members").delete().eq("id", data.member_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateRoleInput = z.object({ member_id: z.string().uuid(), role: RoleEnum });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateRoleInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("space_members")
      .update({ role: data.role })
      .eq("id", data.member_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });