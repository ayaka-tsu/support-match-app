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
  const [hasNotification, setHasNotification] = useState(false);
  const [hasMessageNotification, setHasMessageNotification] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkNotifications = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHasNotification(false);
        return;
      }

      const { data: supporterMatching, error: supporterError } = await supabase
        .from("matchings")
        .select("supporter_seen_at")
        .eq("supporter_id", user.id)
        .eq("status", "active")
        .is("supporter_seen_at", null)
        .limit(1);

      if (supporterError) {
        console.error("notification check error:", supporterError.message);
        return;
      }

      if (supporterMatching && supporterMatching.length > 0) {
        setHasNotification(true);
        return;
      }

      const { data: supporterCanceled, error: supporterCanceledError } =
        await supabase
          .from("matchings")
          .select("id")
          .eq("supporter_id", user.id)
          .eq("status", "canceled")
          .neq("canceled_by", user.id)
          .is("canceled_seen_at", null)
          .limit(1);

      if (supporterCanceledError) {
        console.error(
          "canceled notification check error:",
          supporterCanceledError.message,
        );
        return;
      }

      if (supporterCanceled && supporterCanceled.length > 0) {
        setHasNotification(true);
        return;
      }

      const { data: requestData, error: requestError } = await supabase
        .from("support_requests")
        .select("id")
        .eq("user_id", user.id);

      if (requestError) {
        console.error(
          "request notification check error:",
          requestError.message,
        );
        return;
      }

      if (requestData && requestData.length > 0) {
        const requestIds = requestData.map((request) => request.id);

        const { data: requesterCanceled, error: requesterCanceledError } =
          await supabase
            .from("matchings")
            .select("id")
            .in("support_request_id", requestIds)
            .eq("status", "canceled")
            .neq("canceled_by", user.id)
            .is("canceled_seen_at", null)
            .limit(1);

        if (requesterCanceledError) {
          console.error(
            "requester canceled notification check error:",
            requesterCanceledError.message,
          );
          return;
        }

        if (requesterCanceled && requesterCanceled.length > 0) {
          setHasNotification(true);
          return;
        }

        const { data: requesterMatching, error: requesterError } =
          await supabase
            .from("matchings")
            .select("requester_seen_at")
            .in("support_request_id", requestIds)
            .eq("status", "active")
            .is("requester_seen_at", null)
            .limit(1);

        if (requesterError) {
          console.error(
            "requester notification check error:",
            requesterError.message,
          );
          return;
        }

        if (requesterMatching && requesterMatching.length > 0) {
          setHasNotification(true);
          return;
        }
      }
      setHasNotification(false);
    };

    const handleMatchingNotificationRead = () => {
      checkNotifications();
    };

    checkNotifications();

    window.addEventListener(
      "matching-notification-read",
      handleMatchingNotificationRead,
    );

    return () => {
      window.removeEventListener(
        "matching-notification-read",
        handleMatchingNotificationRead,
      );
    };
  }, []);

  useEffect(() => {
    const checkMessageNotifications = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHasMessageNotification(false);
        return;
      }

      const { data: supporterMatchings } = await supabase
        .from("matchings")
        .select("id")
        .eq("supporter_id", user.id);

      const { data: requestData } = await supabase
        .from("support_requests")
        .select("id")
        .eq("user_id", user.id);

      let requesterMatchings: { id: string }[] = [];

      if (requestData && requestData.length > 0) {
        const requestIds = requestData.map((request) => request.id);

        const { data } = await supabase
          .from("matchings")
          .select("id")
          .in("support_request_id", requestIds);

        requesterMatchings = data ?? [];
      }

      const matchingIds = [
        ...(supporterMatchings ?? []),
        ...requesterMatchings,
      ].map((matching) => matching.id);

      if (matchingIds.length === 0) {
        setHasMessageNotification(false);
        return;
      }

      const { data: unreadMessages, error } = await supabase
        .from("messages")
        .select("id")
        .in("matching_id", matchingIds)
        .neq("sender_id", user.id)
        .is("read_at", null)
        .limit(1);

      if (error) {
        console.error("message notification check error:", error.message);
        return;
      }

      setHasMessageNotification(!!unreadMessages && unreadMessages.length > 0);
    };

    const handleMessageNotificationRead = () => {
      checkMessageNotifications();
    };

    checkMessageNotifications();

    window.addEventListener(
      "message-notification-read",
      handleMessageNotificationRead,
    );

    return () => {
      window.removeEventListener(
        "message-notification-read",
        handleMessageNotificationRead,
      );
    };
  }, []);

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
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-5 top-5 z-40 text-2xl text-stone-700"
        style={{ position: "fixed" }}
        aria-label="メニューを開く"
      >
        &#9776;
        {(hasNotification || hasMessageNotification) && (
          <span
            style={{
              position: "absolute",
              top: "0",
              right: "-2px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "red",
            }}
          />
        )}
      </button>
      <div
        className={`fixed inset-0 z-50 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-[#fbf5f3] p-6 shadow-xl transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="text-2xl text-stone-600"
              aria-label="メニューを閉じる"
            >
              ×
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            <Link
              href="/concept"
              onClick={() => setIsOpen(false)}
              className="menu-item"
            >
              <span>コンセプト</span>
              <span className="text-xl">›</span>
            </Link>

            {!user && (
              <>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="menu-item"
                >
                  <span>新規登録</span>
                  <span className="text-xl">›</span>
                </Link>

                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="menu-item"
                >
                  <span>ログイン</span>
                  <span className="text-xl">›</span>
                </Link>
              </>
            )}

            {user && (
              <div className="flex flex-col gap-2">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="menu-item"
                >
                  <span>プロフィール</span>
                  <span className="text-xl">›</span>
                </Link>

                <Link
                  href="/stores"
                  onClick={() => setIsOpen(false)}
                  className="menu-item"
                >
                  <span>店舗</span>
                  <span className="text-xl">›</span>
                </Link>

                <Link
                  href="/support-requests"
                  onClick={() => setIsOpen(false)}
                  className="menu-item"
                >
                  <span>サポート依頼</span>
                  <span className="text-xl">›</span>
                </Link>

                <Link
                  href="/matching"
                  onClick={() => setIsOpen(false)}
                  className="menu-item relative"
                >
                  <span>マッチング</span>
                  <span className="text-xl">›</span>

                  {hasNotification && (
                    <span
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "red",
                      }}
                    />
                  )}
                </Link>

                <Link
                  href="/messages"
                  onClick={() => setIsOpen(false)}
                  className="menu-item relative"
                >
                  <span>メッセージ</span>
                  <span className="text-xl">›</span>

                  {hasMessageNotification && (
                    <span
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "red",
                      }}
                    />
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  className="button-interaction mt-4 rounded-xl bg-[#eee5e1] px-5 py-3 text-center text-stone-600"
                >
                  ログアウト
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
