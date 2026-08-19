import HamburgerMenu from "@/components/HamburgerMenu";
import StoresList from "@/components/StoresList";
import { createClient } from "@/lib/supabase/server";

export default async function StoresPage() {
  const supabase = await createClient();
  const { data: stores, error } = await supabase
    .from("stores")
    .select("id, name, address");
  if (error) {
    console.error("stores error:", error.message);
  }
  return (
    <main>
      <HamburgerMenu />
      <h1>店舗選択</h1>
      <StoresList stores={stores ?? []} />
    </main>
  );
}
