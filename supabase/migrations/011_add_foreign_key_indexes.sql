-- ============================================
-- Add Missing Foreign Key Indexes
-- ============================================
-- Date: 2025-01-29
-- Description: Add indexes on foreign key columns to improve JOIN performance
-- ============================================

-- ============================================
-- 1. Add indexes for activities table foreign keys
-- ============================================

-- Index for user_id (foreign key to users table)
CREATE INDEX IF NOT EXISTS idx_activities_user_id 
ON public.activities(user_id);

-- Index for related_user_id (foreign key to users table)
CREATE INDEX IF NOT EXISTS idx_activities_related_user_id 
ON public.activities(related_user_id);

-- Index for related_photo_id (foreign key to photos table)
CREATE INDEX IF NOT EXISTS idx_activities_related_photo_id 
ON public.activities(related_photo_id);

-- Index for related_organization_id (foreign key to organizations table)
CREATE INDEX IF NOT EXISTS idx_activities_related_organization_id 
ON public.activities(related_organization_id);

-- ============================================
-- 2. Add indexes for notifications table foreign keys
-- ============================================

-- Index for related_user_id (foreign key to users table)
CREATE INDEX IF NOT EXISTS idx_notifications_related_user_id 
ON public.notifications(related_user_id);

-- Index for related_organization_id (foreign key to organizations table)
CREATE INDEX IF NOT EXISTS idx_notifications_related_organization_id 
ON public.notifications(related_organization_id);

-- Index for related_photo_id (foreign key to photos table)
CREATE INDEX IF NOT EXISTS idx_notifications_related_photo_id 
ON public.notifications(related_photo_id);

-- ============================================
-- 3. Add composite indexes for frequently used queries
-- ============================================

-- Composite index for activities table (user_id, created_at)
-- Useful for fetching user's recent activities
CREATE INDEX IF NOT EXISTS idx_activities_user_id_created_at 
ON public.activities(user_id, created_at DESC);

-- Composite index for notifications table (user_id, is_read, created_at)
-- Useful for fetching user's unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read_created_at 
ON public.notifications(user_id, is_read, created_at DESC);

-- ============================================
-- 4. Consider removing unused indexes (commented out for now)
-- ============================================

-- The following indexes were identified as unused by Supabase linter.
-- However, since the application is still new, we'll keep them for now
-- and re-evaluate after more production usage.

-- Indexes to potentially remove in the future:
-- DROP INDEX IF EXISTS public.photos_created_at_idx;
-- DROP INDEX IF EXISTS public.photo_users_photo_id_idx;
-- DROP INDEX IF EXISTS public.communication_statuses_type_expires_idx;
-- DROP INDEX IF EXISTS public.idx_notifications_is_read;

-- ============================================
-- 5. Add comments to document index purposes
-- ============================================

COMMENT ON INDEX idx_activities_user_id IS 'Index for JOIN queries between activities and users tables';
COMMENT ON INDEX idx_activities_related_user_id IS 'Index for finding activities related to specific users';
COMMENT ON INDEX idx_activities_related_photo_id IS 'Index for finding activities related to specific photos';
COMMENT ON INDEX idx_activities_related_organization_id IS 'Index for finding activities related to specific organizations';

COMMENT ON INDEX idx_notifications_related_user_id IS 'Index for finding notifications related to specific users';
COMMENT ON INDEX idx_notifications_related_organization_id IS 'Index for finding notifications related to specific organizations';
COMMENT ON INDEX idx_notifications_related_photo_id IS 'Index for finding notifications related to specific photos';

COMMENT ON INDEX idx_activities_user_id_created_at IS 'Composite index for fetching user timeline activities efficiently';
COMMENT ON INDEX idx_notifications_user_id_is_read_created_at IS 'Composite index for fetching unread notifications efficiently';

-- Migration completed: Added foreign key indexes to improve query performance