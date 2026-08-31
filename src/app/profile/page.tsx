"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HamburgerMenu from "@/components/HamburgerMenu";
import Image from "next/image";

const supabase = createClient();

export default function ProfilePage() {
  const [nickname, setNickname] = useState("");
  const [supportAvailable, setSupportAvailable] = useState(false);
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
        .select("nickname, support_available, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error(profileError.message);
        return;
      }

      if (!profileData) {
        return;
      }

      setNickname(profileData.nickname);
      setSupportAvailable(profileData.support_available);
      setAvatarUrl(profileData.avatar_url);
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

      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="プロフィール画像"
          width={96}
          height={96}
          className="mb-4 h-14 w-14 rounded-full object-cover"
        />
      ) : (
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#d9a3a3] text-3xl font-medium text-white">
          {nickname ? nickname.charAt(0).toUpperCase() : "?"}
        </div>
      )}
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
