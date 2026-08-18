"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HamburgerMenu from "@/components/HamburgerMenu";


const supabase = createClient();

export default function ProfilePage() {
  const [nickname, setNickname] = useState("");
  const [supportAvailable, setSupportAvailable] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push("/login");
        return;
      }
      setEmail(data.user.email ?? "");
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
      setSupportAvailable(profileData.support_available);
    };
    getUser();
  }, [router]);

  const updateSupportAvailable = async (checked: boolean) => {
    setSupportAvailable(checked);

    const { data, error: useError } = await supabase.auth.getUser();

    if (useError) {
      console.error(useError.message);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ support_available: checked })
      .eq("id", data.user.id);

    if (error) {
      console.error(error.message);
    }
  };

  //   const handleSaveProfile = async () => {
  //     const { data, error: useError } = await supabase.auth.getUser();
  //     if (useError) {
  //       console.error(useError.message);
  //       return;
  //     }

  //     const { error } = await supabase.from("profiles").upsert({
  //       id: data.user.id,
  //       nickname: nickname,
  //       support_available: supportAvailable,
  //       updated_at: new Date().toISOString(),
  //     });

  //     if (error) {
  //       console.error(error.message);
  //       return;
  //     }

  //     alert("プロフィールを保存しました");
  //   };

  return (
    <main>
              <HamburgerMenu />
      
      <Link href="/profile/edit">編集する</Link>
      <h1>プロフィール</h1>

      <p>ニックネーム</p>
      <p>{nickname}</p>

      <p>メールアドレス</p>
      <p>{email}</p>

      <p>サポート可否</p>
      <input
        type="checkbox"
        checked={supportAvailable}
        onChange={(e) => updateSupportAvailable(e.target.checked)}
      />
    </main>
  );
}
