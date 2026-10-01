import { createClient } from "@supabase/supabase-js";

let client;

export function getSupabaseClient() {
  if (client) return client;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY para usar Supabase Auth.",
    );
  }

  client = createClient(supabaseUrl, supabaseKey);
  return client;
}
