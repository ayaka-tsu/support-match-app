"use client";

import { useStore } from "@/context/StoreContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import HamburgerMenu from "@/components/HamburgerMenu";

const supabase = createClient();

export default function SupportRequestsPage() {
  const { selectedStore, setSelectedStore } = useStore();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
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
        setIsRequesting(true);
        const { data: storeData } = await supabase
          .from("stores")
          .select("id, name, address")
          .eq("id", data[0].store_id)
          .single();

        if (storeData) {
          setSelectedStore(storeData);
        }
      }
    };
    checkActiveRequest();
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

  if (!selectedStore) {
    return (
      <div>
        <HamburgerMenu />
        <p>店舗を選択してください</p>

        <button onClick={() => router.push("/stores")}>店舗選択へ</button>
      </div>
    );
  }

  return (
    <main>
      <HamburgerMenu />

      <h1>サポート依頼</h1>
      {selectedStore && <p>選択店舗 : {selectedStore.name}</p>}
      {!isRequesting && (
        <button onClick={() => router.push("/stores")}>店舗を選び直す</button>
      )}
      {isRequesting ? (
        <div>
          <p>サポート依頼中です</p>
          <button onClick={handleCancelRequest}>依頼をキャンセル</button>
        </div>
      ) : (
        <button onClick={() => setIsConfirming(true)}>
          サポートを依頼する
        </button>
      )}
      {isConfirming && (
        <div>
          <p>{selectedStore.name}でサポートを依頼します。よろしいですか？</p>
          <button onClick={handleConfirmRequest}>はい</button>
          <button onClick={() => setIsConfirming(false)}>戻る</button>
        </div>
      )}
    </main>
  );
}
