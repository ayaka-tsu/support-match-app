"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import HamburgerMenu from "@/components/HamburgerMenu";

const supabase = createClient();

export default function EditProfilePage() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const router = useRouter();
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error.message);
        return;
      }
      setEmail(data.user.email ?? "");
      setOriginalEmail(data.user.email ?? "");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("nickname, support_available")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error(profileError.message);
        return;
      }
      setNickname(profileData.nickname);
    };
    getUser();
  }, []);

  const handleSave = async () => {
    const { data, error: useError } = await supabase.auth.getUser();
    if (useError) {
      console.error(useError.message);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        nickname: nickname,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);

    if (error) {
      console.error(error.message);
      return;
    }
    if (email !== originalEmail) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: email,
      });

      if (emailError) {
        console.error(emailError.message);
        return;
      }
    }
    alert("プロフィールを更新しました");
    router.push("/profile");
  };

  return (
    <main>
      <HamburgerMenu />

      <h1>プロフィール編集</h1>

      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleSave}>保存</button>
    </main>
  );
}
