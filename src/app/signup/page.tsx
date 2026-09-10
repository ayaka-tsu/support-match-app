"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "sonner";

const supabase = createClient();

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("パスワードは8文字以上で入力してください");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:3000/signup-complete",
      },
    });

    if (error) {
      toast.error("登録できませんでした。入力内容を確認してください");
      console.error(error.message);
      return;
    }

    toast.success("登録確認メールを送信しました");
  };

  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center">
          <h1 className="page-title">新規登録</h1>
        </div>
        <form
          onSubmit={handleSignup}
          className="mx-auto mt-8 w-full max-w-md space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm text-stone-600">
              メールアドレス
            </label>

            <input
              type="email"
              autoComplete="email"
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
              autoComplete="new-password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-[#fffafa] px-4 py-3"
            />

            <p className="mt-1.5 text-xs text-stone-500">
              8文字以上で入力してください
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#d9a3a3] px-4 py-2.5 font-medium text-white"
          >
            登録
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-[#a97d7d] underline underline-offset-4"
            >
              登録済みの方はこちら
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
