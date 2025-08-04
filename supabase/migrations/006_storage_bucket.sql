-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload photos'
  ) THEN
    CREATE POLICY "Users can upload photos" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'photos' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view all photos'
  ) THEN
    CREATE POLICY "Users can view all photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own photos'
  ) THEN
    CREATE POLICY "Users can delete their own photos" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'photos' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Add missing columns to photos table if they don't exist
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS photo_path TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS description TEXT;

-- Remove the default from photo_path after adding it
ALTER TABLE photos 
ALTER COLUMN photo_path DROP DEFAULT;