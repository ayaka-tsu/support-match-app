import Link from "next/link";

export default function SignupCompletePage() {
  return (
    <main>
      <h1>登録が完了しました</h1>
      <p>メールアドレスの確認が完了しました</p>

      <Link href="/login">ログインする</Link>
    </main>
  );
}
