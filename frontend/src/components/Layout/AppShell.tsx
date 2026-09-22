import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { apiFetch } from "../../lib/api";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/contacts", label: "Contacts" },
  { to: "/messages", label: "Messages" },
  { to: "/history", label: "Call History" },
  { to: "/settings", label: "Settings" },
];

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUnauthenticated();
  };

  return (
    <div className="flex h-screen">
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-border bg-surface p-4">
        <div className="mb-6 flex items-center gap-2 px-2">
          <img src="/logo-icon.png" alt="" className="h-7 w-7 rounded-md" />
          <p className="font-display text-lg text-ink">Realm</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${
                  isActive ? "bg-surface-2 text-ink" : "text-ink-muted hover:bg-surface-2/60"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border pt-3">
          <p className="truncate px-2 text-sm text-ink">{user?.displayName}</p>
          <p className="truncate px-2 text-xs text-ink-muted">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full rounded-md px-3 py-1.5 text-left text-sm text-ink-muted hover:bg-surface-2/60"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}