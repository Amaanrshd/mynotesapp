import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute() {
  const { session, loading, sessionError } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <p role="status" className="text-sm text-slate-600">
          Checking your session...
        </p>
      </main>
    );
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div
          role="alert"
          className="max-w-lg rounded-xl border border-rose-200 bg-white p-6 text-sm leading-6 text-rose-800 shadow-sm"
        >
          <p>Unable to verify your sign-in session: {sessionError}</p>
          <Link
            to="/auth"
            className="mt-4 inline-flex rounded-sm font-semibold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
