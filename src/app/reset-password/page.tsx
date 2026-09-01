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
    <main>
      <h1>パスワード再設定</h1>

      <label>新しいパスワード</label>
      <input
        type="password"
        placeholder="新しいパスワード"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <p>8文字以上で入力してください</p>

      <label>新しいパスワード（確認）</label>
      <input
        type="password"
        placeholder="もう一度入力してください"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button type="button" onClick={handleResetPassword}>
        パスワードを再設定
      </button>
    </main>
  );
}
