"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type VoceMenu = {
href: string;
label: string;
icona: string;
gruppo: string;
};

export function MobileNavigation({ voci }: { voci: VoceMenu[] }) {
const pathname = usePathname();
const [aperto, setAperto] = useState(false);

const attiva = (href: string) =>
href === "/protected"
? pathname === href
: pathname === href || pathname.startsWith(`${href}/`);

return ( <div className="relative">
<button
type="button"
aria-expanded={aperto}
aria-controls="mobile-menu"
onClick={() => setAperto((precedente) => !precedente)}
className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[#EADDCF] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#49372F] shadow-sm transition hover:bg-[#FFFCF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96F52]/50"
> <span className="flex items-center gap-2.5"> <svg
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         strokeWidth="1.8"
         className="h-5 w-5 text-[#A75B43]"
         aria-hidden="true"
       > <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /> </svg>
Navigazione </span>


    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`h-4 w-4 transition-transform ${aperto ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>

  {aperto && (
    <nav
      id="mobile-menu"
      aria-label="Navigazione mobile"
      className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[65vh] overflow-y-auto rounded-2xl border border-[#EADDCF] bg-[#FFFCF8] p-2 shadow-xl"
    >
      {voci.map((voce, indice) => {
        const separatore =
          voce.gruppo === "amministrazione" &&
          (indice === 0 || voci[indice - 1]?.gruppo !== "amministrazione");

        return (
          <div key={voce.href}>
            {separatore && (
              <p className="mb-1 mt-3 border-t border-[#EFE4D9] px-3 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A9988A]">
                Amministrazione
              </p>
            )}

            <Link
              href={voce.href}
              onClick={() => setAperto(false)}
              aria-current={attiva(voce.href) ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                attiva(voce.href)
                  ? "bg-[#F9E8DC] text-[#9E533C]"
                  : "text-[#78675D] hover:bg-[#F7EEE5] hover:text-[#49372F]"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 text-base">
                {voce.icona}
              </span>
              {voce.label}
              {attiva(voce.href) && (
                <span className="ml-auto h-2 w-2 rounded-full bg-[#C96F52]" />
              )}
            </Link>
          </div>
        );
      })}
    </nav>
  )}
</div>


);
}
