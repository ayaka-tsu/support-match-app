"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Store = {
  id: string;
  name: string;
};

type StoreListProps = {
  stores: Store[];
};

export default function StoresList({ stores }: StoreListProps) {
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const router = useRouter();

  const handleSelectedStore = () => {
    if (!selectedStore) return;
    router.push(`/support-requests?storeId=${selectedStore.id}`);
  };

  const normalizeText = (text: string) =>
    text.normalize("NFKC").trim().toLowerCase();

  const filteredStores = stores.filter((store) =>
    normalizeText(store.name).includes(normalizeText(search)),
  );

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="店舗名を検索"
      />

      {filteredStores.map((store) => (
        <div key={store.id}>
          {store.name}
          <button onClick={() => setSelectedStore(store)}>選択</button>
        </div>
      ))}

      {selectedStore && (
        <div>
          <p>選択中 : {selectedStore.name}</p>

          <button onClick={handleSelectedStore}>この店舗を選ぶ</button>
          <button onClick={() => setSelectedStore(null)}>選び直す</button>
        </div>
      )}
    </div>
  );
}
