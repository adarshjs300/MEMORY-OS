import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthLayout } from '../components/AuthLayout';
import { TextField } from '../components/TextField';
import { registerRequest } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, accessToken } = await registerRequest({ email, password, displayName });
      setAuth(user, accessToken);
      navigate('/');
    } catch (err) {
      const message =
        err instanceof AxiosError ? err.response?.data?.error?.message ?? 'Registration failed' : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your memory OS" subtitle="Your private second brain, from today onward">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          label="Name"
          type="text"
          autoComplete="name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-slate-500">
          At least 10 characters, with an uppercase letter, a lowercase letter, and a number.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white
                     transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
