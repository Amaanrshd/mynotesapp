import { useState } from "react";
import { CircleUserRound, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";

export default function Navbar() {
  const { user } = useAuth();
  const [signOutError, setSignOutError] = useState("");

  async function handleSignOut() {
    if (!supabase) {
      setSignOutError("Sign out is unavailable because Supabase is not configured.");
      return;
    }

    setSignOutError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setSignOutError(error.message);
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : "Unable to sign out.",
      );
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="flex min-h-[72px] items-center justify-end gap-3 px-4 sm:px-7 lg:px-10">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
            <CircleUserRound size={19} aria-hidden="true" />
          </span>
          <span className="hidden max-w-48 truncate text-sm font-medium text-slate-700 sm:inline">
            {user?.email ?? "Guest workspace"}
          </span>
        </div>
        {user ? (
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        ) : (
          <Link
            to="/auth"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Sign in
          </Link>
        )}
      </div>
      {signOutError && (
        <p role="alert" className="px-5 pb-2 text-right text-sm text-red-700">
          Sign out failed: {signOutError}
        </p>
      )}
    </header>
  );
}
