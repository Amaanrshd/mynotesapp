import { useState } from "react";
import { BookOpen } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase, supabaseConfigError } from "../lib/supabase.js";

export default function AuthScreen() {
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionError } = useAuth();
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrorMessage("");
    setNotice("");

    try {
      if (!supabase) throw new Error(supabaseConfigError);
      const normalizedEmail = email.trim();
      const result = isSignUp
        ? await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: { emailRedirectTo: window.location.origin },
          })
        : await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

      if (result.error) {
        setErrorMessage(result.error.message);
      } else if (isSignUp && !result.data.session) {
        setNotice(
          "Account created. Check your email for a confirmation link, then sign in.",
        );
      } else if (!result.data.session) {
        setErrorMessage("Sign-in completed without an active session. Please try again.");
      } else {
        const from = location.state?.from;
        const destination =
          typeof from?.pathname === "string"
            ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
            : "/";
        navigate(destination, {
          replace: true,
          state: from?.state,
        });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Authentication could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setErrorMessage("");
    setNotice("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <BookOpen size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold tracking-tight text-slate-900">
              My Notes
            </p>
            <p className="text-sm text-slate-500">Private notes, just for you</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isSignUp
            ? "Sign up with your email and a password."
            : "Sign in to access your notes."}
        </p>

        {sessionError && (
          <p role="alert" className="mt-4 text-sm leading-6 text-rose-700">
            Unable to check your current session: {sessionError}
          </p>
        )}
        {!supabase && (
          <p role="alert" className="mt-4 text-sm leading-6 text-rose-700">
            {supabaseConfigError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </span>
            <input
              type="password"
              name="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={isSignUp ? 6 : undefined}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100"
            />
          </label>

          {errorMessage && (
            <p role="alert" className="text-sm text-red-700">
              {errorMessage}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-emerald-700">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !supabase}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy
              ? "Please wait..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isSignUp ? "Already have an account?" : "New to My Notes?"}{" "}
          <button
            type="button"
            onClick={() => changeMode(isSignUp ? "sign-in" : "sign-up")}
            className="rounded-sm font-medium text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}
