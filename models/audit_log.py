from datetime import datetime
import json

# Import db from app module
try:
    from app import db
except ImportError:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()

class AuditLog(db.Model):
    """Audit log model for tracking all invoice actions."""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    old_values = db.Column(db.Text, nullable=True)  # JSON string
    new_values = db.Column(db.Text, nullable=True)  # JSON string
    remarks = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Action constants
    ACTION_UPLOADED = 'uploaded'
    ACTION_SUBMITTED = 'submitted'
    ACTION_APPROVED = 'approved'
    ACTION_REJECTED = 'rejected'
    ACTION_EDITED = 'edited'
    ACTION_DELETED = 'deleted'
    ACTION_VIEWED = 'viewed'
    ACTION_DOWNLOADED = 'downloaded'
    ACTION_USER_CREATED = 'user_created'
    ACTION_USER_UPDATED = 'user_updated'
    ACTION_USER_DEACTIVATED = 'user_deactivated'
    ACTION_LOGIN = 'login'
    ACTION_LOGOUT = 'logout'
    
    ACTION_CHOICES = [
        ACTION_UPLOADED,
        ACTION_SUBMITTED,
        ACTION_APPROVED,
        ACTION_REJECTED,
        ACTION_EDITED,
        ACTION_DELETED,
        ACTION_VIEWED,
        ACTION_DOWNLOADED,
        ACTION_USER_CREATED,
        ACTION_USER_UPDATED,
        ACTION_USER_DEACTIVATED,
        ACTION_LOGIN,
        ACTION_LOGOUT
    ]
    
    def __init__(self, user_id, action, invoice_id=None, old_values=None, new_values=None, remarks=None):
        self.user_id = user_id
        self.action = action
        self.invoice_id = invoice_id
        self.old_values = json.dumps(old_values) if old_values else None
        self.new_values = json.dumps(new_values) if new_values else None
        self.remarks = remarks
    
    def get_old_values(self):
        """Get old values as dictionary."""
        return json.loads(self.old_values) if self.old_values else None
    
    def get_new_values(self):
        """Get new values as dictionary."""
        return json.loads(self.new_values) if self.new_values else None
    
    def set_old_values(self, values):
        """Set old values from dictionary."""
        self.old_values = json.dumps(values) if values else None
    
    def set_new_values(self, values):
        """Set new values from dictionary."""
        self.new_values = json.dumps(values) if values else None
    
    @staticmethod
    def log_invoice_action(user_id, action, invoice_id=None, old_values=None, new_values=None, remarks=None):
        """Create audit log entry for invoice action."""
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            invoice_id=invoice_id,
            old_values=old_values,
            new_values=new_values,
            remarks=remarks
        )
        return audit_log
    
    @staticmethod
    def log_user_action(user_id, action, target_user_id=None, old_values=None, new_values=None, remarks=None):
        """Create audit log entry for user action."""
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            old_values=old_values,
            new_values=new_values,
            remarks=remarks
        )
        return audit_log
    
    @staticmethod
    def log_system_action(user_id, action, remarks=None):
        """Create audit log entry for system action."""
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            remarks=remarks
        )
        return audit_log
    
    def to_dict(self):
        """Convert audit log to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'user_id': self.user_id,
            'user_name': self.user.username if self.user else None,
            'action': self.action,
            'old_values': self.get_old_values(),
            'new_values': self.get_new_values(),
            'remarks': self.remarks,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'invoice_number': self.invoice.invoice_number if self.invoice else None
        }
    
    def __repr__(self):
        return f'<AuditLog {self.id}: {self.action} by user {self.user_id}>'
