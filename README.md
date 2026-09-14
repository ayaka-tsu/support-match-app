# 見てて

## アプリ概要

## アプリ概要

「見てて」は、子供連れでカフェやお店を利用するときに、「ほんの少しだけ誰かに見ていてほしい」という場面を支えるためのアプリです。

子供と一緒に外出していると、食事をゆっくり取りたい、少し休憩したい、荷物を整理したいなど、ほんの数分だけ手を借りたい場面があります。しかし、そのためだけに家族へお願いしたり、一時預かりなどのサービスを利用したりするのは難しく、近くにいる人へ直接声をかけることにもハードルがあります。

そこで、同じ店舗にいる「少しだけ手を貸してほしい人」と「短時間ならサポートできる人」を、その場でつなげる仕組みを考えました。位置情報を利用して近くにいる人同士をマッチングし、店内・短時間という範囲に限定することで、大きな支援ではなく「ちょっと見てて」を気軽に頼めることを目指しています。

また、助けてもらう側だけでなく、サポートする側にとっても、子供とのふれあいや誰かの役に立つきっかけになるサービスを目指しています。

日常の中にある小さな困りごとを、同じ場所にいる人同士の小さな助け合いで解決できるようにすることが、「見てて」のコンセプトです。

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
