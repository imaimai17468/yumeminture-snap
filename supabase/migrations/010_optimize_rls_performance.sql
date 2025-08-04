-- ============================================
-- Optimize RLS Performance
-- ============================================
-- Date: 2025-01-29
-- Description: Replace auth.uid() with (select auth.uid()) in RLS policies
--              to prevent re-evaluation for each row
-- ============================================

-- ============================================
-- 1. Optimize notifications table policies
-- ============================================

-- Drop and recreate notifications SELECT policy
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT 
  USING ((select auth.uid()) = user_id);

-- Drop and recreate notifications UPDATE policy
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE 
  USING ((select auth.uid()) = user_id);

-- ============================================
-- 2. Optimize organizations table policies
-- ============================================

-- Drop and recreate organizations UPDATE policy
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;
CREATE POLICY "organizations_update_policy" ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = organizations.id
      AND user_id = (select auth.uid())
      AND role = 'admin'
      AND status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = organizations.id
      AND user_id = (select auth.uid())
      AND role = 'admin'
      AND status = 'approved'
    )
  );

-- Drop and recreate organizations DELETE policy
DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;
CREATE POLICY "organizations_delete_policy" ON public.organizations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = organizations.id
      AND user_id = (select auth.uid())
      AND role = 'admin'
      AND status = 'approved'
    )
  );

-- ============================================
-- 3. Check and optimize other tables that might have the same issue
-- ============================================

-- Optimize users table policies
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "users_update_policy" ON public.users;
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- Optimize activities table policies
DROP POLICY IF EXISTS "Users can view relevant activities" ON public.activities;
CREATE POLICY "Users can view relevant activities" ON public.activities
  FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR 
    user_id IN (
      SELECT CASE 
        WHEN user_id_1 = (select auth.uid()) THEN user_id_2
        ELSE user_id_1
      END
      FROM public.friendships
      WHERE user_id_1 = (select auth.uid()) OR user_id_2 = (select auth.uid())
    )
    OR
    user_id IN (
      SELECT DISTINCT f2.user_id_1
      FROM public.friendships f1
      JOIN public.friendships f2 ON (
        (f1.user_id_2 = f2.user_id_1 OR f1.user_id_2 = f2.user_id_2)
        OR (f1.user_id_1 = f2.user_id_1 OR f1.user_id_1 = f2.user_id_2)
      )
      WHERE (f1.user_id_1 = (select auth.uid()) OR f1.user_id_2 = (select auth.uid()))
        AND f2.user_id_1 != (select auth.uid())
        AND f2.user_id_2 != (select auth.uid())
      
      UNION
      
      SELECT DISTINCT f2.user_id_2
      FROM public.friendships f1
      JOIN public.friendships f2 ON (
        (f1.user_id_2 = f2.user_id_1 OR f1.user_id_2 = f2.user_id_2)
        OR (f1.user_id_1 = f2.user_id_1 OR f1.user_id_1 = f2.user_id_2)
      )
      WHERE (f1.user_id_1 = (select auth.uid()) OR f1.user_id_2 = (select auth.uid()))
        AND f2.user_id_1 != (select auth.uid())
        AND f2.user_id_2 != (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create their own activities" ON public.activities;
CREATE POLICY "Users can create their own activities" ON public.activities
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;
CREATE POLICY "Users can delete their own activities" ON public.activities
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- Optimize organization_memberships table policies
DROP POLICY IF EXISTS "organization_memberships_select_policy" ON public.organization_memberships;
CREATE POLICY "organization_memberships_select_policy" ON public.organization_memberships
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR 
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_memberships 
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "organization_memberships_insert_policy" ON public.organization_memberships;
CREATE POLICY "organization_memberships_insert_policy" ON public.organization_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid()) AND status = 'pending'
  );

DROP POLICY IF EXISTS "organization_memberships_update_policy" ON public.organization_memberships;
CREATE POLICY "organization_memberships_update_policy" ON public.organization_memberships
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
      AND om.user_id = (select auth.uid())
      AND om.role = 'admin'
      AND om.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "organization_memberships_delete_policy" ON public.organization_memberships;
CREATE POLICY "organization_memberships_delete_policy" ON public.organization_memberships
  FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
      AND om.user_id = (select auth.uid())
      AND om.role = 'admin'
      AND om.status = 'approved'
    )
  );

-- Optimize friendships table policies
DROP POLICY IF EXISTS "friendships_select_policy" ON public.friendships;
CREATE POLICY "friendships_select_policy" ON public.friendships
  FOR SELECT
  TO authenticated
  USING (
    user_id_1 = (select auth.uid()) 
    OR user_id_2 = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE (f.user_id_1 = (select auth.uid()) OR f.user_id_2 = (select auth.uid()))
      AND (
        f.user_id_1 = friendships.user_id_1 
        OR f.user_id_2 = friendships.user_id_1
        OR f.user_id_1 = friendships.user_id_2
        OR f.user_id_2 = friendships.user_id_2
      )
    )
  );

DROP POLICY IF EXISTS "friendships_insert_policy" ON public.friendships;
CREATE POLICY "friendships_insert_policy" ON public.friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id_1 = (select auth.uid()) 
    OR user_id_2 = (select auth.uid())
  );

DROP POLICY IF EXISTS "friendships_delete_policy" ON public.friendships;
CREATE POLICY "friendships_delete_policy" ON public.friendships
  FOR DELETE
  TO authenticated
  USING (
    user_id_1 = (select auth.uid()) 
    OR user_id_2 = (select auth.uid())
  );

-- Optimize photos table policies
DROP POLICY IF EXISTS "photos_select_policy" ON public.photos;
CREATE POLICY "photos_select_policy" ON public.photos
  FOR SELECT
  TO authenticated
  USING (
    uploaded_by = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.photo_users
      WHERE photo_id = photos.id AND user_id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE friendship_id = photos.friendship_id
      AND (user_id_1 = (select auth.uid()) OR user_id_2 = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "photos_insert_policy" ON public.photos;
CREATE POLICY "photos_insert_policy" ON public.photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = (select auth.uid())
    AND (
      friendship_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.friendships
        WHERE id = friendship_id
        AND (user_id_1 = (select auth.uid()) OR user_id_2 = (select auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS "photos_delete_policy" ON public.photos;
CREATE POLICY "photos_delete_policy" ON public.photos
  FOR DELETE
  TO authenticated
  USING (uploaded_by = (select auth.uid()));

-- Optimize photo_users table policies
DROP POLICY IF EXISTS "photo_users_select_policy" ON public.photo_users;
CREATE POLICY "photo_users_select_policy" ON public.photo_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE id = photo_users.photo_id 
      AND (
        uploaded_by = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.photo_users pu2
          WHERE pu2.photo_id = photos.id AND pu2.user_id = (select auth.uid())
        )
      )
    )
  );

DROP POLICY IF EXISTS "photo_users_insert_policy" ON public.photo_users;
CREATE POLICY "photo_users_insert_policy" ON public.photo_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE id = photo_users.photo_id AND uploaded_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "photo_users_delete_policy" ON public.photo_users;
CREATE POLICY "photo_users_delete_policy" ON public.photo_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.photos
      WHERE id = photo_users.photo_id AND uploaded_by = (select auth.uid())
    )
  );

-- Optimize communication_statuses table policies
DROP POLICY IF EXISTS "communication_statuses_select_policy" ON public.communication_statuses;
CREATE POLICY "communication_statuses_select_policy" ON public.communication_statuses
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR
    user_id IN (
      SELECT CASE 
        WHEN user_id_1 = (select auth.uid()) THEN user_id_2
        ELSE user_id_1
      END
      FROM public.friendships
      WHERE user_id_1 = (select auth.uid()) OR user_id_2 = (select auth.uid())
    )
    OR
    user_id IN (
      SELECT DISTINCT f2.user_id_1
      FROM public.friendships f1
      JOIN public.friendships f2 ON (
        (f1.user_id_2 = f2.user_id_1 OR f1.user_id_2 = f2.user_id_2)
        OR (f1.user_id_1 = f2.user_id_1 OR f1.user_id_1 = f2.user_id_2)
      )
      WHERE (f1.user_id_1 = (select auth.uid()) OR f1.user_id_2 = (select auth.uid()))
        AND f2.user_id_1 != (select auth.uid())
        AND f2.user_id_2 != (select auth.uid())
      
      UNION
      
      SELECT DISTINCT f2.user_id_2
      FROM public.friendships f1
      JOIN public.friendships f2 ON (
        (f1.user_id_2 = f2.user_id_1 OR f1.user_id_2 = f2.user_id_2)
        OR (f1.user_id_1 = f2.user_id_1 OR f1.user_id_1 = f2.user_id_2)
      )
      WHERE (f1.user_id_1 = (select auth.uid()) OR f1.user_id_2 = (select auth.uid()))
        AND f2.user_id_1 != (select auth.uid())
        AND f2.user_id_2 != (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "communication_statuses_insert_policy" ON public.communication_statuses;
CREATE POLICY "communication_statuses_insert_policy" ON public.communication_statuses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "communication_statuses_update_policy" ON public.communication_statuses;
CREATE POLICY "communication_statuses_update_policy" ON public.communication_statuses
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "communication_statuses_delete_policy" ON public.communication_statuses;
CREATE POLICY "communication_statuses_delete_policy" ON public.communication_statuses
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Migration completed: Optimized RLS policies to prevent auth.uid() re-evaluation for each row