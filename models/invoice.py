from datetime import datetime
from flask import url_for
import json

# Import db from app module
try:
    from app import db
except ImportError:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()

class Invoice(db.Model):
    """Invoice model for storing extracted invoice data."""
    __tablename__ = 'invoices'
    
    # Primary key
    id = db.Column(db.Integer, primary_key=True)
    
    # Workflow fields
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending', nullable=False)
    # New workflow helpers
    priority = db.Column(db.String(10), default='low', nullable=False)
    is_saved = db.Column(db.Boolean, default=False, nullable=False)
    rejection_remarks = db.Column(db.Text, nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    submitted_at = db.Column(db.DateTime, nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    approval_remarks = db.Column(db.Text, nullable=True)
    file_path = db.Column(db.String(500), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Invoice data fields (from required_fields.py)
    s_no = db.Column(db.String(50), nullable=True)
    invoice_date = db.Column(db.Date, nullable=True)
    invoice_number = db.Column(db.String(100), nullable=True, index=True)
    po_number = db.Column(db.String(100), nullable=True)
    gst_number = db.Column(db.String(20), nullable=True)
    vendor_name = db.Column(db.String(200), nullable=True)
    line_item = db.Column(db.Text, nullable=True)
    hsn_sac = db.Column(db.String(20), nullable=True)
    gst_percent = db.Column(db.Float, nullable=True)
    igst_amount = db.Column(db.Float, nullable=True)
    cgst_amount = db.Column(db.Float, nullable=True)
    sgst_amount = db.Column(db.Float, nullable=True)
    basic_amount = db.Column(db.Float, nullable=True)
    total_amount = db.Column(db.Float, nullable=True)
    tds = db.Column(db.Float, nullable=True)
    net_payable = db.Column(db.Float, nullable=True)
    filename = db.Column(db.String(255), nullable=True)
    
    # Additional metadata
    extraction_confidence = db.Column(db.Float, nullable=True)
    extraction_method = db.Column(db.String(50), nullable=True)  # 'openai', 'tesseract', 'fallback'
    raw_text = db.Column(db.Text, nullable=True)
    # Persist user-selected line items as JSON string
    selected_line_items = db.Column(db.Text, nullable=True)
    # Payment tracking
    payment_status = db.Column(db.String(30), nullable=True)  # DUE_NOT_PAID, DUE_PARTIAL, DUE_FULL, NOT_DUE
    amount_paid = db.Column(db.Float, nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    department = db.relationship('Department', backref='invoices', lazy=True)
    uploader = db.relationship('User', foreign_keys=[uploaded_by], lazy=True, overlaps="uploaded_invoices")
    approver = db.relationship('User', foreign_keys=[approved_by], lazy=True, overlaps="approved_invoices")
    notifications = db.relationship('Notification', backref='invoice', lazy=True)
    audit_logs = db.relationship('AuditLog', backref='invoice', lazy=True)
    
    # Status constants
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_DRAFT = 'draft'
    STATUS_EXTRACTED = 'extracted'
    
    STATUS_CHOICES = [STATUS_EXTRACTED, STATUS_DRAFT, STATUS_PENDING, STATUS_APPROVED, STATUS_REJECTED]
    
    def __init__(self, department_id, uploaded_by, **kwargs):
        self.department_id = department_id
        self.uploaded_by = uploaded_by
        # Start lifecycle in extracted state; hidden until explicitly saved
        self.status = self.STATUS_EXTRACTED
        # Defaults for new fields
        self.priority = kwargs.get('priority', 'low')
        self.is_saved = kwargs.get('is_saved', False)
        
        # Normalize selected_line_items to JSON string if provided
        if 'selected_line_items' in kwargs:
            sli = kwargs.get('selected_line_items')
            try:
                if isinstance(sli, (list, dict)):
                    kwargs['selected_line_items'] = json.dumps(sli)
            except Exception:
                pass

        # Set invoice data fields
        for field in ['file_path', 's_no', 'invoice_date', 'invoice_number', 'po_number', 'gst_number', 
                     'vendor_name', 'line_item', 'hsn_sac', 'gst_percent',
                     'igst_amount', 'cgst_amount', 'sgst_amount', 'basic_amount',
                     'total_amount', 'tds', 'net_payable', 'filename',
                     'extraction_confidence', 'extraction_method', 'raw_text', 'selected_line_items',
                     'payment_status', 'amount_paid', 'paid_at']:
            if field in kwargs:
                setattr(self, field, kwargs[field])
    
    def approve(self, approved_by_user_id, remarks=None):
        """Approve the invoice."""
        self.status = self.STATUS_APPROVED
        self.approved_by = approved_by_user_id
        self.approved_at = datetime.utcnow()
        if remarks:
            self.approval_remarks = remarks
    
    def reject(self, rejected_by_user_id, remarks):
        """Reject the invoice with remarks."""
        self.status = self.STATUS_REJECTED
        self.approved_by = rejected_by_user_id
        self.approved_at = datetime.utcnow()
        self.rejection_remarks = remarks
    
    def submit(self):
        """Submit invoice for approval."""
        self.status = self.STATUS_PENDING
        self.submitted_at = datetime.utcnow()

    def save_as_draft(self):
        """Mark invoice as saved draft from extracted state."""
        self.is_saved = True
        self.status = self.STATUS_DRAFT

    def set_priority(self, priority_value: str):
        """Validate and set priority."""
        valid = {'low', 'medium', 'high'}
        if priority_value not in valid:
            raise ValueError('Invalid priority value')
        self.priority = priority_value
    
    def is_pending(self):
        """Check if invoice is pending approval."""
        return self.status == self.STATUS_PENDING
    
    def is_approved(self):
        """Check if invoice is approved."""
        return self.status == self.STATUS_APPROVED
    
    def is_rejected(self):
        """Check if invoice is rejected."""
        return self.status == self.STATUS_REJECTED
    
    def can_be_approved_by(self, user):
        """Check if user can approve this invoice."""
        return user.can_approve_invoices() and self.is_pending()
    
    def can_be_edited_by(self, user):
        """Check if user can edit this invoice."""
        if user.is_super_admin():
            return True
        # Finance & Accounts can make minor edits to invoices that are not approved/rejected
        # Allow edits in extracted, draft, or pending states
        try:
            if user.can_approve_invoices():
                return self.status in [self.STATUS_EXTRACTED, self.STATUS_DRAFT, self.STATUS_PENDING]
        except Exception:
            pass
        # Allow uploader to edit when invoice is in extracted, draft, rejected, or pending status
        if user.id == self.uploaded_by and self.status in [self.STATUS_EXTRACTED, self.STATUS_DRAFT, self.STATUS_REJECTED, self.STATUS_PENDING]:
            return True
        return False
    
    def get_invoice_data_dict(self):
        """Get invoice data as dictionary matching required_fields format."""
        return {
            'S_No': self.s_no,
            'Invoice_Date': self.invoice_date.isoformat() if self.invoice_date else None,
            'Invoice_Number': self.invoice_number,
            'PO_Number': self.po_number,
            'GST_Number': self.gst_number,
            'Vendor_Name': self.vendor_name,
            'Line_Item': self.line_item,
            'HSN_SAC': self.hsn_sac,
            'gst_percent': self.gst_percent,
            'IGST_Amount': self.igst_amount,
            'CGST_Amount': self.cgst_amount,
            'SGST_Amount': self.sgst_amount,
            'Basic_Amount': self.basic_amount,
            'Total_Amount': self.total_amount,
            'TDS': self.tds,
            'Net_Payable': self.net_payable,
            'filename': self.filename
        }
    
    def to_dict(self):
        """Convert invoice to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'uploaded_by': self.uploaded_by,
            'uploader_name': self.uploader.username if self.uploader else None,
            'status': self.status,
            'is_saved': self.is_saved,
            'priority': self.priority,
            'rejection_remarks': self.rejection_remarks,
            'approval_remarks': self.approval_remarks,
            'approved_by': self.approved_by,
            'approver_name': self.approver.username if self.approver else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'file_path': self.file_path,
            'file_url': url_for('invoices.download_file', invoice_id=self.id, _external=True) if self.id else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'invoice_data': self.get_invoice_data_dict(),
            # line_items may be attached at upload-time; keep optional passthrough in response layers
            'extraction_confidence': self.extraction_confidence,
            'extraction_method': self.extraction_method,
            'selected_line_items': (json.loads(self.selected_line_items) if self.selected_line_items else []),
            'payment_status': self.payment_status,
            'amount_paid': self.amount_paid,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None
        }
    
    def __repr__(self):
        return f'<Invoice {self.invoice_number or self.id}>'
