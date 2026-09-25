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
  const [isConfirmingOn, setIsConfirmingOn] = useState(false);

  // マッチング成立中は新しいサポート受付をしない仕様のため、表示上は必ずOFFとして扱う
  const displayedSupportAvailable = isMatching ? false : supportAvailable;

  // サポート可能状態を画面上で先に切り替え、profiles の support_available に保存する
  const handleChange = async () => {
    const nextValue = !supportAvailable;

    if (nextValue) {
      setIsConfirmingOn(true);
      return;
    }
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

  const handleConfirmOn = async () => {
    setIsConfirmingOn(false);
    setSupportAvailable(true);

    const { error } = await supabase
      .from("profiles")
      .update({ support_available: true })
      .eq("id", userId);

    // 保存に失敗した場合はOFFに戻す
    if (error) {
      console.error(error.message);
      setSupportAvailable(false);
    }
  };

  return (
    <>
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

      {isConfirmingOn && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6">
          <div className="w-full max-w-sm rounded-3xl bg-[#fbf5f3] p-6 shadow-xl">
            <p className="text-center font-medium text-stone-700">
              サポートをONにしますか？
            </p>

            <div className="mt-4 rounded-xl border border-[#ead3d3] bg-[#fbf5f3] px-3 py-2">
              <p className="text-[13px] leading-6 text-stone-600">
                <span className="mr-1 text-[10px]">※</span>
                近くの依頼を探すため、位置情報を使用します。
              </p>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleConfirmOn}
                className="rounded-full bg-[#d9a3a3] px-7 py-2.5 font-medium text-white"
              >
                続ける
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingOn(false)}
                className="rounded-full bg-stone-200 px-6 py-2.5 text-stone-600"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
