-- ============================================
-- Ensure Users Table RLS is properly configured
-- ============================================
-- usersテーブルのRLSを確実に設定します
-- ============================================

-- RLSが有効になっているか確認して有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを一旦削除
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;

-- ユーザーは自分のデータのみ閲覧可能
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ユーザーは自分のデータのみ更新可能
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 新規ユーザーの自動作成用ポリシー（auth.usersトリガーから呼ばれる）
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLSの状態を確認するためのコメント
COMMENT ON TABLE public.users IS 'User profiles with RLS enabled - users can only access their own data';

-- 既存のRLSポリシーを確認するためのクエリ（実行はされません、参考用）
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'users';