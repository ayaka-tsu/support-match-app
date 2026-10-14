import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "この操作はアプリの退会確認画面から行ってください。" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();

    if (body?.confirm !== true) {
      return NextResponse.json(
        { error: "退会の確認が必要です。" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "退会の確認が必要です。" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "ログイン状態を確認できません。ログインし直してください。" },
        { status: 401 },
      );
    }

    const admin = createAdminClient();

    // 本人のフォルダに残っている画像を、100件ずつ削除する
    while (true) {
      const { data: images, error: listError } = await admin.storage
        .from("avatars")
        .list(user.id, {
          limit: 100,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

      if (listError) {
        console.error("withdraw avatar list error:", listError.message);

        return NextResponse.json(
          { error: "画像の確認に失敗しました。退会は完了していません。" },
          { status: 500 },
        );
      }

      if (!images || images.length === 0) {
        break;
      }

      // このアプリの画像はユーザーID直下のファイルとして保存される
      if (images.some((image) => !image.id)) {
        return NextResponse.json(
          {
            error:
              "画像の保存形式を確認できませんでした。退会は完了していません。",
          },
          { status: 500 },
        );
      }

      const paths = images.map((image) => `${user.id}/${image.name}`);

      const { error: removeError } = await admin.storage
        .from("avatars")
        .remove(paths);

      if (removeError) {
        console.error("withdraw avatar remove error:", removeError.message);

        return NextResponse.json(
          {
            error:
              "画像の削除に失敗しました。退会は完了していません。時間をおいて再度お試しください。",
          },
          { status: 500 },
        );
      }
    }

    // 削除対象は、画面から渡されたIDではなくログイン中の本人
    const { error: deleteError } = await admin.auth.admin.deleteUser(
      user.id,
      false,
    );

    if (deleteError) {
      console.error("withdraw account delete error:", deleteError.message);

      return NextResponse.json(
        {
          error:
            "退会を完了できませんでした。画像は削除済みの場合があります。時間をおいて再度お試しください。",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("withdraw error:", error);

    return NextResponse.json(
      { error: "退会処理に失敗しました。退会の完了を確認できていません。" },
      { status: 500 },
    );
  }
}
