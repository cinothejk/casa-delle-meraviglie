
export function LoadingOverlay({
  messaggio = "Stiamo preparando il tuo spazio personale.",
}: {
  messaggio?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#34261F]/65 p-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Caricamento in corso"
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl border border-[#EADDCF] bg-[#FFF8EF] px-8 py-8 text-center shadow-2xl">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#F5D1BC] border-t-[#C96F52]" />

        <h2 className="text-lg font-bold text-[#49372F]">
          Caricamento in corso...
        </h2>

        <p className="text-sm text-[#78675D]">
          {messaggio}
        </p>
      </div>
    </div>
  );
}
