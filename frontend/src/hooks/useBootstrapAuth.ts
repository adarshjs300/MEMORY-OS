import { useEffect } from 'react';
import { apiClient } from '../api/client';
import { meRequest } from '../api/auth';
import { useAuthStore } from '../store/authStore';

/**
 * On app load, try to silently refresh using the httpOnly cookie. If it
 * succeeds we fetch /me and populate the store; if not, the user is simply
 * unauthenticated (not an error state).
 */
export function useBootstrapAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== 'idle') return;

    (async () => {
      try {
        const { data } = await apiClient.post('/api/auth/refresh');
        const { user } = await meRequest();
        setAuth(user, data.accessToken);
      } catch {
        clearAuth();
      }
    })();
  }, [status, setAuth, clearAuth]);

  return status;
}
