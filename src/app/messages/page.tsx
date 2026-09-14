"use client";

import { useEffect, useRef, useState } from "react";
// import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import HamburgerMenu from "@/components/HamburgerMenu";
import Image from "next/image";

const supabase = createClient();

export default function MessagesPage() {
  const [content, setContent] = useState("");
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    {
      id: string;
      sender_id: string;
      content: string;
      created_at: string;
      read_at: string | null;
    }[]
  >([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isWithinMessageGracePeriod, setIsWithinMessageGracePeriod] =
    useState(false);
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [messageAvailableUntil, setMessageAvailableUntil] = useState<
    string | null
  >(null);
  const [conversationNames, setConversationNames] = useState<
    {
      userId: string;
      nickname: string;
      avatarUrl: string | null;
      matchingIds: string[];
      hasUnread: boolean;
    }[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isMatchingChecked, setIsMatchingChecked] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // メッセージが追加されたら、常に最新メッセージまで自動でスクロールする
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedNickname =
    conversationNames.find(
      (conversation) =>
        matchingId && conversation.matchingIds.includes(matchingId),
    )?.nickname ?? null;

  const selectedAvatarUrl =
    conversationNames.find(
      (conversation) =>
        matchingId && conversation.matchingIds.includes(matchingId),
    )?.avatarUrl ?? null;

  // ログイン中のユーザーを取得し、サポートする側・依頼した側のどちらでも現在のマッチングを特定する
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);

      const { data: supporterMatching, error: supporterMatchingError } =
        await supabase
          .from("matchings")
          .select("id")
          .eq("supporter_id", user.id)
          .eq("status", "active")
          .limit(1);

      if (supporterMatchingError) {
        console.error(
          "supporter matching error:",
          supporterMatchingError.message,
        );
        return;
      }

      if (supporterMatching && supporterMatching.length > 0) {
        setMatchingId(supporterMatching[0].id);
        return;
      }

      const { data: requestData, error: requestError } = await supabase
        .from("support_requests")
        .select("id")
        .eq("user_id", user.id);

      if (requestError) {
        console.error("support request error:", requestError.message);
        return;
      }

      //   if (!requestData || requestData.length === 0) return;

      const requestIds = requestData.map((request) => request.id);

      const { data: requesterMatching, error: requesterMatchingError } =
        await supabase
          .from("matchings")
          .select("id")
          .in("support_request_id", requestIds)
          .eq("status", "active")
          .limit(1);

      if (requesterMatchingError) {
        console.error(
          "requester matching error:",
          requesterMatchingError.message,
        );
        return;
      }

      if (requesterMatching && requesterMatching.length > 0) {
        setMatchingId(requesterMatching[0].id);
        return;
      }
    };

    getUser().finally(() => {
      setIsMatchingChecked(true);
    });
  }, []);

  // 過去を含むマッチングから会話相手ごとの履歴をまとめ、未読状態も含めて一覧を作成する
  useEffect(() => {
    const getConversations = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("matchings")
        .select("id")
        .eq("supporter_id", userId);

      if (error) {
        console.error("conversation fetch error:", error.message);
        return;
      }
      const { data: requestData, error: requestError } = await supabase
        .from("support_requests")
        .select("id")
        .eq("user_id", userId);

      if (requestError) {
        console.error("conversation request error:", requestError.message);
        return;
      }

      const requestIds = requestData?.map((request) => request.id) ?? [];
      let requesterMatchingIds: string[] = [];

      if (requestIds.length > 0) {
        const { data: requesterData, error: requesterError } = await supabase
          .from("matchings")
          .select("id")
          .in("support_request_id", requestIds);

        if (requesterError) {
          console.error(
            "requester conversation error:",
            requesterError.message,
          );
          return;
        }

        requesterMatchingIds =
          requesterData?.map((matching) => matching.id) ?? [];
      }

      const supporterMatchingIds = data?.map((matching) => matching.id) ?? [];

      const allMatchingIds = [
        ...new Set([...supporterMatchingIds, ...requesterMatchingIds]),
      ];

      if (allMatchingIds.length > 0) {
        const { data: matchingData, error: matchingDataError } = await supabase
          .from("matchings")
          .select("id, supporter_id, support_request_id, status, ended_at")
          .in("id", allMatchingIds);

        if (matchingDataError) {
          console.error(
            "conversation matching error:",
            matchingDataError.message,
          );
          return;
        }

        const { data: existingMessages, error: existingMessagesError } =
          await supabase
            .from("messages")
            .select("matching_id")
            .in("matching_id", allMatchingIds);

        if (existingMessagesError) {
          console.error(
            "conversation message check error:",
            existingMessagesError.message,
          );
          return;
        }

        const matchingIdsWithMessages = new Set(
          existingMessages?.map((message) => message.matching_id) ?? [],
        );

        const supportRequestIds =
          matchingData?.map((matching) => matching.support_request_id) ?? [];
        const { data: supportRequestData, error: supportRequestDataError } =
          await supabase
            .from("support_requests")
            .select("id, user_id")
            .in("id", supportRequestIds);

        if (supportRequestDataError) {
          console.error(
            "conversation support request error:",
            supportRequestDataError.message,
          );
          return;
        }
        const userIds = [
          ...(matchingData?.map((matching) => matching.supporter_id) ?? []),
          ...(supportRequestData?.map((request) => request.user_id) ?? []),
        ];
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, nickname, avatar_url")
          .in("id", userIds);

        if (profileError) {
          console.error("conversation profile error:", profileError.message);
          return;
        }

        const conversationMap = new Map<
          string,
          {
            userId: string;
            nickname: string;
            avatarUrl: string | null;
            matchingIds: string[];
            hasUnread: boolean;
          }
        >();

        const now = Date.now();

        const visibleMatchingData =
          matchingData?.filter((matching) => {
            const hasMessages = matchingIdsWithMessages.has(matching.id);

            const isWithinGracePeriod =
              matching.status === "ended" &&
              matching.ended_at &&
              now - new Date(matching.ended_at).getTime() < 60 * 60 * 1000;

            return (
              matching.status === "active" || isWithinGracePeriod || hasMessages
            );
          }) ?? [];

        const sortedMatchingData = [...visibleMatchingData].sort((a, b) => {
          const getPriority = (
            matching: (typeof visibleMatchingData)[number],
          ) => {
            if (matching.status === "active") return 2;

            const isWithinGracePeriod =
              matching.status === "ended" &&
              matching.ended_at &&
              Date.now() - new Date(matching.ended_at).getTime() <
                60 * 60 * 1000;

            if (isWithinGracePeriod) return 1;

            return 0;
          };

          return getPriority(b) - getPriority(a);
        });

        sortedMatchingData.forEach((matching) => {
          const requester = supportRequestData?.find(
            (request) => request.id === matching.support_request_id,
          );

          const otherUserId =
            matching.supporter_id === userId
              ? requester?.user_id
              : matching.supporter_id;

          if (!otherUserId) return;

          const profile = profileData?.find(
            (profile) => profile.id === otherUserId,
          );

          const existingConversation = conversationMap.get(otherUserId);

          if (existingConversation) {
            existingConversation.matchingIds.push(matching.id);
          } else {
            conversationMap.set(otherUserId, {
              userId: otherUserId,
              nickname: profile?.nickname ?? "名前なし",
              avatarUrl: profile?.avatar_url ?? null,
              matchingIds: [matching.id],
              hasUnread: false,
            });
          }
        });

        if (allMatchingIds.length > 0) {
          const { data: unreadMessages, error: unreadError } = await supabase
            .from("messages")
            .select("matching_id")
            .in("matching_id", allMatchingIds)
            .neq("sender_id", userId)
            .is("read_at", null);

          if (unreadError) {
            console.error("unread message error:", unreadError.message);
            return;
          }

          const unreadMatchingIds = new Set(
            unreadMessages?.map((message) => message.matching_id) ?? [],
          );

          conversationMap.forEach((conversation) => {
            conversation.hasUnread = conversation.matchingIds.some((id) =>
              unreadMatchingIds.has(id),
            );
          });
        }

        setConversationNames(Array.from(conversationMap.values()));
      }
    };

    getConversations();
  }, [userId]);

  // マッチング中、または終了後1時間以内かを確認してメッセージ送信可否を決める
  useEffect(() => {
    const checkCanSendMessage = async () => {
      if (!matchingId) {
        setCanSendMessage(false);
        setIsWithinMessageGracePeriod(false);
        return;
      }

      const { data, error } = await supabase
        .from("matchings")
        .select("status, ended_at")
        .eq("id", matchingId)
        .single();

      if (error) {
        console.error("matching status error:", error.message);
        setCanSendMessage(false);
        return;
      }

      if (data.status === "active") {
        setCanSendMessage(true);
        setIsWithinMessageGracePeriod(false);
        return;
      }

      if (data.status === "ended" && data.ended_at) {
        const endedTime = new Date(data.ended_at).getTime();
        const isWithinGracePeriod = Date.now() - endedTime < 60 * 60 * 1000;

        const messageDeadline = new Date(endedTime + 60 * 60 * 1000);
        setMessageAvailableUntil(messageDeadline.toISOString());

        setCanSendMessage(isWithinGracePeriod);
        setIsWithinMessageGracePeriod(isWithinGracePeriod);
        return;
      }

      setCanSendMessage(false);
      setIsWithinMessageGracePeriod(false);
    };

    checkCanSendMessage();
  }, [matchingId]);

  // 選択中の相手との過去のマッチングをまとめて取得し、会話履歴を時系列で表示する
  useEffect(() => {
    const getMessages = async () => {
      if (!matchingId) return;

      const selectedConversation = conversationNames.find((conversation) =>
        conversation.matchingIds.includes(matchingId),
      );

      const targetMatchingIds = selectedConversation?.matchingIds ?? [
        matchingId,
      ];

      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at, read_at")
        .in("matching_id", targetMatchingIds)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("message fetch error:", error.message);
        return;
      }

      setMessages(data ?? []);
    };

    getMessages();
  }, [matchingId, conversationNames]);

  // 新着メッセージと既読更新をリアルタイムで受け取り、表示へ即時反映する
  useEffect(() => {
    if (!userId || !matchingId) return;
    const channel = supabase
      .channel("message-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `matching_id=eq.${matchingId}`,
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            sender_id: string;
            matching_id: string;
            content: string;
            created_at: string;
            read_at: string | null;
          };

          if (newMessage.sender_id === userId) return;

          setMessages((prevMessages) => {
            if (prevMessages.some((message) => message.id === newMessage.id)) {
              return prevMessages;
            }

            return [...prevMessages, newMessage];
          });

          await supabase
            .from("messages")
            .update({
              read_at: new Date().toISOString(),
            })
            .eq("id", newMessage.id)
            .is("read_at", null);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `matching_id=eq.${matchingId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as {
            id: string;
            read_at: string | null;
          };

          setMessages((prevMessages) =>
            prevMessages.map((message) =>
              message.id === updatedMessage.id
                ? { ...message, read_at: updatedMessage.read_at }
                : message,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchingId, userId]);
  // 開いた会話の相手から届いた未読メッセージを既読にし、通知状態も更新する
  useEffect(() => {
    if (!matchingId || !userId) return;

    const selectedConversation = conversationNames.find((conversation) =>
      conversation.matchingIds.includes(matchingId),
    );

    if (!selectedConversation || !selectedConversation.hasUnread) return;

    const markMessagesAsRead = async () => {
      const { error } = await supabase
        .from("messages")
        .update({
          read_at: new Date().toISOString(),
        })
        .in("matching_id", selectedConversation.matchingIds)
        .neq("sender_id", userId)
        .is("read_at", null);

      if (error) {
        console.error("message read error:", error.message);
        return;
      }

      setConversationNames((prev) =>
        prev.map((conversation) =>
          conversation.userId === selectedConversation.userId
            ? { ...conversation, hasUnread: false }
            : conversation,
        ),
      );
      window.dispatchEvent(new Event("message-notification-read"));
    };

    markMessagesAsRead();
  }, [matchingId, userId, conversationNames]);

  // 入力内容を現在のマッチングに紐づけて送信し、送信後に入力欄をリセットする
  const handleSend = async () => {
    if (!canSendMessage) return;
    if (!userId || !matchingId || !content.trim()) return;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        matching_id: matchingId,
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .select("id, sender_id, content, created_at, read_at")
      .single();

    if (error) {
      console.error("message send error:", error.message);
      return;
    }

    if (data) {
      setMessages((prevMessages) => [...prevMessages, data]);
    }

    setContent("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <main className="page-background flex h-[calc(100dvh-94px)] flex-col overflow-hidden">
      <HamburgerMenu />
      <div className="mx-auto w-full max-w-4xl px-6">
        <h1 className="page-title">メッセージ</h1>
      </div>
      {isMatchingChecked && !showHistory && !matchingId && (
        <div className="mx-auto w-full max-w-4xl px-6 pt-6">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="flex w-full max-w-[240px] items-center justify-between rounded-full bg-[#d9a3a3] px-4 py-1.5 text-sm font-medium text-white"
          >
            <span className="flex items-center">
              メッセージ一覧
              {conversationNames.some(
                (conversation) => conversation.hasUnread,
              ) && <span className="ml-2 h-2 w-2 rounded-full bg-[#c96f6f]" />}
            </span>

            <span className="text-xl">›</span>
          </button>
        </div>
      )}
      {showHistory && (
        <div className="mx-auto min-h-0 w-full max-w-4xl flex-1 overflow-y-auto px-6 py-2">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => {
                setShowHistory(false);
                setMatchingId(null);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-[#c98f98]"
              aria-label="メッセージ画面に戻る"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                <path
                  d="M15 5L8 12L15 19"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="flex flex-col gap-3">
              {conversationNames.map((conversation) => (
                <button
                  key={conversation.userId}
                  type="button"
                  className="w-fit text-left"
                  onClick={async () => {
                    setMessages([]);
                    setMatchingId(conversation.matchingIds[0]);
                    setShowHistory(false);

                    if (!userId) return;

                    const { error } = await supabase
                      .from("messages")
                      .update({
                        read_at: new Date().toISOString(),
                      })
                      .in("matching_id", conversation.matchingIds)
                      .neq("sender_id", userId)
                      .is("read_at", null);

                    if (error) {
                      console.error("message read error:", error.message);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {conversation.avatarUrl ? (
                      <Image
                        src={conversation.avatarUrl}
                        alt={`${conversation.nickname}のプロフィール画像`}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9a3a3] text-sm font-medium text-white">
                        {conversation.nickname.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span>{conversation.nickname}</span>
                    {conversation.hasUnread && (
                      <span className="ml-1.5 h-2 w-2 rounded-full bg-[#c96f6f]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!showHistory && matchingId && (
        <>
          {selectedNickname && (
            <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-6 py-2">
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center text-[#c98f98]"
                aria-label="履歴一覧に戻る"
              >
                <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                  <path
                    d="M15 5L8 12L15 19"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {selectedAvatarUrl ? (
                <Image
                  src={selectedAvatarUrl}
                  alt={`${selectedNickname}のプロフィール画像`}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d9a3a3] text-lg font-medium text-white">
                  {selectedNickname.charAt(0).toUpperCase()}
                </div>
              )}

              <p className="min-w-0 flex-1 truncate whitespace-nowrap text-stone-600">
                {selectedNickname}
              </p>
            </div>
          )}
          {isWithinMessageGracePeriod && messageAvailableUntil && (
            <div className="mx-auto w-full max-w-4xl px-6">
              <p className="mt-1 text-xs leading-5 text-stone-500">
                この相手とのメッセージは
                <br />
                {new Date(messageAvailableUntil).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                まで利用できます
              </p>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl px-6">
              {messages.map((message, index) => {
                const currentDate = new Date(
                  message.created_at,
                ).toLocaleDateString("ja-JP");

                const previousDate =
                  index > 0
                    ? new Date(
                        messages[index - 1].created_at,
                      ).toLocaleDateString("ja-JP")
                    : null;

                const showDate = currentDate !== previousDate;

                const messageTime = new Date(
                  message.created_at,
                ).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const isOwnMessage = message.sender_id === userId;

                return (
                  <div key={message.id}>
                    {showDate && (
                      <p className="my-4 text-center text-sm text-stone-500">
                        {currentDate}
                      </p>
                    )}

                    <div
                      className={`mb-3 flex ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="mr-2 flex items-start gap-2">
                          <div className="flex shrink-0 flex-col items-center">
                            {selectedAvatarUrl ? (
                              <Image
                                src={selectedAvatarUrl}
                                alt={`${selectedNickname ?? "相手"}のプロフィール画像`}
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9a3a3] text-sm font-medium text-white">
                                {selectedNickname?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="max-w-xs break-words rounded-2xl bg-[#ead6d2] px-4 py-2">
                              <p className="whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </div>

                            <small className="text-stone-400">
                              {messageTime}
                            </small>
                          </div>
                        </div>
                      )}

                      {isOwnMessage && (
                        <div className="flex max-w-[70vw] flex-col items-end">
                          <div className="max-w-xs break-words rounded-2xl bg-[#d4c2bb] px-4 py-2">
                            <p className="whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>

                          <small className="text-stone-400">
                            {message.read_at && "既読 "}
                            {messageTime}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {canSendMessage && (
            <div className="mx-auto flex w-full max-w-2xl items-end gap-2 px-4 py-3">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);

                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                placeholder="メッセージを入力"
                rows={1}
                className="min-h-10 max-h-[120px] flex-1 resize-none overflow-y-auto rounded-xl border border-stone-300 bg-white px-3 py-2"
              />

              <button
                type="button"
                onClick={handleSend}
                className="shrink-0 rounded-xl bg-[#d9a3a3] px-4 py-2 font-medium text-white"
              >
                送信
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
