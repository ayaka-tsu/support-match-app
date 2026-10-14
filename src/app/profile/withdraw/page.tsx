"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import HamburgerMenu from "@/components/HamburgerMenu";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function WithdrawPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const submittingRef = useRef(false);

  const handleWithdraw = async () => {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirm: true }),
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "退会の完了を確認できませんでした。",
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "退会の完了を確認できませんでした。",
      );
      submittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    // 退会成功後、ブラウザに残っているログイン情報を消す
    try {
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        console.error("withdraw sign out error:", error.message);
      }
    } catch (error) {
      console.error("withdraw sign out error:", error);
    }

    window.location.replace("/signup");
  };

  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <HamburgerMenu />

      <div className="mx-auto w-full max-w-md">
        <h1 className="page-title">退会の確認</h1>

        <div className="mt-6 rounded-2xl bg-[#f9eaea] px-5 py-5">
          <p className="font-medium text-stone-700">
            「見てて」を退会しますか？
          </p>

          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-stone-600">
            <li>
              アカウントとプロフィール、保存したプロフィール画像、
              位置情報を削除します。
            </li>
            <li>
              現在のサポート依頼を終了し、マッチング中の場合は
              マッチングも終了します。
            </li>
            <li>
              相手側には過去のメッセージが残ります。
              あなたの名前はUnknownになり、アイコン画像は表示されません。
            </li>
            <li>退会後は、相手とのメッセージ送信はできません。</li>
          </ul>
        </div>

        {errorMessage && (
          <p role="alert" className="mt-4 text-sm leading-6 text-[#b85f65]">
            {errorMessage}
          </p>
        )}

        <div className="mt-6">
          <div className="grid grid-cols-2 items-center gap-3">
            <Link
              href="/profile"
              onClick={(event) => {
                if (isSubmitting) {
                  event.preventDefault();
                }
              }}
              aria-disabled={isSubmitting}
              className="button-interaction flex min-h-12 items-center justify-center rounded-full bg-[#d9a3a3] px-3 py-3 text-center text-sm font-medium text-white"
            >
              プロフィールに戻る
            </Link>

            <button
              type="button"
              onClick={handleWithdraw}
              disabled={isSubmitting}
              className="button-interaction min-h-12 rounded-full bg-[#b85f65] px-3 py-3 text-sm font-medium text-white disabled:cursor-wait"
            >
              {isSubmitting ? "退会処理中…" : "退会する"}
            </button>
          </div>

          <p className="mt-3 text-center text-xs leading-5 text-stone-500">
            退会を取り消すことはできません。
          </p>
        </div>
      </div>
    </main>
  );
}
