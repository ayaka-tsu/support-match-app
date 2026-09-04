import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HamburgerMenu from "@/components/HamburgerMenu";
import Image from "next/image";
import SupportAvailableToggle from "@/components/SupportAvailableToggle";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, avatar_url, support_available")
    .eq("id", user.id)
    .maybeSingle();
  const { data: supporterMatching } = await supabase
    .from("matchings")
    .select("id")
    .eq("supporter_id", user.id)
    .eq("status", "active");

  const { data: userRequests } = await supabase
    .from("support_requests")
    .select("id")
    .eq("user_id", user.id);

  const requestIds = userRequests?.map((request) => request.id) ?? [];

  let hasRequesterMatching = false;

  if (requestIds.length > 0) {
    const { data: requesterMatching } = await supabase
      .from("matchings")
      .select("id")
      .in("support_request_id", requestIds)
      .eq("status", "active");

    hasRequesterMatching =
      requesterMatching !== null && requesterMatching.length > 0;
  }

  const isMatching =
    (supporterMatching !== null && supporterMatching.length > 0) ||
    hasRequesterMatching;
  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-5 pb-10 pt-2 sm:px-6 sm:pt-4">
      <HamburgerMenu />

      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <Link
            href="/profile"
            className="button-interaction flex min-w-0 flex-col items-center"
          >
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="プロフィール画像"
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d9a3a3] text-xl font-medium text-white">
                {profile?.nickname
                  ? profile.nickname.charAt(0).toUpperCase()
                  : "?"}
              </div>
            )}

            <p className="mt-1 max-w-24 truncate text-center text-sm text-stone-600">
              {profile?.nickname ?? ""}
            </p>
          </Link>

          <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
            <p className="text-sm text-stone-500">
              {isMatching ? "マッチング中" : "マッチングなし"}
            </p>

            {profile && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-stone-600">サポート</span>

                <SupportAvailableToggle
                  userId={user.id}
                  initialSupportAvailable={profile.support_available}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Image
            src="/top-hero.png"
            alt="カフェで過ごす親子とサポートする人のイメージ"
            width={800}
            height={500}
            className="w-24 shrink-0 rounded-2xl object-cover sm:w-28"
          />

          <Link
            href="/concept"
            className="button-interaction flex min-w-0 flex-1 items-center justify-between rounded-3xl bg-[#f9eaea] p-5 shadow-sm"
          >
            <div className="min-w-0">
              <p className="font-medium text-stone-700">コンセプトを見る</p>

              <p className="mt-1 text-sm leading-6 text-stone-500">
                「見てて」に込めた想いや使い方
              </p>
            </div>

            <span className="ml-3 shrink-0 text-2xl text-rose-300">›</span>
          </Link>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-4">
          <Link
            href="/stores"
            className="button-interaction flex items-center justify-between rounded-full bg-[#d9a3a3] px-6 py-3.5 font-medium text-white"
          >
            <span>店舗</span>
            <span>›</span>
          </Link>

          <Link
            href="/support-request"
            className="button-interaction flex items-center justify-between rounded-full bg-[#d9a3a3] px-6 py-3.5 font-medium text-white"
          >
            <span>サポート依頼</span>
            <span>›</span>
          </Link>

          <Link
            href="/messages"
            className="button-interaction flex items-center justify-between rounded-full bg-[#d9a3a3] px-6 py-3.5 font-medium text-white"
          >
            <span>メッセージ</span>
            <span>›</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
