import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NoteForm from "../components/NoteForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { readGuestNotes, updateGuestNote } from "../lib/guestNotes.js";
import { supabase, supabaseConfigError } from "../lib/supabase.js";

const noteColumns =
  "id, user_id, title, description, is_pinned, created_at, updated_at";

function messageFromError(error) {
  return typeof error?.message === "string" && error.message
    ? error.message
    : "Please try again.";
}

export default function EditNote() {
  const { id } = useParams();
  const { user, loading: authLoading, sessionError } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const isMounted = useRef(false);
  const activeUserId = useRef(user?.id ?? null);

  activeUserId.current = user?.id ?? null;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;
    setNote(null);
    setLoadError("");

    if (authLoading) {
      setLoading(true);
      return () => {
        isCurrentRequest = false;
      };
    }

    if (!user) {
      try {
        const guestNote = readGuestNotes().find((item) => item.id === id);
        if (!guestNote) {
          setLoadError(
            "This guest note was not found in this browser. Guest notes are not synced across devices.",
          );
        } else {
          setNote(guestNote);
        }
      } catch (error) {
        setLoadError(`Could not load this guest note. ${messageFromError(error)}`);
      } finally {
        setLoading(false);
      }
      return () => {
        isCurrentRequest = false;
      };
    }

    if (sessionError) {
      setLoading(false);
      setLoadError(`Unable to check your sign-in session: ${sessionError}`);
      return () => {
        isCurrentRequest = false;
      };
    }

    if (!supabase) {
      setLoading(false);
      setLoadError(supabaseConfigError);
      return () => {
        isCurrentRequest = false;
      };
    }

    setLoading(true);
    supabase
      .from("notes")
      .select(noteColumns)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isCurrentRequest) return;
        if (error) {
          setLoadError(`Could not load this note. ${messageFromError(error)}`);
        } else if (!data) {
          setLoadError("This note could not be found in your account.");
        } else {
          setNote(data);
        }
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setLoadError(`Could not load this note. ${messageFromError(error)}`);
        }
      })
      .finally(() => {
        if (isCurrentRequest) setLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [authLoading, id, sessionError, user?.id]);

  async function saveNote({ title, description }) {
    setSaveError("");
    if (!note) return;

    const requestUserId = user?.id ?? null;
    setIsSaving(true);
    try {
      if (!user) {
        updateGuestNote(id, { title, description });
      } else {
        if (sessionError) {
          throw new Error(`Unable to check your sign-in session: ${sessionError}`);
        }
        if (!supabase) throw new Error(supabaseConfigError);

        const { data, error } = await supabase
          .from("notes")
          .update({ title, description })
          .eq("id", id)
          .eq("user_id", requestUserId)
          .select(noteColumns)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Supabase did not confirm the note update.");
      }

      if (isMounted.current && activeUserId.current === requestUserId) {
        navigate("/", { replace: true });
      }
    } catch (error) {
      if (isMounted.current && activeUserId.current === requestUserId) {
        setSaveError(`Could not save your changes. ${messageFromError(error)}`);
      }
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/"
        className="inline-flex rounded-sm text-sm font-medium text-indigo-700 transition hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
      >
        Back to dashboard
      </Link>
      <div className="mb-7 mt-5">
        <p className="text-sm font-semibold text-indigo-700">Your note</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          Edit note
        </h1>
      </div>

      {loading ? (
        <p role="status" className="text-sm text-slate-600">
          Loading note...
        </p>
      ) : loadError ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800"
        >
          {loadError}
        </p>
      ) : note ? (
        <NoteForm
          key={note.id}
          initialTitle={note.title}
          initialDescription={note.description}
          submitLabel="Save Changes"
          onSubmit={saveNote}
          error={saveError}
          isSaving={isSaving}
        />
      ) : null}
    </div>
  );
}
