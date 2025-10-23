"""
Simple authentication utilities for the simplified auth system.
"""
from functools import wraps
from flask import request, jsonify
from models.user import User

def get_current_user():
    """Get current user from X-User-Email header."""
    user_email = request.headers.get('X-User-Email')
    if not user_email:
        return None
    
    return User.query.filter_by(email=user_email).first()

def simple_auth_required(f):
    """Decorator for simple authentication - requires X-User-Email header."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'message': 'Authentication required'}), 401
        
        if not user.is_active:
            return jsonify({'message': 'Account is deactivated'}), 401
        
        # Add user to request context for easy access
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated_function

def role_required_simple(required_roles):
    """Decorator for role-based access control with simple auth."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({'message': 'Authentication required'}), 401
            
            if not user.is_active:
                return jsonify({'message': 'Account is deactivated'}), 401
            
            if isinstance(required_roles, str):
                required_roles_list = [required_roles]
            else:
                required_roles_list = required_roles
            
            if user.role not in required_roles_list:
                return jsonify({'message': 'Insufficient permissions'}), 403
            
            request.current_user = user
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
