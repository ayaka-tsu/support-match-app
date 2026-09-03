import HamburgerMenu from "@/components/HamburgerMenu";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div className="flex justify-end">
          <HamburgerMenu />
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <Image
            src="/top-hero.png"
            alt="カフェで過ごす親子とサポートする人のイメージ"
            width={800}
            height={500}
            className="w-full rounded-3xl object-cover"
          />
          <p className="text-sm tracking-wide text-rose-300">
            ちょっと見てて、を気軽につなぐ
          </p>

          <h2 className="mt-3 text-xl font-medium leading-8 text-stone-600">
            同じ場所にいる人どうしで、
            <br />
            ほんの少し助け合える。
          </h2>

          <p className="mt-4 text-sm leading-7 text-stone-500">
            カフェやお店などで、少しだけ子どもの相手をしていてほしいとき。
            その間に、ほんの少し自分の時間を過ごせるようにつなぐアプリです。
          </p>
        </section>
        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="button-interaction rounded-full bg-[#d9a3a3] px-6 py-3 text-center font-medium text-white"
          >
            新規登録
          </Link>

          <Link
            href="/login"
            className="button-interaction rounded-full bg-[#d9a3a3] px-6 py-3 text-center font-medium text-white"
          >
            ログイン
          </Link>
        </div>

        <Link
          href="/concept"
          className="button-interaction flex items-center justify-between rounded-3xl bg-[#f9eaea] p-5 shadow-sm"
        >
          <div>
            <p className="font-medium text-stone-700">コンセプトを見る</p>

            <p className="mt-1 text-sm text-stone-500">
              「見てて」に込めた想いや使い方
            </p>
          </div>

          <span className="ml-4 text-2xl text-rose-300">›</span>
        </Link>
        <footer className="mt-4 text-center text-xs text-stone-500">
          <div className="mb-2 flex justify-center gap-4">
            <Link href="/terms">利用規約</Link>
            <Link href="/privacy">プライバシーポリシー</Link>
          </div>

          <p>© 2026 見てて</p>
        </footer>
      </div>
    </main>
  );
}
