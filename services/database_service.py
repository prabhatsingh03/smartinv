"""
Database operations service for invoice-related database queries.
Provides helper functions for common database operations and proper error handling.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from sqlalchemy import and_, or_, desc, asc
from sqlalchemy.exc import SQLAlchemyError

from models.invoice import Invoice
from services.fields import ALLOWED_INVOICE_UPDATE_FIELDS, ALLOWED_INVOICE_WORKFLOW_FIELDS
from models.user import User
from models.department import Department
from utils.exceptions import DatabaseError

logger = logging.getLogger(__name__)

class DatabaseService:
    """Service for database operations related to invoices."""
    
    @staticmethod
    def create_invoice(invoice_data: Dict[str, Any]) -> Invoice:
        """
        Create a new invoice record.
        
        Args:
            invoice_data: Dictionary containing invoice data
            
        Returns:
            Created Invoice object
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            from app import db
            
            invoice = Invoice(
                department_id=invoice_data['department_id'],
                uploaded_by=invoice_data['uploaded_by'],
                file_path=invoice_data.get('file_path'),
                s_no=invoice_data.get('s_no'),
                invoice_date=invoice_data.get('invoice_date'),
                invoice_number=invoice_data.get('invoice_number'),
                gst_number=invoice_data.get('gst_number'),
                vendor_name=invoice_data.get('vendor_name'),
                line_item=invoice_data.get('line_item'),
                hsn_sac=invoice_data.get('hsn_sac'),
                gst_percent=invoice_data.get('gst_percent'),
                igst_amount=invoice_data.get('igst_amount'),
                cgst_amount=invoice_data.get('cgst_amount'),
                sgst_amount=invoice_data.get('sgst_amount'),
                basic_amount=invoice_data.get('basic_amount'),
                total_amount=invoice_data.get('total_amount'),
                tds=invoice_data.get('tds'),
                net_payable=invoice_data.get('net_payable'),
                filename=invoice_data.get('filename'),
                extraction_confidence=invoice_data.get('extraction_confidence'),
                extraction_method=invoice_data.get('extraction_method'),
                raw_text=invoice_data.get('raw_text'),
                # New optional fields with defaults applied by model if not provided
                priority=invoice_data.get('priority', 'low'),
                is_saved=invoice_data.get('is_saved', False)
            )
            
            db.session.add(invoice)
            db.session.commit()
            
            logger.info(f"Created invoice {invoice.id} for user {invoice_data['uploaded_by']}")
            return invoice
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error creating invoice: {str(e)}")
            raise DatabaseError(f"Failed to create invoice: {str(e)}")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Unexpected error creating invoice: {str(e)}")
            raise DatabaseError(f"Unexpected error creating invoice: {str(e)}")
    
    @staticmethod
    def get_invoice_by_id(invoice_id: int) -> Optional[Invoice]:
        """
        Get invoice by ID.
        
        Args:
            invoice_id: Invoice ID
            
        Returns:
            Invoice object or None if not found
        """
        try:
            return Invoice.query.get(invoice_id)
        except SQLAlchemyError as e:
            logger.error(f"Database error getting invoice {invoice_id}: {str(e)}")
            raise DatabaseError(f"Failed to get invoice: {str(e)}")
    
    @staticmethod
    def update_invoice(invoice_id: int, update_data: Dict[str, Any], allow_workflow_fields: bool = False) -> Optional[Invoice]:
        """
        Update invoice with new data.
        
        Args:
            invoice_id: Invoice ID
            update_data: Dictionary containing fields to update
            
        Returns:
            Updated Invoice object or None if not found
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            from app import db
            
            invoice = Invoice.query.get(invoice_id)
            if not invoice:
                return None
            
            # Restrict updates to allowed fields only (centralized)
            business_fields = set(ALLOWED_INVOICE_UPDATE_FIELDS)
            workflow_fields = set(ALLOWED_INVOICE_WORKFLOW_FIELDS)
            allowed_fields = business_fields | (workflow_fields if allow_workflow_fields else set())

            # Frontend processing-only fields to ignore during DB updates
            processing_fields = {
                'department_id'
            }

            changed = False
            for field, value in update_data.items():
                if field in processing_fields:
                    continue
                if field in allowed_fields and hasattr(invoice, field):
                    # Coerce common field types before assignment
                    coerced = value
                    try:
                        if field == 'invoice_date' and isinstance(value, str) and value:
                            # Accept ISO date or datetime string; use date component
                            coerced = date.fromisoformat(value[:10])
                        elif field in {'gst_percent','igst_amount','cgst_amount','sgst_amount','basic_amount','total_amount','tds','net_payable'} and value not in (None, ''):
                            coerced = float(value)
                        elif field == 'selected_line_items' and value is not None:
                            import json as _json
                            if isinstance(value, (list, dict)):
                                coerced = _json.dumps(value)
                        elif field in {'amount_paid'} and value not in (None, ''):
                            coerced = float(value)
                        elif field == 'paid_at' and isinstance(value, str) and value:
                            try:
                                # Accept ISO strings; handle trailing 'Z' as UTC
                                iso_val = value.rstrip('Z') + ('+00:00' if value.endswith('Z') else '')
                                from datetime import datetime as _dt
                                coerced = _dt.fromisoformat(iso_val)
                            except Exception:
                                coerced = None
                    except Exception:
                        # Fallback to original value if coercion fails; DB may reject invalid type
                        coerced = value

                    if getattr(invoice, field) != coerced:
                        setattr(invoice, field, coerced)
                        changed = True

            if changed:
                invoice.updated_at = datetime.utcnow()
                db.session.commit()
            else:
                logger.info(f"No-op update for invoice {invoice_id}")
            
            logger.info(f"Updated invoice {invoice_id}")
            return invoice
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error updating invoice {invoice_id}: {str(e)}")
            raise DatabaseError(f"Failed to update invoice: {str(e)}")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Unexpected error updating invoice {invoice_id}: {str(e)}")
            raise DatabaseError(f"Unexpected error updating invoice: {str(e)}")
    
    @staticmethod
    def delete_invoice(invoice_id: int) -> bool:
        """
        Delete invoice by ID.
        
        Args:
            invoice_id: Invoice ID
            
        Returns:
            True if deleted, False if not found
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            from app import db
            
            invoice = Invoice.query.get(invoice_id)
            if not invoice:
                return False
            
            db.session.delete(invoice)
            db.session.commit()
            
            logger.info(f"Deleted invoice {invoice_id}")
            return True
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error deleting invoice {invoice_id}: {str(e)}")
            raise DatabaseError(f"Failed to delete invoice: {str(e)}")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Unexpected error deleting invoice {invoice_id}: {str(e)}")
            raise DatabaseError(f"Unexpected error deleting invoice: {str(e)}")
    
    @staticmethod
    def get_invoices_with_filters(
        department_id: Optional[int] = None,
        user_id: Optional[int] = None,
        status: Optional[str] = None,
        vendor_name: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search: Optional[str] = None,
        amount_min: Optional[float] = None,
        amount_max: Optional[float] = None,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = 'created_at',
        sort_order: str = 'desc',
        requesting_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get invoices with various filters and pagination.
        
        Args:
            department_id: Filter by department ID
            user_id: Filter by user ID
            status: Filter by status
            vendor_name: Filter by vendor name (partial match)
            date_from: Filter by invoice date from
            date_to: Filter by invoice date to
            search: Generic search across invoice fields
            amount_min: Filter by minimum total amount
            amount_max: Filter by maximum total amount
            page: Page number for pagination
            per_page: Number of items per page
            sort_by: Field to sort by
            sort_order: Sort order ('asc' or 'desc')
            requesting_user_id: User ID for access control
            
        Returns:
            Dictionary containing invoices and pagination info
        """
        try:
            query = Invoice.query
            
            # Apply filters
            if department_id:
                query = query.filter(Invoice.department_id == department_id)
            
            if user_id:
                query = query.filter(Invoice.uploaded_by == user_id)
            
            if status:
                # Allow comma-separated statuses
                if isinstance(status, str) and ',' in status:
                    statuses = [s.strip() for s in status.split(',') if s.strip()]
                    query = query.filter(Invoice.status.in_(statuses))
                else:
                    query = query.filter(Invoice.status == status)
            
            if vendor_name:
                query = query.filter(Invoice.vendor_name.ilike(f'%{vendor_name}%'))
            
            if date_from:
                query = query.filter(Invoice.invoice_date >= date_from)
            
            if date_to:
                query = query.filter(Invoice.invoice_date <= date_to)

            # Amount filtering
            if amount_min is not None:
                query = query.filter(Invoice.total_amount >= amount_min)
            
            if amount_max is not None:
                query = query.filter(Invoice.total_amount <= amount_max)

            # Generic search across invoice_number, vendor_name, GST, filename
            if search:
                like = f"%{search}%"
                query = query.filter(
                    or_(
                        Invoice.invoice_number.ilike(like),
                        Invoice.vendor_name.ilike(like),
                        Invoice.gst_number.ilike(like),
                        Invoice.filename.ilike(like)
                    )
                )
            
            # Hide unsaved extracted invoices from others by default
            # Show is_saved==False only to the uploader
            if requesting_user_id is not None:
                query = query.filter(
                    or_(
                        Invoice.is_saved.is_(True),
                        Invoice.uploaded_by == requesting_user_id
                    )
                )

            # Apply sorting
            if hasattr(Invoice, sort_by):
                sort_column = getattr(Invoice, sort_by)
                if sort_order.lower() == 'desc':
                    query = query.order_by(desc(sort_column))
                else:
                    query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(Invoice.created_at))
            
            # Apply pagination
            pagination = query.paginate(
                page=page, 
                per_page=per_page, 
                error_out=False
            )
            
            return {
                'invoices': pagination.items,
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page,
                'per_page': per_page,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
            
        except SQLAlchemyError as e:
            logger.error(f"Database error getting invoices with filters: {str(e)}")
            raise DatabaseError(f"Failed to get invoices: {str(e)}")

    @staticmethod
    def get_finance_users() -> List[User]:
        """Get all users who can approve invoices (Finance & Super Admin)."""
        try:
            return User.query.filter(User.role.in_([User.ROLES['FINANCE'], User.ROLES['SUPER_ADMIN']])).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error getting finance users: {str(e)}")
            raise DatabaseError(f"Failed to get finance users: {str(e)}")
    
    @staticmethod
    def get_invoices_by_department(department_id: int, status: Optional[str] = None) -> List[Invoice]:
        """
        Get invoices by department with optional status filter.
        
        Args:
            department_id: Department ID
            status: Optional status filter
            
        Returns:
            List of Invoice objects
        """
        try:
            query = Invoice.query.filter(Invoice.department_id == department_id)
            if status:
                query = query.filter(Invoice.status == status)
            return query.order_by(desc(Invoice.created_at)).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error getting invoices by department {department_id}: {str(e)}")
            raise DatabaseError(f"Failed to get invoices by department: {str(e)}")
    
    @staticmethod
    def get_invoices_by_user(user_id: int, status: Optional[str] = None) -> List[Invoice]:
        """
        Get invoices uploaded by user with optional status filter.
        
        Args:
            user_id: User ID
            status: Optional status filter
            
        Returns:
            List of Invoice objects
        """
        try:
            query = Invoice.query.filter(Invoice.uploaded_by == user_id)
            if status:
                query = query.filter(Invoice.status == status)
            return query.order_by(desc(Invoice.created_at)).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error getting invoices by user {user_id}: {str(e)}")
            raise DatabaseError(f"Failed to get invoices by user: {str(e)}")
    
    @staticmethod
    def get_pending_invoices() -> List[Invoice]:
        """
        Get all pending invoices.
        
        Returns:
            List of pending Invoice objects
        """
        try:
            return Invoice.query.filter(Invoice.status == Invoice.STATUS_PENDING)\
                .order_by(desc(Invoice.submitted_at)).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error getting pending invoices: {str(e)}")
            raise DatabaseError(f"Failed to get pending invoices: {str(e)}")
    
    @staticmethod
    def get_invoice_statistics() -> Dict[str, Any]:
        """
        Get invoice statistics.
        
        Returns:
            Dictionary containing various statistics
        """
        try:
            from app import db
            
            total_invoices = Invoice.query.count()
            pending_invoices = Invoice.query.filter(Invoice.status == Invoice.STATUS_PENDING).count()
            approved_invoices = Invoice.query.filter(Invoice.status == Invoice.STATUS_APPROVED).count()
            rejected_invoices = Invoice.query.filter(Invoice.status == Invoice.STATUS_REJECTED).count()
            
            # Get total amount of approved invoices
            total_amount_result = db.session.query(db.func.sum(Invoice.total_amount))\
                .filter(Invoice.status == Invoice.STATUS_APPROVED)\
                .scalar()
            total_amount = float(total_amount_result) if total_amount_result else 0.0
            
            # Priority counts - only consider invoices that have been submitted
            submitted_statuses = [Invoice.STATUS_PENDING, Invoice.STATUS_APPROVED, Invoice.STATUS_REJECTED]
            high_count = Invoice.query.filter(Invoice.priority == 'high', Invoice.status.in_(submitted_statuses)).count()
            med_count = Invoice.query.filter(Invoice.priority == 'medium', Invoice.status.in_(submitted_statuses)).count()
            low_count = Invoice.query.filter(Invoice.priority == 'low', Invoice.status.in_(submitted_statuses)).count()

            # Department summary
            department_summary = DatabaseService.get_department_summary()

            # Recent activity (last 10)
            recent_activity = DatabaseService.get_recent_activity(limit=10)

            return {
                'total_invoices': total_invoices,
                'pending_count': pending_invoices,
                'approved_count': approved_invoices,
                'rejected_count': rejected_invoices,
                'total_amount': total_amount,
                'priority_counts': {
                    'high': high_count,
                    'medium': med_count,
                    'low': low_count
                },
                'department_summary': department_summary,
                'recent_activity': recent_activity
            }
            
        except SQLAlchemyError as e:
            logger.error(f"Database error getting invoice statistics: {str(e)}")
            raise DatabaseError(f"Failed to get invoice statistics: {str(e)}")
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User object or None if not found
        """
        try:
            return User.query.get(user_id)
        except SQLAlchemyError as e:
            logger.error(f"Database error getting user {user_id}: {str(e)}")
            raise DatabaseError(f"Failed to get user: {str(e)}")
    
    @staticmethod
    def get_department_by_id(department_id: int) -> Optional[Department]:
        """
        Get department by ID.
        
        Args:
            department_id: Department ID
            
        Returns:
            Department object or None if not found
        """
        try:
            return Department.query.get(department_id)
        except SQLAlchemyError as e:
            logger.error(f"Database error getting department {department_id}: {str(e)}")
            raise DatabaseError(f"Failed to get department: {str(e)}")

    @staticmethod
    def get_recent_activity(limit: int = 10) -> List[Dict[str, Any]]:
        """Return recent audit activity formatted for dashboard."""
        try:
            from services.audit_service import AuditService
            logs = AuditService.get_recent_audit_logs(limit=limit)
            items: List[Dict[str, Any]] = []
            for l in logs:
                items.append({
                    'id': l.id,
                    'timestamp': l.timestamp.isoformat() if getattr(l, 'timestamp', None) else None,
                    'user_id': l.user_id,
                    'username': getattr(l.user, 'username', None) if hasattr(l, 'user') else None,
                    'invoice_id': l.invoice_id,
                    'action': l.action,
                    'message': l.remarks
                })
            return items
        except Exception as e:
            logger.error(f"Failed to build recent activity: {str(e)}")
            return []

    @staticmethod
    def get_department_summary() -> List[Dict[str, Any]]:
        """Aggregate invoice counts by department and status for dashboard."""
        try:
            from app import db
            rows = db.session.query(
                Department.name,
                db.func.count(Invoice.id).label('count'),
                db.func.sum(db.case((Invoice.status == Invoice.STATUS_APPROVED, 1), else_=0)).label('approved'),
                db.func.sum(db.case((Invoice.status == Invoice.STATUS_PENDING, 1), else_=0)).label('pending'),
                db.func.sum(db.case((Invoice.status == Invoice.STATUS_REJECTED, 1), else_=0)).label('rejected'),
            ).outerjoin(Invoice, Department.id == Invoice.department_id)\
            .group_by(Department.id, Department.name).all()

            return [
                {
                    'name': name,
                    'count': int(count or 0),
                    'approved': int(approved or 0),
                    'pending': int(pending or 0),
                    'rejected': int(rejected or 0)
                }
                for name, count, approved, pending, rejected in rows
            ]
        except Exception as e:
            logger.error(f"Failed to build department summary: {str(e)}")
            return []
    
    @staticmethod
    def get_all_departments() -> List[Department]:
        """
        Get all departments.
        
        Returns:
            List of Department objects
        """
        try:
            return Department.query.order_by(Department.name).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error getting departments: {str(e)}")
            raise DatabaseError(f"Failed to get departments: {str(e)}")
