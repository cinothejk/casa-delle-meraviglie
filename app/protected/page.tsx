export const instant = false;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Ruolo = "superadmin" | "direzione" | "socio";

const ruoliItaliani: Record<Ruolo, string> = {
superadmin: "Super Amministratore",
direzione: "Direzione",
socio: "Socio/a",
};

export default async function ProtectedPage() {
const supabase = await createClient();

const {
data: { user },
} = await supabase.auth.getUser();

if (!user) {
redirect("/auth/login");
}

const { data: profile, error } = await supabase
.from("profiles")
.select("nome, cognome, username, ruolo")
.eq("id", user.id)
.single();

if (error || !profile) {
return ( <main className="flex min-h-screen items-center justify-center bg-[#FFF8EF] p-5"> <section className="w-full max-w-lg rounded-3xl border border-[#EADDCF] bg-white p-7 shadow-sm sm:p-9"> <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0EC] text-[#A75B43]"> <svg
           viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           strokeWidth="1.8"
           className="h-6 w-6"
           aria-hidden="true"
         > <circle cx="12" cy="12" r="9" /> <path d="M12 8v4m0 4h.01" strokeLinecap="round" /> </svg> </div>

      <h1 className="text-2xl font-bold text-[#49372F]">
        Profilo non trovato
      </h1>

      <p className="mt-3 text-sm leading-6 text-[#78675D]">
        L'accesso è riuscito, ma non è stato trovato il profilo
        associato al tuo account. Contatta un amministratore per
        ricevere assistenza.
      </p>
    </section>
  </main>
);


}

const ruolo = profile.ruolo as Ruolo;
const nomeCompleto = [profile.nome, profile.cognome]
.filter(Boolean)
.join(" ");

const nomeVisualizzato =
nomeCompleto || profile.username || user.email || "benvenuto";

const sezioni =
ruolo === "superadmin"
? [
{
titolo: "Soci",
descrizione: "Gestisci le persone della comunità.",
href: "/protected/soci",
simbolo: "persone",
colore: "bg-[#F9E8DC]",
testo: "text-[#A75B43]",
},
{
titolo: "Famiglie",
descrizione: "Organizza i nuclei familiari.",
href: "/protected/famiglie",
simbolo: "casa",
colore: "bg-[#E4EBDD]",
testo: "text-[#58734F]",
},
{
titolo: "Cerchi",
descrizione: "Gestisci gruppi e aree di attività.",
href: "/protected/cerchi",
simbolo: "cerchi",
colore: "bg-[#F8EBC6]",
testo: "text-[#8A6A22]",
},
{
titolo: "Attività",
descrizione: "Consulta e organizza le attività.",
href: "/protected/attivita",
simbolo: "attivita",
colore: "bg-[#F5D1BC]",
testo: "text-[#9E533C]",
},
{
titolo: "Report mensili",
descrizione: "Consulta ore e crediti delle famiglie.",
href: "/protected/report",
simbolo: "report",
colore: "bg-[#E7E2F3]",
testo: "text-[#6D5A93]",
},
{
titolo: "Impostazioni",
descrizione: "Configura regole e valori del sistema.",
href: "/protected/impostazioni",
simbolo: "impostazioni",
colore: "bg-[#E3EAF3]",
testo: "text-[#4E6888]",
},
{
titolo: "Audit log",
descrizione: "Consulta lo storico delle modifiche.",
href: "/protected/audit",
simbolo: "audit",
colore: "bg-[#F0E5DB]",
testo: "text-[#795B47]",
},
{
titolo: "Utenti",
descrizione: "Gestisci account e accessi.",
href: "/protected/utenti",
simbolo: "utenti",
colore: "bg-[#DDEFEA]",
testo: "text-[#397668]",
},
]
: ruolo === "direzione"
? [
{
titolo: "Soci",
descrizione: "Consulta e gestisci i soci.",
href: "/protected/soci",
simbolo: "persone",
colore: "bg-[#F9E8DC]",
testo: "text-[#A75B43]",
},
{
titolo: "Famiglie",
descrizione: "Gestisci le famiglie della comunità.",
href: "/protected/famiglie",
simbolo: "casa",
colore: "bg-[#E4EBDD]",
testo: "text-[#58734F]",
},
{
titolo: "Cerchi",
descrizione: "Organizza i gruppi di lavoro.",
href: "/protected/cerchi",
simbolo: "cerchi",
colore: "bg-[#F8EBC6]",
testo: "text-[#8A6A22]",
},
{
titolo: "Attività",
descrizione: "Assegna attività e verifica il lavoro.",
href: "/protected/attivita",
simbolo: "attivita",
colore: "bg-[#F5D1BC]",
testo: "text-[#9E533C]",
},
{
titolo: "Report mensili",
descrizione: "Consulta ore e crediti delle famiglie.",
href: "/protected/report",
simbolo: "report",
colore: "bg-[#E7E2F3]",
testo: "text-[#6D5A93]",
},
]
: [
{
titolo: "Attività",
descrizione: "Scopri le attività e candidati.",
href: "/protected/attivita",
simbolo: "attivita",
colore: "bg-[#F5D1BC]",
testo: "text-[#9E533C]",
},
{
titolo: "La mia situazione",
descrizione: "Consulta le tue ore e il credito familiare.",
href: "/protected/mia-situazione",
simbolo: "report",
colore: "bg-[#E4EBDD]",
testo: "text-[#58734F]",
},
];

return ( <main className="relative min-h-screen overflow-hidden bg-[#FFF8EF] px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
{/* Decorazioni dello sfondo */} <div
     aria-hidden="true"
     className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F5D1BC]/35 blur-3xl sm:h-96 sm:w-96"
   /> <div
     aria-hidden="true"
     className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#DCE5D4]/50 blur-3xl"
   />


  <div className="relative mx-auto max-w-7xl">
    {/* Intestazione di benvenuto */}
    <header className="mb-8 overflow-hidden rounded-[2rem] bg-[#49372F] shadow-[0_20px_55px_-25px_rgba(73,55,47,0.45)] sm:mb-10">
      <div className="relative px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-16 h-52 w-52 rounded-full border-[24px] border-white/[0.06] sm:right-12 sm:h-64 sm:w-64"
        />

        <div className="relative max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-medium text-[#F9E8DC]">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-[#D5E2C8]"
            />
            La tua comunità, il tuo spazio
          </div>

          <p className="text-sm font-medium text-[#E8C9B8]">
            CASA DELLE MERAVIGLIE
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Bentornato,
            <br className="sm:hidden" /> {nomeVisualizzato}!
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-[#F0E6DE] sm:text-base sm:leading-7">
            Ogni piccolo gesto contribuisce a far crescere la nostra
            comunità. Ecco gli strumenti a tua disposizione.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white ring-1 ring-white/10">
            <span className="text-[#E8C9B8]">Il tuo ruolo</span>
            <span aria-hidden="true" className="text-white/40">
              ·
            </span>
            <span className="font-semibold">
              {ruoliItaliani[ruolo] ?? ruolo}
            </span>
          </div>
        </div>
      </div>
    </header>

    {/* Accessi rapidi */}
    <section>
      <div className="mb-5 sm:mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A75B43]">
          Il tuo spazio
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#49372F] sm:text-3xl">
          Da dove vuoi iniziare?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#78675D] sm:text-base">
          Scegli una sezione per continuare.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sezioni.map((sezione) => (
          <Link
            key={sezione.href}
            href={sezione.href}
            className="group flex min-h-44 flex-col rounded-[1.5rem] border border-[#EADDCF] bg-white/90 p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#D9B8A5] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C96F52]/30 sm:min-h-48 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${sezione.colore} ${sezione.testo}`}
              >
                <IconaDashboard nome={sezione.simbolo} />
              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-full text-[#A9988A] transition group-hover:bg-[#F9E8DC] group-hover:text-[#A75B43]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14m-6-6 6 6-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>

            <h3 className="mt-5 text-lg font-bold text-[#49372F]">
              {sezione.titolo}
            </h3>

            <p className="mt-1 text-sm leading-6 text-[#78675D]">
              {sezione.descrizione}
            </p>
          </Link>
        ))}
      </div>
    </section>

    <footer className="mt-10 pb-3 text-center">
      <p className="text-xs leading-5 text-[#8B796D]">
        Un piccolo gesto, una grande meraviglia.
      </p>
    </footer>
  </div>
</main>


);
}

function IconaDashboard({ nome }: { nome: string }) {
const props = {
viewBox: "0 0 24 24",
fill: "none",
stroke: "currentColor",
strokeWidth: 1.7,
strokeLinecap: "round" as const,
strokeLinejoin: "round" as const,
className: "h-6 w-6",
"aria-hidden": true as const,
};

switch (nome) {
case "persone":
case "utenti":
return (
<svg {...props}> <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /> <circle cx="10" cy="7" r="4" /> <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /> </svg>
);


case "casa":
  return (
    <svg {...props}>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v12h14V9M9 21v-7h6v7" />
    </svg>
  );

case "cerchi":
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v5m9 4h-5M12 21v-5m-9-4h5" />
    </svg>
  );

case "attivita":
  return (
    <svg {...props}>
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  );

case "report":
  return (
    <svg {...props}>
      <path d="M4 19V5m0 14h17" />
      <path d="m7 15 4-4 3 2 5-6" />
      <path d="M16 7h3v3" />
    </svg>
  );

case "impostazioni":
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.6-1.4-2.4L7.1 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.6 1.4 2.4-1.5 1.1a8 8 0 0 1 0 2Z" />
    </svg>
  );

case "audit":
  return (
    <svg {...props}>
      <path d="M12 8v4l3 2" />
      <circle cx="12" cy="12" r="9" />
      <path d="M5 4 3 6m16-2 2 2" />
    </svg>
  );

default:
  return null;


}
}
