"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const supabase = createClient();

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:3000/signup-complete",
      },
    });

    if (error) {
      console.error(error.message);
      return;
    }

    alert("登録確認メールを送信しました");
  };

  return (
    <main>
      <h1>新規登録</h1>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">登録</button>
      </form>
      <Link href="/login">登録済の方はこちら</Link>
    </main>
  );
}
