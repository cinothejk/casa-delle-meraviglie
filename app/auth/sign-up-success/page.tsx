import Link from "next/link";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "@/components/ui/card";

export default function Page() {
return ( <main className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-[#FFF8EF] px-5 py-12 text-[#49372F] sm:px-8">
{/* Decorazioni di sfondo */} <div
     aria-hidden="true"
     className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#F5D1BC]/60 blur-2xl"
   /> <div
     aria-hidden="true"
     className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#DCE5D6]/70 blur-2xl"
   />


  <div className="relative z-10 w-full max-w-md">
    {/* Intestazione */}
    <div className="mb-8 flex flex-col items-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#C96F52] text-white shadow-lg shadow-[#C96F52]/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-9 w-9"
          aria-hidden="true"
        >
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9" />
          <path d="M9 20v-6h6v6" />
          <path d="M9 9h.01M15 9h.01" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-[#49372F]">
        Casa delle Meraviglie
      </h1>
      <p className="mt-2 text-sm text-[#8A7568]">
        La comunità cresce insieme
      </p>
    </div>

    {/* Conferma registrazione */}
    <Card className="overflow-hidden rounded-3xl border border-[#EADDCF] bg-white/95 shadow-xl shadow-[#77533D]/10">
      <div className="h-2 bg-gradient-to-r from-[#81977A] via-[#A9B99D] to-[#F5D1BC]" />

      <CardHeader className="items-center px-6 pb-3 pt-8 text-center sm:px-8">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#E7EFE2] text-[#5F7D58]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
            <path d="m9 16 2 2 4-4" />
          </svg>
        </div>

        <CardTitle className="text-2xl font-bold text-[#49372F]">
          Ancora un piccolo passo!
        </CardTitle>

        <CardDescription className="mt-2 text-base leading-relaxed text-[#8A7568]">
          Benvenuto nella nostra comunità.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-8 sm:px-8">
        <p className="text-center text-sm leading-6 text-[#6F5B50]">
          La tua registrazione è stata avviata con successo. Ti abbiamo
          chiesto di confermare il tuo indirizzo email: apri il messaggio
          che hai ricevuto e segui il link per attivare il tuo account.
        </p>

        <div className="mt-6 rounded-2xl border border-[#E2E9DC] bg-[#F4F7F0] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#6D8765] shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12 8v4l2.5 2.5" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </span>

            <div>
              <p className="text-sm font-semibold text-[#526A4D]">
                Cosa fare adesso
              </p>
              <p className="mt-1 text-sm leading-5 text-[#6F7E66]">
                Controlla anche la cartella spam o posta indesiderata. Una
                volta confermata l&apos;email, potrai accedere con le tue
                credenziali.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/auth/login"
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#C96F52] px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#C96F52]/20 transition hover:-translate-y-0.5 hover:bg-[#B95F43] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96F52] focus-visible:ring-offset-2"
        >
          Vai al login
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>

        <p className="mt-6 text-center text-xs text-[#A08D80]">
          Uno spazio di cura, collaborazione e meraviglia.
        </p>
      </CardContent>
    </Card>

    <p className="mt-6 text-center text-xs text-[#A08D80]">
      © Casa delle Meraviglie
    </p>
  </div>
</main>


);
}
