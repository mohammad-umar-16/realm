import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, MessagesSquare, History, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { apiFetch } from "../../lib/api";
import { Avatar } from "../ui/Avatar";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/messages", label: "Messages", icon: MessagesSquare },
  { to: "/history", label: "Call History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUnauthenticated();
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <div className="flex items-center justify-between border-b border-border bg-surface p-3 lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="" className="h-6 w-6 rounded-md" />
          <span className="font-display text-ink">Realm</span>
        </div>
        <button onClick={handleLogout} aria-label="Log out" className="text-ink-muted transition-colors hover:text-ink">
          <LogOut className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-border bg-surface p-4 lg:flex">
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
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-surface-2 text-ink" : "text-ink-muted hover:bg-surface-2/60 hover:text-ink"
                }`
              }
            >
              <item.icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Avatar name={user?.displayName ?? "?"} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{user?.displayName}</p>
            <p className="truncate text-xs text-ink-muted">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="text-ink-muted transition-colors hover:text-ink"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface lg:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                isActive ? "text-primary-light" : "text-ink-muted"
              }`
            }
          >
            <item.icon className="h-5 w-5" strokeWidth={1.75} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}