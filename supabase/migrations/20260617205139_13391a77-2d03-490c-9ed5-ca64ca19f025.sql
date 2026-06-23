
CREATE TYPE public.space_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE public.spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT 'violet',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.space_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.space_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spaces TO authenticated;
GRANT ALL ON public.spaces TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_members TO authenticated;
GRANT ALL ON public.space_members TO service_role;

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS between spaces and space_members
CREATE OR REPLACE FUNCTION public.is_space_member(_space_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = _space_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.spaces WHERE id = _space_id AND owner_id = _user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_space_member(uuid, uuid) TO authenticated, service_role;

-- spaces policies
CREATE POLICY spaces_select_member ON public.spaces FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_space_member(id, auth.uid()));
CREATE POLICY spaces_insert_own ON public.spaces FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY spaces_update_owner ON public.spaces FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY spaces_delete_owner ON public.spaces FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- space_members policies
CREATE POLICY members_select_visible ON public.space_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.spaces s WHERE s.id = space_id AND s.owner_id = auth.uid()
  ));
CREATE POLICY members_insert_owner ON public.space_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.spaces s WHERE s.id = space_id AND s.owner_id = auth.uid()
  ));
CREATE POLICY members_update_owner ON public.space_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.spaces s WHERE s.id = space_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.spaces s WHERE s.id = space_id AND s.owner_id = auth.uid()));
CREATE POLICY members_delete_owner_or_self ON public.space_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.spaces s WHERE s.id = space_id AND s.owner_id = auth.uid()
  ));

CREATE TRIGGER trg_spaces_updated_at BEFORE UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
