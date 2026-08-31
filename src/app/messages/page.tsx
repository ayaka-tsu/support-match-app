"use client";

import { useEffect, useState } from "react";
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

    getUser();
  }, [matchingId]);

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
          .select("id, supporter_id, support_request_id")
          .in("id", allMatchingIds);

        if (matchingDataError) {
          console.error(
            "conversation matching error:",
            matchingDataError.message,
          );
          return;
        }
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

        matchingData?.forEach((matching) => {
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
        .select("id, sender_id, content, created_at")
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
      .select("id, sender_id, content, created_at")
      .single();

    if (error) {
      console.error("message send error:", error.message);
      return;
    }

    if (data) {
      setMessages((prevMessages) => [...prevMessages, data]);
    }

    setContent("");
  };

  return (
    <main>
      <HamburgerMenu />
      <h1>メッセージ</h1>

      <button
        type="button"
        onClick={() => setShowHistory((prev) => !prev)}
        style={{ position: "relative" }}
      >
        履歴
        {conversationNames.some((conversation) => conversation.hasUnread) && (
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              marginLeft: "6px",
              borderRadius: "50%",
              backgroundColor: "red",
            }}
          />
        )}
      </button>

      {showHistory && (
        <div>
          {conversationNames.map((conversation) => (
            <button
              key={conversation.userId}
              type="button"
              onClick={async () => {
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
                  <span
                    style={{
                      display: "inline-block",
                      width: "8px",
                      height: "8px",
                      marginLeft: "6px",
                      borderRadius: "50%",
                      backgroundColor: "red",
                    }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedNickname && (
        <div className="flex items-center gap-3">
          {selectedAvatarUrl ? (
            <Image
              src={selectedAvatarUrl}
              alt={`${selectedNickname}のプロフィール画像`}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9a3a3] text-lg font-medium text-white">
              {selectedNickname.charAt(0).toUpperCase()}
            </div>
          )}

          <p>{selectedNickname}</p>
        </div>
      )}

      {isWithinMessageGracePeriod && messageAvailableUntil && (
        <p>
          この相手とのメッセージは
          {new Date(messageAvailableUntil).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          まで利用できます
        </p>
      )}

      <div>
        {messages.map((message, index) => {
          const currentDate = new Date(message.created_at).toLocaleDateString(
            "ja-JP",
          );

          const previousDate =
            index > 0
              ? new Date(messages[index - 1].created_at).toLocaleDateString(
                  "ja-JP",
                )
              : null;

          const showDate = currentDate !== previousDate;

          const messageTime = new Date(message.created_at).toLocaleTimeString(
            "ja-JP",
            {
              hour: "2-digit",
              minute: "2-digit",
            },
          );

          return (
            <div key={message.id}>
              {showDate && <p>{currentDate}</p>}
              <p>{message.content}</p>
              <small>{messageTime}</small>
            </div>
          );
        })}
      </div>

      {canSendMessage && (
        <>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="メッセージを入力"
          />

          <button type="button" onClick={handleSend}>
            送信
          </button>
        </>
      )}
    </main>
  );
}
