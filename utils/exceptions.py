"""
Custom exception classes for invoice processing and file operations.
Provides specific error types for better error handling and user feedback.
"""

class InvoiceProcessingError(Exception):
    """Base exception for invoice processing errors."""
    pass

class FileValidationError(InvoiceProcessingError):
    """Exception raised when file validation fails."""
    pass

class ExtractionError(InvoiceProcessingError):
    """Exception raised when invoice data extraction fails."""
    pass

class DatabaseError(InvoiceProcessingError):
    """Exception raised when database operations fail."""
    pass

class ValidationError(InvoiceProcessingError):
    """Exception raised when data validation fails."""
    pass

class PermissionError(InvoiceProcessingError):
    """Exception raised when user lacks required permissions."""
    pass

class InvoiceFileNotFoundError(InvoiceProcessingError):
    """Exception raised when required file is not found."""
    pass

class ConfigurationError(InvoiceProcessingError):
    """Exception raised when system configuration is invalid."""
    pass

class ServiceUnavailableError(InvoiceProcessingError):
    """Exception raised when external service is unavailable."""
    pass
