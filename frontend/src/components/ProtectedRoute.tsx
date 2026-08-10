import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useBootstrapAuth } from '../hooks/useBootstrapAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useBootstrapAuth();

  if (status === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 text-sm text-slate-500">
        Loading your memory…
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
