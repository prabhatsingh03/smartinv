from datetime import datetime

# Import db from app module
try:
    from app import db
except ImportError:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()

class Notification(db.Model):
    """Notification model for in-app notifications."""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=True)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Notification type constants
    TYPE_INVOICE_SUBMITTED = 'invoice_submitted'
    TYPE_INVOICE_APPROVED = 'invoice_approved'
    TYPE_INVOICE_REJECTED = 'invoice_rejected'
    TYPE_INVOICE_UPLOADED = 'invoice_uploaded'
    TYPE_USER_CREATED = 'user_created'
    TYPE_SYSTEM_ALERT = 'system_alert'
    
    TYPE_CHOICES = [
        TYPE_INVOICE_SUBMITTED,
        TYPE_INVOICE_APPROVED,
        TYPE_INVOICE_REJECTED,
        TYPE_INVOICE_UPLOADED,
        TYPE_USER_CREATED,
        TYPE_SYSTEM_ALERT
    ]
    
    def __init__(self, user_id, message, notification_type, invoice_id=None):
        self.user_id = user_id
        self.message = message
        self.notification_type = notification_type
        self.invoice_id = invoice_id
        self.is_read = False
    
    def mark_as_read(self):
        """Mark notification as read."""
        self.is_read = True
    
    def mark_as_unread(self):
        """Mark notification as unread."""
        self.is_read = False
    
    @staticmethod
    def create_invoice_submitted_notification(invoice, finance_users):
        """Create notifications for finance users when invoice is submitted."""
        notifications = []
        for user in finance_users:
            if user.is_finance():
                message = f"New invoice {invoice.invoice_number or invoice.id} submitted by {invoice.uploader.username} for approval"
                notification = Notification(
                    user_id=user.id,
                    message=message,
                    notification_type=Notification.TYPE_INVOICE_SUBMITTED,
                    invoice_id=invoice.id
                )
                notifications.append(notification)
        return notifications
    
    @staticmethod
    def create_invoice_approved_notification(invoice):
        """Create notification for uploader when invoice is approved."""
        message = f"Your invoice {invoice.invoice_number or invoice.id} has been approved"
        return Notification(
            user_id=invoice.uploaded_by,
            message=message,
            notification_type=Notification.TYPE_INVOICE_APPROVED,
            invoice_id=invoice.id
        )
    
    @staticmethod
    def create_invoice_rejected_notification(invoice):
        """Create notification for uploader when invoice is rejected."""
        message = f"Your invoice {invoice.invoice_number or invoice.id} has been rejected. Remarks: {invoice.rejection_remarks or 'No remarks provided'}"
        return Notification(
            user_id=invoice.uploaded_by,
            message=message,
            notification_type=Notification.TYPE_INVOICE_REJECTED,
            invoice_id=invoice.id
        )
    
    @staticmethod
    def create_user_created_notification(user, created_by):
        """Create notification for new user when account is created."""
        message = f"Your account has been created. Username: {user.username}, Role: {user.role}"
        return Notification(
            user_id=user.id,
            message=message,
            notification_type=Notification.TYPE_USER_CREATED
        )
    
    def to_dict(self):
        """Convert notification to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'invoice_id': self.invoice_id,
            'message': self.message,
            'is_read': self.is_read,
            'notification_type': self.notification_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'invoice_number': self.invoice.invoice_number if self.invoice else None
        }
    
    def __repr__(self):
        return f'<Notification {self.id}: {self.message[:50]}...>'
