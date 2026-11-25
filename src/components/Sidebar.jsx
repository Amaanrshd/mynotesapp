import { BookOpen, LayoutDashboard, Plus } from "lucide-react";
import { NavLink, Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[72px] shrink-0 flex-col border-r border-slate-200 bg-white px-2 py-5 sm:w-60 sm:px-5 sm:py-7">
      <Link
        to="/"
        aria-label="My Notes home"
        className="mb-9 flex items-center justify-center gap-2.5 rounded-lg text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:justify-start"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <BookOpen size={18} aria-hidden="true" />
        </span>
        <span className="hidden text-xs font-bold tracking-[0.18em] text-slate-700 sm:inline">
          MY NOTES
        </span>
      </Link>

      <Link
        to="/notes/new"
        aria-label="Add new note"
        title="Add new note"
        className="mb-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:justify-start sm:px-3.5"
      >
        <Plus size={18} aria-hidden="true" />
        <span className="hidden sm:inline">Add New Note</span>
      </Link>

      <nav aria-label="Main navigation">
        <NavLink
          to="/"
          end
          aria-label="My Notes dashboard"
          title="My Notes"
          className={({ isActive }) =>
            `flex min-h-11 items-center justify-center gap-3 rounded-xl px-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:justify-start sm:px-3 ${
              isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`
          }
        >
          <LayoutDashboard size={18} aria-hidden="true" />
          <span className="hidden sm:inline">My Notes</span>
        </NavLink>
      </nav>

      <div className="mt-auto hidden rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 sm:block">
        Your ideas, all in one place.
      </div>
    </aside>
  );
}
