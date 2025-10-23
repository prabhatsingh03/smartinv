#!/usr/bin/env python3
"""
SmartInv Flask Application Runner

This script initializes and runs the SmartInv Flask application.
It handles database initialization, environment setup, and server startup.
"""

import os
import sys
import argparse
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

def setup_environment():
    """Setup environment variables and configuration."""
    # Set default environment variables if not already set
    if not os.environ.get('JWT_SECRET_KEY'):
        os.environ['JWT_SECRET_KEY'] = 'your-jwt-secret-key-change-in-production'
    
    if not os.environ.get('SECRET_KEY'):
        os.environ['SECRET_KEY'] = 'your-secret-key-change-in-production'
    
    if not os.environ.get('SUPERADMIN_EMAIL'):
        os.environ['SUPERADMIN_EMAIL'] = 'superadmin@smartinv.com'
    
    if not os.environ.get('SUPERADMIN_PASSWORD'):
        os.environ['SUPERADMIN_PASSWORD'] = 'SuperAdmin123!'
    
    # OpenAI API key (required for invoice extraction)
    if not os.environ.get('OPENAI_API_KEY'):
        print("⚠️  Warning: OPENAI_API_KEY not set. Invoice extraction will not work.")
        print("   Set OPENAI_API_KEY environment variable or create .env file")
    
    print("✓ Environment variables configured")

def initialize_database(app, reset=False, seed_sample=False):
    """Initialize database with tables and initial data."""
    from database import initialize_database, reset_database
    
    with app.app_context():
        if reset:
            print("Resetting database...")
            if not reset_database():
                print("✗ Failed to reset database")
                return False
        else:
            print("Initializing database...")
            if not initialize_database(seed_sample=seed_sample):
                print("✗ Failed to initialize database")
                return False
        
        print("✓ Database initialization completed")
        return True

def create_app_instance(environment='development'):
    """Create Flask app instance with specified environment."""
    from app import create_app
    from config import config
    
    # Get configuration class
    config_class = config.get(environment, config['default'])
    
    # Create app instance
    app = create_app(config_class)
    
    print(f"✓ Flask app created with {environment} configuration")
    return app

def run_development_server(app, host='0.0.0.0', port=5170, debug=True):
    """Run Flask development server."""
    print(f"Starting SmartInv Flask application...")
    print(f"Environment: Development")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Debug: {debug}")
    print(f"URL: http://{host}:{port}")
    print(f"API Base: http://{host}:{port}/api")
    print("\n" + "="*50)
    print("SmartInv API Endpoints:")
    print("="*50)
    print("Authentication:")
    print("  POST /api/auth/register     - Register new user (Super Admin only)")
    print("  POST /api/auth/login        - User login")
    print("  POST /api/auth/logout       - User logout")
    print("  POST /api/auth/refresh      - Refresh JWT token")
    print("  GET  /api/auth/profile      - Get user profile")
    print("  POST /api/auth/change-password - Change password")
    print("\nUser Management:")
    print("  GET    /api/users           - List all users (Super Admin only)")
    print("  GET    /api/users/<id>      - Get user details")
    print("  PUT    /api/users/<id>      - Update user")
    print("  DELETE /api/users/<id>      - Deactivate user (Super Admin only)")
    print("  POST   /api/users/<id>/activate - Activate user (Super Admin only)")
    print("  GET    /api/users/roles     - Get available roles")
    print("  GET    /api/users/departments - Get all departments")
    print("\nInvoice Management:")
    print("  GET    /api/invoices        - List invoices")
    print("  GET    /api/invoices/<id>   - Get invoice details")
    print("  POST   /api/invoices        - Create new invoice")
    print("  PUT    /api/invoices/<id>   - Update invoice")
    print("  POST   /api/invoices/<id>/submit - Submit invoice for approval")
    print("  POST   /api/invoices/<id>/approve - Approve invoice (Finance only)")
    print("  POST   /api/invoices/<id>/reject  - Reject invoice (Finance only)")
    print("  DELETE /api/invoices/<id>   - Delete invoice (draft only)")
    print("  GET    /api/invoices/statuses - Get available statuses")
    print("\nSystem:")
    print("  GET    /api/health          - Health check")
    print("="*50)
    print("\nDefault Super Admin Credentials:")
    print(f"  Email: {os.environ.get('SUPERADMIN_EMAIL', 'superadmin@smartinv.com')}")
    print(f"  Password: {os.environ.get('SUPERADMIN_PASSWORD', 'SuperAdmin123!')}")
    print("="*50)
    print("\nPress Ctrl+C to stop the server")
    print("="*50)
    
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        print("\n\n✓ Server stopped by user")
    except Exception as e:
        print(f"\n✗ Server error: {str(e)}")
        sys.exit(1)

def main():
    """Main function to run the application."""
    parser = argparse.ArgumentParser(description='SmartInv Flask Application Runner')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=5170, help='Port to bind to (default: 5170)')
    parser.add_argument('--env', default='development', choices=['development', 'production', 'testing'],
                       help='Environment configuration (default: development)')
    parser.add_argument('--debug', action='store_true', default=True, help='Enable debug mode (default: True)')
    parser.add_argument('--no-debug', action='store_false', dest='debug', help='Disable debug mode')
    parser.add_argument('--reset-db', action='store_true', help='Reset database before starting')
    parser.add_argument('--seed-sample', action='store_true', help='Seed sample data for testing')
    parser.add_argument('--init-only', action='store_true', help='Only initialize database, do not start server')
    
    args = parser.parse_args()
    
    print("SmartInv Flask Application")
    print("=" * 30)
    
    # Setup environment
    setup_environment()
    
    # Create app instance
    app = create_app_instance(args.env)
    
    # Initialize database
    if not initialize_database(app, reset=args.reset_db, seed_sample=args.seed_sample):
        print("✗ Database initialization failed. Exiting.")
        sys.exit(1)
    
    # If init-only flag is set, exit after initialization
    if args.init_only:
        print("✓ Database initialization completed. Exiting as requested.")
        return
    
    # Run development server
    run_development_server(
        app, 
        host=args.host, 
        port=args.port, 
        debug=args.debug
    )

if __name__ == '__main__':
    main()
