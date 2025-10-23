from datetime import datetime

# Import db from app module
try:
    from app import db
except ImportError:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()

class Department(db.Model):
    """Department model for organizational structure."""
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __init__(self, name, description=None):
        self.name = name
        self.description = description
    
    @staticmethod
    def get_default_departments():
        """Get list of default departments to be created."""
        return [
            {
                'name': 'Maintenance',
                'description': 'Maintenance department responsible for facility upkeep and repairs'
            },
            {
                'name': 'HR',
                'description': 'Human Resources department for employee management'
            },
            {
                'name': 'Site',
                'description': 'Site operations department for field activities'
            },
            {
                'name': 'Procurement',
                'description': 'Procurement department for vendor management and purchasing'
            }
        ]
    
    def to_dict(self):
        """Convert department to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user_count': len(self.users) if hasattr(self, 'users') else 0
        }
    
    def __repr__(self):
        return f'<Department {self.name}>'
