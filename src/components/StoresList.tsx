"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [searchType, setSearchType] = useState<"name" | "address">("name");
  const [isMatching, setIsMatching] = useState(false);
  const router = useRouter();

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
      } else {
        setIsRequesting(false);
      }
    };
    checkActiveReruest();
  }, []);

  const handleSelectStore = () => {
    if (!selectedStore) return;
    router.push(`/support-requests?storeId=${selectedStore.id}`);
  };
  const handleAddStore = async () => {
    if (!newStoreName.trim()) return;

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
    <div>
      {requestMessage && <p>{requestMessage}</p>}
      <button onClick={() => setSearchType("name")}>店舗名で検索</button>

      <button onClick={() => setSearchType("address")}>住所で検索</button>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredStores.map((store) => (
        <div key={store.id}>
          {store.name}
          {store.address && <p>{store.address}</p>}
          <button
            onClick={() => {
              if (isRequesting || isMatching) {
                setRequestMessage(
                  isMatching ? "現在マッチングです" : "現在サポート依頼中です",
                );
                return;
              }
              setSelectedStore(store);
            }}
          >
            選択
          </button>
        </div>
      ))}

      <button onClick={() => setIsAddingStore(true)}>店舗を追加</button>

      {isAddingStore && (
        <div>
          <input
            type="text"
            value={newStoreName}
            onChange={(e) => {
              setNewStoreName(e.target.value);
              setAddStoreError("");
            }}
            placeholder="店舗名"
          />

          <input
            type="text"
            value={newStoreAddress}
            onChange={(e) => setNewStoreAddress(e.target.value)}
            placeholder="店舗住所"
          />

          <button onClick={handleAddStore}>この店舗を選択する</button>
          <button onClick={() => setIsAddingStore(false)}>閉じる</button>
          {addStoreError && <p>{addStoreError}</p>}
        </div>
      )}

      {selectedStore && !isRequesting && (
        <div>
          <p>選択中 : {selectedStore.name}</p>

          <button onClick={handleSelectStore}>サポート依頼へ進む</button>
          <button onClick={() => setSelectedStore(null)}>選び直す</button>
        </div>
      )}
    </div>
  );
}
