export function validateRemarks(remarks) {
    if (!remarks || !remarks.trim())
        return 'Remarks are required';
    if (remarks.trim().length < 5)
        return 'Remarks must be at least 5 characters';
    return undefined;
}
export function canApprove(role) {
    return role === 'FINANCE' || role === 'SUPER_ADMIN';
}
export function isApprovable(status) {
    return status === 'PENDING_REVIEW' || status === 'SUBMITTED' || status === 'UPLOADED';
}
