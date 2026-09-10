import Link from "next/link";

export default function SignupCompletePage() {
  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <div className="mx-auto w-full max-w-md">
        <h1 className="page-title text-center">登録完了</h1>

        <div className="mt-8 rounded-3xl bg-[#fbf5f3] px-6 py-8 text-center shadow-sm">
          <p className="text-lg font-medium text-stone-700">
            登録が完了しました
          </p>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            メールアドレスの確認が完了しました。
            <br />
            ログインして「見てて」をご利用ください。
          </p>

          <Link
            href="/login"
            className="button-interaction mx-auto mt-6 block w-full max-w-xs rounded-full bg-[#d9a3a3] px-6 py-3 font-medium text-white"
          >
            ログインする
          </Link>
        </div>
      </div>
    </main>
  );
}
