"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const supabase = createClient();

  const handleResetPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/reset-password",
    });

    if (error) {
      toast.error("再設定メールを送信できませんでした");
      console.error(error.message);
      return;
    }

    toast.success("パスワード再設定メールを送信しました");
  };

  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center">
          <h1 className="page-title">パスワードを忘れた方</h1>
        </div>

        <div className="mt-8">
          <label className="mb-2 block text-sm text-stone-600">
            メールアドレス
          </label>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-[#fffafa] px-4 py-3"
          />

          <button
            type="button"
            onClick={handleResetPassword}
            className="mx-auto mt-5 block w-full max-w-xs rounded-xl bg-[#d9a3a3] px-4 py-2.5 font-medium text-white"
          >
            再設定メールを送信
          </button>

          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="text-sm text-[#a97d7d] underline underline-offset-4"
            >
              ログインに戻る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
