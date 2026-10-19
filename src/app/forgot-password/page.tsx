"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async () => {
    if (isSending) return;
    setIsSending(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      });

      if (error) {
        toast.error("再設定メールを送信できませんでした");
        console.error(error.message);
        return;
      }

      toast.success("パスワード再設定メールを送信しました");
    } catch (error) {
      toast.error("再設定メールを送信できませんでした");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };
  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center">
          <h1 className="page-title">パスワードを忘れた方</h1>
        </div>

        {isSending && <LoadingSpinner />}
        <div className={isSending ? "hidden" : "mt-8"}>
          <label className="mb-2 block text-sm text-stone-600">
            メールアドレス
          </label>
          <input
            type="email"
            disabled={isSending}
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-[#fffafa] px-4 py-3"
          />

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isSending}
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
