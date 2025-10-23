export function normalizeRole(raw) {
    const map = {
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
    return map[raw] ?? raw;
}
// Legacy JWT functions (kept for backward compatibility)
export function decodeRole(token) {
    if (!token)
        return undefined;
    try {
        const parts = token.split('.');
        if (parts.length < 2)
            return undefined;
        const payload = parts[1];
        const json = atob(payload);
        const obj = JSON.parse(json);
        return obj.role ? normalizeRole(obj.role) : undefined;
    }
    catch {
        return undefined;
    }
}
export function decodeUserId(token) {
    if (!token)
        return undefined;
    try {
        const parts = token.split('.');
        if (parts.length < 2)
            return undefined;
        const payload = parts[1];
        const json = atob(payload);
        const obj = JSON.parse(json);
        return obj.sub;
    }
    catch {
        return undefined;
    }
}
// New simplified auth functions
export function getCurrentUserRole() {
    const userStr = localStorage.getItem('user');
    if (!userStr)
        return undefined;
    try {
        const user = JSON.parse(userStr);
        return user.role ? normalizeRole(user.role) : undefined;
    }
    catch {
        return undefined;
    }
}
export function getCurrentUserId() {
    const userStr = localStorage.getItem('user');
    if (!userStr)
        return undefined;
    try {
        const user = JSON.parse(userStr);
        return user.id;
    }
    catch {
        return undefined;
    }
}
