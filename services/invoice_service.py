"""
Invoice processing service that integrates the existing extraction logic into Flask.
Handles PDF uploads, extraction, validation, and database operations.
"""

import os
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, date
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage

from main_extractor import process_pdf, log_error
from text_extractor import extract_text
from llm_fallback import extract_with_llm
from required_fields import REQUIRED_FIELDS
from models.invoice import Invoice
from models.user import User
from models.department import Department
from utils.file_utils import FileUtils
from utils.exceptions import InvoiceProcessingError, FileValidationError

logger = logging.getLogger(__name__)

class InvoiceService:
    """Service for processing invoices and managing file operations."""
    
    def __init__(self, upload_folder: str, max_file_size: int = 16 * 1024 * 1024):
        self.upload_folder = upload_folder
        self.max_file_size = max_file_size
        self.file_utils = FileUtils(upload_folder)
    
    def process_uploaded_invoice(
        self, 
        file: FileStorage, 
        user: User, 
        department_id: int,
        model: str = "gpt-4o-mini"
    ) -> Dict[str, Any]:
        """
        Process an uploaded PDF invoice file.
        
        Args:
            file: Uploaded file object
            user: User who uploaded the file
            department_id: Department ID for the invoice
            model: OpenAI model to use for extraction
            
        Returns:
            Dict containing processed invoice data and metadata
            
        Raises:
            FileValidationError: If file validation fails
            InvoiceProcessingError: If processing fails
        """
        try:
            # Validate file
            self._validate_upload(file)
            
            # Generate secure filename and save to temporary storage
            filename = secure_filename(file.filename)
            file_path = self.file_utils.save_to_temp_storage(
                file, filename, user.id
            )
            
            # Extract invoice data using existing logic
            extracted_data = self._extract_invoice_data(file_path, model)
            
            # Process and validate extracted data (DB payload)
            processed_data = self._process_extracted_data(extracted_data, filename)
            # Add metadata to DB payload
            processed_data.update({
                'file_path': file_path,
                'extraction_method': 'openai',
                'extraction_confidence': 0.95,
                'raw_text': extracted_data.get('raw_text', ''),
                'department_id': department_id,
                'uploaded_by': user.id
            })

            # Build API payload snapshot from extracted_data (uppercase canonical keys)
            # Ensure we keep line_items and raw_text for FE multi-line display
            # Build safe API payload without circular references
            src = extracted_data or {}
            rows = src.get('line_items') or []
            safe_rows = []
            try:
                for it in rows:
                    if isinstance(it, dict):
                        item_copy = dict(it)
                        # Remove potential nested reference to line_items to avoid cycles
                        item_copy.pop('line_items', None)
                        safe_rows.append(item_copy)
                    else:
                        safe_rows.append(it)
            except Exception:
                safe_rows = []

            processed_data_api = {k: v for k, v in src.items() if k != 'line_items'}
            processed_data_api['line_items'] = safe_rows
            processed_data_api['raw_text'] = src.get('raw_text', '')
            # Optionally merge a few lowercase DB fields for FE convenience (without overriding uppercase)
            for k in ['invoice_number','vendor_name','total_amount','gst_number','invoice_date','filename']:
                if k not in processed_data_api and k in processed_data:
                    processed_data_api[k] = processed_data.get(k)

            # Return DB payload by default for backward compatibility
            # Callers that need API snapshot can access via tuple (db_payload, api_payload)
            return {
                '__db_payload__': processed_data,
                '__api_payload__': processed_data_api
            }
            
        except Exception as e:
            fname = getattr(file, 'filename', '<unknown>')
            logger.error(f"Error processing invoice {fname}: {str(e)}")
            raise InvoiceProcessingError(f"Failed to process invoice: {str(e)}")
    
    def _validate_upload(self, file: FileStorage) -> None:
        """Validate uploaded file."""
        if not file or not file.filename:
            raise FileValidationError("No file provided")
        
        # Check file size
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > self.max_file_size:
            raise FileValidationError(f"File too large. Maximum size: {self.max_file_size} bytes")
        
        if file_size == 0:
            raise FileValidationError("Empty file")
        
        # Check file extension
        if not self.file_utils.is_allowed_file(file.filename):
            raise FileValidationError("Invalid file type. Only PDF files are allowed.")
        
        # Check MIME type using python-magic
        try:
            import magic
            file.seek(0)
            mime_type = magic.from_buffer(file.read(1024), mime=True)
            file.seek(0)  # Reset to beginning
            
            if not mime_type.startswith('application/pdf'):
                raise FileValidationError(f"Invalid file type. Expected PDF, got {mime_type}")
        except ImportError:
            logger.warning("python-magic not available, skipping MIME type check")
        except Exception as e:
            logger.warning(f"Could not check MIME type: {e}")
        
        # Save to temp path for integrity check
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            file.seek(0)
            temp_file.write(file.read())
            temp_path = temp_file.name
            file.seek(0)  # Reset to beginning
        
        try:
            # Check file integrity
            if not self.file_utils.validate_file_integrity(temp_path):
                raise FileValidationError("Invalid PDF file. File appears to be corrupted or not a valid PDF.")
        finally:
            # Clean up temp file
            import os
            try:
                os.unlink(temp_path)
            except OSError:
                pass
    
    def _extract_invoice_data(self, file_path: str, model: str) -> Dict[str, Any]:
        """
        Extract invoice data using the existing extraction pipeline.
        
        Args:
            file_path: Path to the PDF file
            model: OpenAI model to use
            
        Returns:
            Dict containing extracted invoice data
        """
        try:
            from flask import current_app
            
            # Check if LLM fallback is enabled
            llm_enabled = current_app.config.get('LLM_FALLBACK_ENABLED', True)
            ocr_enabled = current_app.config.get('OCR_ENABLED', True)
            
            if not llm_enabled:
                # Return minimal metadata for manual review
                logger.info("LLM processing disabled, returning minimal metadata")
                return {
                    'raw_text': '',
                    'extraction_method': 'manual_review',
                    'extraction_confidence': 0.0,
                    'vendor_name': 'Manual Review Required',
                    'invoice_number': '',
                    'total_amount': None,
                    'invoice_date': None,
                    'gst_number': '',
                    'line_item': '',
                    'hsn_sac': '',
                    'gst_percent': None,
                    'igst_amount': None,
                    'cgst_amount': None,
                    'sgst_amount': None,
                    'basic_amount': None,
                    'tds': None,
                    'net_payable': None,
                    's_no': ''
                }
            
            # Use existing process_pdf function with config toggles
            if not ocr_enabled:
                # Skip OCR, use only PyMuPDF text extraction
                logger.info("OCR disabled, using PyMuPDF text extraction only")
            
            extracted_rows, full_text = process_pdf(file_path, model=model, use_ocr=ocr_enabled)
            
            # Check if extraction returned valid data
            if not extracted_rows or not isinstance(extracted_rows, list) or len(extracted_rows) == 0:
                raise InvoiceProcessingError("No data extracted from PDF")
            
            # Use the first row as base values and include all extracted rows for FE multi-line support
            base_data = extracted_rows[0]
            base_data['line_items'] = extracted_rows
            
            # Use the full_text returned from process_pdf
            base_data['raw_text'] = full_text
            
            return base_data
            
        except Exception as e:
            logger.error(f"Error in extraction pipeline: {str(e)}")
            raise InvoiceProcessingError(f"Extraction failed: {str(e)}")
    
    def _to_float(self, val):
        """Convert value to float, handling commas, currency symbols, and parentheses."""
        if val is None:
            return None
        s = str(val).strip().replace(',', '')
        s = s.replace('₹', '').replace('$', '').replace('€', '').replace('£', '')
        if s.startswith('(') and s.endswith(')'):
            s = '-' + s[1:-1]
        try:
            return float(s)
        except:
            return None

    def _process_extracted_data(self, data: Dict[str, Any], filename: str) -> Dict[str, Any]:
        """
        Process and normalize extracted data for database storage.
        
        Args:
            data: Raw extracted data
            filename: Original filename
            
        Returns:
            Processed data ready for database storage
        """
        # Map field names from extraction format to database format
        field_mapping = {
            'S_No': 's_no',
            'Invoice_Date': 'invoice_date',
            'Invoice_Number': 'invoice_number',
            'GST_Number': 'gst_number',
            'Vendor_Name': 'vendor_name',
            'Line_Item': 'line_item',
            'HSN_SAC': 'hsn_sac',
            'gst_percent': 'gst_percent',
            'IGST_Amount': 'igst_amount',
            'CGST_Amount': 'cgst_amount',
            'SGST_Amount': 'sgst_amount',
            'Basic_Amount': 'basic_amount',
            'Total_Amount': 'total_amount',
            'TDS': 'tds',
            'Net_Payable': 'net_payable',
            'filename': 'filename'
        }
        
        processed = {}
        
        for extraction_field, db_field in field_mapping.items():
            value = data.get(extraction_field)
            
            # Handle special field conversions
            if db_field == 'invoice_date' and value:
                try:
                    from dateutil import parser
                    processed[db_field] = parser.parse(value).date()
                except:
                    processed[db_field] = None
            elif db_field in ['gst_percent', 'igst_amount', 'cgst_amount', 'sgst_amount', 
                             'basic_amount', 'total_amount', 'tds', 'net_payable']:
                processed[db_field] = self._to_float(value)
            else:
                processed[db_field] = value
        
        # Set filename
        processed['filename'] = filename
        
        return processed
    
    def validate_invoice_data(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate processed invoice data.
        
        Args:
            data: Processed invoice data
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        # Required fields validation
        required_fields = ['invoice_number', 'total_amount']
        for field in required_fields:
            if not data.get(field):
                errors.append(f"Missing required field: {field}")
        
        # Vendor name is now optional - only validate if provided
        if data.get('vendor_name') and data['vendor_name'].strip() == '':
            # If vendor_name is provided but empty, set it to None
            data['vendor_name'] = None
        
        # Amount validation
        if data.get('total_amount'):
            try:
                total = float(data['total_amount'])
                if total <= 0:
                    errors.append("Total amount must be positive")
            except (ValueError, TypeError):
                errors.append("Invalid total amount format")
        
        # Date validation
        if data.get('invoice_date'):
            if not isinstance(data['invoice_date'], date):
                errors.append("Invalid invoice date format")
        
        # GST number validation (if provided)
        if data.get('gst_number'):
            gst = data['gst_number'].strip()
            if len(gst) != 15:
                errors.append("GST number must be 15 characters long")
        
        return len(errors) == 0, errors
    
    def create_invoice_record(self, data: Dict[str, Any]) -> Invoice:
        """
        Create a new invoice record in the database.
        
        Args:
            data: Processed invoice data
            
        Returns:
            Created Invoice object
        """
        try:
            # Validate data before creating
            is_valid, errors = self.validate_invoice_data(data)
            if not is_valid:
                raise InvoiceProcessingError(f"Validation failed: {', '.join(errors)}")
            
            # Create invoice object
            invoice = Invoice(
                department_id=data['department_id'],
                uploaded_by=data['uploaded_by'],
                file_path=data.get('file_path'),
                s_no=data.get('s_no'),
                invoice_date=data.get('invoice_date'),
                invoice_number=data.get('invoice_number'),
                gst_number=data.get('gst_number'),
                vendor_name=data.get('vendor_name'),
                line_item=data.get('line_item'),
                hsn_sac=data.get('hsn_sac'),
                gst_percent=data.get('gst_percent'),
                igst_amount=data.get('igst_amount'),
                cgst_amount=data.get('cgst_amount'),
                sgst_amount=data.get('sgst_amount'),
                basic_amount=data.get('basic_amount'),
                total_amount=data.get('total_amount'),
                tds=data.get('tds'),
                net_payable=data.get('net_payable'),
                filename=data.get('filename'),
                extraction_confidence=data.get('extraction_confidence'),
                extraction_method=data.get('extraction_method'),
                raw_text=data.get('raw_text')
            )
            
            return invoice
            
        except Exception as e:
            logger.error(f"Error creating invoice record: {str(e)}")
            raise InvoiceProcessingError(f"Failed to create invoice record: {str(e)}")
    
    def get_invoice_by_id(self, invoice_id: int) -> Optional[Invoice]:
        """Get invoice by ID."""
        return Invoice.query.get(invoice_id)
    
    def get_invoices_by_department(self, department_id: int, status: str = None) -> List[Invoice]:
        """Get invoices by department with optional status filter."""
        query = Invoice.query.filter_by(department_id=department_id)
        if status:
            query = query.filter_by(status=status)
        return query.order_by(Invoice.created_at.desc()).all()
    
    def get_invoices_by_user(self, user_id: int, status: str = None) -> List[Invoice]:
        """Get invoices uploaded by user with optional status filter."""
        query = Invoice.query.filter_by(uploaded_by=user_id)
        if status:
            query = query.filter_by(status=status)
        return query.order_by(Invoice.created_at.desc()).all()
    
    def update_invoice(self, invoice: Invoice, data: Dict[str, Any]) -> Invoice:
        """
        Update invoice with new data.
        
        Args:
            invoice: Invoice object to update
            data: New data to update
            
        Returns:
            Updated Invoice object
        """
        try:
            # Update fields
            for field, value in data.items():
                if hasattr(invoice, field):
                    setattr(invoice, field, value)
            
            invoice.updated_at = datetime.utcnow()
            
            return invoice
            
        except Exception as e:
            logger.error(f"Error updating invoice {invoice.id}: {str(e)}")
            raise InvoiceProcessingError(f"Failed to update invoice: {str(e)}")
    
    def delete_invoice(self, invoice: Invoice) -> bool:
        """
        Delete invoice and associated file.
        
        Args:
            invoice: Invoice object to delete
            
        Returns:
            True if successful
        """
        try:
            # Delete associated file if it exists
            if invoice.file_path and os.path.exists(invoice.file_path):
                os.remove(invoice.file_path)
            
            # Delete from database
            from app import db
            db.session.delete(invoice)
            db.session.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting invoice {invoice.id}: {str(e)}")
            raise InvoiceProcessingError(f"Failed to delete invoice: {str(e)}")
    
    def submit_invoice(self, invoice: Invoice) -> Invoice:
        """Submit invoice for approval."""
        invoice.submit()
        return invoice
    
    def approve_invoice(self, invoice: Invoice, approver_id: int, remarks: str = None) -> Invoice:
        """Approve invoice."""
        invoice.approve(approver_id, remarks)
        return invoice
    
    def reject_invoice(self, invoice: Invoice, rejector_id: int, remarks: str) -> Invoice:
        """Reject invoice with remarks."""
        invoice.reject(rejector_id, remarks)
        return invoice
    
    def move_to_permanent_storage(self, invoice: Invoice) -> bool:
        """
        Move invoice file from temporary to permanent storage.
        This should be called when invoice status changes to draft or above.
        
        Args:
            invoice: Invoice object
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not invoice.file_path:
                return False
            
            # Check if file is already in permanent storage
            if not invoice.file_path.startswith(os.path.join(self.upload_folder, 'temp')):
                return True  # Already in permanent storage
            
            # Get original filename from invoice
            original_filename = invoice.filename or 'unknown.pdf'
            
            # Move to permanent storage
            permanent_path = self.file_utils.move_to_permanent_storage(
                invoice.file_path, 
                original_filename, 
                invoice.department_id, 
                invoice.uploaded_by
            )
            
            # Update invoice file_path in database
            from app import db
            invoice.file_path = permanent_path
            db.session.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error moving invoice {invoice.id} to permanent storage: {str(e)}")
            return False
    
    def cleanup_temp_file(self, invoice: Invoice) -> bool:
        """
        Clean up temporary file for invoice.
        This should be called when invoice is deleted or abandoned.
        
        Args:
            invoice: Invoice object
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not invoice.file_path:
                return True
            
            # Only cleanup if file is in temp storage
            if invoice.file_path.startswith(os.path.join(self.upload_folder, 'temp')):
                return self.file_utils.cleanup_temp_file(invoice.file_path)
            
            return True
            
        except Exception as e:
            logger.error(f"Error cleaning up temp file for invoice {invoice.id}: {str(e)}")
            return False
    
    def cleanup_abandoned_invoices(self, hours_threshold: int = 24) -> int:
        """
        Clean up abandoned invoices (extracted status for too long) and their temp files.
        
        Args:
            hours_threshold: Number of hours after which to consider an invoice abandoned
            
        Returns:
            Number of invoices cleaned up
        """
        try:
            from app import db
            from datetime import datetime, timedelta
            
            # Find invoices that are still in extracted status and older than threshold
            cutoff_time = datetime.utcnow() - timedelta(hours=hours_threshold)
            
            abandoned_invoices = Invoice.query.filter(
                Invoice.status == Invoice.STATUS_EXTRACTED,
                Invoice.is_saved == False,
                Invoice.created_at < cutoff_time
            ).all()
            
            cleaned_count = 0
            for invoice in abandoned_invoices:
                try:
                    # Clean up temp file
                    self.cleanup_temp_file(invoice)
                    
                    # Delete invoice record
                    db.session.delete(invoice)
                    cleaned_count += 1
                    
                except Exception as e:
                    logger.error(f"Error cleaning up abandoned invoice {invoice.id}: {str(e)}")
                    continue
            
            if cleaned_count > 0:
                db.session.commit()
                logger.info(f"Cleaned up {cleaned_count} abandoned invoices")
            
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Error in cleanup_abandoned_invoices: {str(e)}")
            return 0
