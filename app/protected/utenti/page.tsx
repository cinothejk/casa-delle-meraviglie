import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  creaUtente,
  modificaUtente,
  generaResetPassword,
} from "./actions";

export const instant = false;

export default async function UtentiPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profilo, error: profiloError } = await supabase
    .from("profiles")
    .select("id, nome, cognome, username, ruolo, attivo")
    .eq("id", user.id)
    .single();

  if (
    profiloError ||
    !profilo ||
    profilo.ruolo !== "superadmin" ||
    !profilo.attivo
  ) {
    redirect("/protected");
  }

  const { data: famiglie, error: famiglieError } = await supabase
    .from("famiglie")
    .select("id, nome, attiva")
    .eq("attiva", true)
    .order("nome");

  if (famiglieError) {
    throw new Error(
      "Errore nel caricamento delle famiglie."
    );
  }

  const { data: utenti, error: utentiError } = await supabase
    .from("profiles")
    .select(`
      id,
      nome,
      cognome,
      email,
      username,
      ruolo,
      attivo,
      famiglia_id,
      famiglie (
        id,
        nome
      )
    `)
    .order("cognome")
    .order("nome");

  if (utentiError) {
    throw new Error(
      "Errore nel caricamento degli utenti."
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Gestione Utenti
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Crea e controlla gli utenti che possono accedere
            all'applicazione.
          </p>
        </div>

        <Link
          href="/protected"
          className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-6 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">
          Crea nuovo utente
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Puoi creare un Socio oppure un utente Direzione.
        </p>

        <form
          action={creaUtente}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              Nome
            </label>

            <input
              name="nome"
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Cognome
            </label>

            <input
              name="cognome"
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Username
            </label>

            <input
              name="username"
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Password iniziale
            </label>

            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="w-full rounded-lg border px-3 py-2"
            />

            <p className="mt-1 text-xs text-gray-500">
              Almeno 8 caratteri.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Ruolo
            </label>

            <select
              name="ruolo"
              defaultValue="socio"
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="socio">Socio</option>
              <option value="direzione">Direzione</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Famiglia
            </label>

            <select
              name="famiglia_id"
              defaultValue=""
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="">
                Nessuna famiglia
              </option>

              {(famiglie ?? []).map((famiglia) => (
                <option
                  key={famiglia.id}
                  value={famiglia.id}
                >
                  {famiglia.nome}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-gray-500">
              Per un Socio seleziona la famiglia di appartenenza.
              Direzione non può essere associata a una famiglia.
            </p>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
            >
              Crea utente
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border bg-white dark:bg-gray-900">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">
              Utenti esistenti
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Modifica dati, famiglia e stato degli utenti.
            </p>
          </div>

          <div className="space-y-4 p-5">
            {(utenti ?? []).map((utente) => {
              const famiglia = Array.isArray(utente.famiglie)
                ? utente.famiglie[0]
                : utente.famiglie;

              const isSuperAdmin =
                utente.ruolo === "superadmin";

              return (
                <form
                  key={utente.id}
                  action={modificaUtente}
                  className="rounded-xl border p-5"
                >
                  <input
                    type="hidden"
                    name="utente_id"
                    value={utente.id}
                  />

                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {utente.nome} {utente.cognome}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {utente.email}
                      </p>
                    </div>

                    <span className="rounded-full border px-3 py-1 text-xs font-medium">
                      {utente.ruolo}
                    </span>
                  </div>

                  {isSuperAdmin ? (
                    <div className="rounded-lg border bg-gray-50 p-4 text-sm dark:bg-gray-800">
                      <p className="font-medium">
                        Account SuperAdmin
                      </p>

                      <p className="mt-1 text-gray-500">
                        Questo account non può essere modificato
                        da questa schermata.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Nome
                        </label>

                        <input
                          name="nome"
                          defaultValue={utente.nome ?? ""}
                          required
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Cognome
                        </label>

                        <input
                          name="cognome"
                          defaultValue={utente.cognome ?? ""}
                          required
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Username
                        </label>

                        <input
                          name="username"
                          defaultValue={utente.username ?? ""}
                          required
                          className="w-full rounded-lg border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Email
                        </label>

                        <input
                          value={utente.email ?? ""}
                          disabled
                          className="w-full rounded-lg border bg-gray-100 px-3 py-2 text-gray-500 dark:bg-gray-800"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Ruolo
                        </label>

                        <select
                          name="ruolo"
                          defaultValue={utente.ruolo}
                          className="w-full rounded-lg border px-3 py-2"
                        >
                          <option value="socio">
                            Socio
                          </option>

                          <option value="direzione">
                            Direzione
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Famiglia
                        </label>

                        <select
                          name="famiglia_id"
                          defaultValue={utente.famiglia_id ?? ""}
                          className="w-full rounded-lg border px-3 py-2"
                        >
                          <option value="">
                            Nessuna famiglia
                          </option>

                          {(famiglie ?? []).map((famiglia) => (
                            <option
                              key={famiglia.id}
                              value={famiglia.id}
                            >
                              {famiglia.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Stato
                        </label>

                        <select
                          name="attivo"
                          defaultValue={
                            utente.attivo
                              ? "true"
                              : "false"
                          }
                          className="w-full rounded-lg border px-3 py-2"
                        >
                          <option value="true">
                            Attivo
                          </option>

                          <option value="false">
                            Disattivo
                          </option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="submit"
                          className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
                        >
                          Salva modifiche
                        </button>

                        <button
                          type="submit"
                          formAction={generaResetPassword}
                          className="w-full rounded-lg border px-4 py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Reimposta password
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              );
            })}
          </div>
        </div>
    </section>
  );
}