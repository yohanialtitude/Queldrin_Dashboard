import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { GoogleButton } from '../components/auth/GoogleButton';
import { useAuth } from '../contexts/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login() {
  const { login, googleSignIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as {from?: string;} | null)?.from ?? '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{email?: string;password?: string;form?: string;}>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) return setErrors({ form: res.error });
    toast.success('Signed in. Welcome back to Queldrin.');
    navigate(from, { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const res = await googleSignIn();
    setLoading(false);
    if (!res.ok) return setErrors({ form: res.error });
    toast.success('Signed in with Google.');
    navigate(from, { replace: true });
  };

  const handleForgot = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setErrors({ email: 'Enter your email first so we can send a reset link.' });
      return;
    }
    setLoading(true);
    const res = await resetPassword(email);
    setLoading(false);
    if (!res.ok) return setErrors({ form: res.error });
    toast.success(`Password reset link sent to ${email.trim()}`);
  };

  return (
    <AuthLayout>
      <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back</h2>
      <p className="mt-2 text-sm text-[#6e5644]">Sign in to manage GPU resources, workload queues and allocations.</p>

      <div className="mt-8">
        <GoogleButton label="Sign in with Google" onClick={handleGoogle} disabled={loading} />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-[#6e5644]">
        <span className="h-px flex-1 bg-[#e8d8c0]" /> or continue with email <span className="h-px flex-1 bg-[#e8d8c0]" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.form &&
        <div role="alert" className="rounded-xl border border-[#b83a2e]/25 bg-[#b83a2e]/5 px-3.5 py-2.5 text-sm text-[#b83a2e]">
            {errors.form}
          </div>
        }
        <div>
          <label htmlFor="email" className="label">Work email</label>
          <input id="email" type="email" autoComplete="email" className="input h-11" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
          {errors.email && <p className="mt-1.5 text-xs font-medium text-danger">{errors.email}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">Password</label>
            <button type="button" onClick={handleForgot} disabled={loading} className="mb-1.5 text-xs font-semibold text-[#543320] hover:underline disabled:opacity-60">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="input h-11 pr-11" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-1.5 top-1.5 rounded-lg p-2 text-[#6e5644] hover:bg-[#f4e9d8]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs font-medium text-danger">{errors.password}</p>}
        </div>
        <button type="submit" className="btn-primary h-11 w-full" disabled={loading}>
          {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#6e5644]">
        New to Queldrin?{' '}
        <Link to="/signup" className="font-semibold text-[#543320] hover:underline">
          Create an account
        </Link>
      </p>

    </AuthLayout>);

}