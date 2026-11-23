export type Role = 'Administrator' | 'Infrastructure Manager' | 'Engineer' | 'Viewer';

export type Permission =
'manage_resources' |
'manage_workloads' |
'schedule' |
'manage_allocations' |
'manage_settings';

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  role: Role;
  provider: 'password' | 'google';
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}