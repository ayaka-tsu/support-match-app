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
    <main>
      <h1>新規登録</h1>
      <form onSubmit={handleSignup}>
        <label>メールアドレス</label>
        <input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>パスワード</label>
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <p>8文字以上で入力してください</p>
        <button type="submit">登録</button>
      </form>
      <Link href="/login">登録済の方はこちら</Link>
    </main>
  );
}
