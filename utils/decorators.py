from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import sys
import os

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.user import User

def jwt_required_custom(f):
    """Custom JWT required decorator - simplified to avoid error masking."""
    return jwt_required()(f)

def role_required(*roles):
    """Decorator to require specific user roles."""
    def decorator(f):
        @wraps(f)
        @jwt_required_custom
        def decorated_function(*args, **kwargs):
            try:
                current_user_id = get_jwt_identity()
                user = User.query.get(current_user_id)
                
                if not user:
                    return jsonify({'message': 'User not found'}), 404
                
                if not user.is_active:
                    return jsonify({'message': 'Account is deactivated'}), 401
                
                if user.role not in roles:
                    return jsonify({'message': 'Insufficient permissions'}), 403
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'message': f'Authorization error: {str(e)}'}), 500
        return decorated_function
    return decorator

def department_access(department_id_getter):
    """Decorator to ensure users can only access their department's data."""
    def decorator(f):
        @wraps(f)
        @jwt_required_custom
        def decorated_function(*args, **kwargs):
            try:
                current_user_id = get_jwt_identity()
                user = User.query.get(current_user_id)
                
                if not user:
                    return jsonify({'message': 'User not found'}), 404
                
                if not user.is_active:
                    return jsonify({'message': 'Account is deactivated'}), 401
                
                # Super Admin can access all departments
                if user.is_super_admin():
                    return f(*args, **kwargs)
                
                # Get target department ID from the getter function
                target_department_id = department_id_getter(*args, **kwargs)
                
                # Check if user has department access
                if not user.department_id:
                    return jsonify({'message': 'User not assigned to any department'}), 403
                
                # Check if user's department matches target department
                if user.department_id != target_department_id:
                    return jsonify({'message': 'Access denied - department mismatch'}), 403
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'message': f'Department access error: {str(e)}'}), 500
        return decorated_function
    return decorator

def get_current_user():
    """Get current user from JWT token."""
    try:
        current_user_id = get_jwt_identity()
        return User.query.get(current_user_id)
    except Exception:
        return None

def get_user_permissions(user):
    """Get user permissions based on role."""
    if not user:
        return {}
    
    permissions = {
        'can_upload_invoices': user.can_upload_invoices(),
        'can_approve_invoices': user.can_approve_invoices(),
        'can_manage_users': user.can_manage_users(),
        'is_super_admin': user.is_super_admin(),
        'is_admin': user.is_admin(),
        'is_finance': user.is_finance(),
        'department_id': user.department_id,
        'role': user.role
    }
    
    return permissions

def validate_user_access(user, resource_user_id=None, resource_department_id=None):
    """Validate if user can access a specific resource."""
    if not user:
        return False, 'User not found'
    
    if not user.is_active:
        return False, 'Account is deactivated'
    
    # Super Admin can access everything
    if user.is_super_admin():
        return True, 'Access granted'
    
    # Check if user is accessing their own resource
    if resource_user_id and user.id == resource_user_id:
        return True, 'Access granted'
    
    # Check department access
    if resource_department_id and user.department_id == resource_department_id:
        return True, 'Access granted'
    
    return False, 'Access denied'

def require_permission(permission_func):
    """Decorator to require specific permission function."""
    def decorator(f):
        @wraps(f)
        @jwt_required_custom
        def decorated_function(*args, **kwargs):
            try:
                user = get_current_user()
                if not user:
                    return jsonify({'message': 'User not found'}), 404
                
                if not permission_func(user):
                    return jsonify({'message': 'Insufficient permissions'}), 403
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'message': f'Permission error: {str(e)}'}), 500
        return decorated_function
    return decorator

def validate_request_data(required_fields=None, optional_fields=None):
    """Decorator to validate request data."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                data = request.get_json()
                if not data:
                    return jsonify({'message': 'No data provided'}), 400
                
                # Check required fields
                if required_fields:
                    missing_fields = [field for field in required_fields if field not in data or not data[field]]
                    if missing_fields:
                        return jsonify({'message': f'Missing required fields: {", ".join(missing_fields)}'}), 400
                
                # Check for unknown fields
                if optional_fields:
                    all_fields = set(required_fields or []) | set(optional_fields or [])
                    unknown_fields = [field for field in data.keys() if field not in all_fields]
                    if unknown_fields:
                        return jsonify({'message': f'Unknown fields: {", ".join(unknown_fields)}'}), 400
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'message': f'Validation error: {str(e)}'}), 400
        return decorated_function
    return decorator
