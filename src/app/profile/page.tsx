"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HamburgerMenu from "@/components/HamburgerMenu";
import Image from "next/image";
import SupportAvailableToggle from "@/components/SupportAvailableToggle";

const supabase = createClient();

export default function ProfilePage() {
  const [nickname, setNickname] = useState("");
  const [supportAvailable, setSupportAvailable] = useState(false);
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [userId, setUserId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push("/login");
        return;
      }

      setUserId(data.user.id);
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
      setIsProfileLoaded(true);
    };
    getUser();
  }, [router]);

  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <HamburgerMenu />

      <div className="mx-auto w-full max-w-2xl">
        <h1 className="page-title">プロフィール</h1>

        <div className="mt-4 text-right">
          <Link
            href="/profile/edit"
            className="text-sm text-[#a97d7d] underline underline-offset-4"
          >
            編集する
          </Link>
        </div>
        {isProfileLoaded && (
          <>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="プロフィール画像"
                width={96}
                height={96}
                unoptimized
                className="mx-auto mt-6 mb-4 h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="mx-auto mt-6 mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#d9a3a3] text-3xl font-medium text-white">
                {nickname ? nickname.charAt(0).toUpperCase() : "?"}
              </div>
            )}

            <div className="mx-auto mt-6 w-full max-w-sm rounded-2xl bg-[#f9eaea] px-5 py-5">
              <div>
                <p className="text-xs text-stone-500">ニックネーム</p>
                <p className="mt-1 font-medium text-stone-700">{nickname}</p>
              </div>

              <div className="mt-5">
                <p className="text-xs text-stone-500">メールアドレス</p>
                <p className="mt-1 text-sm text-stone-700">{email}</p>
              </div>

              {userId && (
                <div className="mt-5 flex items-center justify-between border-t border-[#ead6d6] pt-4">
                  <span className="text-sm text-stone-600">サポート</span>

                  <SupportAvailableToggle
                    userId={userId}
                    initialSupportAvailable={supportAvailable}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
