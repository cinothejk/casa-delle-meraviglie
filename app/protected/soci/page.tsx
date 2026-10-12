import { createClient } from "@/lib/supabase/server";
import { modificaSocio } from "./actions";

export const instant = false;

export default async function SociPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profilo } = await supabase
    .from("profiles")
    .select("ruolo")
    .eq("id", user.id)
    .single();

  if (!profilo || !["superadmin", "direzione"].includes(profilo.ruolo)) {
    return (
      <div className="rounded-lg border p-6">
        <h1 className="text-xl font-semibold">Accesso non autorizzato</h1>
      </div>
    );
  }

  const { data: soci, error: sociError } = await supabase
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
    .order("cognome", { ascending: true })
    .order("nome", { ascending: true });

  const { data: famiglie, error: famiglieError } = await supabase
    .from("famiglie")
    .select("id, nome")
    .eq("attiva", true)
    .order("nome", { ascending: true });

  if (sociError || famiglieError) {
    return (
      <div className="rounded-lg border p-6">
        <h1 className="text-xl font-semibold">Errore</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Impossibile caricare i dati dei soci.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Soci</h1>
        <p className="text-sm text-muted-foreground">
          Gestisci dati anagrafici, famiglia e stato dei soci.
        </p>
      </div>

      <div className="space-y-4">
        {(soci ?? []).map((socio) => {
          const famiglia = Array.isArray(socio.famiglie)
            ? socio.famiglie[0]
            : socio.famiglie;

          return (
            <form
              key={socio.id}
              action={modificaSocio}
              className="rounded-lg border p-5"
            >
              <input
                type="hidden"
                name="socio_id"
                value={socio.id}
              />

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label
                    htmlFor={`nome-${socio.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Nome
                  </label>

                  <input
                    id={`nome-${socio.id}`}
                    name="nome"
                    defaultValue={socio.nome ?? ""}
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`cognome-${socio.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Cognome
                  </label>

                  <input
                    id={`cognome-${socio.id}`}
                    name="cognome"
                    defaultValue={socio.cognome ?? ""}
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`username-${socio.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Username
                  </label>

                  <input
                    id={`username-${socio.id}`}
                    name="username"
                    defaultValue={socio.username ?? ""}
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email
                  </label>

                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    {socio.email ?? "—"}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`famiglia-${socio.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Famiglia
                  </label>

                  <select
                    id={`famiglia-${socio.id}`}
                    name="famiglia_id"
                    defaultValue={famiglia?.id ?? ""}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      Nessuna famiglia
                    </option>

                    {(famiglie ?? []).map((famigliaOption) => (
                      <option
                        key={famigliaOption.id}
                        value={famigliaOption.id}
                      >
                        {famigliaOption.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`attivo-${socio.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Stato
                  </label>

                  <select
                    id={`attivo-${socio.id}`}
                    name="attivo"
                    defaultValue={socio.attivo ? "true" : "false"}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="true">Attivo</option>
                    <option value="false">Non attivo</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Ruolo:{" "}
                  <span className="font-medium text-foreground">
                    {socio.ruolo}
                  </span>
                </div>

                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Salva modifiche
                </button>
              </div>
            </form>
          );
        })}

        {(!soci || soci.length === 0) && (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Nessun socio presente.
          </div>
        )}
      </div>
    </div>
  );
}