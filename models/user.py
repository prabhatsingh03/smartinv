from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import re

# Import db from app module
try:
    from app import db
except ImportError:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()

class User(db.Model):
    """User model for authentication and role management."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='Admin')
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    department = db.relationship('Department', backref='users', lazy=True)
    uploaded_invoices = db.relationship('Invoice', foreign_keys='Invoice.uploaded_by', lazy=True)
    approved_invoices = db.relationship('Invoice', foreign_keys='Invoice.approved_by', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    audit_logs = db.relationship('AuditLog', backref='user', lazy=True)
    
    # Role constants
    ROLES = {
        'ADMIN': 'Admin',
        'HR': 'HR',
        'SITE': 'Site',
        'PROCUREMENT': 'Procurement',
        'FINANCE': 'Finance & Accounts',
        'SUPER_ADMIN': 'Super Admin'
    }
    
    def __init__(self, username, email, password, role='Admin', department_id=None):
        self.username = username
        self.email = email
        self.set_password(password)
        self.role = role
        self.department_id = department_id
    
    def set_password(self, password):
        """Hash and set password."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash."""
        return check_password_hash(self.password_hash, password)
    
    def has_role(self, role):
        """Check if user has specific role."""
        return self.role == role
    
    def is_super_admin(self):
        """Check if user is Super Admin."""
        return self.role == self.ROLES['SUPER_ADMIN']
    
    def is_admin(self):
        """Check if user is Admin."""
        return self.role == self.ROLES['ADMIN']
    
    def is_finance(self):
        """Check if user is Finance & Accounts."""
        return self.role == self.ROLES['FINANCE']
    
    def can_approve_invoices(self):
        """Check if user can approve invoices."""
        return self.role in [self.ROLES['FINANCE'], self.ROLES['SUPER_ADMIN']]
    
    def can_upload_invoices(self):
        """Check if user can upload invoices."""
        return self.role in [self.ROLES['ADMIN'], self.ROLES['SITE'], self.ROLES['PROCUREMENT'], self.ROLES['SUPER_ADMIN']]
    
    def can_manage_users(self):
        """Check if user can manage other users."""
        return self.role == self.ROLES['SUPER_ADMIN']
    
    @staticmethod
    def validate_email(email):
        """Validate email format using validators module."""
        from utils.validators import validate_email as validate_email_func
        return validate_email_func(email)
    
    @staticmethod
    def validate_password(password):
        """Validate password strength using validators module."""
        from utils.validators import validate_password as validate_password_func
        return validate_password_func(password)
    
    def to_dict(self):
        """Convert user to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'
