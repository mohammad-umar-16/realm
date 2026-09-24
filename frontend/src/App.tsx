import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignupPage } from "./pages/SignupPage";
import { LoginPage } from "./pages/LoginPage";
import { VerifyPage } from "./pages/VerifyPage";
import { AppShell } from "./components/Layout/AppShell";
import { useAuthCheck } from "./hooks/useAuthCheck";
import { useAuthStore } from "./store/authStore";
import { SocketProvider } from "./context/SocketContext";
import { DmNotifications } from "./components/DmNotifications";

const CallApp = lazy(() => import("./CallApp").then((m) => ({ default: m.CallApp })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ContactsPage = lazy(() => import("./pages/ContactsPage").then((m) => ({ default: m.ContactsPage })));
const MessagesPage = lazy(() => import("./pages/MessagesPage").then((m) => ({ default: m.MessagesPage })));
const CallHistoryPage = lazy(() => import("./pages/CallHistoryPage").then((m) => ({ default: m.CallHistoryPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

function RouteFallback() {
  return <div className="flex h-screen items-center justify-center text-ink-muted">Loading…</div>;
}

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
        <DmNotifications />
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
      </SocketProvider>
    </BrowserRouter>
  );
}