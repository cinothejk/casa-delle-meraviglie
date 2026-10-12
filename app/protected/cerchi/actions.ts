
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verificaGestione() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("ruolo")
    .eq("id", user.id)
    .single();

  if (
    error ||
    !profile ||
    (profile.ruolo !== "superadmin" && profile.ruolo !== "direzione")
  ) {
    throw new Error("Non autorizzato.");
  }

  return supabase;
}

export async function modificaCerchio(formData: FormData) {
  const supabase = await verificaGestione();

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const descrizione = String(
    formData.get("descrizione") ?? ""
  ).trim();
  const attivo = formData.get("attivo") === "true";

  if (!id) {
    throw new Error("Cerchio non specificato.");
  }

  if (!nome) {
    throw new Error("Il nome del cerchio è obbligatorio.");
  }

  const { error } = await supabase
    .from("cerchi")
    .update({
      nome,
      descrizione: descrizione || null,
      attivo,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/cerchi");
}

