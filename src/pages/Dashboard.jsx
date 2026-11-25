import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Pin } from "lucide-react";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog.jsx";
import NoteCard from "../components/NoteCard.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  deleteGuestNote,
  readGuestNotes,
  updateGuestNote,
} from "../lib/guestNotes.js";
import { supabase, supabaseConfigError } from "../lib/supabase.js";

const noteColumns =
  "id, user_id, title, description, is_pinned, created_at, updated_at";

function messageFromError(error, fallback) {
  return typeof error?.message === "string" && error.message
    ? error.message
    : fallback;
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return Number(b.is_pinned) - Number(a.is_pinned);

    const createdAtDifference =
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (createdAtDifference !== 0) return createdAtDifference;

    return b.id.localeCompare(a.id);
  });
}

function LoadingCards() {
  return (
    <div
      role="status"
      aria-label="Loading notes"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3"
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="min-h-56 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="size-10 rounded-xl bg-slate-200" />
          <div className="mt-6 h-3 w-24 rounded bg-slate-200" />
          <div className="mt-3 h-5 w-3/4 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-full rounded bg-slate-100" />
          <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
      <span className="sr-only">Loading your notes...</span>
    </div>
  );
}

function EmptyState({ signedIn }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
        <Pin size={20} aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">
        {signedIn ? "No notes yet" : "Continue in guest mode"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {signedIn
          ? "Your notes will appear here. Create one to get started."
          : "Guest notes are saved only in this browser. They are not sent to Supabase or synced across devices."}
      </p>
      <Link
        to="/notes/new"
        className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        Add New Note <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading, sessionError } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [query, setQuery] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [busyNoteId, setBusyNoteId] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const isMounted = useRef(false);
  const activeUserId = useRef(user?.id ?? null);
  const deleteTriggerRef = useRef(null);
  const deleteInProgress = useRef(false);
  const dashboardHeadingRef = useRef(null);
  const navigate = useNavigate();

  activeUserId.current = user?.id ?? null;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (noteToDelete || !deleteTriggerRef.current) return undefined;

    const trigger = deleteTriggerRef.current;
    deleteTriggerRef.current = null;
    const timeoutId = window.setTimeout(() => {
      if (trigger.isConnected) {
        trigger.focus();
      } else {
        dashboardHeadingRef.current?.focus();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [noteToDelete]);

  useEffect(() => {
    let isCurrentRequest = true;
    setError("");
    setActionError("");
    setBusyNoteId(null);

    if (authLoading) {
      setLoading(true);
      return () => {
        isCurrentRequest = false;
      };
    }

    if (!user) {
      try {
        setNotes(sortNotes(readGuestNotes()));
      } catch (readError) {
        setNotes([]);
        setError(messageFromError(readError, "Unable to load guest notes."));
      } finally {
        setLoading(false);
      }
      return () => {
        isCurrentRequest = false;
      };
    }

    if (sessionError) {
      setNotes([]);
      setLoading(false);
      setError(`Unable to check your sign-in session: ${sessionError}`);
      return () => {
        isCurrentRequest = false;
      };
    }

    if (!supabase) {
      setNotes([]);
      setLoading(false);
      setError(supabaseConfigError);
      return () => {
        isCurrentRequest = false;
      };
    }

    setLoading(true);
    supabase
      .from("notes")
      .select(noteColumns)
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .then(({ data, error: requestError }) => {
        if (!isCurrentRequest) return;
        if (requestError) {
          setNotes([]);
          setError(messageFromError(requestError, "Unable to load your notes."));
          return;
        }
        setNotes(data ?? []);
      })
      .catch((requestError) => {
        if (!isCurrentRequest) return;
        setNotes([]);
        setError(messageFromError(requestError, "Unable to load your notes."));
      })
      .finally(() => {
        if (isCurrentRequest) setLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [authLoading, retryCount, sessionError, user?.id]);

  const filteredNotes = useMemo(() => {
    const searchTerm = query.trim().toLocaleLowerCase();
    if (!searchTerm) return notes;

    return notes.filter((note) =>
      `${note.title} ${note.description}`.toLocaleLowerCase().includes(searchTerm),
    );
  }, [notes, query]);
  const pinnedNotes = filteredNotes.filter((note) => note.is_pinned);
  const unpinnedNotes = filteredNotes.filter((note) => !note.is_pinned);

  function retryLoading() {
    setRetryCount((count) => count + 1);
  }

  function editNote(note) {
    navigate(`/notes/${note.id}/edit`);
  }

  function requestDelete(note, trigger) {
    if (busyNoteId || deleteInProgress.current) return;
    deleteTriggerRef.current = trigger;
    setDeleteError("");
    setNoteToDelete(note);
  }

  function cancelDelete() {
    if (deleteInProgress.current) return;
    setDeleteError("");
    setNoteToDelete(null);
  }

  async function togglePinned(note) {
    if (busyNoteId) return;

    setBusyNoteId(note.id);
    setActionError("");
    if (!user) {
      try {
        const updatedNote = updateGuestNote(note.id, {
          is_pinned: !note.is_pinned,
        });
        setNotes((currentNotes) =>
          sortNotes(
            currentNotes.map((current) =>
              current.id === updatedNote.id ? updatedNote : current,
            ),
          ),
        );
      } catch (updateError) {
        setActionError(
          `Could not update the guest note: ${messageFromError(updateError, "Please try again.")}`,
        );
      } finally {
        setBusyNoteId(null);
      }
      return;
    }
    if (!supabase) {
      setActionError(supabaseConfigError);
      setBusyNoteId(null);
      return;
    }

    try {
      const { data, error: updateError } = await supabase
        .from("notes")
        .update({ is_pinned: !note.is_pinned })
        .eq("id", note.id)
        .eq("user_id", user.id)
        .select(noteColumns)
        .single();

      if (updateError) throw updateError;
      if (!data) throw new Error("Supabase did not return the updated note.");
      if (!isMounted.current || activeUserId.current !== user.id) return;

      setNotes((currentNotes) =>
        sortNotes(currentNotes.map((current) => (current.id === data.id ? data : current))),
      );
    } catch (updateError) {
      if (!isMounted.current || activeUserId.current !== user.id) return;
      setActionError(
        `Could not update the pin status: ${messageFromError(updateError, "Please try again.")}`,
      );
    } finally {
      if (isMounted.current && activeUserId.current === user.id) {
        setBusyNoteId(null);
      }
    }
  }

  async function confirmDelete() {
    const note = noteToDelete;
    if (!note || busyNoteId || deleteInProgress.current) return;

    deleteInProgress.current = true;
    const requestUserId = user?.id ?? null;
    setIsDeleting(true);
    setBusyNoteId(note.id);
    setDeleteError("");
    try {
      if (!user) {
        const deletedNote = deleteGuestNote(note.id);
        if (!isMounted.current) return;
        setNotes((currentNotes) =>
          currentNotes.filter((current) => current.id !== deletedNote.id),
        );
      } else {
        if (!supabase) throw new Error(supabaseConfigError);

        const { data, error: deleteError } = await supabase
          .from("notes")
          .delete()
          .eq("id", note.id)
          .eq("user_id", user.id)
          .select("id")
          .single();

        if (deleteError) throw deleteError;
        if (!data || data.id !== note.id) {
          throw new Error("Supabase did not confirm deletion of this note.");
        }
        if (!isMounted.current || activeUserId.current !== requestUserId) return;

        setNotes((currentNotes) =>
          currentNotes.filter((current) => current.id !== data.id),
        );
      }

      if (isMounted.current && activeUserId.current === requestUserId) {
        setNoteToDelete(null);
      }
    } catch (deleteError) {
      if (isMounted.current && activeUserId.current === requestUserId) {
        setDeleteError(
          `Could not delete "${note.title}". ${messageFromError(deleteError, "Please try again.")}`,
        );
      }
    } finally {
      deleteInProgress.current = false;
      if (isMounted.current) {
        setIsDeleting(false);
        setBusyNoteId(null);
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-6 border-b border-slate-200/80 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-700">Your space</p>
          <h1
            ref={dashboardHeadingRef}
            tabIndex={-1}
            className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 focus-visible:outline-none sm:text-4xl"
          >
            My Notes
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Keep your thoughts organized and the important ones close.
          </p>
        </div>
        <SearchBar
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm leading-6 text-rose-800">
            Could not load your notes. {error}
          </p>
          <button
            type="button"
            onClick={retryLoading}
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-rose-300 bg-white px-3 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {actionError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800"
        >
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="mt-8">
          <LoadingCards />
        </div>
      ) : !error && notes.length === 0 ? (
        <div className="mt-8">
          <EmptyState signedIn={Boolean(user)} />
        </div>
      ) : !error ? (
        <>
          {pinnedNotes.length > 0 && (
            <section
              id="pinned-notes"
              aria-labelledby="pinned-heading"
              className="mt-8 scroll-mt-24"
            >
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Pin size={16} className="text-indigo-600" aria-hidden="true" />
                    <h2
                      id="pinned-heading"
                      className="text-lg font-semibold tracking-tight text-slate-900"
                    >
                      Pinned Notes
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    The notes you want to keep close.
                  </p>
                </div>
                <span className="text-sm tabular-nums text-slate-500">
                  {pinnedNotes.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={editNote}
                    onDelete={requestDelete}
                    onTogglePin={togglePinned}
                    busy={Boolean(busyNoteId)}
                  />
                ))}
              </div>
            </section>
          )}

          <section
            id="all-notes"
            aria-labelledby="all-notes-heading"
            className="mt-10 scroll-mt-24"
          >
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2
                  id="all-notes-heading"
                  className="text-lg font-semibold tracking-tight text-slate-900"
                >
                  All Notes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Notes that are not pinned.
                </p>
              </div>
              <span className="text-sm tabular-nums text-slate-500">
                {unpinnedNotes.length}
              </span>
            </div>
            {unpinnedNotes.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {unpinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={editNote}
                    onDelete={requestDelete}
                    onTogglePin={togglePinned}
                    busy={Boolean(busyNoteId)}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500">
                {query.trim()
                  ? "No unpinned notes match your search."
                  : "All your notes are pinned."}
              </p>
            )}
          </section>

          {filteredNotes.length === 0 && (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-center">
              <p className="font-medium text-slate-800">No notes match your search</p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-2 rounded-sm text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Clear search
              </button>
            </div>
          )}
        </>
      ) : null}
      {noteToDelete && (
        <ConfirmDeleteDialog
          note={noteToDelete}
          error={deleteError}
          isDeleting={isDeleting}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
