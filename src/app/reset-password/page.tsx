"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      toast.error("新しいパスワードは8文字以上で入力してください");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("新しいパスワードが一致していません");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      if (error.code === "same_password") {
        toast.error(
          "以前と同じパスワードは設定できません。別のパスワードを入力してください",
        );
      } else {
        toast.error("パスワードを再設定できませんでした");
      }

      console.error(error.message);
      return;
    }

    toast.success("パスワードを再設定しました");
    router.push("/login");
  };

  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <div className="mx-auto w-full max-w-md">
        <h1 className="page-title text-center">パスワード再設定</h1>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm text-stone-600">
              新しいパスワード
            </label>

            <input
              type="password"
              autoComplete="new-password"
              placeholder="新しいパスワード"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-[#fffafa] px-4 py-3"
            />

            <p className="mt-1.5 text-xs text-stone-500">
              8文字以上で入力してください
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-stone-600">
              新しいパスワード（確認）
            </label>

            <input
              type="password"
              autoComplete="new-password"
              placeholder="もう一度入力してください"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-[#fffafa] px-4 py-3"
            />
          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            className="button-interaction w-full rounded-xl bg-[#d9a3a3] px-4 py-2.5 font-medium text-white"
          >
            パスワードを再設定
          </button>
        </div>
      </div>
    </main>
  );
}
