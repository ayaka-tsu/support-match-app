"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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

  if (checkedPath !== pathname) {
    return null;
  }

  return <>{children}</>;
}
