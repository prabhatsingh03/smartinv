from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import check_password_hash
from datetime import datetime
import sys
import os

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.user import User
from models.department import Department
from models.audit_log import AuditLog
from utils.decorators import jwt_required_custom, role_required
from utils.validators import validate_email, validate_password

auth_bp = Blueprint('auth', __name__)

# Import blacklisted_tokens from app
from app import blacklisted_tokens

@auth_bp.route('/register', methods=['POST'])
@role_required('Super Admin')
def register():
    """Register a new user (Super Admin only)."""
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
        current_user_id = get_jwt_identity()
        audit_log = AuditLog.log_user_action(
            user_id=current_user_id,
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

@auth_bp.route('/login', methods=['POST'])
def login():
    """Simple authentication - validate email and password directly."""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'message': 'Account is deactivated'}), 401
        
        # Return user data without JWT tokens for simplified authentication
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'authenticated': True
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Login error: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Simple logout - no JWT required."""
    try:
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        return jsonify({'message': f'Logout error: {str(e)}'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'message': 'User not found or inactive'}), 401
        
        # Create new access token
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'username': user.username,
                'role': user.role,
                'department_id': user.department_id
            }
        )
        
        # Log token refresh
        from app import db
        audit_log = AuditLog.log_system_action(
            user_id=user.id,
            action=AuditLog.ACTION_LOGIN,  # Using LOGIN as closest action
            remarks=f"Token refreshed for user {user.username}"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Token refreshed successfully',
            'access_token': access_token
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Token refresh error: {str(e)}')
        return jsonify({'message': f'Token refresh error: {str(e)}'}), 500

@auth_bp.route('/profile', methods=['POST'])
def get_profile():
    """Get user profile by email - simplified authentication."""
    try:
        data = request.get_json()
        
        if not data or not data.get('email'):
            return jsonify({'message': 'Email is required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching profile: {str(e)}'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required_custom
def change_password():
    """Change user password."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        if not data or not data.get('current_password') or not data.get('new_password'):
            return jsonify({'message': 'Current password and new password are required'}), 400
        
        # Verify current password
        if not user.check_password(data['current_password']):
            return jsonify({'message': 'Current password is incorrect'}), 400
        
        # Validate new password
        is_valid, message = validate_password(data['new_password'])
        if not is_valid:
            return jsonify({'message': message}), 400
        
        # Update password
        user.set_password(data['new_password'])
        
        from app import db
        db.session.commit()
        
        # Log password change
        audit_log = AuditLog.log_user_action(
            user_id=current_user_id,
            action=AuditLog.ACTION_USER_UPDATED,
            old_values={'password': '***'},
            new_values={'password': '***'},
            remarks="Password changed"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        from app import db
        db.session.rollback()
        return jsonify({'message': f'Error changing password: {str(e)}'}), 500

# JWT token blacklist checker
@jwt_required_custom
def check_blacklist():
    """Check if token is blacklisted."""
    jti = get_jwt()['jti']
    return jti in blacklisted_tokens
