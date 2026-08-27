"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import HamburgerMenu from "@/components/HamburgerMenu";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function MatchingPage() {
  const [isMatching, setIsMatching] = useState(false);
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const [matchedNickname, setMatchedNickname] = useState("");
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const [matchingCreatedAt, setMatchingCreatedAt] = useState<string | null>(
    null,
  );
  const router = useRouter();

  useEffect(() => {
    const checkMatching = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("matchings")
        .select(
          "id, support_request_id, supporter_id, status, ended_at,  created_at",
        )
        .eq("supporter_id", user.id)
        .eq("status", "active");

      if (error) {
        console.error("matching check error:", error.message);
        return;
      }
      if (data && data.length > 0) {
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

        setIsMatching(true);
        setMatchingCreatedAt(data[0].created_at);
        setMatchingId(data[0].id);

        const { data: matchedRequest, error: matchedRequestError } =
          await supabase
            .from("support_requests")
            .select("user_id")
            .eq("id", data[0].support_request_id)
            .single();

        if (matchedRequestError) {
          console.error("matched request error:", matchedRequestError.message);
          return;
        }
        setMatchedUserId(matchedRequest.user_id);
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("support_available")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("profile check error:", profileError.message);
        return;
      }

      if (profileData?.support_available) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { error: profileLocationError } = await supabase
            .from("profiles")
            .update({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              location_updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (profileLocationError) {
            console.error(
              "profile location update error:",
              profileLocationError.message,
            );
            return;
          }
        });
      }

      const { data: requestData, error: requestError } = await supabase
        .from("support_requests")
        .select("id")
        .eq("user_id", user.id);

      if (requestError) {
        console.error("support request check error:", requestError.message);
        return;
      }
      if (!requestData || requestData.length === 0) {
        return;
      }
      const requestIds = requestData.map((request) => request.id);
      const { data: matchingData, error: matchingError } = await supabase
        .from("matchings")
        .select("id, supporter_id, status, ended_at, created_at")
        .in("support_request_id", requestIds)
        .eq("status", "active");

      if (matchingError) {
        console.error("matching request check error:", matchingError.message);
        return;
      }

      if (matchingData && matchingData.length > 0) {
        setIsMatching(true);
        setMatchingCreatedAt(matchingData[0].created_at);
        setMatchingId(matchingData[0].id);
        setMatchedUserId(matchingData[0].supporter_id);
      }
      const thirtyMinutesAgo = new Date(
        Date.now() - 30 * 60 * 1000,
      ).toISOString();

      const { data: activeRequests, error: activeRequestError } = await supabase
        .from("support_requests")
        .select("id, store_id, created_at, latitude, longitude")
        .eq("user_id", user.id)
        .gte("created_at", thirtyMinutesAgo)
        .order("created_at", { ascending: false })
        .limit(1);

      if (activeRequestError) {
        console.error("active request error:", activeRequestError.message);
        return;
      }

      if (!activeRequests || activeRequests.length === 0) {
        return;
      }

      const activeRequest = activeRequests[0];

      navigator.geolocation.getCurrentPosition(async (position) => {
        console.log(position.coords.latitude);
        console.log(position.coords.longitude);

        const { error } = await supabase
          .from("support_requests")
          .update({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location_updated_at: new Date().toISOString(),
          })
          .eq("id", activeRequest.id);

        if (error) {
          console.error("location update error:", error.message);
          return;
        }
      });

      const { data: supporters, error: supportersError } = await supabase
        .from("profiles")
        .select("id, latitude, longitude, location_updated_at")
        .eq("support_available", true)
        .neq("id", user.id);

      if (supportersError) {
        console.error("supporters check error:", supportersError.message);
        return;
      }

      if (!supporters || supporters.length === 0) {
        return;
      }

      const vaildSupporters = supporters.filter(
        (supporter) =>
          supporter.latitude !== null && supporter.longitude !== null,
      );

      if (vaildSupporters.length === 0) {
        return;
      }
      const toRadians = (value: number) => {
        return (value * Math.PI) / 180;
      };
      const getDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
      ) => {
        const R = 6371000;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const nearbySupporters = vaildSupporters.filter((supporter) => {
        const distance = getDistance(
          activeRequest.latitude,
          activeRequest.longitude,
          supporter.latitude,
          supporter.longitude,
        );
        return distance <= 100;
      });

      if (nearbySupporters.length === 0) {
        return;
      }

      const matchedSupporter = nearbySupporters[0];

      const { data: existingMatching } = await supabase
        .from("matchings")
        .select("id")
        .eq("support_request_id", activeRequest.id)
        .maybeSingle();

      if (existingMatching) {
        setIsMatching(true);
        return;
      }

      const { error: createMatchingError } = await supabase
        .from("matchings")
        .insert({
          support_request_id: activeRequest.id,
          supporter_id: matchedSupporter.id,
          status: "active",
          updated_at: new Date().toISOString(),
        });

      if (createMatchingError) {
        console.error("matching create errror:", createMatchingError.message);
        return;
      }

      const { error: supportOffError } = await supabase
        .from("profiles")
        .update({
          support_available: false,
        })
        .eq("id", matchedSupporter.id);

      if (supportOffError) {
        console.error("support off error:", supportOffError.message);
        return;
      }

      setIsMatching(true);
    };

    checkMatching();
  }, []);

  useEffect(() => {
    if (!matchedUserId) {
      return;
    }

    const fetchMatchedProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", matchedUserId)
        .single();

      if (error) {
        console.error("matched profile error:", error.message);
        return;
      }

      setMatchedNickname(data.nickname);
    };
    fetchMatchedProfile();
  }, [matchedUserId]);

  useEffect(() => {
    if (!isMatching) {
      return;
    }

    const turnOffSupport = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          support_available: false,
        })
        .eq("id", user.id);

      if (error) {
        console.error("support off error:", error.message);
        return;
      }
    };

    turnOffSupport();
  }, [isMatching]);

  const handleEndMatching = async () => {
    if (!matchingId) {
      return;
    }

    const { error } = await supabase
      .from("matchings")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchingId);

    if (error) {
      console.error("matching end error:", error.message);
      return;
    }

    setIsMatching(false);
    setIsEnded(true);
  };

  useEffect(() => {
    if (!isEnded) {
      return;
    }

    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [isEnded, router]);

  useEffect(() => {
    if (!isCanceled) {
      return;
    }

    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [isCanceled, router]);

  const handleCancelMatching = async () => {
    if (!matchingId) {
      return;
    }

    const { error } = await supabase
      .from("matchings")
      .update({
        status: "canceled",
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchingId);

    if (error) {
      console.error("matching cancel error:", error.message);
      return;
    }

    setIsMatching(false);
    setIsCanceled(true);
  };

  useEffect(() => {
    if (!isMatching || !matchingId || !matchingCreatedAt) {
      return;
    }

    const createdTime = new Date(matchingCreatedAt).getTime();
    const oneHour = 60 * 60 * 1000;
    const remainingTime = createdTime + oneHour - Date.now();

    const endMatchingAutomatically = async () => {
      const { error } = await supabase
        .from("matchings")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchingId);

      if (error) {
        console.error("automatic matching end error:", error.message);
        return;
      }

      setIsMatching(false);
    };

    if (remainingTime <= 0) {
      endMatchingAutomatically();
      return;
    }

    const timer = setTimeout(() => {
      endMatchingAutomatically();
    }, remainingTime);

    return () => {
      clearTimeout(timer);
    };
  }, [isMatching, matchingId, matchingCreatedAt]);

  return (
    <main>
      <HamburgerMenu />
      <h1>マッチング</h1>

      {isEnded ? (
        <>
          <p>ご利用ありがとうございました</p>
        </>
      ) : isMatching ? (
        <>
          <p>マッチング中です</p>
          <p>相手: {matchedNickname}</p>
          {matchingCreatedAt && (
            <p>
              サポート成立{" "}
              {new Date(matchingCreatedAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          {matchingCreatedAt && (
            <p>
              このサポート成立は
              {new Date(
                new Date(matchingCreatedAt).getTime() + 60 * 60 * 1000,
              ).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              まで有効です
            </p>
          )}
          <button type="button" onClick={() => router.push("/messages")}>
            メッセージを開く
          </button>

          <button type="button" onClick={handleCancelMatching}>
            キャンセル
          </button>

          <button onClick={handleEndMatching}>マッチング終了</button>
        </>
      ) : (
        <p>現在マッチングはありません</p>
      )}
    </main>
  );
}
