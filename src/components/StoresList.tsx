"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/context/StoreContext";

const supabase = createClient();

type Store = {
  id: string;
  name: string;
  address: string | null;
};

type StoreListProps = {
  stores: Store[];
};

export default function StoresList({ stores }: StoreListProps) {
  const [search, setSearch] = useState("");
  const { selectedStore, setSelectedStore } = useStore();
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");
  const [addStoreError, setAddStoreError] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestMessageStoreId, setRequestMessageStoreId] = useState<
    string | null
  >(null);
  const [searchType, setSearchType] = useState<"name" | "address">("name");
  const [isMatching, setIsMatching] = useState(false);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReselecting = searchParams.get("reselect") === "true";

  useEffect(() => {
    if (!isReselecting) return;

    setSelectedStore(null);
    router.replace("/stores");
  }, [isReselecting, router, setSelectedStore]);

  useEffect(() => {
    const checkActiveReruest = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: supporterMatching, error: supporterMatchingError } =
        await supabase
          .from("matchings")
          .select("id")
          .eq("supporter_id", user.id)
          .eq("status", "active");

      if (supporterMatchingError) {
        console.error(
          "supporter matching check error",
          supporterMatchingError.message,
        );
        return;
      }

      const { data: userRequests, error: userRequestsError } = await supabase
        .from("support_requests")
        .select("id")
        .eq("user_id", user.id);

      if (userRequestsError) {
        console.error("user requests check error", userRequestsError.message);
        return;
      }

      const requestIds = userRequests?.map((request) => request.id) ?? [];

      let hasRequesterMatching = false;

      if (requestIds.length > 0) {
        const { data: requesterMatching, error: requesterMatchingError } =
          await supabase
            .from("matchings")
            .select("id")
            .in("support_request_id", requestIds)
            .eq("status", "active");
        if (requesterMatchingError) {
          console.error(
            "requester matching check error",
            requesterMatchingError.message,
          );
          return;
        }
        hasRequesterMatching =
          requesterMatching !== null && requesterMatching.length > 0;
      }

      if (
        (supporterMatching && supporterMatching.length > 0) ||
        hasRequesterMatching
      ) {
        setIsMatching(true);
      }

      const thirtyMinutesAgo = new Date(
        Date.now() - 30 * 60 * 1000,
      ).toISOString();

      const { data, error } = await supabase
        .from("support_requests")
        .select("id")
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
          setSelectedStore(null);
          return;
        }

        setIsRequesting(true);
      } else {
        setIsRequesting(false);
      }
    };
    checkActiveReruest().finally(() => setIsCheckingRequest(false));
  }, [setSelectedStore]);

  const handleSelectStore = () => {
    if (!selectedStore) return;
    router.push(`/support-requests?storeId=${selectedStore.id}`);
  };
  const handleAddStore = async () => {
    if (!newStoreName.trim()) {
      setAddStoreError("店舗名を入力してください");
      return;
    }
    const duplicateStore = stores.find(
      (store) => normalizeText(store.name) === normalizeText(newStoreName),
    );

    if (duplicateStore) {
      setAddStoreError("この店舗はすでに登録されています");
      return;
    }
    const { data, error } = await supabase
      .from("stores")
      .insert({
        name: newStoreName.trim(),
        address: newStoreAddress.trim() || null,
      })
      .select("id, name, address")
      .single();
    if (error) {
      console.error("store add error:", error.message);
      return;
    }
    setSelectedStore(data);
    setNewStoreName("");
    setNewStoreAddress("");
    setIsAddingStore(false);
    router.refresh();
  };

  const normalizeText = (text: string) =>
    text.normalize("NFKC").trim().toLowerCase();

  const filteredStores = stores.filter((store) => {
    const target = searchType === "name" ? store.name : (store.address ?? "");
    return normalizeText(target).includes(normalizeText(search));
  });

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSearchType("name")}
          className={`rounded-full px-4 py-2 text-sm ${
            searchType === "name"
              ? "bg-[#d9a3a3] text-white"
              : "bg-[#f3e6e3] text-stone-600"
          }`}
        >
          店舗名
        </button>

        <button
          type="button"
          onClick={() => setSearchType("address")}
          className={`rounded-full px-4 py-2 text-sm ${
            searchType === "address"
              ? "bg-[#d9a3a3] text-white"
              : "bg-[#f3e6e3] text-stone-600"
          }`}
        >
          住所
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={searchType === "name" ? "店舗名で検索" : "住所で検索"}
        className="mt-3 w-full rounded-xl border border-stone-300 bg-[#fffafa] px-4 py-3"
      />

      <div className="mt-6 flex flex-col gap-3">
        {filteredStores.map((store) => {
          const isSelected = selectedStore?.id === store.id;

          return (
            <div
              key={store.id}
              className={`rounded-2xl px-4 py-4 ${
                isSelected ? "bg-[#f3e6e3]" : "bg-white/70"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-stone-700">{store.name}</p>

                  {store.address && (
                    <p className="mt-1 text-sm leading-5 text-stone-500">
                      {store.address}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isCheckingRequest}
                  onClick={() => {
                    if (isRequesting || isMatching) {
                      setRequestMessage(
                        isMatching
                          ? "現在マッチングです"
                          : "現在サポート依頼中です",
                      );
                      setRequestMessageStoreId(store.id);
                      return;
                    }

                    setSelectedStore(store);
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                    isSelected
                      ? "bg-[#c98f98] text-white"
                      : "bg-[#d9a3a3] text-white"
                  } ${isCheckingRequest ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {isSelected ? "選択中" : "選択"}
                </button>
              </div>

              {requestMessageStoreId === store.id && requestMessage && (
                <p className="mt-2 text-sm text-[#c96f6f]">{requestMessage}</p>
              )}

              {isSelected && !isRequesting && !isCheckingRequest && (
                <div className="mt-4 border-t border-[#e5cccc] pt-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleSelectStore}
                      className="flex-1 rounded-full bg-[#d9a3a3] px-5 py-3 font-medium text-white"
                    >
                      サポート依頼へ進む
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedStore(null)}
                      className="rounded-full bg-stone-200 px-5 py-3 text-stone-600"
                    >
                      選び直す
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setIsAddingStore(true)}
          className="text-sm text-[#a97d7d] underline underline-offset-4"
        >
          店舗が見つからない場合はこちら
        </button>
      </div>

      {isAddingStore && (
        <div className="mt-5 rounded-2xl bg-[#f9eaea] p-5">
          <p className="font-medium text-stone-700">店舗を追加</p>

          <input
            type="text"
            value={newStoreName}
            onChange={(e) => {
              setNewStoreName(e.target.value);
              setAddStoreError("");
            }}
            placeholder="店舗名"
            className="mt-4 w-full rounded-xl border border-stone-300 bg-[#fffafa] px-4 py-3"
          />

          <input
            type="text"
            value={newStoreAddress}
            onChange={(e) => setNewStoreAddress(e.target.value)}
            placeholder="店舗住所"
            className="mt-3 w-full rounded-xl border border-stone-300 bg-[#fffafa] px-4 py-3"
          />

          {addStoreError && (
            <p className="mt-2 text-sm text-[#c96f6f]">{addStoreError}</p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleAddStore}
              className="flex-1 rounded-full bg-[#d9a3a3] px-4 py-2.5 font-medium text-white"
            >
              この店舗を選択する
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAddingStore(false);
                setAddStoreError("");
                setNewStoreName("");
                setNewStoreAddress("");
              }}
              className="rounded-full bg-stone-200 px-4 py-2.5 text-stone-600"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
