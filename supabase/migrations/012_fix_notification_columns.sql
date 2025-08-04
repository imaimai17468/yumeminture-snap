-- ============================================
-- Fix notification columns in functions
-- ============================================
-- Date: 2025-08-04
-- Description: 
--   Fix create_notification function to use correct column names
--   (related_user_id, related_organization_id, related_photo_id)
--   instead of deprecated related_id column
-- ============================================

-- Drop the old function with incorrect column reference
DROP FUNCTION IF EXISTS public.create_notification(uuid, text, text, text, uuid, jsonb);

-- Recreate the function with correct column names
CREATE OR REPLACE FUNCTION public.create_notification(
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
  INSERT INTO public.notifications (
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the trigger functions to use the correct function signature

-- Fix notify_organization_admins_on_join_request
CREATE OR REPLACE FUNCTION public.notify_organization_admins_on_join_request()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix notify_user_on_join_status_change
CREATE OR REPLACE FUNCTION public.notify_user_on_join_status_change()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix notify_user_on_photo_tag
CREATE OR REPLACE FUNCTION public.notify_user_on_photo_tag()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix notify_users_on_new_friendship
CREATE OR REPLACE FUNCTION public.notify_users_on_new_friendship()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;