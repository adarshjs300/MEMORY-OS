import { useAuthStore } from '../store/authStore';
import { logoutRequest } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  async function handleLogout() {
    await logoutRequest();
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="flex items-center justify-between border-b border-ink-700 px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Digital Memory OS</h1>
          <p className="text-xs text-slate-500">Remember everything. Understand anything. Forget nothing.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user?.displayName}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-ink-800"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9Zm0 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-slate-100">
          Welcome, {user?.displayName?.split(' ')[0] ?? 'there'}.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
          Phase 1 (authentication) is complete and this dashboard is protected by it. Memory capture, search, the
          knowledge graph, and AI chat land in the phases that follow.
        </p>
      </main>
    </div>
  );
}
