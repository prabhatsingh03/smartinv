from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
import logging
from config import Config

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()

# JWT blacklist for v4
blacklisted_tokens = set()

def create_app(config_class=Config):
    """Application factory pattern for creating Flask app instances."""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    # Configure CORS with explicit origin and no credentials (header-based JWT)
    CORS(app,
         origins=app.config.get('CORS_ORIGINS', ['http://localhost:3000', 'http://localhost:3330', 'http://127.0.0.1:3000', 'http://127.0.0.1:3330']),
         supports_credentials=False,
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-Email'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         expose_headers=['Content-Type', 'Authorization'])
    
    # JWT settings are configured in config.py - no need to override here
    
    # Create uploads directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, app.config.get('LOG_LEVEL', 'INFO')),
        format='%(asctime)s %(levelname)s %(name)s %(message)s',
        handlers=[
            logging.FileHandler(app.config.get('LOG_FILE', 'smartinv.log')),
            logging.StreamHandler()
        ]
    )
    
    # Set request size limit for file uploads
    app.config['MAX_CONTENT_LENGTH'] = app.config.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)
    
    # Register blueprints
    from blueprints.auth import auth_bp
    from blueprints.users import users_bp
    from blueprints.invoices import invoices_bp
    from blueprints.notifications import notifications_bp
    from blueprints.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(invoices_bp, url_prefix='/api/invoices')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # JWT blocklist loader for v4
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return jwt_payload['jti'] in blacklisted_tokens
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'message': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'message': 'Authorization token is required'}), 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token has been revoked'}), 401
    
    # Global error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'message': 'Bad request'}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'message': 'Unauthorized'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'message': 'Forbidden'}), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'message': 'Resource not found'}), 404
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'message': 'Internal server error'}), 500
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'SmartInv API is running'})
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5170)
