# テラコード

TypeScript版の寺院管理システムです。

## 機能

- **戸主台帳**: 檀家・世帯員の情報を登録・編集・検索
- **法要・行事管理**: 法要・行事のスケジュール管理、参加者・御布施の記録

## 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org) (App Router)
- **言語**: TypeScript
- **データベース**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io)
- **スタイリング**: Tailwind CSS

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを編集してデータベース接続URLを設定します。

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### 3. データベースのマイグレーション

```bash
npx prisma migrate dev --name init
```

### 4. Prismaクライアントの生成

```bash
npx prisma generate
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## ディレクトリ構成

```
src/
├── app/
│   ├── api/
│   │   ├── danka/          # 檀家APIルート
│   │   └── ceremonies/     # 法要・行事APIルート
│   ├── danka/              # 戸主台帳ページ
│   ├── ceremonies/         # 法要・行事ページ
│   └── page.tsx            # トップページ
├── lib/
│   └── prisma.ts           # Prismaクライアント
└── types/
    └── index.ts            # 型定義
prisma/
└── schema.prisma           # データベーススキーマ
```

## データモデル

- **Danka（檀家）**: 檀家番号・氏名・住所・連絡先など
- **DankaMember（世帯員）**: 続柄・生年月日・戒名など
- **Ceremony（法要・行事）**: タイトル・種別・日時・場所など
- **CeremonyParticipant（参加者）**: 参加人数・御布施など
