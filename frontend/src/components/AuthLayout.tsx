import type { ReactNode } from 'react';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9Zm0 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6 shadow-xl shadow-black/20">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">Digital Memory OS — Remember everything.</p>
      </div>
    </div>
  );
}
