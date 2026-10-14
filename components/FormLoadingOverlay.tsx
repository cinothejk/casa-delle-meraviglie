
"use client";

import { useFormStatus } from "react-dom";

export default function FormLoadingOverlay() {
  const { pending } = useFormStatus();

  if (!pending) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#34261F]/60 p-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Operazione in corso"
    >
      <div className="flex min-w-56 flex-col items-center gap-4 rounded-2xl border border-[#EDE1D6] bg-[#FFF8EF] px-8 py-7 shadow-2xl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F5D1BC] border-t-[#C96F52]" />

        <p className="text-center font-semibold text-[#503C30]">
          Operazione in corso...
        </p>

        <p className="text-center text-sm text-[#857568]">
          Attendi qualche istante
        </p>
      </div>
    </div>
  );
}
