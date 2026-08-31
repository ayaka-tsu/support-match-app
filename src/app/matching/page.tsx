"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import HamburgerMenu from "@/components/HamburgerMenu";
import { useRouter } from "next/navigation";
import Image from "next/image";

const supabase = createClient();

export default function MatchingPage() {
  const [isMatching, setIsMatching] = useState(false);
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const [matchedNickname, setMatchedNickname] = useState("");
  const [matchedAvatarUrl, setMatchedAvatarUrl] = useState<string | null>(null);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);
  const [isCanceledByOther, setIsCanceledByOther] = useState(false);
  const [isNewMatching, setIsNewMatching] = useState(false);
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
          "id, support_request_id, supporter_id, status, ended_at,  created_at, supporter_seen_at",
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

        if (!data[0].supporter_seen_at) {
          setIsNewMatching(true);
        }

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

      if (!data || data.length === 0) {
        const { data: canceledData, error: canceledError } = await supabase
          .from("matchings")
          .select("id, canceled_by, ended_at, canceled_seen_at")
          .eq("supporter_id", user.id)
          .eq("status", "canceled")
          .order("ended_at", { ascending: false })
          .limit(1);

        if (canceledError) {
          console.error(
            "canceled matching check error:",
            canceledError.message,
          );
          return;
        }
        if (
          canceledData &&
          canceledData.length > 0 &&
          canceledData[0].canceled_by !== user.id &&
          !canceledData[0].canceled_seen_at
        ) {
          setMatchingId(canceledData[0].id);
          setIsCanceledByOther(true);
        }
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
        .select(
          "id, supporter_id, status, ended_at, created_at, requester_seen_at",
        )
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
        if (!matchingData[0].requester_seen_at) {
          setIsNewMatching(true);
        }
      }

      if (!matchingData || matchingData.length === 0) {
        console.log("requestIds:", requestIds);
        const { data: canceledMatchingData, error: canceledMatchingError } =
          await supabase
            .from("matchings")
            .select("id, canceled_by, ended_at, canceled_seen_at")
            .in("support_request_id", requestIds)
            .eq("status", "canceled")
            .order("ended_at", { ascending: false })
            .limit(1);
        if (canceledMatchingError) {
          console.error(
            "canceled requester matching check error:",
            canceledMatchingError.message,
          );
          return;
        }

        if (
          canceledMatchingData &&
          canceledMatchingData.length > 0 &&
          canceledMatchingData[0].canceled_by !== user.id &&
          !canceledMatchingData[0].canceled_seen_at
        ) {
          setMatchingId(canceledMatchingData[0].id);
          setIsCanceledByOther(true);
        }
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
        .select("nickname, avatar_url")
        .eq("id", matchedUserId)
        .single();

      if (error) {
        console.error("matched profile error:", error.message);
        return;
      }

      setMatchedNickname(data.nickname);
      setMatchedAvatarUrl(data.avatar_url);
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

  const handleCancelMatching = async () => {
    if (!matchingId) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("matchings")
      .update({
        status: "canceled",
        canceled_by: user.id,
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

  const handleCloseCanceledByOther = async () => {
    if (!matchingId) return;

    const { error } = await supabase
      .from("matchings")
      .update({
        canceled_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchingId);

    if (error) {
      console.error("canceled seen update error:", error.message);
      return;
    }
    window.dispatchEvent(new Event("matching-notification-read"));
    setIsCanceledByOther(false);
  };

  const handleCloseNewMatching = async () => {
    if (!matchingId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: matchingData, error: matchingError } = await supabase
      .from("matchings")
      .select("supporter_id, support_request_id")
      .eq("id", matchingId)
      .single();

    if (matchingError) {
      console.error("matching seen check error:", matchingError.message);
      return;
    }

    if (matchingData.supporter_id === user.id) {
      await supabase
        .from("matchings")
        .update({ supporter_seen_at: new Date().toISOString() })
        .eq("id", matchingId);
    } else {
      await supabase
        .from("matchings")
        .update({ requester_seen_at: new Date().toISOString() })
        .eq("id", matchingId);
    }
    window.dispatchEvent(new Event("matching-notification-read"));
    setIsNewMatching(false);
  };

  useEffect(() => {
    if (!isMatching || !matchingId || !matchingCreatedAt) {
      return;
    }
    const createdTime = new Date(matchingCreatedAt).getTime();
    const oneHour = 60 * 60 * 1000;
    const automaticEndTime = new Date(createdTime + oneHour).toISOString();
    const remainingTime = createdTime + oneHour - Date.now();

    const endMatchingAutomatically = async () => {
      const { error } = await supabase
        .from("matchings")
        .update({
          status: "ended",
          ended_at: automaticEndTime,
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
        <p>ご利用ありがとうございました</p>
      ) : isMatching ? (
        <>
          <p>マッチング中です</p>
          <div className="flex items-center gap-3">
            {matchedAvatarUrl ? (
              <Image
                src={matchedAvatarUrl}
                alt={`${matchedNickname}のプロフィール画像`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d9a3a3] text-lg font-medium text-white">
                {matchedNickname
                  ? matchedNickname.charAt(0).toUpperCase()
                  : "?"}
              </div>
            )}

            <p>{matchedNickname}</p>
          </div>
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

          <button type="button" onClick={handleEndMatching}>
            マッチング終了
          </button>
        </>
      ) : (
        <p>現在マッチングはありません</p>
      )}

      {isNewMatching && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "white",
              padding: "32px",
              borderRadius: "12px",
            }}
          >
            <button
              type="button"
              onClick={handleCloseNewMatching}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
              }}
            >
              ×
            </button>
            <p>サポートが成立しました</p>
          </div>
        </div>
      )}

      {isCanceled && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "white",
              padding: "32px",
              borderRadius: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => setIsCanceled(false)}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
              }}
            >
              ×
            </button>
            <p>キャンセルしました</p>
          </div>
        </div>
      )}

      {isCanceledByOther && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "white",
              padding: "32px",
              borderRadius: "12px",
            }}
          >
            <button
              type="button"
              onClick={handleCloseCanceledByOther}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
              }}
            >
              ×
            </button>
            <p>相手の方がキャンセルしました</p>
          </div>
        </div>
      )}
      {/* {isEnded ? (
        <>
          <p>ご利用ありがとうございました</p>
        </>
      ) : isNewMatching ? (
        <div>
          <button type="button" onClick={handleCloseNewMatching}>
            ×
          </button>
          <p>サポートが成立しました</p>
        </div>
      ) : isCanceled ? (
        <div>
          <button type="button" onClick={() => setIsCanceled(false)}>
            ×
          </button>
          <p>キャンセルしました</p>
        </div>
      ) : isCanceledByOther ? (
        <div>
          <button type="button" onClick={handleCloseCanceledByOther}>
            ×
          </button>
          <p>相手の方がキャンセルしました</p>
        </div>
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
      )} */}
    </main>
  );
}
