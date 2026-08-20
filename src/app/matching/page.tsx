"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import HamburgerMenu from "@/components/HamburgerMenu";

const supabase = createClient();

export default function MatchingPage() {
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    const checkMatching = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("matchings")
        .select("id, support_request_id, supporter_id")
        .eq("supporter_id", user.id);

      if (error) {
        console.error("matching check error:", error.message);
        return;
      }
      if (data && data.length > 0) {
        setIsMatching(true);
      }
    };

    checkMatching();
  }, []);
  return (
    <main>
      <HamburgerMenu />
      <h1>マッチング</h1>
    </main>
  );
}
