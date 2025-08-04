# &[🏢]s!:Snap - なぜ早く開発を進められたか

## genspark へのプロンプト

以下の原稿をもとに、高速開発の秘訣と工夫を共有するプレゼンテーションを作成してください。開発者向けに、実践的な Tips と具体的な時間短縮の実例を交えた内容にしてください。スライドは 10-12 枚程度で、開発者に刺さるテクニカルでモダンなデザインを使用してください。

---

## スライド構成案

### スライド 1: タイトル

**高速開発の舞台裏**
&[🏢]s!:Snap を 1 日で作り上げた方法

〜 モダンスタックと AI 活用による究極の開発効率化 〜

発表者: いまいまい

### スライド 2: 開発プロセス

**AI駆動開発の流れ**

```
1. REQUIREMENTS.md作成・AI共有
2. AI駆動DB設計（Claude Code）
3. 認証・組織管理（AI実装）
4. 写真機能（MCP活用）
5. ネットワーク可視化（AI生成）
6. UI仕上げ・デプロイ
```

**従来の開発手法を根本から変革**

### スライド 3: 成功の 3 本柱

**AI ファーストな開発アプローチ**

1. 📋 **specs/ による要件定義**
   - REQUIREMENTS.md で AI と認識共有
   - CHECKLIST.md で品質担保

2. 🤖 **Claude Code の全面活用**
   - 実装の 95% を AI が生成
   - 人間はレビューと承認のみ

3. 🔧 **MCP サーバーの活用**
   - context7: ライブラリドキュメント即座参照
   - serena: コードベース解析と編集
   - playwright: UI テストの自動化

### スライド 4: 技術選定の戦略

**「作らない」を徹底**

| 領域     | 選択               | 理由                     |
| -------- | ------------------ | ------------------------ |
| 認証     | Supabase Auth      | 実装済みの認証機能       |
| DB       | Supabase + Drizzle | 型安全性とRLSの両立      |
| UI       | shadcn/ui          | 高品質コンポーネント群   |
| スタイル | Tailwind CSS v4    | ユーティリティファースト |

**開発工数を劇的に削減**

### スライド 5: Supabase の威力

**Backend as a Service の活用**

```typescript
// 認証: たった数行で実装
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});

// RLS: SQLでセキュリティを宣言的に
CREATE POLICY "Users can view own organization members" ON users
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM organization_memberships
    WHERE user_id = auth.uid()
  )
);
```

**実装工数を大幅に削減**

### スライド 6: AI 駆動開発の実践

**Claude Code による完全自動実装**

1. **specs/REQUIREMENTS.md の威力**
   ```markdown
   ## 必須機能
   1. 写真による友達機能
   2. 組織管理（承認フロー）
   3. ネットワーク可視化
   ```
   → AI が仕様を完全理解

2. **CLAUDE.md による品質保証**
   - 命名規則の自動遵守
   - アーキテクチャパターンの統一
   - 型安全性の担保

3. **人間の役割は「承認」のみ**
   ```
   AI: 「この実装でよろしいですか？」
   人間: 「y」
   ```

### スライド 7: 型安全性による高速化

**TypeScript + Zod + Drizzle の黄金トライアングル**

```typescript
// Entity定義（Zod）
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
});

// 型の自動生成
export type User = z.infer<typeof UserSchema>;

// Drizzle ORMでの型安全なクエリ
const users = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.organizationId, orgId));
// 👆 コンパイル時に型チェック
```

**デバッグ工数を大幅に削減**

### スライド 8: コンポーネント設計

**Package by Feature アーキテクチャ**

```
src/components/features/photos/
├── PhotoUpload.tsx         # メインコンポーネント
├── usePhotoUpload.ts      # カスタムフック
├── photoValidation.ts     # バリデーション
└── photo-preview/
    └── PhotoPreview.tsx   # サブコンポーネント
```

**メリット**:

- 機能単位での並行開発
- 依存関係の明確化
- リファクタリングの容易さ

### スライド 9: MCP サーバーの活用

**外部リソースへの即座アクセス**

1. **context7 でドキュメント参照**
   ```typescript
   // AI が自動で最新ドキュメントを参照
   mcp__context7__get-library-docs("/vercel/next.js", {
     topic: "app-router"
   })
   ```

2. **serena でコード解析**
   ```typescript
   // 既存コードの構造を瞬時に理解
   mcp__serena__get_symbols_overview({
     relative_path: "src/components"
   })
   ```

3. **playwright で動作確認**
   ```typescript
   // UI の自動テスト
   mcp__playwright__browser_snapshot()
   ```

**調査工数をほぼゼロに**

### スライド 10: AI との対話例

**実際の開発フロー**

```
人間: 「友達機能を実装して」

AI: 「specs/REQUIREMENTS.md を確認しました。
     以下の実装でよろしいですか？
     - photos テーブル作成
     - friendships テーブル作成
     - Supabase Storage 設定
     - アップロード API」

人間: 「y」

AI: 「実装完了しました。
     lefthook で自動整形済みです」

人間: 「ネットワーク図も追加して」

AI: 「MCP serena で類似実装を検索...
     React Flow を使用します」

人間: 「y」
```

**実装プロセスを極限まで効率化**

### スライド 11: 失敗と学び

**高速開発の落とし穴**

1. **初期の過度な抽象化**

   - 解決: YAGNI 原則の徹底

2. **テスト不足による手戻り**

   - 解決: 重要機能に絞ったテスト

3. **ドキュメント不足**
   - 解決: CLAUDE.md での継続的更新

**教訓**: スピードと品質のバランス

### スライド 12: まとめ

**AI 時代の開発手法**

1. **仕様書ファーストの開発**
   - specs/ で要件を明文化
   - AI が完全に理解できる形式で記述

2. **Claude Code + MCP の最強タッグ**
   - 実装は AI に 100% 任せる
   - 人間は方向性の指示と承認のみ

3. **人間の役割の変化**
   - 仕様作成とビジョン設定
   - AI への適切な指示
   - 品質の確認と承認
   - 実装は AI に完全委任

**未来の開発**: 人間はプロダクトマネージャー、AI がエンジニア

---

## 話すポイント

- **効率化の実例**: 具体的な改善事例を紹介
- **コード例**: 実際のコードで Before/After を示す
- **失敗談**: 完璧ではなかった部分も正直に
- **再現性**: 聴衆が明日から使える Tips

## 追加スライド案

### ボーナススライド: AI 活用ツール

**開発を加速させたツール群**

```json
{
  "primary_ai": "Claude Code",
  "mcp_servers": {
    "context7": "ドキュメント即座参照",
    "serena": "コードベース解析・編集",
    "playwright": "UI 自動テスト"
  },
  "specs": {
    "REQUIREMENTS.md": "要件定義",
    "CHECKLIST.md": "品質チェック",
    "CLAUDE.md": "AI への指示書"
  },
  "human_tools": ["承認ボタン", "コーヒー"]
}
```

### ボーナススライド: コスト削減

**インフラコスト**

- Supabase: 無料枠で十分
- Vercel: 無料枠で十分
- 総インフラコスト: **月額 0 円**

開発速度とコストの両立を実現
