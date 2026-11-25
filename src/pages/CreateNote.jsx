import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NoteForm from "../components/NoteForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase, supabaseConfigError } from "../lib/supabase.js";

function messageFromError(error) {
  return typeof error?.message === "string" && error.message
    ? error.message
    : "Please try again.";
}

export default function CreateNote() {
  const { user, loading: authLoading, sessionError } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const isMounted = useRef(false);
  const activeUserId = useRef(user?.id ?? null);
  const submissionInProgress = useRef(false);

  activeUserId.current = user?.id ?? null;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  async function saveNote({ title, description }) {
    if (submissionInProgress.current) return;
    setError("");

    if (authLoading) {
      setError("Please wait while your sign-in session is checked.");
      return;
    }
    if (!user) {
      setError("Sign in to create a note.");
      return;
    }
    const requestUserId = user.id;
    submissionInProgress.current = true;
    setIsSaving(true);
    try {
      if (sessionError) {
        throw new Error(`Unable to check your sign-in session: ${sessionError}`);
      }
      if (!supabase) throw new Error(supabaseConfigError);

      const { data, error: insertError } = await supabase
        .from("notes")
        .insert({
          title,
          description,
          user_id: requestUserId,
        })
        .select("id, user_id")
        .single();

      if (insertError) throw insertError;
      if (!data?.id || data.user_id !== requestUserId) {
        throw new Error("Supabase did not confirm that the note was created.");
      }

      if (
        isMounted.current &&
        activeUserId.current === requestUserId
      ) {
        navigate(location.state?.returnTo ?? "/", { replace: true });
      }
    } catch (insertError) {
      if (
        isMounted.current &&
        activeUserId.current === requestUserId
      ) {
        setError(`Could not save your note. ${messageFromError(insertError)}`);
      }
    } finally {
      submissionInProgress.current = false;
      if (isMounted.current) setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to={location.state?.returnTo ?? "/"}
        className="inline-flex rounded-sm text-sm font-medium text-indigo-700 transition hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
      >
        Back to dashboard
      </Link>
      <div className="mb-7 mt-5">
        <p className="text-sm font-semibold text-indigo-700">A new thought</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          Create note
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Capture an idea, reminder, or anything you want to remember.
        </p>
      </div>
      <NoteForm
        onSubmit={saveNote}
        error={error}
        cancelTo={location.state?.returnTo ?? "/"}
        isSaving={isSaving}
        isCheckingSession={authLoading}
      />
    </div>
  );
}
