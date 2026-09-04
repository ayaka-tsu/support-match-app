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
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <HamburgerMenu />

      <div className="mx-auto w-full max-w-2xl">
        <h1 className="page-title">店舗</h1>

        <div className="mt-6">
          <StoresList stores={stores ?? []} />
        </div>
      </div>
    </main>
  );
}
