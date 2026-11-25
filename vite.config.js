import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function isPrivilegedSupabaseKey(key) {
  if (/^sb_secret_/i.test(key)) return true;
  const payload = key.split(".")[1];
  if (!payload) return false;

  const claims = Buffer.from(payload, "base64url").toString("utf8");
  return /"role"\s*:\s*"service_role"/i.test(claims);
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const define = {};
  const supabaseUrl = (
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    ""
  ).trim();
  const supabasePublishableKey = (
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    ""
  ).trim();

  if (supabasePublishableKey && isPrivilegedSupabaseKey(supabasePublishableKey)) {
    throw new Error(
      "A privileged Supabase key was provided as the frontend publishable key. Use a publishable or legacy anon key instead.",
    );
  }

  if (supabaseUrl) {
    define["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(supabaseUrl);
  }
  if (supabasePublishableKey) {
    define["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"] = JSON.stringify(
      supabasePublishableKey,
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    define,
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.js",
      restoreMocks: true,
      clearMocks: true,
    },
  };
});
