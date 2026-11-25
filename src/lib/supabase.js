import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigError =
  !supabaseUrl || !supabasePublishableKey
    ? import.meta.env.DEV
      ? "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env.local file, then restart the development server."
      : "Supabase is not configured for this deployment. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your hosting provider's environment variables, then rebuild and redeploy."
    : null;

export const supabase =
  supabaseConfigError === null
    ? createClient(supabaseUrl, supabasePublishableKey)
    : null;
