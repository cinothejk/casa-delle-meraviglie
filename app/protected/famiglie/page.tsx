import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  assegnaSocio,
  creaFamiglia,
  modificaFamiglia,
} from "./actions";

export const instant = false;

export default async function FamigliePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ruolo")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    (profile.ruolo !== "superadmin" && profile.ruolo !== "direzione")
  ) {
    redirect("/protected");
  }

  const [{ data: famiglie, error: famiglieError }, { data: soci }] =
    await Promise.all([
      supabase
        .from("famiglie")
        .select(`
          id,
          nome,
          codice,
          attiva,
          profiles (
            id,
            nome,
            cognome,
            email,
            ruolo,
            attivo
          )
        `)
        .order("nome", { ascending: true }),

      supabase
        .from("profiles")
        .select(`
          id,
          nome,
          cognome,
          email,
          famiglia_id,
          attivo
        `)
        .order("cognome", { ascending: true }),
    ]);

  if (famiglieError) {
    return (
      <main>
        <h1 className="text-2xl font-bold">
          Errore nel caricamento delle famiglie
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {famiglieError.message}
        </p>
      </main>
    );
  }

  return (
    <main>
      {/* Intestazione */}
      <div className="mb-8">
        <p className="text-sm text-gray-500">
          Gestione nuclei familiari
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Famiglie
        </h1>

        <p className="mt-2 text-gray-600">
          Crea le famiglie e assegna i soci al relativo nucleo familiare.
        </p>
      </div>

      {/* Nuova famiglia */}
      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Nuova famiglia
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Crea una nuova famiglia da utilizzare per la gestione del credito
          mensile.
        </p>

        <form
          action={creaFamiglia}
          className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto]"
        >
          <div>
            <label
              htmlFor="nome"
              className="mb-1 block text-sm font-medium"
            >
              Nome famiglia
            </label>

            <input
              id="nome"
              name="nome"
              required
              placeholder="es. Famiglia Rossi"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="codice"
              className="mb-1 block text-sm font-medium"
            >
              Codice
            </label>

            <input
              id="codice"
              name="codice"
              placeholder="es. FAM-001"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              + Crea famiglia
            </button>
          </div>
        </form>
      </section>

      {/* Famiglie esistenti */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Famiglie registrate
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {famiglie?.length ?? 0} famiglie
            </p>
          </div>
        </div>

        {famiglie && famiglie.length > 0 ? (
          <div className="space-y-5">
            {famiglie.map((famiglia) => {
              const membri = Array.isArray(famiglia.profiles)
                ? famiglia.profiles
                : [];

              return (
                <div
                  key={famiglia.id}
                  className="rounded-xl border bg-white shadow-sm"
                >
                  {/* Testata famiglia */}
                  <div className="border-b p-5">
                    <form
                      action={modificaFamiglia}
                      className="grid gap-4 lg:grid-cols-[1fr_220px_160px_auto]"
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={famiglia.id}
                      />

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Nome famiglia
                        </label>

                        <input
                          name="nome"
                          required
                          defaultValue={famiglia.nome}
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Codice
                        </label>

                        <input
                          name="codice"
                          defaultValue={famiglia.codice ?? ""}
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Stato
                        </label>

                        <select
                          name="attiva"
                          defaultValue={String(famiglia.attiva)}
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        >
                          <option value="true">
                            Attiva
                          </option>

                          <option value="false">
                            Disattiva
                          </option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                          Salva
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Membri */}
                  <div className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          Soci della famiglia
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {membri.length}{" "}
                          {membri.length === 1 ? "socio" : "soci"}
                        </p>
                      </div>

                      <span
                        className={
                          famiglia.attiva
                            ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                            : "rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
                        }
                      >
                        {famiglia.attiva ? "Attiva" : "Disattiva"}
                      </span>
                    </div>

                    {membri.length > 0 ? (
                      <div className="space-y-2">
                        {membri.map((membro) => (
                          <div
                            key={membro.id}
                            className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="font-medium">
                                {membro.nome || "—"}{" "}
                                {membro.cognome || ""}
                              </div>

                              <div className="text-xs text-gray-500">
                                {membro.email || "Email non disponibile"}
                              </div>
                            </div>

                            <form action={assegnaSocio}>
                              <input
                                type="hidden"
                                name="socio_id"
                                value={membro.id}
                              />

                              <select
                                name="famiglia_id"
                                defaultValue={famiglia.id}
                                className="rounded-lg border bg-white px-3 py-2 text-sm"
                              >
                                <option value="">
                                  Nessuna famiglia
                                </option>

                                {famiglie.map((fam) => (
                                  <option
                                    key={fam.id}
                                    value={fam.id}
                                  >
                                    {fam.nome}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="submit"
                                className="ml-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-100"
                              >
                                Sposta
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                        Nessun socio assegnato a questa famiglia.
                      </p>
                    )}

                    {/* Aggiunta socio */}
                    <div className="mt-5 border-t pt-5">
                      <h4 className="text-sm font-semibold">
                        Assegna un socio
                      </h4>

                      <form
                        action={assegnaSocio}
                        className="mt-3 flex flex-col gap-2 sm:flex-row"
                      >
                        <input
                          type="hidden"
                          name="famiglia_id"
                          value={famiglia.id}
                        />

                        <select
                          name="socio_id"
                          required
                          className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Seleziona un socio
                          </option>

                          {soci
                            ?.filter(
                              (socio) => socio.famiglia_id !== famiglia.id
                            )
                            .map((socio) => (
                              <option
                                key={socio.id}
                                value={socio.id}
                              >
                                {socio.nome || "—"}{" "}
                                {socio.cognome || ""}
                                {socio.famiglia_id
                                  ? " · già assegnato"
                                  : ""}
                              </option>
                            ))}
                        </select>

                        <button
                          type="submit"
                          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                        >
                          Assegna
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold">
              Nessuna famiglia presente
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Crea la prima famiglia utilizzando il modulo qui sopra.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}