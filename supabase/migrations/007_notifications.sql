-- Create notification type enum if not exists
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'join_request',
        'join_approved', 
        'join_rejected',
        'photo_tagged',
        'new_friend',
        'member_removed',
        'role_changed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  related_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  related_photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_related_user_id UUID DEFAULT NULL,
  p_related_organization_id UUID DEFAULT NULL,
  p_related_photo_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_user_id,
    related_organization_id,
    related_photo_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_related_user_id,
    p_related_organization_id,
    p_related_photo_id
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for organization join requests
CREATE OR REPLACE FUNCTION notify_organization_admins_on_join_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all admins of the organization
  INSERT INTO notifications (user_id, type, title, message, related_user_id, related_organization_id)
  SELECT 
    om.user_id,
    'join_request'::notification_type,
    'New Join Request',
    u.name || ' requested to join your organization',
    NEW.user_id,
    NEW.organization_id
  FROM organization_memberships om
  INNER JOIN users u ON u.id = NEW.user_id
  WHERE om.organization_id = NEW.organization_id
    AND om.role = 'admin'
    AND om.status = 'approved';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_join_request_notify ON organization_memberships;
CREATE TRIGGER on_join_request_notify
  AFTER INSERT ON organization_memberships
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_organization_admins_on_join_request();

-- Trigger for join request approval/rejection
CREATE OR REPLACE FUNCTION notify_user_on_join_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, related_organization_id)
    SELECT 
      NEW.user_id,
      'join_approved'::notification_type,
      'Join Request Approved',
      'Your request to join ' || o.name || ' has been approved!',
      NEW.organization_id
    FROM organizations o
    WHERE o.id = NEW.organization_id;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, related_organization_id)
    SELECT 
      NEW.user_id,
      'join_rejected'::notification_type,
      'Join Request Rejected',
      'Your request to join ' || o.name || ' has been rejected.',
      NEW.organization_id
    FROM organizations o
    WHERE o.id = NEW.organization_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_join_status_change_notify ON organization_memberships;
CREATE TRIGGER on_join_status_change_notify
  AFTER UPDATE ON organization_memberships
  FOR EACH ROW
  WHEN (OLD.status != NEW.status)
  EXECUTE FUNCTION notify_user_on_join_status_change();

-- Trigger for photo tagging
CREATE OR REPLACE FUNCTION notify_user_on_photo_tag()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if user tagged themselves
  IF NEW.user_id = (SELECT uploaded_by FROM photos WHERE id = NEW.photo_id) THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO notifications (user_id, type, title, message, related_user_id, related_photo_id)
  SELECT 
    NEW.user_id,
    'photo_tagged'::notification_type,
    'You were tagged in a photo',
    u.name || ' tagged you in a photo',
    p.uploaded_by,
    NEW.photo_id
  FROM photos p
  INNER JOIN users u ON u.id = p.uploaded_by
  WHERE p.id = NEW.photo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_photo_tag_notify ON photo_users;
CREATE TRIGGER on_photo_tag_notify
  AFTER INSERT ON photo_users
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_on_photo_tag();

-- Trigger for new friendships
CREATE OR REPLACE FUNCTION notify_users_on_new_friendship()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify both users
  INSERT INTO notifications (user_id, type, title, message, related_user_id)
  SELECT 
    NEW.user_id_1,
    'new_friend'::notification_type,
    'New Friend',
    u.name || ' is now your friend!',
    NEW.user_id_2
  FROM users u
  WHERE u.id = NEW.user_id_2;
  
  INSERT INTO notifications (user_id, type, title, message, related_user_id)
  SELECT 
    NEW.user_id_2,
    'new_friend'::notification_type,
    'New Friend',
    u.name || ' is now your friend!',
    NEW.user_id_1
  FROM users u
  WHERE u.id = NEW.user_id_1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_friendship_notify ON friendships;
CREATE TRIGGER on_new_friendship_notify
  AFTER INSERT ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_on_new_friendship();