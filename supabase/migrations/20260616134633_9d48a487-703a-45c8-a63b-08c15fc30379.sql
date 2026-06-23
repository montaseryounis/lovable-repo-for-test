DROP POLICY IF EXISTS magnific_delete_own ON storage.objects;
DROP POLICY IF EXISTS magnific_select_own ON storage.objects;
DROP POLICY IF EXISTS magnific_update_own ON storage.objects;

CREATE POLICY magnific_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'magnific' AND owner = auth.uid());

CREATE POLICY magnific_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'magnific' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'magnific' AND owner = auth.uid());

CREATE POLICY magnific_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'magnific' AND owner = auth.uid());