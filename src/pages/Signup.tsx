import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2Icon } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { GoogleButton } from '../components/auth/GoogleButton';
import { useAuth } from '../contexts/AuthContext';
import { roles } from '../data/options';
import type { Role } from '../types/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm' | 'terms' | 'form', string>>;

function strength(pw: string): {score: number;label: string;} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return { score, label: ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score] };
}

export function Signup() {
  const { signup, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<Role>('Engineer');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const pw = strength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    if (!terms) next.terms = 'Accept the terms to continue.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const res = await signup({ name, email, password, role });
    setLoading(false);
    if (!res.ok) return setErrors({ form: res.error });
    toast.success('Account created. Your workspace is ready.');
    navigate('/app', { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const res = await googleSignIn();
    setLoading(false);
    if (!res.ok) return setErrors({ form: res.error });
    toast.success('Signed in with Google.');
    navigate('/app', { replace: true });
  };

  const bar = ['bg-[#d9c3a3]', 'bg-[#b83a2e]', 'bg-[#a86c12]', 'bg-[#3a608e]', 'bg-[#287452]'][pw.score];

  return (
    <AuthLayout>
      <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Create your workspace</h2>
      <p className="mt-2 text-sm text-[#6e5644]">Start organizing GPU resources and AI workload queues for your team.</p>

      <div className="mt-8">
        <GoogleButton label="Sign up with Google" onClick={handleGoogle} disabled={loading} />
      </div>
      <div className="my-6 flex items-center gap-3 text-xs text-[#6e5644]">
        <span className="h-px flex-1 bg-[#e8d8c0]" /> or sign up with email <span className="h-px flex-1 bg-[#e8d8c0]" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.form &&
        <div role="alert" className="rounded-xl border border-[#b83a2e]/25 bg-[#b83a2e]/5 px-3.5 py-2.5 text-sm text-[#b83a2e]">
            {errors.form}
          </div>
        }
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" className="input h-11" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
            {errors.name && <p className="mt-1.5 text-xs font-medium text-danger">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="role" className="label">Role</label>
            <select id="role" className="input h-11" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {roles.map((r) =>
              <option key={r}>{r}</option>
              )}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="email" className="label">Work email</label>
          <input id="email" type="email" className="input h-11" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          {errors.email && <p className="mt-1.5 text-xs font-medium text-danger">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" className="input h-11" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          {password &&
          <div className="mt-2 flex items-center gap-3">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) =>
              <span key={i} className={`h-1 flex-1 rounded-full ${i < pw.score ? bar : 'bg-[#eadbc4]'}`} />
              )}
              </div>
              <span className="text-xs text-[#6e5644]">{pw.label}</span>
            </div>
          }
          {errors.password && <p className="mt-1.5 text-xs font-medium text-danger">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm password</label>
          <input id="confirm" type="password" className="input h-11" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {errors.confirm && <p className="mt-1.5 text-xs font-medium text-danger">{errors.confirm}</p>}
        </div>
        <div>
          <label className="flex items-start gap-2.5 text-sm text-[#6e5644]">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-[#543320]" />
            <span>
              I agree to the Queldrin terms of service and{' '}
              <a
                href="https://queldrin.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#543320] underline underline-offset-2 hover:text-[#7a4b2b]">
                privacy policy
              </a>
              .
            </span>
          </label>
          {errors.terms && <p className="mt-1.5 text-xs font-medium text-danger">{errors.terms}</p>}
        </div>
        <button type="submit" className="btn-primary h-11 w-full" disabled={loading}>
          {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#6e5644]">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-[#543320] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>);

}