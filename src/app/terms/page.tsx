import HamburgerMenu from "@/components/HamburgerMenu";

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-end">
          <HamburgerMenu />
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-medium text-stone-700">利用規約</h1>

          <p className="mt-4 text-sm leading-7 text-stone-500">
            利用規約は現在準備中です。
          </p>
        </section>
      </div>
    </main>
  );
}
