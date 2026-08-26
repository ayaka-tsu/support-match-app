"use client";

import { useEffect, useState } from "react";
// import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import HamburgerMenu from "@/components/HamburgerMenu";

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
    { matchingId: string; nickname: string }[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);

  const selectedNickname =
    conversationNames.find(
      (conversation) => conversation.matchingId === matchingId,
    )?.nickname ?? null;

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
          .select("id, nickname")
          .in("id", userIds);

        if (profileError) {
          console.error("conversation profile error:", profileError.message);
          return;
        }
        const names =
          matchingData?.map((matching) => {
            const requester = supportRequestData?.find(
              (request) => request.id === matching.support_request_id,
            );

            const otherUserId =
              matching.supporter_id === userId
                ? requester?.user_id
                : matching.supporter_id;

            const profile = profileData?.find(
              (profile) => profile.id === otherUserId,
            );

            return {
              matchingId: matching.id,
              nickname: profile?.nickname ?? "名前なし",
            };
          }) ?? [];

        setConversationNames(names);
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

      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("matching_id", matchingId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("message fetch error:", error.message);
        return;
      }

      setMessages(data ?? []);
    };

    getMessages();
  }, [matchingId]);

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

      <button type="button" onClick={() => setShowHistory((prev) => !prev)}>
        履歴
      </button>

      {showHistory && (
        <div>
          {conversationNames.map((conversation) => (
            <button
              key={conversation.matchingId}
              type="button"
              onClick={() => {
                setMatchingId(conversation.matchingId);
                setShowHistory(false);
              }}
            >
              {conversation.nickname}
            </button>
          ))}
        </div>
      )}

      {selectedNickname && <p>{selectedNickname}</p>}

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
        {messages.map((message) => (
          <p key={message.id}>{message.content}</p>
        ))}
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
