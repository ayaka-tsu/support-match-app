"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function HamburgerMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      setUser(data.user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error.message);
      return;
    }

    router.push("/");
  };

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>&#9776;</button>

      {isOpen && (
        <div>
          <Link href="/consept">コンセプト</Link>

          {!user && (
            <div>
              <Link href="/signup"> 新規登録</Link>
              <Link href="/login"> ログイン</Link>
            </div>
          )}
          {user && (
            <div>
              <Link href="/profile">プロフィール</Link>
              <Link href="/stores">店舗</Link>
              <Link href="/support-requests">サポート依頼</Link>
              <Link href="/matching">マッチング</Link>
              <Link href="/messages">メッセージ</Link>

              <button onClick={handleLogout}>ログアウト</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
