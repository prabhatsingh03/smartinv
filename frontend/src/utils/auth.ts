import type { Role, RoleCompat, BackendRole, DecodedToken } from '@types';

export function normalizeRole(raw: string): RoleCompat {
  const map: Record<string, RoleCompat> = {
    'Super Admin': 'SUPER_ADMIN',
    'Admin': 'ADMIN',
    'Site': 'SITE',
    'Procurement': 'PROCUREMENT',
    'HR': 'HR',
    'Finance & Accounts': 'FINANCE',
    // Already normalized fallbacks
    'SUPER_ADMIN': 'SUPER_ADMIN',
    'ADMIN': 'ADMIN',
    'SITE': 'SITE',
    'PROCUREMENT': 'PROCUREMENT',
    'FINANCE': 'FINANCE'
  };
  return map[raw] ?? (raw as Role);
}

export function decodeRole(token?: string | null): RoleCompat | undefined {
  if (!token) return undefined;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return undefined;
    const payload = parts[1];
    const json = atob(payload);
    const obj = JSON.parse(json) as Partial<DecodedToken> & { role?: BackendRole | RoleCompat };
    return obj.role ? normalizeRole(obj.role as string) : undefined;
  } catch {
    return undefined;
  }
}

export function decodeUserId(token?: string | null): number | string | undefined {
  if (!token) return undefined;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return undefined;
    const payload = parts[1];
    const json = atob(payload);
    const obj = JSON.parse(json) as Partial<DecodedToken>;
    return obj.sub as any;
  } catch {
    return undefined;
  }
}


