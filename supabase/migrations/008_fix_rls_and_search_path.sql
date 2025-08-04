-- ============================================
-- Fix RLS and search_path security issues
-- ============================================
-- Date: 2025-01-29
-- Description: 
--   1. Ensure RLS is enabled on all tables
--   2. Add missing RLS policies
--   3. Fix function search_path settings
-- ============================================

-- ============================================
-- 1. Ensure RLS is enabled on all tables
-- ============================================

-- Re-enable RLS on all tables (idempotent)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Fix missing policies
-- ============================================

-- Drop existing policies on organizations table to recreate them
DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;

-- Recreate organizations policies with proper permissions
-- Everyone can view all organizations
CREATE POLICY "organizations_select_policy" ON public.organizations
  FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can create an organization
CREATE POLICY "organizations_insert_policy" ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only organization admins can update their organization
CREATE POLICY "organizations_update_policy" ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'approved'
    )
  );

-- Only organization admins can delete their organization
CREATE POLICY "organizations_delete_policy" ON public.organizations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'approved'
    )
  );

-- Add missing INSERT policy for notifications table
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 3. Fix function search_path settings
-- ============================================

-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix search_path for handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = COALESCE(EXCLUDED.name, users.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix search_path for create_notification function
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_related_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_related_id, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Fix search_path for notify_organization_admins_on_join_request function
CREATE OR REPLACE FUNCTION public.notify_organization_admins_on_join_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  org_name TEXT;
  user_name TEXT;
BEGIN
  -- Only notify on new pending requests
  IF NEW.status = 'pending' THEN
    -- Get organization name
    SELECT name INTO org_name FROM public.organizations WHERE id = NEW.organization_id;
    
    -- Get requesting user name
    SELECT name INTO user_name FROM public.users WHERE id = NEW.user_id;
    
    -- Create notifications for all admins of the organization
    FOR admin_record IN 
      SELECT user_id 
      FROM public.organization_memberships 
      WHERE organization_id = NEW.organization_id 
      AND role = 'admin' 
      AND status = 'approved'
      AND user_id != NEW.user_id
    LOOP
      PERFORM public.create_notification(
        admin_record.user_id,
        'organization_join_request',
        'New Organization Join Request',
        user_name || ' has requested to join ' || org_name,
        NEW.id,
        jsonb_build_object(
          'organization_id', NEW.organization_id,
          'user_id', NEW.user_id,
          'membership_id', NEW.id
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix search_path for notify_user_on_join_status_change function
CREATE OR REPLACE FUNCTION public.notify_user_on_join_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_name TEXT;
BEGIN
  -- Only notify on status changes
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    -- Get organization name
    SELECT name INTO org_name FROM public.organizations WHERE id = NEW.organization_id;
    
    IF NEW.status = 'approved' THEN
      PERFORM public.create_notification(
        NEW.user_id,
        'organization_join_approved',
        'Organization Join Request Approved',
        'Your request to join ' || org_name || ' has been approved!',
        NEW.id,
        jsonb_build_object('organization_id', NEW.organization_id)
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.create_notification(
        NEW.user_id,
        'organization_join_rejected',
        'Organization Join Request Rejected',
        'Your request to join ' || org_name || ' has been rejected.',
        NEW.id,
        jsonb_build_object('organization_id', NEW.organization_id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix search_path for notify_user_on_photo_tag function
CREATE OR REPLACE FUNCTION public.notify_user_on_photo_tag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photographer_name TEXT;
  photo_record RECORD;
BEGIN
  -- Get photo details
  SELECT p.*, u.name as photographer_name
  INTO photo_record
  FROM public.photos p
  JOIN public.users u ON p.uploaded_by = u.id
  WHERE p.id = NEW.photo_id;
  
  -- Don't notify the photographer about their own photo
  IF NEW.user_id != photo_record.uploaded_by THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'photo_tag',
      'You were tagged in a photo',
      photo_record.photographer_name || ' tagged you in a photo',
      NEW.photo_id,
      jsonb_build_object(
        'photo_id', NEW.photo_id,
        'photographer_id', photo_record.uploaded_by
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix search_path for notify_users_on_new_friendship function
CREATE OR REPLACE FUNCTION public.notify_users_on_new_friendship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user1_name TEXT;
  user2_name TEXT;
BEGIN
  -- Get user names
  SELECT name INTO user1_name FROM public.users WHERE id = NEW.user_id_1;
  SELECT name INTO user2_name FROM public.users WHERE id = NEW.user_id_2;
  
  -- Notify both users
  PERFORM public.create_notification(
    NEW.user_id_1,
    'new_friendship',
    'New Friend Added',
    'You are now friends with ' || user2_name,
    NEW.id,
    jsonb_build_object('friend_id', NEW.user_id_2)
  );
  
  PERFORM public.create_notification(
    NEW.user_id_2,
    'new_friendship',
    'New Friend Added',
    'You are now friends with ' || user1_name,
    NEW.id,
    jsonb_build_object('friend_id', NEW.user_id_1)
  );
  
  RETURN NEW;
END;
$$;

-- ============================================
-- 4. Verify all tables have RLS enabled
-- ============================================

-- This query can be run to verify RLS is enabled on all tables
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- Migration completed: Fixed RLS and search_path security issues identified by Supabase security audit