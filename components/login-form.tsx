
"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("invalid login credentials")
        ) {
          throw new Error("Email o password non corretti. Riprova.");
        }

        throw new Error(
          "Non è stato possibile accedere. Riprova tra qualche momento."
        );
      }

      router.push("/protected");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Si è verificato un errore. Riprova."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#34261F]/65 p-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Accesso in corso"
        >
          <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl border border-[#EADDCF] bg-[#FFF8EF] px-8 py-8 text-center shadow-2xl">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#F5D1BC] border-t-[#C96F52]" />

            <h2 className="text-lg font-bold text-[#49372F]">
              Accesso in corso...
            </h2>

            <p className="text-sm text-[#78675D]">
              Stiamo preparando il tuo spazio personale.
            </p>
          </div>
        </div>
      )}



    <div
      className={cn("flex min-w-0 flex-col", className)}
      {...props}
    >
      <div className="px-4 py-5 sm:px-7 sm:py-7">
        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F9E8DC] px-3 py-1.5 text-xs font-semibold text-[#9E533C]">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-[#C96F52]"
            />
            La tua comunità ti aspetta
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[#49372F] sm:text-[1.75rem]">
            Bentornato!
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#78675D]">
            Accedi al tuo spazio personale e scopri le attività della
            nostra comunità.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-[#59463B]"
            >
              Indirizzo email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nome@esempio.it"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#E8D8CA] bg-[#FFFCF8] px-4 py-3 text-base text-[#49372F] outline-none transition placeholder:text-[#B4A397] hover:border-[#D9B8A5] focus:border-[#C96F52] focus:ring-4 focus:ring-[#C96F52]/15"
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-[#59463B]"
              >
                Password
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-[#A75B43] underline-offset-4 transition hover:text-[#82432F] hover:underline"
              >
                Password dimenticata?
              </Link>
            </div>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#E8D8CA] bg-[#FFFCF8] px-4 py-3 text-base text-[#49372F] outline-none transition placeholder:text-[#B4A397] hover:border-[#D9B8A5] focus:border-[#C96F52] focus:ring-4 focus:ring-[#C96F52]/15"
            />
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="flex gap-3 rounded-xl border border-[#E8B8AD] bg-[#FFF0EC] p-3.5 text-sm leading-5 text-[#963F32]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="mt-0.5 h-5 w-5 shrink-0"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  d="M12 8v4m0 4h.01"
                  strokeLinecap="round"
                />
              </svg>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C96F52] px-5 py-3 text-base font-semibold text-white shadow-md shadow-[#C96F52]/20 transition hover:bg-[#B65E43] hover:shadow-lg hover:shadow-[#C96F52]/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C96F52]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isLoading ? (
              <>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 animate-spin"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                    opacity="0.25"
                  />
                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Accesso in corso...
              </>
            ) : (
              <>
                Entra nella tua comunità
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M5 12h14m-6-6 6 6-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EFE4D9]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-[#9A887B]">
                Un posto per tutti
              </span>
            </div>
          </div>

          <p className="text-center text-sm leading-6 text-[#78675D]">
            Non hai ancora un account?{" "}
            <Link
              href="/auth/sign-up"
              className="font-semibold text-[#A75B43] underline-offset-4 transition hover:text-[#82432F] hover:underline"
            >
              Registrati qui
            </Link>
          </p>
        </form>
      </div>
    </div>
    </>
  );
}