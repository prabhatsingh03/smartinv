export function hasRole(userRole, allowed) {
    return allowed.includes(userRole);
}
export function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString();
}
