import { useState } from "react";
import { Link } from "react-router-dom";

export default function NoteForm({
  onSubmit,
  error,
  initialTitle = "",
  initialDescription = "",
  submitLabel = "Save Note",
  cancelTo = "/",
  isSaving = false,
  isCheckingSession = false,
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [validationErrors, setValidationErrors] = useState({});
  const busy = isSaving || isCheckingSession;

  function handleTitleChange(event) {
    const value = event.target.value;
    setTitle(value);
    if (value.trim()) {
      setValidationErrors((current) => ({ ...current, title: "" }));
    }
  }

  function handleDescriptionChange(event) {
    const value = event.target.value;
    setDescription(value);
    if (value.trim()) {
      setValidationErrors((current) => ({ ...current, description: "" }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const errors = {
      title: trimmedTitle ? "" : "Enter a title for your note.",
      description: trimmedDescription
        ? ""
        : "Enter a description for your note.",
    };

    setTitle(trimmedTitle);
    setDescription(trimmedDescription);
    setValidationErrors(errors);

    if (errors.title || errors.description) return;
    await onSubmit({ title: trimmedTitle, description: trimmedDescription });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="space-y-6">
        <div>
          <label
            htmlFor="note-title"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Note Title
          </label>
          <input
            id="note-title"
            type="text"
            name="title"
            autoComplete="off"
            value={title}
            onChange={handleTitleChange}
            aria-required="true"
            aria-invalid={Boolean(validationErrors.title)}
            aria-describedby={
              validationErrors.title ? "note-title-error" : "note-title-help"
            }
            disabled={busy}
            placeholder="Give your note a title"
            className={`min-h-12 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70 ${
              validationErrors.title
                ? "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-100"
                : "border-slate-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-100"
            }`}
          />
          {validationErrors.title ? (
            <p
              id="note-title-error"
              role="alert"
              className="mt-2 text-sm text-rose-700"
            >
              {validationErrors.title}
            </p>
          ) : (
            <p id="note-title-help" className="mt-2 text-xs text-slate-500">
              A short, clear title makes notes easier to find.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="note-description"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Note Description
          </label>
          <textarea
            id="note-description"
            name="description"
            rows={9}
            value={description}
            onChange={handleDescriptionChange}
            aria-required="true"
            aria-invalid={Boolean(validationErrors.description)}
            aria-describedby={
              validationErrors.description
                ? "note-description-error"
                : "note-description-help"
            }
            disabled={busy}
            placeholder="Write down the details..."
            className={`w-full resize-y rounded-xl border bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70 ${
              validationErrors.description
                ? "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-100"
                : "border-slate-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-100"
            }`}
          />
          {validationErrors.description ? (
            <p
              id="note-description-error"
              role="alert"
              className="mt-2 text-sm text-rose-700"
            >
              {validationErrors.description}
            </p>
          ) : (
            <p
              id="note-description-help"
              className="mt-2 text-xs text-slate-500"
            >
              Your note is saved as plain text.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm leading-6 text-rose-800"
        >
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <Link
          to={cancelTo}
          aria-disabled={busy}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
          className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? "Saving..."
            : isCheckingSession
              ? "Checking session..."
              : submitLabel}
        </button>
      </div>
    </form>
  );
}
