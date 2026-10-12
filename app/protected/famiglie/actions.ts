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

  return { supabase, user };
}

export async function creaFamiglia(formData: FormData) {
  const { supabase } = await verificaGestione();

  const nome = String(formData.get("nome") ?? "").trim();
  const codice = String(formData.get("codice") ?? "").trim();

  if (!nome) {
    throw new Error("Il nome della famiglia è obbligatorio.");
  }

  const { error } = await supabase.from("famiglie").insert({
    nome,
    codice: codice || null,
    attiva: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/famiglie");
}

export async function modificaFamiglia(formData: FormData) {
  const { supabase } = await verificaGestione();

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const codice = String(formData.get("codice") ?? "").trim();
  const attiva = formData.get("attiva") === "true";

  if (!id) {
    throw new Error("Famiglia non specificata.");
  }

  if (!nome) {
    throw new Error("Il nome della famiglia è obbligatorio.");
  }

  const { error } = await supabase
    .from("famiglie")
    .update({
      nome,
      codice: codice || null,
      attiva,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/famiglie");
}

export async function assegnaSocio(formData: FormData) {
  const { supabase } = await verificaGestione();

  const socioId = String(formData.get("socio_id") ?? "");
  const famigliaId = String(formData.get("famiglia_id") ?? "");

  if (!socioId) {
    throw new Error("Socio non specificato.");
  }

  const nuovoValore = famigliaId || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      famiglia_id: nuovoValore,
    })
    .eq("id", socioId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/famiglie");
  revalidatePath("/protected/soci");
}