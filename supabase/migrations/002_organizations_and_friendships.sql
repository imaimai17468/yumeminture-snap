-- ============================================
-- Organizations and Friendships Setup
-- ============================================
-- このマイグレーションは、組織管理と友達関係システムの
-- テーブルとRLSポリシーを設定します
-- ============================================

-- ============================================
-- 1. Create Enums (if not exists)
-- ============================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
        CREATE TYPE public.membership_role AS ENUM ('admin', 'member');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
        CREATE TYPE public.membership_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'communication_status_type') THEN
        CREATE TYPE public.communication_status_type AS ENUM ('office', 'social', 'available', 'busy');
    END IF;
END $$;

-- ============================================
-- 2. Create organizations table
-- ============================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Create organization_memberships table
-- ============================================
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.membership_role NOT NULL DEFAULT 'member',
  status public.membership_status NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS organization_memberships_user_id_idx ON public.organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS organization_memberships_org_status_idx ON public.organization_memberships(organization_id, status);
CREATE INDEX IF NOT EXISTS organization_memberships_org_role_idx ON public.organization_memberships(organization_id, role);

-- Enable RLS
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- メンバーシップは関連するユーザーと組織のメンバーが閲覧可能
DROP POLICY IF EXISTS "organization_memberships_select_policy" ON public.organization_memberships;
CREATE POLICY "organization_memberships_select_policy" ON public.organization_memberships
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'approved'
    )
  );

-- メンバーシップの申請は認証されたユーザーが自分自身のものを作成可能
DROP POLICY IF EXISTS "organization_memberships_insert_policy" ON public.organization_memberships;
CREATE POLICY "organization_memberships_insert_policy" ON public.organization_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- メンバーシップの更新は管理者のみ可能（承認・却下・ロール変更）
DROP POLICY IF EXISTS "organization_memberships_update_policy" ON public.organization_memberships;
CREATE POLICY "organization_memberships_update_policy" ON public.organization_memberships
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'approved'
    )
  );

-- メンバーシップの削除は管理者または本人が可能
DROP POLICY IF EXISTS "organization_memberships_delete_policy" ON public.organization_memberships;
CREATE POLICY "organization_memberships_delete_policy" ON public.organization_memberships
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'approved'
    )
  );

-- ============================================
-- 4. Create friendships table
-- ============================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT unique_friendship UNIQUE (user_id_1, user_id_2),
  CONSTRAINT different_users CHECK (user_id_1 != user_id_2),
  CONSTRAINT ordered_users CHECK (user_id_1 < user_id_2)
);

-- Indexes
CREATE INDEX IF NOT EXISTS friendships_user_id_1_idx ON public.friendships(user_id_1);
CREATE INDEX IF NOT EXISTS friendships_user_id_2_idx ON public.friendships(user_id_2);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 友達関係は当事者のみ閲覧可能
DROP POLICY IF EXISTS "friendships_select_policy" ON public.friendships;
CREATE POLICY "friendships_select_policy" ON public.friendships
  FOR SELECT
  TO authenticated
  USING (
    user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  );

-- 友達関係の作成は認証されたユーザーが可能（自分が含まれる必要がある）
DROP POLICY IF EXISTS "friendships_insert_policy" ON public.friendships;
CREATE POLICY "friendships_insert_policy" ON public.friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  );

-- 友達関係の削除は当事者のみ可能
DROP POLICY IF EXISTS "friendships_delete_policy" ON public.friendships;
CREATE POLICY "friendships_delete_policy" ON public.friendships
  FOR DELETE
  TO authenticated
  USING (
    user_id_1 = auth.uid() OR user_id_2 = auth.uid()
  );

-- ============================================
-- 5. Create photos table
-- ============================================
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id UUID NOT NULL REFERENCES public.friendships(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS photos_friendship_id_idx ON public.photos(friendship_id);
CREATE INDEX IF NOT EXISTS photos_uploaded_by_idx ON public.photos(uploaded_by);
CREATE INDEX IF NOT EXISTS photos_created_at_idx ON public.photos(created_at);

-- Enable RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- 写真は友達関係の当事者のみ閲覧可能
DROP POLICY IF EXISTS "photos_select_policy" ON public.photos;
CREATE POLICY "photos_select_policy" ON public.photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.id = photos.friendship_id
      AND (f.user_id_1 = auth.uid() OR f.user_id_2 = auth.uid())
    )
  );

-- 写真のアップロードは友達関係の当事者のみ可能
DROP POLICY IF EXISTS "photos_insert_policy" ON public.photos;
CREATE POLICY "photos_insert_policy" ON public.photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.id = friendship_id
      AND (f.user_id_1 = auth.uid() OR f.user_id_2 = auth.uid())
    )
  );

-- 写真の削除はアップロードした本人のみ可能
DROP POLICY IF EXISTS "photos_delete_policy" ON public.photos;
CREATE POLICY "photos_delete_policy" ON public.photos
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- ============================================
-- 6. Create photo_users table
-- ============================================
CREATE TABLE IF NOT EXISTS public.photo_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT unique_photo_user UNIQUE (photo_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS photo_users_photo_id_idx ON public.photo_users(photo_id);
CREATE INDEX IF NOT EXISTS photo_users_user_id_idx ON public.photo_users(user_id);

-- Enable RLS
ALTER TABLE public.photo_users ENABLE ROW LEVEL SECURITY;

-- 写真内のユーザーは、写真を閲覧できる人のみ閲覧可能
DROP POLICY IF EXISTS "photo_users_select_policy" ON public.photo_users;
CREATE POLICY "photo_users_select_policy" ON public.photo_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.photos p
      JOIN public.friendships f ON p.friendship_id = f.id
      WHERE p.id = photo_users.photo_id
      AND (f.user_id_1 = auth.uid() OR f.user_id_2 = auth.uid())
    )
  );

-- 写真内のユーザーの追加は写真をアップロードした本人のみ可能
DROP POLICY IF EXISTS "photo_users_insert_policy" ON public.photo_users;
CREATE POLICY "photo_users_insert_policy" ON public.photo_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.photos p
      WHERE p.id = photo_id
      AND p.uploaded_by = auth.uid()
    )
  );

-- 写真内のユーザーの削除は写真をアップロードした本人のみ可能
DROP POLICY IF EXISTS "photo_users_delete_policy" ON public.photo_users;
CREATE POLICY "photo_users_delete_policy" ON public.photo_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.photos p
      WHERE p.id = photo_id
      AND p.uploaded_by = auth.uid()
    )
  );

-- ============================================
-- 7. Create communication_statuses table
-- ============================================
CREATE TABLE IF NOT EXISTS public.communication_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  status_type public.communication_status_type NOT NULL,
  message VARCHAR(200),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS communication_statuses_user_id_idx ON public.communication_statuses(user_id);
CREATE INDEX IF NOT EXISTS communication_statuses_type_expires_idx ON public.communication_statuses(status_type, expires_at);

-- Enable RLS
ALTER TABLE public.communication_statuses ENABLE ROW LEVEL SECURITY;

-- コミュニケーション状態は友達の友達まで閲覧可能
DROP POLICY IF EXISTS "communication_statuses_select_policy" ON public.communication_statuses;
CREATE POLICY "communication_statuses_select_policy" ON public.communication_statuses
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    -- 直接の友達
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = communication_statuses.user_id)
      OR (f.user_id_2 = auth.uid() AND f.user_id_1 = communication_statuses.user_id)
    ) OR
    -- 友達の友達
    EXISTS (
      SELECT 1 FROM public.friendships f1
      JOIN public.friendships f2 ON (
        (f1.user_id_1 = f2.user_id_1 OR f1.user_id_1 = f2.user_id_2 OR
         f1.user_id_2 = f2.user_id_1 OR f1.user_id_2 = f2.user_id_2)
        AND f1.id != f2.id
      )
      WHERE (
        (f1.user_id_1 = auth.uid() OR f1.user_id_2 = auth.uid())
        AND (f2.user_id_1 = communication_statuses.user_id OR f2.user_id_2 = communication_statuses.user_id)
      )
    )
  );

-- コミュニケーション状態の作成・更新は本人のみ可能
DROP POLICY IF EXISTS "communication_statuses_insert_policy" ON public.communication_statuses;
CREATE POLICY "communication_statuses_insert_policy" ON public.communication_statuses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "communication_statuses_update_policy" ON public.communication_statuses;
CREATE POLICY "communication_statuses_update_policy" ON public.communication_statuses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "communication_statuses_delete_policy" ON public.communication_statuses;
CREATE POLICY "communication_statuses_delete_policy" ON public.communication_statuses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 8. Create RLS Policies (After all tables are created)
-- ============================================

-- Organizations Policies
-- 組織は認証されたユーザーなら誰でも閲覧可能
DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;
CREATE POLICY "organizations_select_policy" ON public.organizations
  FOR SELECT
  TO authenticated
  USING (true);

-- 組織の作成は認証されたユーザーなら誰でも可能（最初の管理者になる）
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
CREATE POLICY "organizations_insert_policy" ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 組織の更新は管理者のみ可能
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;
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
  );

-- 組織の削除は管理者のみ可能
DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;
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

-- ============================================
-- 9. Create updated_at triggers for new tables
-- ============================================
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_memberships_updated_at ON public.organization_memberships;
CREATE TRIGGER update_organization_memberships_updated_at 
  BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_communication_statuses_updated_at ON public.communication_statuses;
CREATE TRIGGER update_communication_statuses_updated_at 
  BEFORE UPDATE ON public.communication_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 10. Storage policies for photos bucket
-- ============================================
-- Note: The 'photos' bucket must be created via Supabase Dashboard before running this SQL

-- Policy 1: Photos are viewable by friends
DROP POLICY IF EXISTS "Photos are viewable by friends" ON storage.objects;
CREATE POLICY "Photos are viewable by friends"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos' AND
  EXISTS (
    SELECT 1 FROM public.photos p
    JOIN public.friendships f ON p.friendship_id = f.id
    WHERE p.photo_url = storage.objects.name
    AND (f.user_id_1 = auth.uid() OR f.user_id_2 = auth.uid())
  )
);

-- Policy 2: Users can upload photos for their friendships
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
CREATE POLICY "Users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can delete their own photos
DROP POLICY IF EXISTS "Users can delete their photos" ON storage.objects;
CREATE POLICY "Users can delete their photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Storage Structure:
-- photos/{user_id}/{photo_id}.{extension}
-- ============================================