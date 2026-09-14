"use client";

import { useStore } from "@/context/StoreContext";
import { useMatching } from "@/context/MatchingContext";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import HamburgerMenu from "@/components/HamburgerMenu";

const supabase = createClient();

export default function SupportRequestsPage() {
  const { selectedStore, setSelectedStore } = useStore();
  const { checkForMatching } = useMatching();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [expiredRequestIds, setExpiredRequestIds] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");

  // 画面表示時に、マッチング中か・直近30分以内のサポート依頼が残っているかを確認して表示状態を復元する
  useEffect(() => {
    let isCancelled = false;

    const checkActiveRequest = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isCancelled || !user) return;
      const { data: supporterMatching, error: supporterMatchingError } =
        await supabase
          .from("matchings")
          .select("id")
          .eq("supporter_id", user.id)
          .eq("status", "active")
          .limit(1);

      if (supporterMatchingError) {
        console.error(
          "supporter matching check error:",
          supporterMatchingError.message,
        );
        return;
      }

      if (supporterMatching && supporterMatching.length > 0) {
        setIsMatching(true);
        setIsRequesting(false);
        return;
      }
      const thirtyMinutesAgo = new Date(
        Date.now() - 30 * 60 * 1000,
      ).toISOString();

      const { data, error } = await supabase
        .from("support_requests")
        .select("id, store_id, created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyMinutesAgo)
        .order("created_at", { ascending: false })
        .limit(1);

      if (isCancelled) return;

      if (error) {
        console.error("active request check error", error.message);
        return;
      }

      if (data && data.length > 0) {
        const { data: matchingData, error: matchingError } = await supabase
          .from("matchings")
          .select("id, status")
          .eq("support_request_id", data[0].id)
          .maybeSingle();

        if (isCancelled) return;

        if (matchingError) {
          console.error("request matching check error", matchingError.message);
          return;
        }

        if (matchingData) {
          setIsRequesting(false);

          if (matchingData.status === "active") {
            setIsMatching(true);
          }

          if (!storeId) {
            setSelectedStore(null);
          }

          return;
        }

        setIsRequesting(true);

        const { data: storeData } = await supabase
          .from("stores")
          .select("id, name, address")
          .eq("id", data[0].store_id)
          .single();

        if (isCancelled) return;

        if (storeData) {
          setSelectedStore(storeData);
        }
      } else {
        setIsRequesting(false);

        if (!storeId) {
          setSelectedStore(null);
        }
      }
    };

    checkActiveRequest().finally(() => {
      if (!isCancelled) {
        setIsCheckingRequest(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [setSelectedStore, storeId]);

  // 30分以内にマッチングしなかった未確認のサポート依頼を確認する
  useEffect(() => {
    let timeoutId: number | null = null;
    let isCancelled = false;

    const checkExpiredRequests = async () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isCancelled || !user) return;

      const { data: requests, error: requestError } = await supabase
        .from("support_requests")
        .select("id, created_at")
        .eq("user_id", user.id)
        .is("expired_seen_at", null)
        .order("created_at", { ascending: true });

      if (requestError) {
        console.error("expired request check error:", requestError.message);
        return;
      }

      if (!requests || requests.length === 0) {
        setExpiredRequestIds([]);
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

      const expiredIds = unmatchedRequests
        .filter(
          (request) =>
            now >= new Date(request.created_at).getTime() + thirtyMinutes,
        )
        .map((request) => request.id);

      setExpiredRequestIds(expiredIds);

      if (expiredIds.length > 0) return;

      const nextExpirationTimes = unmatchedRequests
        .map(
          (request) => new Date(request.created_at).getTime() + thirtyMinutes,
        )
        .filter((expirationTime) => expirationTime > now);

      if (nextExpirationTimes.length === 0) return;

      const nextExpirationTime = Math.min(...nextExpirationTimes);

      timeoutId = window.setTimeout(
        () => {
          checkExpiredRequests();
        },
        nextExpirationTime - now + 100,
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkExpiredRequests();
      }
    };

    checkExpiredRequests();

    const channel = supabase
      .channel("support-request-expiration-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_requests",
        },
        () => {
          checkExpiredRequests();
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
          checkExpiredRequests();
        },
      )
      .subscribe();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("support-request-expired", checkExpiredRequests);

    return () => {
      isCancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      supabase.removeChannel(channel);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(
        "support-request-expired",
        checkExpiredRequests,
      );
    };
  }, []);

  // 選択中の店舗でサポート依頼を作成し、その直後に近くのサポーターとのマッチング判定を行う
  const handleConfirmRequest = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    if (!selectedStore) return;

    const { error } = await supabase.from("support_requests").insert({
      user_id: user.id,
      store_id: selectedStore.id,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("support request error:", error.message);
      return;
    }

    setIsConfirming(false);
    setIsRequesting(true);

    await checkForMatching();
  };

  // 最新のサポート依頼を削除して、依頼中の状態と選択店舗をリセットする
  const handleCancelRequest = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("support_requests")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error("request fetch error:", error?.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from("support_requests")
      .delete()
      .eq("id", data.id);

    if (deleteError) {
      console.error("delete request error:", deleteError.message);
      return;
    }

    setIsRequesting(false);
    setSelectedStore(null);
  };

  const handleCloseExpiredRequest = async () => {
    if (expiredRequestIds.length === 0) return;

    const { error } = await supabase
      .from("support_requests")
      .update({
        expired_seen_at: new Date().toISOString(),
      })
      .in("id", expiredRequestIds);

    if (error) {
      console.error("expired request seen update error:", error.message);
      return;
    }

    setExpiredRequestIds([]);
    setIsRequesting(false);
    setSelectedStore(null);

    window.dispatchEvent(new Event("support-request-notification-read"));
  };

  const expiredRequestModal =
    expiredRequestIds.length > 0 ? (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6">
        <div className="relative w-full max-w-sm rounded-3xl bg-[#fbf5f3] p-6 text-center shadow-xl">
          <p className="leading-7 text-stone-700">
            サポートできる方が
            <br />
            見つかりませんでした
          </p>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            サポート依頼を終了しました
          </p>

          <button
            type="button"
            onClick={handleCloseExpiredRequest}
            className="absolute right-4 top-3 text-2xl text-stone-500"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
      </div>
    ) : null;

  if (isCheckingRequest) {
    return (
      <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
        <HamburgerMenu />

        <div className="mx-auto w-full max-w-2xl">
          <h1 className="page-title">サポート依頼</h1>
        </div>
      </main>
    );
  }

  if (isMatching) {
    return (
      <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
        <HamburgerMenu />

        <div className="mx-auto w-full max-w-2xl">
          <h1 className="page-title">サポート依頼</h1>

          <div className="mx-auto mt-8 text-center">
            <p className="text-stone-600">現在マッチング中です</p>
          </div>
        </div>
      </main>
    );
  }

  if (!selectedStore) {
    return (
      <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
        <HamburgerMenu />
        {expiredRequestModal}

        <div className="mx-auto w-full max-w-2xl">
          <h1 className="page-title">サポート依頼</h1>

          <div className="mx-auto mt-8 text-center">
            <p className="text-stone-600">店舗を選択してください</p>

            <button
              type="button"
              onClick={() => router.push("/stores")}
              className="mt-5 rounded-full bg-[#d9a3a3] px-6 py-2.5 font-medium text-white"
            >
              店舗選択へ
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <HamburgerMenu />

      <div className="mx-auto w-full max-w-2xl">
        <h1 className="page-title">サポート依頼</h1>

        <div className="mt-8 flex flex-col items-center">
          {!isRequesting && (
            <div className="w-full max-w-sm rounded-2xl bg-[#f9eaea] px-5 py-3">
              <p className="text-center text-xs text-stone-500">選択中の店舗</p>

              <p className="mt-1 text-center font-medium text-stone-700">
                {selectedStore.name}
              </p>

              {selectedStore.address && (
                <p className="mt-1 max-w-xs text-sm text-stone-500">
                  {selectedStore.address}
                </p>
              )}
            </div>
          )}
          {!isRequesting && !isConfirming && (
            <>
              <button
                type="button"
                onClick={() => setIsConfirming(true)}
                className="mt-5 w-full max-w-sm rounded-full bg-[#d9a3a3] px-8 py-2.5 font-medium text-white"
              >
                サポートを依頼する
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStore(null);
                  router.push("/stores?reselect=true");
                }}
                className="mt-4 text-sm text-[#a97d7d] underline underline-offset-4"
              >
                店舗を選び直す
              </button>
            </>
          )}

          {isConfirming && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6">
              <div className="w-full max-w-sm rounded-3xl bg-[#fbf5f3] p-6 shadow-xl">
                <p className="text-center leading-7 text-stone-700">
                  {selectedStore.name}で
                  <br />
                  サポートを依頼しますか？
                </p>

                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmRequest}
                    className="rounded-full bg-[#d9a3a3] px-7 py-2.5 font-medium text-white"
                  >
                    依頼する
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfirming(false)}
                    className="rounded-full bg-stone-200 px-6 py-2.5 text-stone-600"
                  >
                    戻る
                  </button>
                </div>
              </div>
            </div>
          )}
          {isRequesting && (
            <div className="mt-6 flex flex-col items-center">
              <div className="w-full max-w-sm rounded-2xl bg-[#f9eaea] px-6 py-5 text-center">
                <p className="text-xs text-stone-500">選択中の店舗</p>

                <p className="mt-1 font-medium text-stone-700">
                  {selectedStore.name}
                </p>

                {selectedStore.address && (
                  <p className="mt-1 max-w-xs text-sm text-stone-500">
                    {selectedStore.address}
                  </p>
                )}

                <div className="mt-4 border-t border-[#ead6d6] pt-4 text-center">
                  <p className="font-medium text-stone-700">
                    サポート依頼中です
                  </p>

                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    近くでサポートできる方を探しています
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelRequest}
                className="mt-5 text-sm text-[#a97d7d] underline underline-offset-4"
              >
                依頼をキャンセル
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
