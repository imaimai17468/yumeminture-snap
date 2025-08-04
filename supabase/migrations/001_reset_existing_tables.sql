-- ============================================
-- Reset Existing Tables (Optional)
-- ============================================
-- このマイグレーションは既存のテーブルをクリーンアップします
-- 本番環境では実行しないでください！
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;

DROP POLICY IF EXISTS "organization_memberships_select_policy" ON public.organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_insert_policy" ON public.organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_update_policy" ON public.organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_delete_policy" ON public.organization_memberships;

DROP POLICY IF EXISTS "friendships_select_policy" ON public.friendships;
DROP POLICY IF EXISTS "friendships_insert_policy" ON public.friendships;
DROP POLICY IF EXISTS "friendships_delete_policy" ON public.friendships;

DROP POLICY IF EXISTS "photos_select_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_insert_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_delete_policy" ON public.photos;

DROP POLICY IF EXISTS "photo_users_select_policy" ON public.photo_users;
DROP POLICY IF EXISTS "photo_users_insert_policy" ON public.photo_users;
DROP POLICY IF EXISTS "photo_users_delete_policy" ON public.photo_users;

DROP POLICY IF EXISTS "communication_statuses_select_policy" ON public.communication_statuses;
DROP POLICY IF EXISTS "communication_statuses_insert_policy" ON public.communication_statuses;
DROP POLICY IF EXISTS "communication_statuses_update_policy" ON public.communication_statuses;
DROP POLICY IF EXISTS "communication_statuses_delete_policy" ON public.communication_statuses;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
DROP TRIGGER IF EXISTS update_organization_memberships_updated_at ON public.organization_memberships;
DROP TRIGGER IF EXISTS update_communication_statuses_updated_at ON public.communication_statuses;

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.photo_users CASCADE;
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.communication_statuses CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.organization_memberships CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.communication_status_type CASCADE;
DROP TYPE IF EXISTS public.membership_status CASCADE;
DROP TYPE IF EXISTS public.membership_role CASCADE;