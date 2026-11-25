import { Search } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  return (
    <label className="relative block w-full max-w-md">
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder="Search your notes"
        aria-label="Search notes"
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-100"
      />
    </label>
  );
}
