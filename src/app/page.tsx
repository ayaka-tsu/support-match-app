import HamburgerMenu from "@/components/HamburgerMenu";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen px-6 py-6">
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
          <a
            href="/signup"
            className="rounded-full bg-pink-300 px-6 py-3 text-center font-medium text-white"
          >
            新規登録
          </a>

          <a
            href="/login"
            className="rounded-full border border-pink-300 bg-white px-6 py-3 text-center font-medium text-pink-400"
          >
            ログイン
          </a>
        </div>

        <a href="/concept" className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="font-medium text-stone-700">コンセプトを見る</p>

          <p className="mt-1 text-sm text-stone-500">
            「見てて」に込めた想いや使い方
          </p>
        </a>

        <footer className="mt-4 text-center text-xs text-stone-400">
          <p>© 2026 見てて</p>
        </footer>
      </div>
    </main>
  );
}
