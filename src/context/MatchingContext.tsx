"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type CurrentPosition = {
  latitude: number;
  longitude: number;
  capturedAt: number;
};

type MatchingContextValue = {
  checkForMatching: () => Promise<void>;
};
const MatchingContext = createContext<MatchingContextValue | null>(null);

// どの画面からでも共通のマッチング判定を呼び出せるようにするためのカスタムフック
export function useMatching() {
  const context = useContext(MatchingContext);

  if (!context) {
    throw new Error("useMatching must be used within MatchingProvider");
  }

  return context;
}

export function MatchingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const positionRef = useRef<CurrentPosition | null>(null);

  // 短時間に位置情報取得が繰り返されるため、30秒以内の取得結果は再利用する
  const getCurrentPosition = useCallback(async () => {
    const cachedPosition = positionRef.current;

    if (cachedPosition && Date.now() - cachedPosition.capturedAt < 30 * 1000) {
      return cachedPosition;
    }

    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      },
    );

    const currentPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      capturedAt: Date.now(),
    };

    positionRef.current = currentPosition;

    return currentPosition;
  }, []);

  // サポート依頼側・サポートする側の両方から、現在地を基準に成立可能なマッチングを探す
  const checkForMatching = useCallback(async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("matching session error:", sessionError.message);
      return;
    }

    if (!session) return;

    const user = session.user;

    // サポート依頼は直近30分以内のものだけをマッチング対象として扱う
    const thirtyMinutesAgo = new Date(
      Date.now() - 30 * 60 * 1000,
    ).toISOString();

    // 新規ユーザーは profiles 行がまだ存在しない場合があるため maybeSingle で取得する
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("support_available")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("profile check error:", profileError.message);
      return;
    }

    const { data: ownRequests, error: ownRequestError } = await supabase
      .from("support_requests")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", thirtyMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1);

    if (ownRequestError) {
      console.error("support request check error:", ownRequestError.message);
      return;
    }

    const hasOwnRequest = !!ownRequests && ownRequests.length > 0;
    const isSupportAvailable = profileData?.support_available === true;

    // 依頼中でもサポート可能でもないユーザーは、位置情報取得やマッチング検索を行わない
    if (!hasOwnRequest && !isSupportAvailable) {
      return;
    }

    let currentPosition: CurrentPosition;

    try {
      currentPosition = await getCurrentPosition();
    } catch (error) {
      console.error("location get error:", error);
      return;
    }

    const currentLatitude = currentPosition.latitude;
    const currentLongitude = currentPosition.longitude;
    const locationUpdatedAt = new Date(
      currentPosition.capturedAt,
    ).toISOString();

    // サポートする側の位置は profiles に保存し、依頼者との100m判定に使う
    if (isSupportAvailable) {
      const { error: profileLocationError } = await supabase
        .from("profiles")
        .update({
          latitude: currentLatitude,
          longitude: currentLongitude,
          location_updated_at: locationUpdatedAt,
        })
        .eq("id", user.id);

      if (profileLocationError) {
        console.error(
          "profile location update error:",
          profileLocationError.message,
        );
        return;
      }
    }

    // サポート依頼側の位置は support_requests に保存し、サポーターとの100m判定に使う
    if (hasOwnRequest) {
      const activeRequest = ownRequests[0];

      const { error: requestLocationError } = await supabase
        .from("support_requests")
        .update({
          latitude: currentLatitude,
          longitude: currentLongitude,
          location_updated_at: locationUpdatedAt,
        })
        .eq("id", activeRequest.id);

      if (requestLocationError) {
        console.error(
          "request location update error:",
          requestLocationError.message,
        );
        return;
      }

      // 同じ依頼から複数のマッチングが作られないよう、既存マッチングの有無を先に確認する
      const { data: existingMatching, error: existingMatchingError } =
        await supabase
          .from("matchings")
          .select("id")
          .eq("support_request_id", activeRequest.id)
          .maybeSingle();

      if (existingMatchingError) {
        console.error(
          "existing matching error:",
          existingMatchingError.message,
        );
        return;
      }

      if (!existingMatching) {
        const { data: nearbySupporterId, error: supportersError } =
          await supabase.rpc("find_nearby_supporter", {
            current_latitude: currentLatitude,
            current_longitude: currentLongitude,
          });

        if (supportersError) {
          console.error("supporters check error:", supportersError.message);
          return;
        }

        const nearbySupporter = nearbySupporterId
          ? { id: nearbySupporterId }
          : null;
        if (nearbySupporter) {
          const { data: createdMatchingId, error: createMatchingError } =
            await supabase.rpc("create_matching_if_valid", {
              target_request_id: activeRequest.id,
              target_supporter_id: nearbySupporter.id,
            });
          if (createMatchingError) {
            if (createMatchingError.code !== "23505") {
              console.error(
                "matching create error:",
                createMatchingError.message,
              );
            }
          } else {
            const { error: supportOffError } = await supabase.rpc(
              "set_matched_supporter_unavailable",
              {
                target_matching_id: createdMatchingId,
              },
            );

            if (supportOffError) {
              console.error("support off error:", supportOffError.message);
              return;
            }

            router.refresh();
          }
        }
      }
    }

    // 依頼側の操作を待たず成立できるよう、サポートする側からも近くの依頼を探す
    if (isSupportAvailable) {
      const { data: nearbyRequestId, error: requestsError } =
        await supabase.rpc("find_nearby_support_request", {
          current_latitude: currentLatitude,
          current_longitude: currentLongitude,
        });

      if (requestsError) {
        console.error("nearby requests check error:", requestsError.message);
        return;
      }

      const nearbyRequest = nearbyRequestId ? { id: nearbyRequestId } : null;
      if (!nearbyRequest) {
        return;
      }
      const { error: createMatchingError } = await supabase.rpc(
        "create_matching_if_valid",
        {
          target_request_id: nearbyRequest.id,
          target_supporter_id: user.id,
        },
      );
      if (createMatchingError) {
        // 同じマッチングが同時に2回作られそうになった場合は、2件目だけ作らない
        if (createMatchingError.code !== "23505") {
          console.error("matching create error:", createMatchingError.message);
        }
        return;
      }

      // マッチング成立後は、新たな依頼と重複しないよう自分のサポート状態をOFFにする
      const { error: supportOffError } = await supabase
        .from("profiles")
        .update({
          support_available: false,
        })
        .eq("id", user.id);

      if (supportOffError) {
        console.error("support off error:", supportOffError.message);
        return;
      }

      router.refresh();
    }
  }, [getCurrentPosition, router]);

  // 画面遷移後すぐに判定し、その後も10秒ごとに再判定して成立状態を反映する
  useEffect(() => {
    void checkForMatching();

    const intervalId = window.setInterval(() => {
      void checkForMatching().finally(() => {
        router.refresh();
      });
    }, 10000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [checkForMatching, pathname, router]);

  // matchings テーブルの変更をリアルタイム購読し、相手側の成立・終了なども画面へ反映する
  useEffect(() => {
    const channel = supabase
      .channel("matching-dashboard-refresh")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matchings",
        },
        () => {
          router.refresh();
        },
      )

      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          router.refresh();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <MatchingContext.Provider value={{ checkForMatching }}>
      {children}
    </MatchingContext.Provider>
  );
}
