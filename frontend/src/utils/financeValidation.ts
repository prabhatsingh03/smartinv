export function validateRemarks(remarks: string): string | undefined {
  if (!remarks || !remarks.trim()) return 'Remarks are required';
  if (remarks.trim().length < 5) return 'Remarks must be at least 5 characters';
  return undefined;
}

export function canApprove(role?: string): boolean {
  return role === 'FINANCE' || role === 'SUPER_ADMIN';
}

export function isApprovable(status?: string): boolean {
  return status === 'PENDING_REVIEW' || status === 'SUBMITTED' || status === 'UPLOADED';
}


