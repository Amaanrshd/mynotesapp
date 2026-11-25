import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDeleteDialog({
  note,
  error,
  isDeleting,
  onCancel,
  onConfirm,
}) {
  const cancelButtonRef = useRef(null);
  const deleteButtonRef = useRef(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (error && !isDeleting) deleteButtonRef.current?.focus();
  }, [error, isDeleting]);

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (!isDeleting) onCancel();
      return;
    }

    if (event.key !== "Tab") return;
    const firstButton = cancelButtonRef.current;
    const lastButton = deleteButtonRef.current;
    if (!firstButton || !lastButton) return;

    if (event.shiftKey && document.activeElement === firstButton) {
      event.preventDefault();
      lastButton.focus();
    } else if (!event.shiftKey && document.activeElement === lastButton) {
      event.preventDefault();
      firstButton.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-note-title"
        aria-describedby="delete-note-description"
        aria-busy={isDeleting}
        onKeyDown={handleKeyDown}
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex size-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
          <AlertTriangle size={21} aria-hidden="true" />
        </div>
        <h2
          id="delete-note-title"
          className="mt-4 text-lg font-semibold tracking-tight text-slate-900"
        >
          Delete note?
        </h2>
        <p
          id="delete-note-description"
          className="mt-2 break-words text-sm leading-6 text-slate-600"
        >
          Delete <span className="font-semibold text-slate-800">{note.title}</span>?
          This action cannot be undone.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-800"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            aria-disabled={isDeleting}
            onClick={() => {
              if (!isDeleting) onCancel();
            }}
            className={`inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
              isDeleting ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            Cancel
          </button>
          <button
            ref={deleteButtonRef}
            type="button"
            aria-disabled={isDeleting}
            onClick={() => {
              if (!isDeleting) onConfirm();
            }}
            className={`inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 ${
              isDeleting ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </section>
    </div>
  );
}
