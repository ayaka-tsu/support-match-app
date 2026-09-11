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
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isCanceledByOther, setIsCanceledByOther] = useState(false);
  const [isEndedByOther, setIsEndedByOther] = useState(false);
  const [isNewMatching, setIsNewMatching] = useState(false);
  const [isMatchingChecked, setIsMatchingChecked] = useState(false);
  const [matchingCreatedAt, setMatchingCreatedAt] = useState<string | null>(
    null,
  );
  const router = useRouter();

  // ログイン中のユーザーについて、サポートする側・依頼した側の両方から現在のマッチング状態を確認する
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

      if (!data || data.length === 0) {
        const { data: endedData, error: endedError } = await supabase
          .from("matchings")
          .select("id, ended_by, ended_at, ended_seen_at")
          .eq("supporter_id", user.id)
          .eq("status", "ended")
          .neq("ended_by", user.id)
          .is("ended_seen_at", null)
          .order("ended_at", { ascending: false })
          .limit(1);

        if (endedError) {
          console.error("ended matching check error:", endedError.message);
          return;
        }

        if (endedData && endedData.length > 0) {
          setMatchingId(endedData[0].id);
          setIsEndedByOther(true);
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

      if (!matchingData || matchingData.length === 0) {
        const { data: endedMatchingData, error: endedMatchingError } =
          await supabase
            .from("matchings")
            .select("id, ended_by, ended_at, ended_seen_at")
            .in("support_request_id", requestIds)
            .eq("status", "ended")
            .neq("ended_by", user.id)
            .is("ended_seen_at", null)
            .order("ended_at", { ascending: false })
            .limit(1);

        if (endedMatchingError) {
          console.error(
            "ended requester matching check error:",
            endedMatchingError.message,
          );
          return;
        }

        if (endedMatchingData && endedMatchingData.length > 0) {
          setMatchingId(endedMatchingData[0].id);
          setIsEndedByOther(true);
        }
      }
    };
    checkMatching().finally(() => {
      setIsMatchingChecked(true);
    });
  }, []);

  // 相手側がマッチングを終了した更新をリアルタイムで受け取り、画面へ即時反映する
  useEffect(() => {
    if (!matchingId) {
      return;
    }

    const subscribeToMatchingEnd = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const channel = supabase
        .channel(`matching-end-${matchingId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "matchings",
            filter: `id=eq.${matchingId}`,
          },
          (payload) => {
            const updatedMatching = payload.new as {
              status?: string;
              ended_by?: string | null;
              ended_seen_at?: string | null;
            };

            if (
              updatedMatching.status === "ended" &&
              updatedMatching.ended_by &&
              updatedMatching.ended_by !== user.id &&
              !updatedMatching.ended_seen_at
            ) {
              setIsMatching(false);
              setIsEndedByOther(true);
            }
          },
        )
        .subscribe();

      return channel;
    };

    let matchingChannel: ReturnType<typeof supabase.channel> | null = null;

    subscribeToMatchingEnd().then((channel) => {
      matchingChannel = channel ?? null;
    });

    return () => {
      if (matchingChannel) {
        supabase.removeChannel(matchingChannel);
      }
    };
  }, [matchingId]);

  // マッチング相手のニックネームとプロフィール画像を取得して表示する
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

  // マッチング成立中は新たなサポート対象にならないよう、サポート可否を自動でOFFにする
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

  // 利用者が手動でマッチングを終了し、終了時刻と終了したユーザーを記録する
  const handleEndMatching = async () => {
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
        status: "ended",
        ended_at: new Date().toISOString(),
        ended_by: user.id,
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

  // 手動終了後はお礼メッセージを表示し、3秒後にトップ画面へ戻す
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

  // マッチングをキャンセルし、誰がキャンセルしたかと終了時刻を保存する
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

  // 相手からのキャンセル通知を確認済みにし、通知の赤丸を消す
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

  // 相手からの終了通知を確認済みにし、通知の赤丸を消す
  const handleCloseEndedByOther = async () => {
    if (!matchingId) return;

    const { error } = await supabase
      .from("matchings")
      .update({
        ended_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchingId);

    if (error) {
      console.error("ended seen update error:", error.message);
      return;
    }

    window.dispatchEvent(new Event("matching-notification-read"));
    setIsEndedByOther(false);
  };

  // マッチング成立通知を確認済みにし、サポートする側・依頼した側それぞれの確認時刻を保存する
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

  // マッチング成立時刻を基準に1時間後を計算し、時間切れになったマッチングを自動終了する
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
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <HamburgerMenu />

      <div className="mx-auto w-full max-w-md">
        <h1 className="page-title">マッチング</h1>

        {isEnded ? (
          <div className="mt-10 text-center">
            <p className="font-medium text-stone-700">
              ご利用ありがとうございました
            </p>
          </div>
        ) : isMatching ? (
          <div className="mt-8">
            <p className="text-center text-sm font-medium text-[#a97d7d]">
              マッチング中です
            </p>

            <div className="mt-6 flex flex-col items-center">
              {matchedAvatarUrl ? (
                <Image
                  src={matchedAvatarUrl}
                  alt={`${matchedNickname}のプロフィール画像`}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d9a3a3] text-2xl font-medium text-white">
                  {matchedNickname
                    ? matchedNickname.charAt(0).toUpperCase()
                    : "?"}
                </div>
              )}

              <p className="mt-3 text-lg font-medium text-stone-700">
                {matchedNickname}
              </p>
            </div>

            <div className="mt-7 rounded-2xl border border-stone-200 bg-white/70 px-5 py-5">
              {matchingCreatedAt && (
                <>
                  <div>
                    <p className="text-xs text-stone-500">サポート成立</p>
                    <p className="mt-1 font-medium text-stone-700">
                      {new Date(matchingCreatedAt).toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-stone-200 pt-4">
                    <p className="text-xs text-stone-500">利用可能時間</p>
                    <p className="mt-1 text-sm text-stone-700">
                      {new Date(
                        new Date(matchingCreatedAt).getTime() + 60 * 60 * 1000,
                      ).toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      まで
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.push("/messages")}
              className="button-interaction mx-auto mt-6 block w-full max-w-xs rounded-full bg-[#d9a3a3] px-6 py-3 font-medium text-white"
            >
              メッセージを開く
            </button>
            <div className="mt-5 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleEndMatching}
                className="button-interaction w-full max-w-xs rounded-full border border-[#b99191] bg-[#fffafa] px-5 py-2.5 font-medium text-[#9b7474]"
              >
                マッチング終了
              </button>

              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(true)}
                className="button-interaction rounded-full bg-[#fcf6f6] px-5 py-2 text-sm font-medium text-[#c96f6f]"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : isMatchingChecked ? (
          <div className="mt-10 text-center">
            <p className="text-stone-600">現在マッチングはありません</p>
          </div>
        ) : null}
        {isCancelConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6">
            <div className="w-full max-w-sm rounded-3xl bg-[#fbf5f3] p-6 text-center shadow-xl">
              <p className="text-stone-700">マッチングをキャンセルしますか？</p>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    setIsCancelConfirmOpen(false);
                    await handleCancelMatching();
                  }}
                  className="button-interaction rounded-full bg-[#c96f6f] px-6 py-2.5 font-medium text-white"
                >
                  キャンセルする
                </button>

                <button
                  type="button"
                  onClick={() => setIsCancelConfirmOpen(false)}
                  className="button-interaction rounded-full bg-stone-200 px-6 py-2.5 text-stone-600"
                >
                  戻る
                </button>
              </div>
            </div>
          </div>
        )}

        {isNewMatching && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6">
            <div className="relative w-full max-w-sm rounded-3xl bg-[#fbf5f3] px-6 py-8 text-center shadow-xl">
              <button
                type="button"
                onClick={handleCloseNewMatching}
                className="absolute right-4 top-3 text-2xl text-stone-500"
                aria-label="閉じる"
              >
                ×
              </button>

              <p className="font-medium text-stone-700">
                サポートが成立しました
              </p>

              {matchedNickname && (
                <p className="mt-2 text-sm text-stone-500">
                  {matchedNickname}さんとマッチングしました
                </p>
              )}
            </div>
          </div>
        )}

        {isCanceled && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6">
            <div className="relative w-full max-w-sm rounded-3xl bg-[#fbf5f3] px-6 py-8 text-center shadow-xl">
              <button
                type="button"
                onClick={() => setIsCanceled(false)}
                className="absolute right-4 top-3 text-2xl text-stone-500"
                aria-label="閉じる"
              >
                ×
              </button>

              <p className="font-medium text-stone-700">キャンセルしました</p>
            </div>
          </div>
        )}

        {isCanceledByOther && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6">
            <div className="relative w-full max-w-sm rounded-3xl bg-[#fbf5f3] px-6 py-8 text-center shadow-xl">
              <button
                type="button"
                onClick={handleCloseCanceledByOther}
                className="absolute right-4 top-3 text-2xl text-stone-500"
                aria-label="閉じる"
              >
                ×
              </button>

              <p className="font-medium text-stone-700">
                相手の方がキャンセルしました
              </p>
            </div>
          </div>
        )}

        {isEndedByOther && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6">
            <div className="relative w-full max-w-sm rounded-3xl bg-[#fbf5f3] px-6 py-8 text-center shadow-xl">
              <button
                type="button"
                onClick={handleCloseEndedByOther}
                className="absolute right-4 top-3 text-2xl text-stone-500"
                aria-label="閉じる"
              >
                ×
              </button>

              <p className="font-medium text-stone-700">
                このマッチングは終了しました
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
