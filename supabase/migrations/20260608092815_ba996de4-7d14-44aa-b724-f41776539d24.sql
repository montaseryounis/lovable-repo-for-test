
CREATE POLICY "magnific_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'magnific' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "magnific_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'magnific' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "magnific_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'magnific' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "magnific_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'magnific' AND auth.uid()::text = (storage.foldername(name))[1]);
