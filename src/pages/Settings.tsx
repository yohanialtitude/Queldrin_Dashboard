import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckIcon, GlobeIcon, MinusIcon, MoonIcon, RotateCcwIcon, SunIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Field } from '../components/ui/Field';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { UserAvatar } from '../components/auth/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { company, companyOffices } from '../data/company';
import { permissionLabels, roleDescriptions, rolePermissions, roles } from '../data/options';
import type { Permission, Role } from '../types/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Settings() {
  const { user, updateProfile, can } = useAuth();
  const { theme, setTheme } = useTheme();
  const { simulationOn, setSimulationOn, resetData } = useData();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [errors, setErrors] = useState<{name?: string;email?: string;}>({});
  const [confirmReset, setConfirmReset] = useState(false);
  if (!user) return null;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSavingProfile(true);
    const res = await updateProfile({ name: name.trim(), email: email.trim() });
    setSavingProfile(false);
    res.ok ? toast.success('Profile saved') : toast.error(res.error);
  };

  const changeRole = async (role: Role) => {
    const res = await updateProfile({ role });
    res.ok ? toast.success(`Now previewing as ${role}`) : toast.error(res.error);
  };

  const sectionTitle = 'font-display text-xl font-semibold text-ink';

  return (
    <div>
      <PageHeader eyebrow="Workspace settings" title="Settings" description="Manage your profile, role-based access, appearance and workspace data." />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          <section className="card p-5 sm:p-6" aria-labelledby="profile-title">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={user.name}
                photoURL={user.photoURL}
                imageAlt={`${user.name} profile`}
                className="h-12 w-12 shrink-0 rounded-full border border-line text-sm"
              />
              <div className="min-w-0">
                <h2 id="profile-title" className={sectionTitle}>Profile</h2>
                <p className="truncate text-sm text-ink-soft">{user.email}</p>
                <p className="text-xs text-ink-soft">Signed in with {user.provider === 'google' ? 'Google' : 'email and password'}.</p>
              </div>
            </div>
            <form onSubmit={saveProfile} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="s-name" error={errors.name}>
                <input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Email" htmlFor="s-email" error={errors.email}>
                <input id="s-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </form>
          </section>

          <section className="card" aria-labelledby="role-title">
            <div className="p-5 sm:p-6">
              <h2 id="role-title" className={sectionTitle}>Role-based access</h2>
              <p className="mt-1 text-sm text-ink-soft">Preview each role in this demo workspace. Your current role controls which actions are available.</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {roles.map((r) =>
                <button
                  key={r}
                  type="button"
                  onClick={() => changeRole(r)}
                  aria-pressed={user.role === r}
                  className={`rounded-xl border p-4 text-left transition-colors duration-150 ${user.role === r ? 'border-brand bg-accent-soft' : 'border-line hover:bg-muted'}`}>
                  
                    <span className="flex items-center justify-between text-sm font-semibold text-ink">
                      {r}
                      {user.role === r && <CheckIcon className="h-4 w-4 text-accent" />}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{roleDescriptions[r]}</span>
                  </button>
                )}
              </div>
            </div>
            <div className="table-scroll border-t border-line" role="region" aria-label="Role permission matrix" tabIndex={0}>
              <table>
                <thead className="bg-muted/50">
                  <tr>
                    <th className="th">Permission</th>
                    {roles.map((r) => <th key={r} className="th text-center">{r.replace('Infrastructure ', 'Infra. ')}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(Object.keys(permissionLabels) as Permission[]).map((p) =>
                  <tr key={p}>
                      <td className="td">{permissionLabels[p]}</td>
                      {roles.map((r) =>
                    <td key={r} className="td text-center">
                          {rolePermissions[r].includes(p) ? <CheckIcon className="mx-auto h-4 w-4 text-success" aria-label="Allowed" /> : <MinusIcon className="mx-auto h-4 w-4 text-ink-soft/50" aria-label="Not allowed" />}
                        </td>
                    )}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5 sm:p-6" aria-labelledby="pref-title">
            <h2 id="pref-title" className={sectionTitle}>Preferences</h2>
            <p className="mb-2 mt-5 text-xs font-semibold text-ink-soft">Theme</p>
            <div className="grid grid-cols-2 gap-2">
              {([['light', 'Light', SunIcon], ['dark', 'Dark', MoonIcon]] as const).map(([value, label, Icon]) =>
              <button key={value} type="button" onClick={() => setTheme(value)} aria-pressed={theme === value} className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium ${theme === value ? 'border-brand bg-accent-soft text-ink' : 'border-line text-ink-soft hover:bg-muted'}`}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">Simulated status updates</p>
                <p className="text-xs text-ink-soft">Advance running workloads every 5 seconds</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={simulationOn}
                aria-label="Simulated status updates"
                onClick={() => setSimulationOn(!simulationOn)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ${simulationOn ? 'bg-brand' : 'bg-line'}`}>
                
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform duration-150 ${simulationOn ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="mt-6 border-t border-line pt-5">
              <p className="text-sm font-semibold text-ink">Demo data</p>
              <p className="mt-1 text-xs text-ink-soft">Restore the seeded GPU resources, workloads and allocation records.</p>
              <button type="button" className="btn-secondary mt-3" disabled={!can('manage_settings')} onClick={() => setConfirmReset(true)}>
                <RotateCcwIcon className="h-4 w-4" /> Reset demo data
              </button>
              {!can('manage_settings') && <p className="mt-2 text-xs text-ink-soft">Only administrators can reset workspace data.</p>}
            </div>
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="org-title">
            <h2 id="org-title" className={sectionTitle}>Organization</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
              ['Company', company.name],
              ['Niche', company.niche],
              ['Industry', company.industry],
              ['Founder', company.founder],
              ['Founded', company.founded]].
              map(([k, v]) =>
              <div key={k} className="flex justify-between gap-4">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 space-y-4 border-t border-line pt-5">
              {companyOffices.map((o) =>
              <div key={o.region}>
                  <p className="text-xs font-semibold text-accent">{o.region}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{o.legalName}</p>
                  <p className="text-sm text-ink-soft">{o.address}</p>
                  <a href={`tel:${o.phone.replace(/[^+\d]/g, '')}`} className="text-sm text-ink hover:underline">{o.phone}</a>
                </div>
              )}
              <a href={company.website} target="_blank" rel="noreferrer" className="btn-secondary w-full">
                <GlobeIcon className="h-4 w-4" /> {company.domain}
              </a>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        message="All GPU resources, workloads, allocations, decisions and activity will be restored to the seeded demo records. Your account is not affected."
        confirmLabel="Reset data"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          const result = await resetData();
          if (result.ok) {
            setConfirmReset(false);
            toast.success('Demo data restored');
          } else {
            toast.error(result.error);
          }
        }} />
      
    </div>);

}