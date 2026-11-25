import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigError =
  !supabaseUrl || !supabasePublishableKey
    ? "Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or their VITE_ equivalents) to your .env.local file, then restart the development server."
    : null;

export const supabase =
  supabaseConfigError === null
    ? createClient(supabaseUrl, supabasePublishableKey)
    : null;
