import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
return ( <main className="relative isolate flex min-h-svh w-full items-center justify-center overflow-hidden bg-[#FFF8EF] px-4 py-8 sm:px-6 sm:py-10">
{/* Decorazioni dello sfondo */} <div
     aria-hidden="true"
     className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[#F5D1BC]/70 blur-2xl sm:h-96 sm:w-96"
   />

  <div
    aria-hidden="true"
    className="pointer-events-none absolute -bottom-28 -right-20 -z-10 h-80 w-80 rounded-full bg-[#DCE5D4]/80 blur-2xl sm:h-[28rem] sm:w-[28rem]"
  />

  <div
    aria-hidden="true"
    className="pointer-events-none absolute right-[12%] top-[12%] -z-10 hidden h-20 w-20 rotate-12 rounded-[2rem] bg-[#F4D98A]/50 sm:block"
  />

  <div className="w-full max-w-md">
    {/* Intestazione */}
    <header className="mb-7 flex items-center justify-center gap-4">
          {/* Logo a sinistra */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-[#C96F52] text-white shadow-lg shadow-[#C96F52]/20">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              aria-hidden="true"
            >
              <path
                d="M8 22L24 9L40 22V39H28V28H20V39H8V22Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 17V10H23"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M32 8V14M29 11H35"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Testi a destra */}
          <div className="text-left">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-[#A75B43]">
              Una comunità che cresce insieme
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#49372F] sm:text-4xl">
              Casa delle{" "}
              <span className="text-[#C96F52]">Meraviglie</span>
            </h1>
          </div>
        </header>

    {/* Scheda di registrazione */}
    <section className="overflow-hidden rounded-[1.75rem] border border-[#EADDCF] bg-white/95 p-2 shadow-[0_20px_60px_-20px_rgba(112,75,53,0.22)] backdrop-blur-sm sm:p-3">
      <SignUpForm />
    </section>

    <footer className="mt-5 text-center sm:mt-6">
      {/*<p className="text-xs leading-5 text-[#8B796D]">
        Un piccolo gesto, una grande meraviglia.
      </p> */}
    </footer>
  </div>
</main>


);
}
