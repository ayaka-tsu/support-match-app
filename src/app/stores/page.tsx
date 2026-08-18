import HamburgerMenu from "@/components/HamburgerMenu";
import { createClient } from "@/lib/supabase/server";

export default async function StoresPage() {
  const supabase = await createClient();
  const { data: stores, error } = await supabase
    .from("stores")
    .select("id, name");
  if (error) {
    console.error(error);
  }
  return (
    <main>
      <HamburgerMenu />
      <h1>店舗選択</h1>
      {stores?.map((store) => (
        <div key={store.id}>{store.name}</div>
      ))}
    </main>
  );
}
