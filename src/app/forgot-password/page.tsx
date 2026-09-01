"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

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
    <main>
      <h1>パスワードを忘れた方</h1>

      <p>登録しているメールアドレスを入力してください。</p>

      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button type="button" onClick={handleResetPassword}>
        再設定メールを送信
      </button>
    </main>
  );
}
