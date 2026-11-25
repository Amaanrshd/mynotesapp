import { CalendarDays, FileText, Pencil, Pin, PinOff, Trash2 } from "lucide-react";

const cardTones = [
  "border-sky-100 bg-sky-50",
  "border-rose-100 bg-rose-50",
  "border-amber-100 bg-amber-50",
  "border-violet-100 bg-violet-50",
];

const iconTones = [
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
];

function getToneIndex(id) {
  return (
    Array.from(id).reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    ) % cardTones.length
  );
}

function formatCreatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  busy = false,
}) {
  const toneIndex = getToneIndex(note.id);

  return (
    <article
      className={`flex min-h-56 flex-col rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${cardTones[toneIndex]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex size-10 items-center justify-center rounded-xl ${iconTones[toneIndex]}`}
        >
          <FileText size={19} aria-hidden="true" />
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-white/75 px-2.5 py-1 text-xs font-medium ${
            note.is_pinned ? "text-indigo-700" : "text-slate-500"
          }`}
        >
          {note.is_pinned ? (
            <Pin size={12} aria-hidden="true" />
          ) : (
            <PinOff size={12} aria-hidden="true" />
          )}
          {note.is_pinned ? "Pinned" : "Not pinned"}
        </span>
      </div>

      <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <CalendarDays size={13} aria-hidden="true" />
        <time dateTime={note.created_at}>{formatCreatedAt(note.created_at)}</time>
      </p>
      <h3 className="mt-1.5 break-words text-base font-semibold leading-6 text-slate-900">
        {note.title}
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
        {note.description}
      </p>

      <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-900/5 pt-3">
        <button
          type="button"
          onClick={() => onEdit(note)}
          aria-label={`Edit ${note.title}`}
          title="Edit note"
          className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/70 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
        >
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onTogglePin(note)}
          aria-label={`${note.is_pinned ? "Unpin" : "Pin"} ${note.title}`}
          title={note.is_pinned ? "Unpin note" : "Pin note"}
          className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/70 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
        >
          {note.is_pinned ? (
            <PinOff size={16} aria-hidden="true" />
          ) : (
            <Pin size={16} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={(event) => onDelete(note, event.currentTarget)}
          aria-label={`Delete ${note.title}`}
          title="Delete note"
          className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-rose-100 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
