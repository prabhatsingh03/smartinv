from werkzeug.security import generate_password_hash
from datetime import datetime
import os
import sys

# Add current directory to path to import models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import db from app module
try:
    from app import db
except ImportError:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()

from models.user import User
from models.department import Department
from models.invoice import Invoice
from models.notification import Notification
from models.audit_log import AuditLog

def create_tables():
    """Create all database tables."""
    try:
        db.create_all()
        print("✓ Database tables created successfully")
        return True
    except Exception as e:
        print(f"✗ Error creating database tables: {str(e)}")
        return False

def drop_tables():
    """Drop all database tables."""
    try:
        db.drop_all()
        print("✓ Database tables dropped successfully")
        return True
    except Exception as e:
        print(f"✗ Error dropping database tables: {str(e)}")
        return False

def seed_departments():
    """Seed default departments."""
    try:
        # Check if departments already exist
        if Department.query.count() > 0:
            print("✓ Departments already seeded")
            return True
        
        # Get default departments
        default_departments = Department.get_default_departments()
        
        for dept_data in default_departments:
            department = Department(
                name=dept_data['name'],
                description=dept_data['description']
            )
            db.session.add(department)
        
        db.session.commit()
        print("✓ Default departments seeded successfully")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"✗ Error seeding departments: {str(e)}")
        return False

def seed_super_admin():
    """Seed Super Admin user."""
    try:
        # Check if Super Admin already exists
        super_admin = User.query.filter_by(role=User.ROLES['SUPER_ADMIN']).first()
        if super_admin:
            print("✓ Super Admin already exists")
            return True
        
        # Get Super Admin credentials from environment or use defaults
        super_admin_email = os.environ.get('SUPERADMIN_EMAIL', 'superadmin@smartinv.com')
        super_admin_password = os.environ.get('SUPERADMIN_PASSWORD', 'SuperAdmin123!')
        
        # Create Super Admin user
        super_admin = User(
            username='superadmin',
            email=super_admin_email,
            password=super_admin_password,
            role=User.ROLES['SUPER_ADMIN']
        )
        
        db.session.add(super_admin)
        db.session.commit()
        
        print(f"✓ Super Admin user created successfully")
        print(f"  Email: {super_admin_email}")
        print(f"  Password: {super_admin_password}")
        print(f"  Username: superadmin")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"✗ Error creating Super Admin: {str(e)}")
        return False

def seed_sample_data():
    """Seed sample data for testing."""
    try:
        # Check if sample data already exists
        if User.query.count() > 1:  # More than just Super Admin
            print("✓ Sample data already seeded")
            return True
        
        # Get departments
        maintenance_dept = Department.query.filter_by(name='Maintenance').first()
        hr_dept = Department.query.filter_by(name='HR').first()
        site_dept = Department.query.filter_by(name='Site').first()
        procurement_dept = Department.query.filter_by(name='Procurement').first()
        finance_dept = Department.query.filter_by(name='Finance & Accounts').first()
        
        # Create Finance & Accounts department if it doesn't exist
        if not finance_dept:
            finance_dept = Department(
                name='Finance & Accounts',
                description='Finance and Accounts department for invoice approval'
            )
            db.session.add(finance_dept)
            db.session.commit()
        
        # Create sample users
        sample_users = [
            {
                'username': 'admin1',
                'email': 'admin1@smartinv.com',
                'password': 'Admin123!',
                'role': User.ROLES['ADMIN'],
                'department_id': maintenance_dept.id if maintenance_dept else None
            },
            {
                'username': 'hr1',
                'email': 'hr1@smartinv.com',
                'password': 'Hr123!',
                'role': User.ROLES['HR'],
                'department_id': hr_dept.id if hr_dept else None
            },
            {
                'username': 'site1',
                'email': 'site1@smartinv.com',
                'password': 'Site123!',
                'role': User.ROLES['SITE'],
                'department_id': site_dept.id if site_dept else None
            },
            {
                'username': 'procurement1',
                'email': 'procurement1@smartinv.com',
                'password': 'Procurement123!',
                'role': User.ROLES['PROCUREMENT'],
                'department_id': procurement_dept.id if procurement_dept else None
            },
            {
                'username': 'finance1',
                'email': 'finance1@smartinv.com',
                'password': 'Finance123!',
                'role': User.ROLES['FINANCE'],
                'department_id': finance_dept.id if finance_dept else None
            }
        ]
        
        for user_data in sample_users:
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                role=user_data['role'],
                department_id=user_data['department_id']
            )
            db.session.add(user)
        
        db.session.commit()
        print("✓ Sample users created successfully")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"✗ Error seeding sample data: {str(e)}")
        return False

def initialize_database(seed_sample=False):
    """Initialize database with tables and initial data."""
    print("Initializing database...")
    
    # Create tables
    if not create_tables():
        return False
    
    # Seed departments
    if not seed_departments():
        return False
    
    # Seed Super Admin
    if not seed_super_admin():
        return False
    
    # Seed sample data if requested
    if seed_sample:
        if not seed_sample_data():
            return False
    
    print("✓ Database initialization completed successfully")
    return True

def reset_database():
    """Reset database by dropping and recreating all tables."""
    print("Resetting database...")
    
    # Drop all tables
    if not drop_tables():
        return False
    
    # Recreate tables
    if not create_tables():
        return False
    
    # Seed initial data
    if not seed_departments():
        return False
    
    if not seed_super_admin():
        return False
    
    print("✓ Database reset completed successfully")
    return True

def get_database_stats():
    """Get database statistics."""
    try:
        stats = {
            'users': User.query.count(),
            'departments': Department.query.count(),
            'invoices': Invoice.query.count(),
            'notifications': Notification.query.count(),
            'audit_logs': AuditLog.query.count()
        }
        return stats
    except Exception as e:
        print(f"Error getting database stats: {str(e)}")
        return None

def backup_database():
    """Create a backup of the database (SQLite only)."""
    try:
        from flask import current_app
        db_uri = current_app.config['SQLALCHEMY_DATABASE_URI']
        if db_uri.startswith('sqlite:///'):
            db_path = db_uri.replace('sqlite:///', '')
            backup_path = f"{db_path}.backup"
            
            import shutil
            shutil.copy2(db_path, backup_path)
            print(f"✓ Database backed up to {backup_path}")
            return True
        else:
            print("✗ Database backup only supported for SQLite")
            return False
    except Exception as e:
        print(f"✗ Error backing up database: {str(e)}")
        return False

if __name__ == "__main__":
    # This can be run as a standalone script
    from app import create_app
    
    app = create_app()
    with app.app_context():
        import sys
        
        if len(sys.argv) > 1:
            command = sys.argv[1]
            
            if command == "init":
                initialize_database(seed_sample=True)
            elif command == "reset":
                reset_database()
            elif command == "stats":
                stats = get_database_stats()
                if stats:
                    print("Database Statistics:")
                    for key, value in stats.items():
                        print(f"  {key}: {value}")
            elif command == "backup":
                backup_database()
            else:
                print("Available commands: init, reset, stats, backup")
        else:
            initialize_database(seed_sample=True)
