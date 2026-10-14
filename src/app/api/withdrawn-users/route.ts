import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 },
      );
    }

    // 本人が閲覧できるマッチングを既存のRLSで取得する
    const { data: matchings, error: matchingError } = await supabase
      .from("matchings")
      .select("supporter_id, support_request_id");

    if (matchingError) {
      throw matchingError;
    }

    const requestIds = [
      ...new Set(
        (matchings ?? []).map((matching) => matching.support_request_id),
      ),
    ];

    const participantIds = new Set<string>();

    for (const matching of matchings ?? []) {
      participantIds.add(matching.supporter_id);
    }

    if (requestIds.length > 0) {
      const { data: requests, error: requestError } = await supabase
        .from("support_requests")
        .select("user_id")
        .in("id", requestIds);

      if (requestError) {
        throw requestError;
      }

      for (const request of requests ?? []) {
        participantIds.add(request.user_id);
      }
    }

    participantIds.delete(user.id);

    if (participantIds.size === 0) {
      return NextResponse.json(
        { withdrawnUserIds: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    // 会話相手の退会状態のみをサーバー側で確認する
    const admin = createAdminClient();

    const { data: withdrawnUsers, error: withdrawnError } = await admin
      .from("withdrawn_users")
      .select("user_id")
      .in("user_id", [...participantIds]);

    if (withdrawnError) {
      throw withdrawnError;
    }

    return NextResponse.json(
      {
        withdrawnUserIds: (withdrawnUsers ?? []).map(
          (withdrawnUser) => withdrawnUser.user_id,
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("withdrawn user check error:", error);

    return NextResponse.json(
      { error: "退会状態を確認できませんでした" },
      { status: 500 },
    );
  }
}
