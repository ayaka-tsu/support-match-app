# 見てて

## アプリ概要

「見てて」は、子供連れでカフェやお店を利用するときに、「ほんの少しだけ誰かに見ていてほしい」という場面を支えるためのアプリです。

子供の対応に追われて食事や休憩ができなかったり、少し息抜きしたくても家族や一時預かりを利用するほどではなかったりすることがあります。

そこで、同じ店内にいる「短時間ならサポートできる人」と「少しだけ手を借りたい人」をつなぎ、店内・短時間に限定した気軽な助け合いを実現することを目指しました。保護者が少しでもゆっくりでき、サポートする側にとっても子供とのふれあいや、人を助けるきっかけになるようなサービスを目指しています。

## デモ

公開URL：https://support-match-app.vercel.app

## デモアカウント

### デモユーザー1

- メールアドレス: demo@mitete.test
- パスワード: MiteteDemo2026!

### デモユーザー2

- メールアドレス: demo2@mitete.test
- パスワード: MiteteDemo2026!

## 主な機能

- ユーザー登録・ログイン
- プロフィール設定
- 店舗の検索・選択
- サポート依頼
- 同じ場所にいる人とのマッチング
- マッチング相手とのメッセージ
- マッチングの終了・キャンセル
- 新着メッセージやマッチング状況の通知表示

## 使用技術

- Next.js 16.3.1
- React 19.2.8
- TypeScript
- Tailwind CSS 4
- Supabase
- Prisma 7.9.1
- PostgreSQL
- Vercel

## 外部サービス・API

- Supabase：認証、データベース、ストレージ、リアルタイム通信に使用

## 必須環境

- Node.js 20系
- npm

## ローカルでの実行方法

```bash
git clone https://github.com/ayaka-tsu/support-match-app.git
cd support-match-app
npm install
```

プロジェクト直下に `.env.local` を作成し、Supabase接続用の以下の項目を設定します。

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

設定後、以下を実行します。

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 画面イメージ

### トップ画面

![トップ画面](./public/readme-top.png)

### 店舗一覧

![店舗一覧](./public/readme-stores.png)

### メッセージ画面

![メッセージ画面](./public/readme-messages.png)
