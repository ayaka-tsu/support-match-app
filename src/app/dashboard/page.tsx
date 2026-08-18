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
  return (
    <main>
      <HamburgerMenu />

      <h1>ログインした人のトップページ</h1>
    </main>
  );
}
