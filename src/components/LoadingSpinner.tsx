export default function LoadingSpinner() {
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center gap-3"
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#ead6d6] border-t-[#b99191] motion-reduce:animate-none"
      />

      <p className="text-sm text-stone-500">読み込み中…</p>
    </div>
  );
}
