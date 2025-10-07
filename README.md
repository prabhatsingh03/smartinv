# SmartInv - Invoice Management System

A Flask-based web application for invoice extraction, management, and approval workflow with JWT authentication and role-based access control.

## Features

- **JWT Authentication**: Secure user authentication with role-based access control
- **Role-Based Access Control**: 6 user types (Admin, HR, Site, Procurement, Finance & Accounts, Super Admin)
- **Invoice Management**: Upload, extract, approve, and track invoices
- **Department Management**: Organizational structure with department-based access
- **Audit Trail**: Comprehensive logging of all user actions
- **Notification System**: In-app notifications for invoice status changes
- **Invoice Extraction**: Integration with existing OpenAI-based extraction system

## User Roles

1. **Super Admin**: Full system access, user management
2. **Admin**: Maintenance department operations
3. **HR**: Human resources operations
4. **Site**: Site operations and field activities
5. **Procurement**: Vendor management and purchasing
6. **Finance & Accounts**: Invoice approval and financial operations

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd SmartInv
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   Create a `.env` file with the following variables:
   ```env
   SECRET_KEY=your-secret-key-change-in-production
   JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
   SUPERADMIN_EMAIL=superadmin@smartinv.com
   SUPERADMIN_PASSWORD=SuperAdmin123!
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Initialize the database**:
   ```bash
   python run.py --init-only --seed-sample
   ```

5. **Run the application**:
   ```bash
   python run.py
   ```

## Usage

### Starting the Server

```bash
# Basic startup
python run.py

# Custom host and port
python run.py --host 0.0.0.0 --port 8080

# Production mode
python run.py --env production --no-debug

# Reset database and start fresh
python run.py --reset-db --seed-sample
```

### Default Credentials

- **Super Admin**:
  - Email: `superadmin@smartinv.com`
  - Password: `SuperAdmin123!`
  - Username: `superadmin`

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user (Super Admin only)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password

#### User Management
- `GET /api/users` - List all users (Super Admin only)
- `GET /api/users/<id>` - Get user details
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Deactivate user (Super Admin only)
- `POST /api/users/<id>/activate` - Activate user (Super Admin only)
- `GET /api/users/roles` - Get available roles
- `GET /api/users/departments` - Get all departments

#### Invoice Management
- `GET /api/invoices` - List invoices
- `GET /api/invoices/<id>` - Get invoice details
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/<id>` - Update invoice
- `POST /api/invoices/<id>/submit` - Submit invoice for approval
- `POST /api/invoices/<id>/approve` - Approve invoice (Finance only)
- `POST /api/invoices/<id>/reject` - Reject invoice (Finance only)
- `DELETE /api/invoices/<id>` - Delete invoice (draft only)
- `GET /api/invoices/statuses` - Get available statuses

#### System
- `GET /api/health` - Health check

## Database Management

### Initialize Database
```bash
python database.py init
```

### Reset Database
```bash
python database.py reset
```

### Get Database Statistics
```bash
python database.py stats
```

### Backup Database
```bash
python database.py backup
```

## Project Structure

```
SmartInv/
├── app.py                 # Main Flask application
├── config.py             # Configuration classes
├── database.py           # Database initialization
├── run.py               # Application runner
├── requirements.txt     # Python dependencies
├── models/              # SQLAlchemy models
│   ├── __init__.py
│   ├── user.py
│   ├── department.py
│   ├── invoice.py
│   ├── notification.py
│   └── audit_log.py
├── blueprints/          # Flask blueprints
│   ├── __init__.py
│   ├── auth.py
│   ├── users.py
│   └── invoices.py
├── utils/               # Utility functions
│   ├── __init__.py
│   ├── decorators.py
│   └── validators.py
├── uploads/             # File upload directory
│   └── .gitkeep
└── README.md
```

## Configuration

The application supports multiple environments:

- **Development**: Default configuration with debug mode
- **Production**: Production-ready configuration
- **Testing**: Testing configuration with in-memory database

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Audit logging for all actions
- CORS support for cross-origin requests

## Integration with Existing Code

The Flask application is designed to integrate with the existing invoice extraction system:

- `main_extractor.py` - Main extraction logic
- `text_extractor.py` - Text extraction utilities
- `llm_fallback.py` - LLM fallback extraction
- `required_fields.py` - Invoice field definitions

## Development

### Adding New Features

1. Create new models in `models/` directory
2. Add new blueprints in `blueprints/` directory
3. Update database schema in `database.py`
4. Add utility functions in `utils/` directory

### Testing

```bash
# Run with testing configuration
python run.py --env testing
```

## Troubleshooting

### Common Issues

1. **Database not initialized**: Run `python run.py --init-only`
2. **Permission errors**: Check user roles and department assignments
3. **File upload issues**: Verify upload directory permissions
4. **JWT token errors**: Check JWT_SECRET_KEY configuration

### Logs

Application logs are available in the console output. For production, configure proper logging handlers.

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, contact the development team.
