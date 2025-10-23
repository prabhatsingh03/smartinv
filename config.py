import os
from datetime import timedelta

class Config:
    """Base configuration class."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///smartinv.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_DECODE_LEEWAY = 30  # Tolerate 30s clock skew
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']
    JWT_TOKEN_LOCATION = ['headers']
    JWT_COOKIE_SECURE = False  # Set to True in production with HTTPS
    JWT_COOKIE_CSRF_PROTECT = False  # Set to True if you want CSRF protection
    
    # File Upload Configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'pdf'}  # Only PDF files for invoice processing
    UPLOAD_EXTENSIONS = ALLOWED_EXTENSIONS
    
    # File Processing Configuration
    PROCESSING_TIMEOUT = 300  # 5 minutes timeout for processing
    OCR_ENABLED = True
    LLM_FALLBACK_ENABLED = True
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    
    # Application Settings
    SUPERADMIN_EMAIL = os.environ.get('SUPERADMIN_EMAIL') or 'superadmin@smartinv.com'
    SUPERADMIN_PASSWORD = os.environ.get('SUPERADMIN_PASSWORD') or 'SuperAdmin123@'
    
    # Pagination
    POSTS_PER_PAGE = 20
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3330,http://127.0.0.1:3000,http://127.0.0.1:3330').split(',')
    
    # Request Configuration
    JSON_SORT_KEYS = False
    JSONIFY_PRETTYPRINT_REGULAR = True
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', 'smartinv.log')

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or 'sqlite:///smartinv_dev.db'

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///smartinv_prod.db'
    
    # Override with environment variables for production
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    SECRET_KEY = os.environ.get('SECRET_KEY')
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    SUPERADMIN_EMAIL = os.environ.get('SUPERADMIN_EMAIL')
    SUPERADMIN_PASSWORD = os.environ.get('SUPERADMIN_PASSWORD')
    
    # Production-specific JWT settings
    # JWT_COOKIE_SECURE = True  # Not using cookie-based auth
    # JWT_COOKIE_CSRF_PROTECT = True  # Not using cookie-based auth
    
    # CORS settings for production
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3330,http://127.0.0.1:3000,http://127.0.0.1:3330').split(',')

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
