#!/usr/bin/env python3
"""
Cleanup script for abandoned invoices.
This script should be run periodically (e.g., via cron) to clean up invoices
that were uploaded but never saved as draft or above.
"""

import os
import sys
import logging
from datetime import datetime

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from services.invoice_service import InvoiceService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main cleanup function."""
    try:
        # Create Flask app context
        app = create_app()
        
        with app.app_context():
            # Initialize invoice service
            service = InvoiceService(
                upload_folder=app.config['UPLOAD_FOLDER'],
                max_file_size=app.config['MAX_CONTENT_LENGTH']
            )
            
            # Clean up abandoned invoices (older than 24 hours)
            cleaned_count = service.cleanup_abandoned_invoices(hours_threshold=24)
            
            if cleaned_count > 0:
                logger.info(f"Successfully cleaned up {cleaned_count} abandoned invoices")
            else:
                logger.info("No abandoned invoices found to clean up")
                
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
