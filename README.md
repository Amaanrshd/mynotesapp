# My Notes

A responsive personal-notes application built with React, Vite, Tailwind CSS, React Router, and Supabase. All note reads and mutations require an authenticated user and use the `public.notes` table; there is no guest/localStorage notes backend.

Browser-only guest notes created by an earlier version are not automatically imported or deleted. This version no longer reads that local data.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A Supabase project

## Install and configure

```powershell
npm install
Copy-Item .env.example .env.local
```

Set the public project URL and publishable key in `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Get these from the Supabase project API settings. A legacy public `anon` key is also accepted as the publishable key. **Never put a `service_role` key, secret key, database password, or other privileged credential in this frontend project.** `.env.local` is ignored by Git, and Vite refuses to start/build if the configured frontend key uses the `sb_secret_` prefix or contains a legacy `service_role` JWT claim. Vite also accepts the unprefixed `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` names as a compatibility fallback, but the `VITE_` names above are preferred.

Restart Vite after changing environment variables. If either required value is missing, the sign-in page displays a configuration error.

## Supabase setup

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`supabase/migrations/20261125160000_create_notes.sql`](./supabase/migrations/20261125160000_create_notes.sql). It creates the notes table, blank-text constraints, timestamp trigger, owner-scoped indexes, grants, RLS, and separate authenticated CRUD policies. The migration is in this repository; it has **not** been applied to any remote project by this application.
3. In **Authentication → Providers**, enable Email/password authentication.
4. Keep email confirmation enabled unless your project has a deliberate, reviewed reason to change it. Configure a working SMTP provider if you need reliable production delivery. Sign-up displays a confirmation notice when Supabase does not return a session.
5. In **Authentication → URL Configuration**, set the Site URL to your local app origin (for example `http://localhost:5173`) and allow that origin in Redirect URLs. Add the exact production origin (and any preview origins you use) after deployment. The sign-up flow requests a confirmation redirect to the current app origin.
6. Confirm the table has RLS enabled and the four owner policies from the migration. Do not add an `anon` policy for personal notes.

The client filters queries by `user_id` as defense in depth. Row Level Security is the actual authorization boundary and must be enabled in the database.

## Run

```powershell
npm run dev
```

Vite prints the local URL (usually `http://localhost:5173`). The app starts at the sign-in page for signed-out visitors. After successful authentication, the Dashboard, Create Note, and Edit Note routes are protected.

## Test and build

```powershell
npm test
npm run build
npm run preview
```

Vitest and React Testing Library cover note form validation, sign-up/sign-in and sign-out calls, protected-route behavior, delete cancellation, failed pin/delete mutations, owner-scoped note requests, pin/unpin grouping and refresh loading, and search escaping/stale-response races. Supabase is mocked at the client boundary; these tests do not contact a Supabase project.

## Hosting

This is a Vite single-page application. Configure the host to serve `index.html` for unknown application paths so a direct browser request or refresh at `/notes/new` and `/notes/:id/edit` reaches React Router:

- **Netlify:** add a `_redirects` file to the published output containing `/* /index.html 200`.
- **Vercel:** the repository includes [`vercel.json`](./vercel.json), which rewrites application routes to `/index.html`.
- **Other static hosts:** enable the equivalent SPA fallback/rewrite; do not redirect the browser to a missing physical `.html` file.

After deployment, set the Supabase **Site URL** to the production origin and add it to **Redirect URLs**. Add preview origins only if users should be able to complete authentication from them. Ensure the publishable key and project URL are configured in the hosting provider's frontend build environment before building.

### Vercel environment variables

Vercel does not upload the ignored `.env.local` file. In **Vercel → Project → Settings → Environment Variables**, add:

- `VITE_SUPABASE_URL` — the Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the public publishable key (or legacy public anon key).

Enable the variables for every Vercel environment you use (at least **Production**, and **Preview** if testing preview deployments), then redeploy so Vite can embed them during the build. Do not add `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, or `SUPABASE_JWT_SECRET` to the frontend project's environment variables.

For a Vite project, verify the Vercel project uses the repository root, build command `npm run build`, and output directory `dist`. If the configuration error remains after redeploying, check that the browser URL belongs to the project/environment where those variables were set and that the deployment was built after the variables were added.

## Application structure and React concepts

- `src/components/` contains the reusable Navbar, Sidebar, NoteCard, NoteForm, SearchBar, authentication screen, protected-route boundary, and delete confirmation dialog. Components receive note data and callbacks through props.
- `src/pages/` contains the Dashboard, Create Note, and Edit Note route screens.
- `src/context/AuthContext.jsx` loads the Supabase session and subscribes to auth changes.
- `src/lib/supabase.js` creates the Supabase client from the public environment variables.
- `src/App.jsx` defines application routes and protects note pages.
- `src/index.css` loads Tailwind CSS and sets global typography.

`useState` holds form values, query text, note results, auth state, and loading/error/pending states. `useEffect` loads notes, resolves the auth session, debounces search, and cleans up request timers/subscriptions. Event handlers submit forms, change search, confirm deletion, and toggle pin state. Conditional rendering selects the loading, error, empty, search-empty, pinned, and unpinned views. Forms are controlled and trim/reject blank note fields. `map()` renders cards and `filter()` separates pinned from unpinned results. `async`/`await` handles Supabase authentication and mutations; Dashboard reads and title search use Supabase `select()`/`ilike()`, while create, edit, pin, and delete use Supabase mutations and verify returned rows before updating the UI.

## Requirements completion checklist

- [x] Email/password sign-up, sign-in, sign-out, session loading, and protected note routes are implemented.
- [x] Note requests are scoped to the current user; database RLS policies enforce ownership independently.
- [x] Create, fetch, edit, pin/unpin, and delete use the configured Supabase client.
- [x] The form rejects blank and whitespace-only titles/descriptions; the migration enforces this at the database level too.
- [x] Delete requires an accessible confirmation dialog; cancellation does not call Supabase.
- [x] Search uses a title-only database `ilike()` filter, escapes `%`, `_`, and `\`, debounces input, aborts/invalidate stale requests, and has a clear action.
- [x] Pin/unpin verifies the returned row, scopes the update to note ID and user ID, persists the returned state, keeps search intact, and renders each note in only one section.
- [x] Notes are fetched from Supabase on dashboard load, including after a page refresh.
- [x] Create and edit screens work as client routes when the host serves the SPA fallback.
- [x] Loading, request errors, form validation, no-notes, and no-search-match states are provided.
- [x] Cards wrap long titles/descriptions; the sidebar compacts to icon controls at small widths and the card grid adapts to viewport size.
- [x] Controls use labels, focus styles, keyboard interaction, and accessible dialog semantics.
- [x] Only the project URL and public publishable/anon key are read into the frontend; `.env.local` is ignored.

**External setup still required:** the SQL migration must be applied to your Supabase project, Email authentication and redirect URLs must be configured, and the deployed app must receive its public environment variables and SPA fallback. The remote schema, real email delivery, cross-account isolation, and production hosting were not verified from this repository.

## Manual end-to-end checklist

- [ ] Configure `.env.local`, apply the SQL migration, enable Email auth, and allow the local redirect URL.
- [ ] Create an account with email confirmation enabled; confirm the email and sign in. Also test a bad password and a failed/network sign-in.
- [ ] Sign out and confirm `/`, `/notes/new`, and `/notes/<id>/edit` redirect to sign-in; sign in and confirm the requested route is restored.
- [ ] Create a note with normal text, then try blank and whitespace-only title/description values.
- [ ] Edit the note and verify the saved title and description survive refresh.
- [ ] Pin it, verify the pinned styling and Pinned Notes placement, refresh, then unpin and verify it returns to All Notes.
- [ ] Search by title, including literal `%`, `_`, and `\`; type quickly, clear search, and verify no-results differs from an empty account.
- [ ] Delete a note and cancel; confirm it remains. Delete again and confirm; verify the final note and final pinned note states.
- [ ] Open `/notes/new` and an existing `/notes/<id>/edit` URL directly, including after a production-host refresh.
- [ ] Use a second account to verify it cannot read, edit, pin, or delete the first account's notes.
- [ ] Check the interface at mobile, tablet, and desktop widths; use only the keyboard through navigation, forms, card actions, and the delete dialog.
- [ ] Inspect browser build output and deployment settings to ensure no secret/service-role key is present and the SPA fallback is active.

