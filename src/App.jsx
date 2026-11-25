import { Navigate, Route, Routes } from "react-router-dom";
import AuthScreen from "./components/AuthScreen.jsx";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import CreateNote from "./pages/CreateNote.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EditNote from "./pages/EditNote.jsx";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ApplicationLayout>
            <Dashboard />
          </ApplicationLayout>
        }
      />
      <Route
        path="/notes/new"
        element={
          <ApplicationLayout>
            <CreateNote />
          </ApplicationLayout>
        }
      />
      <Route
        path="/notes/:id/edit"
        element={
          <ApplicationLayout>
            <EditNote />
          </ApplicationLayout>
        }
      />
      <Route path="/auth" element={<AuthRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthRoute() {
  const { session } = useAuth();
  return session ? <Navigate to="/" replace /> : <AuthScreen />;
}

function ApplicationLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          <main className="w-full flex-1 px-5 py-7 sm:px-8 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
