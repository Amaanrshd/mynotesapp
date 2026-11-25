import { LoaderCircle, Search, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  onClear,
  isLoading = false,
}) {
  return (
    <div className="w-full max-w-md">
      <label htmlFor="note-search" className="sr-only">
        Search notes by title
      </label>
      <div className="relative">
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          id="note-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search your notes"
          autoComplete="off"
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-20 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100"
        />
        {isLoading && (
          <LoaderCircle
            size={16}
            aria-hidden="true"
            className="absolute right-11 top-1/2 -translate-y-1/2 animate-spin text-indigo-600"
          />
        )}
        {value && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            title="Clear search"
            className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      {isLoading && (
        <p role="status" className="sr-only">
          Loading notes...
        </p>
      )}
    </div>
  );
}
