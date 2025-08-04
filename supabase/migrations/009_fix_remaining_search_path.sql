-- ============================================
-- Fix remaining search_path security issue
-- ============================================
-- Date: 2025-01-29
-- Description: Fix search_path for the other create_notification function
-- ============================================

-- Fix search_path for the second create_notification function (with different parameters)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_related_user_id UUID DEFAULT NULL,
  p_related_organization_id UUID DEFAULT NULL,
  p_related_photo_id UUID DEFAULT NULL
) 
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Also check and fix any trigger functions that might have been missed
-- List all functions without search_path for verification
-- SELECT n.nspname AS schema, p.proname AS function_name
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND p.prosrc NOT LIKE '%search_path%'
-- AND p.prokind = 'f';

-- Migration completed: Fixed remaining search_path security issue for create_notification function