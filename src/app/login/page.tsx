"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "sonner";

const supabase = createClient();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("メールアドレスまたはパスワードが違います");
      console.error(error.message);
      return;
    }
    toast.success("ログインに成功しました");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          support_available: false,
        })
        .eq("id", user.id);
    }
    router.push("/dashboard");
  };

  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center">
          <h1 className="page-title">ログイン</h1>
        </div>

        <form
          onSubmit={handleLogin}
          className="mx-auto mt-8 w-full max-w-md space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm text-stone-600">
              メールアドレス
            </label>

            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-[#fffafa] px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-stone-600">
              パスワード
            </label>

            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-[#fffafa] px-4 py-3"
            />

            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-[#a97d7d] underline underline-offset-4"
              >
                パスワードを忘れた方はこちら
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#d9a3a3] px-4 py-2.5 font-medium text-white"
          >
            ログイン
          </button>

          <div className="text-center">
            <Link
              href="/signup"
              className="text-sm text-[#a97d7d] underline underline-offset-4"
            >
              新規登録はこちら
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
