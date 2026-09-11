"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Props = {
  userId: string;
  initialSupportAvailable: boolean;
  isMatching?: boolean;
};

export default function SupportAvailableToggle({
  userId,
  initialSupportAvailable,
  isMatching = false,
}: Props) {
  const [supportAvailable, setSupportAvailable] = useState(
    initialSupportAvailable,
  );

  // マッチング成立中は新しいサポート受付をしない仕様のため、表示上は必ずOFFとして扱う
  const displayedSupportAvailable = isMatching ? false : supportAvailable;

  // サポート可能状態を画面上で先に切り替え、profiles の support_available に保存する
  const handleChange = async () => {
    const nextValue = !supportAvailable;

    setSupportAvailable(nextValue);

    const { error } = await supabase
      .from("profiles")
      .update({ support_available: nextValue })
      .eq("id", userId);

    // 保存に失敗した場合は、表示だけが先に切り替わった状態を元に戻す
    if (error) {
      console.error(error.message);
      setSupportAvailable(!nextValue);
    }
  };
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-center text-sm text-stone-600">
        {displayedSupportAvailable ? "ON" : "OFF"}
      </span>
      <button
        type="button"
        onClick={handleChange}
        className={`relative h-7 w-12 rounded-full ${
          isMatching ? "" : "transition-colors"
        } ${displayedSupportAvailable ? "bg-[#d9a3a3]" : "bg-stone-300"}`}
        aria-label={
          displayedSupportAvailable
            ? "サポート可能をオフにする"
            : "サポート可能をオンにする"
        }
      >
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm ${
            isMatching ? "" : "transition-transform"
          } ${displayedSupportAvailable ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
