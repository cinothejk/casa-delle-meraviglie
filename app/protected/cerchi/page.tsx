
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { modificaCerchio } from "./actions";

export const instant = false;

export default async function CerchiPage() {
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

  const { data: cerchi, error } = await supabase
    .from("cerchi")
    .select(`
      id,
      nome,
      descrizione,
      attivo
    `)
    .order("nome", { ascending: true });

  if (error) {
    return (
      <main>
        <h1 className="text-2xl font-bold">
          Errore nel caricamento dei cerchi
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {error.message}
        </p>
      </main>
    );
  }

  return (
    <main>
      <div className="mb-8">
        <p className="text-sm text-gray-500">
          Organizzazione delle attività
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Cerchi
        </h1>

        <p className="mt-2 text-gray-600">
          Gestisci i cerchi della comunità e la loro disponibilità.
        </p>
      </div>

      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
        <div className="text-2xl font-bold">
          {cerchi?.length ?? 0}
        </div>

        <div className="text-sm text-gray-500">
          cerchi configurati
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {cerchi?.map((cerchio) => (
          <div
            key={cerchio.id}
            className="rounded-xl border bg-white shadow-sm"
          >
            <form
              action={modificaCerchio}
              className="p-5"
            >
              <input
                type="hidden"
                name="id"
                value={cerchio.id}
              />

              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {cerchio.nome}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Cerchio
                  </p>
                </div>

                <span
                  className={
                    cerchio.attivo
                      ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                      : "rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
                  }
                >
                  {cerchio.attivo ? "Attivo" : "Disattivo"}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor={`nome-${cerchio.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Nome
                  </label>

                  <input
                    id={`nome-${cerchio.id}`}
                    name="nome"
                    required
                    defaultValue={cerchio.nome}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`descrizione-${cerchio.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Descrizione
                  </label>

                  <textarea
                    id={`descrizione-${cerchio.id}`}
                    name="descrizione"
                    defaultValue={cerchio.descrizione ?? ""}
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Descrizione del cerchio..."
                  />
                </div>

                <div>
                  <label
                    htmlFor={`attivo-${cerchio.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Stato
                  </label>

                  <select
                    id={`attivo-${cerchio.id}`}
                    name="attivo"
                    defaultValue={String(cerchio.attivo)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="true">
                      Attivo
                    </option>

                    <option value="false">
                      Disattivo
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Salva modifiche
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}

