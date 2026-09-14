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
  const [hasExpiredRequestNotification, setHasExpiredRequestNotification] =
    useState(false);
  const [hasMessageNotification, setHasMessageNotification] = useState(false);
  const router = useRouter();

  // マッチング成立・相手からのキャンセル・相手からの終了が未確認なら、マッチング通知マークを表示する
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

      const { data: supporterEnded, error: supporterEndedError } =
        await supabase
          .from("matchings")
          .select("id")
          .eq("supporter_id", user.id)
          .eq("status", "ended")
          .neq("ended_by", user.id)
          .is("ended_seen_at", null)
          .limit(1);

      if (supporterEndedError) {
        console.error(
          "ended notification check error:",
          supporterEndedError.message,
        );
        return;
      }

      if (supporterEnded && supporterEnded.length > 0) {
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

        const { data: requesterEnded, error: requesterEndedError } =
          await supabase
            .from("matchings")
            .select("id")
            .in("support_request_id", requestIds)
            .eq("status", "ended")
            .neq("ended_by", user.id)
            .is("ended_seen_at", null)
            .limit(1);

        if (requesterEndedError) {
          console.error(
            "requester ended notification check error:",
            requesterEndedError.message,
          );
          return;
        }

        if (requesterEnded && requesterEnded.length > 0) {
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

    // matchings の変更をリアルタイム購読し、成立・終了・キャンセルの通知状態をすぐ更新する
    const matchingChannel = supabase
      .channel("matching-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matchings",
        },
        () => {
          checkNotifications();
        },
      )
      .subscribe();

    window.addEventListener(
      "matching-notification-read",
      handleMatchingNotificationRead,
    );

    return () => {
      supabase.removeChannel(matchingChannel);

      window.removeEventListener(
        "matching-notification-read",
        handleMatchingNotificationRead,
      );
    };
  }, []);

  // 自分が参加した全マッチングの中から、相手が送った未読メッセージがあるか確認する
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

  // 新着メッセージをリアルタイム購読し、自分以外から届いたときだけ通知マークを付ける
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("message-notification-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as {
            sender_id: string;
          };

          if (newMessage.sender_id !== user.id) {
            setHasMessageNotification(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 30分以内にマッチングしなかったサポート依頼が未確認なら通知マークを表示する
  useEffect(() => {
    let timeoutId: number | null = null;
    let isCancelled = false;

    const checkExpiredRequestNotification = async () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isCancelled) return;

      if (!user) {
        setHasExpiredRequestNotification(false);
        return;
      }

      const { data: requests, error: requestError } = await supabase
        .from("support_requests")
        .select("id, created_at")
        .eq("user_id", user.id)
        .is("expired_seen_at", null)
        .order("created_at", { ascending: true });

      if (requestError) {
        console.error(
          "expired request notification check error:",
          requestError.message,
        );
        return;
      }

      if (!requests || requests.length === 0) {
        setHasExpiredRequestNotification(false);
        return;
      }

      const requestIds = requests.map((request) => request.id);

      const { data: matchingData, error: matchingError } = await supabase
        .from("matchings")
        .select("support_request_id")
        .in("support_request_id", requestIds);

      if (matchingError) {
        console.error(
          "expired request matching check error:",
          matchingError.message,
        );
        return;
      }

      const matchedRequestIds = new Set(
        matchingData?.map((matching) => matching.support_request_id) ?? [],
      );

      const unmatchedRequests = requests.filter(
        (request) => !matchedRequestIds.has(request.id),
      );

      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;

      const hasExpiredRequest = unmatchedRequests.some(
        (request) =>
          now >= new Date(request.created_at).getTime() + thirtyMinutes,
      );

      setHasExpiredRequestNotification(hasExpiredRequest);

      if (hasExpiredRequest) {
        window.dispatchEvent(new Event("support-request-expired"));
      }

      if (hasExpiredRequest) return;

      const nextExpirationTimes = unmatchedRequests
        .map(
          (request) => new Date(request.created_at).getTime() + thirtyMinutes,
        )
        .filter((expirationTime) => expirationTime > now);

      if (nextExpirationTimes.length === 0) return;

      const nextExpirationTime = Math.min(...nextExpirationTimes);

      timeoutId = window.setTimeout(
        () => {
          checkExpiredRequestNotification();
        },
        nextExpirationTime - now + 100,
      );
    };

    const handleExpiredRequestNotificationRead = () => {
      checkExpiredRequestNotification();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkExpiredRequestNotification();
      }
    };

    checkExpiredRequestNotification();

    const channel = supabase
      .channel("support-request-expiration-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_requests",
        },
        () => {
          checkExpiredRequestNotification();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matchings",
        },
        () => {
          checkExpiredRequestNotification();
        },
      )
      .subscribe();

    window.addEventListener(
      "support-request-notification-read",
      handleExpiredRequestNotificationRead,
    );

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      supabase.removeChannel(channel);

      window.removeEventListener(
        "support-request-notification-read",
        handleExpiredRequestNotificationRead,
      );

      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
        className="fixed right-5 top-5 z-40 flex h-8 w-8 flex-col items-end justify-center gap-1.5"
        style={{ position: "fixed" }}
        aria-label="メニューを開く"
      >
        <span className="h-0.5 w-6 rounded-full bg-[#b99191]" />
        <span className="h-0.5 w-4 rounded-full bg-[#b99191]" />
        {(hasNotification ||
          hasMessageNotification ||
          hasExpiredRequestNotification) && (
          <span className="absolute right-[-2px] top-0 h-2 w-2 rounded-full bg-[#c96f6f]" />
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
                  <span className="flex items-center gap-2">
                    サポート依頼
                    {hasExpiredRequestNotification && (
                      <span className="h-2 w-2 rounded-full bg-[#c96f6f]" />
                    )}
                  </span>
                  <span className="text-xl">›</span>
                </Link>

                <Link
                  href="/matching"
                  onClick={() => setIsOpen(false)}
                  className="menu-item"
                >
                  <span className="flex items-center gap-2">
                    マッチング
                    {hasNotification && (
                      <span className="h-2 w-2 rounded-full bg-[#c96f6f]" />
                    )}
                  </span>

                  <span className="text-xl">›</span>
                </Link>

                <Link
                  href="/messages"
                  onClick={() => setIsOpen(false)}
                  className="menu-item"
                >
                  <span className="flex items-center gap-2">
                    メッセージ
                    {hasMessageNotification && (
                      <span className="h-2 w-2 rounded-full bg-[#c96f6f]" />
                    )}
                  </span>

                  <span className="text-xl">›</span>
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
