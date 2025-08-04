-- Create activity type enum
DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'friend_added',
    'photo_uploaded',
    'joined_organization',
    'left_organization',
    'status_changed',
    'photo_tagged'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  related_photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  related_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_related_user_id ON activities(related_user_id);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activities from themselves and their friends
CREATE POLICY "Users can view relevant activities" ON activities
  FOR SELECT
  USING (
    -- Own activities
    user_id = auth.uid() 
    OR
    -- Activities from friends
    user_id IN (
      SELECT 
        CASE 
          WHEN user_id_1 = auth.uid() THEN user_id_2
          ELSE user_id_1
        END
      FROM friendships
      WHERE user_id_1 = auth.uid() OR user_id_2 = auth.uid()
    )
    OR
    -- Activities where user is mentioned (related_user_id)
    related_user_id = auth.uid()
  );

-- Policy: Users can only create activities for themselves
CREATE POLICY "Users can create their own activities" ON activities
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users cannot update activities
-- (Activities are immutable historical records)

-- Policy: Users can only delete their own activities
CREATE POLICY "Users can delete their own activities" ON activities
  FOR DELETE
  USING (user_id = auth.uid());