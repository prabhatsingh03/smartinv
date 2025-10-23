from flask import Blueprint, request, jsonify
import sys
import os

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.user import User
from models.department import Department
from models.audit_log import AuditLog
from utils.simple_auth import simple_auth_required, role_required_simple
from utils.validators import validate_email, validate_password

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['POST'])
@role_required_simple('Super Admin')
def create_user():
    """Create a new user (Super Admin only)."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'role']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Validate password strength
        is_valid, message = validate_password(data['password'])
        if not is_valid:
            return jsonify({'message': message}), 400
        
        # Validate role
        valid_roles = list(User.ROLES.values())
        if data['role'] not in valid_roles:
            return jsonify({'message': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists'}), 409
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 409
        
        # Get department if specified
        department_id = None
        if 'department_id' in data and data['department_id']:
            department = Department.query.get(data['department_id'])
            if not department:
                return jsonify({'message': 'Department not found'}), 404
            department_id = department.id
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            role=data['role'],
            department_id=department_id
        )
        
        from app import db
        db.session.add(user)
        db.session.commit()
        
        # Log user creation
        current_user = request.current_user
        audit_log = AuditLog.log_user_action(
            user_id=current_user.id,
            action=AuditLog.ACTION_USER_CREATED,
            new_values=user.to_dict(),
            remarks=f"Created user {user.username} with role {user.role}"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'message': f'Error creating user: {str(e)}'}), 500

@users_bp.route('/', methods=['GET'])
@role_required_simple('Super Admin')
def get_all_users():
    """Get all users (Super Admin only)."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        role_filter = request.args.get('role')
        department_filter = request.args.get('department_id', type=int)
        search = request.args.get('search')
        
        # Build query
        query = User.query
        
        # Apply filters
        if role_filter:
            query = query.filter(User.role == role_filter)
        
        if department_filter:
            query = query.filter(User.department_id == department_filter)
        
        if search:
            query = query.filter(
                (User.username.contains(search)) |
                (User.email.contains(search))
            )
        
        # Paginate results
        users = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching users: {str(e)}'}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@simple_auth_required
def get_user(user_id):
    """Get specific user details."""
    try:
        current_user = request.current_user
        
        # Users can view their own profile, Super Admin can view all
        if current_user.id != user_id and not current_user.is_super_admin():
            return jsonify({'message': 'Access denied'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching user: {str(e)}'}), 500

@users_bp.route('/<int:user_id>', methods=['PUT'])
@simple_auth_required
def update_user(user_id):
    """Update user details."""
    try:
        current_user = request.current_user
        
        # Users can update their own profile, Super Admin can update all
        if current_user.id != user_id and not current_user.is_super_admin():
            return jsonify({'message': 'Access denied'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        # Store old values for audit log
        old_values = user.to_dict()
        
        # Update allowed fields
        if 'email' in data:
            if not validate_email(data['email']):
                return jsonify({'message': 'Invalid email format'}), 400
            
            # Check if email already exists
            existing_user = User.query.filter(
                User.email == data['email'],
                User.id != user_id
            ).first()
            if existing_user:
                return jsonify({'message': 'Email already exists'}), 409
            
            user.email = data['email']
        
        if 'username' in data:
            # Check if username already exists
            existing_user = User.query.filter(
                User.username == data['username'],
                User.id != user_id
            ).first()
            if existing_user:
                return jsonify({'message': 'Username already exists'}), 409
            
            user.username = data['username']
        
        # Only Super Admin can change role and department
        if current_user.is_super_admin():
            if 'role' in data:
                valid_roles = list(User.ROLES.values())
                if data['role'] not in valid_roles:
                    return jsonify({'message': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}), 400
                user.role = data['role']
            
            if 'department_id' in data:
                if data['department_id']:
                    department = Department.query.get(data['department_id'])
                    if not department:
                        return jsonify({'message': 'Department not found'}), 404
                user.department_id = data['department_id']
            
            if 'is_active' in data:
                user.is_active = data['is_active']
            
            # Super Admin can set a new password directly
            if 'password' in data and data['password']:
                is_valid, message = validate_password(data['password'])
                if not is_valid:
                    return jsonify({'message': message}), 400
                user.set_password(data['password'])
        
        from app import db
        db.session.commit()
        
        # Log user update
        audit_log = AuditLog.log_user_action(
            user_id=current_user.id,
            action=AuditLog.ACTION_USER_UPDATED,
            old_values=old_values,
            new_values=user.to_dict(),
            remarks=f"Updated user {user.username}"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'message': f'Error updating user: {str(e)}'}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@role_required_simple('Super Admin')
def deactivate_user(user_id):
    """Deactivate user (Super Admin only)."""
    try:
        current_user = request.current_user
        
        # Cannot deactivate self
        if current_user.id == user_id:
            return jsonify({'message': 'Cannot deactivate your own account'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Store old values for audit log
        old_values = user.to_dict()
        
        # Deactivate user
        user.is_active = False
        
        from app import db
        db.session.commit()
        
        # Log user deactivation
        audit_log = AuditLog.log_user_action(
            user_id=current_user.id,
            action=AuditLog.ACTION_USER_DEACTIVATED,
            old_values=old_values,
            new_values=user.to_dict(),
            remarks=f"Deactivated user {user.username}"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({'message': 'User deactivated successfully'}), 200
        
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'message': f'Error deactivating user: {str(e)}'}), 500

@users_bp.route('/<int:user_id>/activate', methods=['POST'])
@role_required_simple('Super Admin')
def activate_user(user_id):
    """Activate user (Super Admin only)."""
    try:
        current_user = request.current_user
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Store old values for audit log
        old_values = user.to_dict()
        
        # Activate user
        user.is_active = True
        
        from app import db
        db.session.commit()
        
        # Log user activation
        audit_log = AuditLog.log_user_action(
            user_id=current_user.id,
            action=AuditLog.ACTION_USER_UPDATED,
            old_values=old_values,
            new_values=user.to_dict(),
            remarks=f"Activated user {user.username}"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({'message': 'User activated successfully'}), 200
        
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'message': f'Error activating user: {str(e)}'}), 500

@users_bp.route('/roles', methods=['GET'])
@simple_auth_required
def get_roles():
    """Get available user roles."""
    try:
        return jsonify({
            'roles': list(User.ROLES.values())
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching roles: {str(e)}'}), 500

@users_bp.route('/departments', methods=['GET'])
@simple_auth_required
def get_departments():
    """Get all departments."""
    try:
        departments = Department.query.all()
        return jsonify({
            'departments': [dept.to_dict() for dept in departments]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching departments: {str(e)}'}), 500
