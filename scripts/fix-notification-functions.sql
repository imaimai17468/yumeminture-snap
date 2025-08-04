-- ============================================
-- 通知関数の修正SQL
-- ============================================
-- このSQLをSupabaseのSQLエディタで直接実行してください
-- ============================================

-- 1. 古い関数を削除
DROP FUNCTION IF EXISTS public.create_notification(uuid, text, text, text, uuid, jsonb);

-- 2. 正しいカラム名を使用する新しい関数を作成
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

-- 3. トリガー関数の修正（新しい関数シグネチャを使用）
-- notify_organization_admins_on_join_request
CREATE OR REPLACE FUNCTION public.notify_organization_admins_on_join_request()
RETURNS TRIGGER AS $$
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
        'join_request'::notification_type,
        'New Organization Join Request',
        user_name || ' has requested to join ' || org_name,
        NEW.user_id,
        NEW.organization_id,
        NULL
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- notify_user_on_join_status_change
CREATE OR REPLACE FUNCTION public.notify_user_on_join_status_change()
RETURNS TRIGGER AS $$
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
        'join_approved'::notification_type,
        'Organization Join Request Approved',
        'Your request to join ' || org_name || ' has been approved!',
        NULL,
        NEW.organization_id,
        NULL
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.create_notification(
        NEW.user_id,
        'join_rejected'::notification_type,
        'Organization Join Request Rejected',
        'Your request to join ' || org_name || ' has been rejected.',
        NULL,
        NEW.organization_id,
        NULL
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- notify_user_on_photo_tag
CREATE OR REPLACE FUNCTION public.notify_user_on_photo_tag()
RETURNS TRIGGER AS $$
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
      'photo_tagged'::notification_type,
      'You were tagged in a photo',
      photo_record.photographer_name || ' tagged you in a photo',
      photo_record.uploaded_by,
      NULL,
      NEW.photo_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- notify_users_on_new_friendship
CREATE OR REPLACE FUNCTION public.notify_users_on_new_friendship()
RETURNS TRIGGER AS $$
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
    'new_friend'::notification_type,
    'New Friend Added',
    'You are now friends with ' || user2_name,
    NEW.user_id_2,
    NULL,
    NULL
  );
  
  PERFORM public.create_notification(
    NEW.user_id_2,
    'new_friend'::notification_type,
    'New Friend Added',
    'You are now friends with ' || user1_name,
    NEW.user_id_1,
    NULL,
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. 関数が正しく更新されたか確認
SELECT proname, pronargs, proargtypes::regtype[] 
FROM pg_proc 
WHERE proname = 'create_notification';