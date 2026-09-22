import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignupPage } from "./pages/SignupPage";
import { LoginPage } from "./pages/LoginPage";
import { VerifyPage } from "./pages/VerifyPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ContactsPage } from "./pages/ContactsPage";
import { MessagesPage } from "./pages/MessagesPage";
import { CallHistoryPage } from "./pages/CallHistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AppShell } from "./components/Layout/AppShell";
import { CallApp } from "./CallApp";
import { useAuthCheck } from "./hooks/useAuthCheck";
import { useAuthStore } from "./store/authStore";
import { SocketProvider } from "./context/SocketContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);

  if (status === "checking") {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  useAuthCheck();

  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<VerifyPage />} />

          <Route
            path="/call"
            element={
              <ProtectedRoute>
                <CallApp />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:contactId" element={<MessagesPage />} />
            <Route path="/history" element={<CallHistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}