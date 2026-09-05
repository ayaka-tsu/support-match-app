"use client";

import { useStore } from "@/context/StoreContext";
import { useMatching } from "@/context/MatchingContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import HamburgerMenu from "@/components/HamburgerMenu";

const supabase = createClient();

export default function SupportRequestsPage() {
  const { selectedStore, setSelectedStore } = useStore();
  const { checkForMatching } = useMatching();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkActiveRequest = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

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

      if (error) {
        console.error("active request check error", error.message);
        return;
      }

      if (data && data.length > 0) {
        const { data: matchingData, error: matchingError } = await supabase
          .from("matchings")
          .select("id")
          .eq("support_request_id", data[0].id)
          .maybeSingle();

        if (matchingError) {
          console.error("request matching check error", matchingError.message);
          return;
        }
        if (matchingData) {
          setIsRequesting(false);
          return;
        }
        setIsRequesting(true);

        const { data: storeData } = await supabase
          .from("stores")
          .select("id, name, address")
          .eq("id", data[0].store_id)
          .single();

        if (storeData) {
          setSelectedStore(storeData);
        }
      } else {
        setIsRequesting(false);
      }
    };
    checkActiveRequest().finally(() => setIsCheckingRequest(false));
  }, [setSelectedStore]);

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

    // const thirtyMinutesAgo = new Date(
    //   Date.now() - 30 * 60 * 1000,
    // ).toISOString();

    // const { error } = await supabase
    //   .from("support_requests")
    //   .delete()
    //   .eq("user_id", user.id)
    //   // .gte("created_at", thirtyMinutesAgo);
    //   .order("created_at", { ascending: false })
    //   .limit(1);

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
  if (!selectedStore) {
    return (
      <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
        <HamburgerMenu />

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
                onClick={() => router.push("/stores")}
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
