"""Validation utilities for invoice workflow operations and permissions."""

from typing import Tuple, Optional
from models.invoice import Invoice
from models.user import User


def ensure_can_submit(invoice: Invoice, user: User) -> Tuple[bool, str]:
    if user is None or not user.is_active:
        return False, 'Invalid or inactive user'
    # Uploader or Super Admin can submit when not already pending
    if invoice.is_pending():
        return False, 'Invoice already pending approval'
    if user.is_super_admin() or user.id == invoice.uploaded_by:
        return True, 'OK'
    return False, 'Only uploader or Super Admin can submit'


def ensure_can_approve(invoice: Invoice, user: User) -> Tuple[bool, str]:
    if user is None or not user.is_active:
        return False, 'Invalid or inactive user'
    if not user.can_approve_invoices():
        return False, 'Only Finance & Accounts or Super Admin can approve/reject'
    if not invoice.is_pending():
        return False, 'Only pending invoices can be approved/rejected'
    return True, 'OK'


def ensure_can_update(invoice: Invoice, user: User) -> Tuple[bool, str]:
    if user is None or not user.is_active:
        return False, 'Invalid or inactive user'
    
    # Check if user can edit the invoice
    if not invoice.can_be_edited_by(user):
        # Provide more specific error messages based on the reason
        if invoice.is_approved():
            return False, 'Cannot edit approved invoices'
        elif invoice.is_rejected():
            return False, 'Cannot edit rejected invoices'
        elif user.department_id != invoice.department_id and not user.is_super_admin():
            return False, 'You do not have permission to edit invoices from other departments'
        elif user.id != invoice.uploaded_by and not user.is_super_admin():
            return False, 'You can only edit invoices that you uploaded'
        else:
            return False, 'You cannot edit this invoice in its current status'
    
    return True, 'OK'


def ensure_valid_rejection(remarks: Optional[str]) -> Tuple[bool, str]:
    if not remarks or not remarks.strip():
        return False, 'Rejection remarks are required'
    return True, 'OK'


