import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HamburgerMenu from "@/components/HamburgerMenu";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

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
    <main>
      <HamburgerMenu />

      <h1>ログインした人のトップページ</h1>
      <p>{isMatching ? "マッチング中" : "マッチングなし"}</p>
    </main>
  );
}
