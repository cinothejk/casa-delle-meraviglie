export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { MobileNavigation } from "@/components/mobile-navigation";
import Link from "next/link";

export default async function ProtectedLayout({
children,
}: {
children: React.ReactNode;
}) {
const supabase = await createClient();

const {
data: { user },
} = await supabase.auth.getUser();

if (!user) {
return null;
}

const { data: profile } = await supabase
.from("profiles")
.select("nome, cognome, username, ruolo")
.eq("id", user.id)
.single();

const ruolo = profile?.ruolo ?? "socio";

const nomeCompleto = [profile?.nome, profile?.cognome]
.filter(Boolean)
.join(" ");

const nomeVisualizzato =
nomeCompleto || profile?.username || user.email || "Utente";

const vociMenu = [
{ href: "/protected", label: "Dashboard", icona: "⌂", gruppo: "generale" },
...(ruolo === "superadmin" || ruolo === "direzione"
? [
{ href: "/protected/soci", label: "Soci", icona: "♧", gruppo: "gestione" },
{ href: "/protected/famiglie", label: "Famiglie", icona: "⌂", gruppo: "gestione" },
{ href: "/protected/cerchi", label: "Cerchi", icona: "◉", gruppo: "gestione" },
]
: []),
{ href: "/protected/attivita", label: "Attività", icona: "✳", gruppo: "generale" },
...(ruolo === "socio"
? [
{
href: "/protected/mia-situazione",
label: "La mia situazione",
icona: "↗",
gruppo: "generale",
},
]
: []),
...(ruolo === "superadmin" || ruolo === "direzione"
? [
{ href: "/protected/report", label: "Report mensili", icona: "▤", gruppo: "generale" },
]
: []),
...(ruolo === "superadmin"
? [
{ href: "/protected/impostazioni", label: "Impostazioni", icona: "⚙", gruppo: "amministrazione" },
{ href: "/protected/utenti", label: "Utenti", icona: "♧", gruppo: "amministrazione" },
{ href: "/protected/importazioni/famiglie", label: "Importa famiglie", icona: "↓", gruppo: "amministrazione" },
{ href: "/protected/importazioni/soci", label: "Importa soci", icona: "↓", gruppo: "amministrazione" },
{ href: "/protected/audit", label: "Audit log", icona: "≡", gruppo: "amministrazione" },
{ href: "/protected/pulizia-dati", label: "Pulizia dati", icona: "⌫", gruppo: "amministrazione" },
]
: []),
];

return ( <main className="min-h-screen bg-[#FFF8EF] text-[#49372F]"> <div className="flex min-h-screen">
{/* Sidebar desktop */} <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#EADDCF] bg-[#FFFCF8] lg:flex xl:w-72"> <div className="border-b border-[#EFE4D9] px-5 py-6 xl:px-6"> <Link href="/protected" className="group flex items-center gap-3"> <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#C96F52] text-white shadow-md shadow-[#C96F52]/20 transition group-hover:-rotate-3"> <svg
               viewBox="0 0 48 48"
               fill="none"
               stroke="currentColor"
               strokeWidth="2.5"
               strokeLinecap="round"
               strokeLinejoin="round"
               className="h-8 w-8"
               aria-hidden="true"
             > <path d="M8 22L24 9L40 22V39H28V28H20V39H8V22Z" /> <path d="M17 17V10H23" /> <path d="M32 8V14M29 11H35" /> </svg> </div>


          <div className="min-w-0">
            <div className="text-sm font-bold leading-5 text-[#49372F] xl:text-base">
              Casa delle
              <br />
              Meraviglie
            </div>
            <div className="mt-1 text-xs text-[#8B796D]">
              La comunità cresce insieme
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 xl:px-4" aria-label="Navigazione principale">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A9988A]">
          Il tuo spazio
        </p>

        <div className="space-y-1">
          {vociMenu
            .filter((voce) => voce.gruppo !== "amministrazione")
            .map((voce) => (
              <MenuLink key={voce.href} {...voce} />
            ))}
        </div>

        {ruolo === "superadmin" && (
          <div className="mt-7">
            <div className="mb-2 border-t border-[#EFE4D9]" />
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A9988A]">
              Amministrazione
            </p>

            <div className="space-y-1">
              {vociMenu
                .filter((voce) => voce.gruppo === "amministrazione")
                .map((voce) => (
                  <MenuLink key={voce.href} {...voce} />
                ))}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-[#EFE4D9] p-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[#F7EEE5] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCE5D4] text-sm font-bold text-[#58734F]">
            {nomeVisualizzato.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#49372F]">
              {nomeVisualizzato}
            </p>
            <p className="mt-0.5 text-xs text-[#8B796D]">
              {getRoleLabel(ruolo)}
            </p>
          </div>
        </div>

        <ThemeSwitcher />
      </div>
    </aside>

    {/* Contenuto e intestazione */}
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-[#EADDCF] bg-[#FFF8EF]/95 backdrop-blur-md">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C96F52] text-white lg:hidden">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path d="M8 22L24 9L40 22V39H28V28H20V39H8V22Z" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#49372F] sm:text-base">
                <span className="lg:hidden">Casa delle Meraviglie</span>
                <span className="hidden lg:inline">
                  {getRoleLabel(ruolo)}
                </span>
              </p>
              <p className="truncate text-xs text-[#8B796D] lg:hidden">
                {getRoleLabel(ruolo)}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden min-w-0 text-right sm:block lg:hidden">
              <p
                className="max-w-[clamp(5rem,20vw,10rem)] truncate text-sm font-semibold text-[#49372F]"
                title={nomeVisualizzato}
              >
                {nomeVisualizzato}
              </p>
            </div>
            <div className="shrink-0">
              <AuthButton />
            </div>
          </div>

        </div>

        {/* Navigazione mobile e tablet */}
        <div className="border-t border-[#EFE4D9] px-3 py-2 lg:hidden sm:px-6">
          <MobileNavigation voci={vociMenu} />
        </div>
      </header>

      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </div>
    </div>
  </div>
</main>


);
}

function MenuLink({
href,
label,
icona,
}: {
href: string;
label: string;
icona: string;
gruppo?: string;
}) {
return ( <Link
   href={href}
   className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#78675D] transition hover:bg-[#F9E8DC] hover:text-[#9E533C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96F52]/50"
 > <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7EEE5] text-base text-[#A75B43] transition group-hover:bg-white">
{icona} </span> <span>{label}</span> </Link>
);
}

function getRoleLabel(ruolo: string) {
switch (ruolo) {
case "superadmin":
return "Amministrazione · SuperAdmin";
case "direzione":
return "Direzione";
case "socio":
return "Area Socio";
default:
return "Casa delle Meraviglie";
}
}
