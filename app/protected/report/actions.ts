"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function verificaGestione() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato");
  }

  const { data: profilo, error } = await supabase
    .from("profiles")
    .select("ruolo, attivo")
    .eq("id", user.id)
    .single();

  if (
    error ||
    !profilo ||
    !profilo.attivo ||
    !["superadmin", "direzione"].includes(profilo.ruolo)
  ) {
    throw new Error("Non autorizzato");
  }

  return supabase;
}

export async function generaReport(formData: FormData) {
  const supabase = await verificaGestione();

  const anno = Number(formData.get("anno"));
  const mese = Number(formData.get("mese"));

  if (!Number.isInteger(anno) || !Number.isInteger(mese)) {
    throw new Error("Anno o mese non validi");
  }

  const { error } = await supabase.rpc(
    "genera_report_mensile",
    {
      p_anno: anno,
      p_mese: mese,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/report");
}

export async function chiudiPeriodo(formData: FormData) {
  const supabase = await verificaGestione();

  const anno = Number(formData.get("anno"));
  const mese = Number(formData.get("mese"));

  if (!Number.isInteger(anno) || !Number.isInteger(mese)) {
    throw new Error("Anno o mese non validi");
  }

  const { error } = await supabase.rpc(
    "chiudi_periodo_mensile",
    {
      p_anno: anno,
      p_mese: mese,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/report");
}