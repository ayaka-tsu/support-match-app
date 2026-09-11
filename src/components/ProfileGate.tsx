"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ニックネーム未設定でも利用できる画面はプロフィール確認を通さず表示する
const bypassPaths = [
  "/login",
  "/signup",
  "/signup-complete",
  "/forgot-password",
  "/reset-password",
  "/profile/edit",
  "/concept",
];

export default function ProfileGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkedPath, setCheckedPath] = useState<string | null>(null);

  const isBypassPath = bypassPaths.includes(pathname);

  // ログイン済みユーザーのプロフィールを確認し、ニックネーム未設定ならプロフィール編集画面へ誘導する
  useEffect(() => {
    if (isBypassPath) return;

    const checkProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setCheckedPath(pathname);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(profileError.message);
        setCheckedPath(pathname);
        return;
      }

      if (!profile?.nickname?.trim()) {
        router.replace("/profile/edit");
        return;
      }

      setCheckedPath(pathname);
    };

    checkProfile();
  }, [isBypassPath, pathname, router]);

  if (isBypassPath) {
    return <>{children}</>;
  }

  // プロフィール確認が終わるまでは元の画面を描画せず、未設定画面が一瞬見えるのを防ぐ
  if (checkedPath !== pathname) {
    return null;
  }

  return <>{children}</>;
}
