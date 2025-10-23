"""
Audit logging service for tracking all invoice operations.
Integrates with the existing AuditLog model and provides proper tracking of user actions.
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError

from models.audit_log import AuditLog
from models.invoice import Invoice
from models.user import User
from utils.exceptions import DatabaseError

logger = logging.getLogger(__name__)

class AuditService:
    """Service for audit logging operations."""
    
    @staticmethod
    def log_invoice_action(
        user_id: int,
        action: str,
        invoice_id: Optional[int] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        remarks: Optional[str] = None
    ) -> AuditLog:
        """
        Log an invoice-related action.
        
        Args:
            user_id: ID of user performing the action
            action: Action being performed
            invoice_id: ID of invoice (if applicable)
            old_values: Previous values (for updates)
            new_values: New values (for updates)
            remarks: Additional remarks
            
        Returns:
            Created AuditLog object
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            from app import db
            
            audit_log = AuditLog.log_invoice_action(
                user_id=user_id,
                action=action,
                invoice_id=invoice_id,
                old_values=old_values,
                new_values=new_values,
                remarks=remarks
            )
            
            db.session.add(audit_log)
            db.session.commit()
            
            logger.info(f"Logged {action} action for user {user_id}, invoice {invoice_id}")
            return audit_log
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error logging invoice action: {str(e)}")
            raise DatabaseError(f"Failed to log invoice action: {str(e)}")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Unexpected error logging invoice action: {str(e)}")
            raise DatabaseError(f"Unexpected error logging invoice action: {str(e)}")
    
    @staticmethod
    def log_invoice_upload(user_id: int, invoice_id: int, filename: str) -> AuditLog:
        """
        Log invoice upload action.
        
        Args:
            user_id: ID of user who uploaded
            invoice_id: ID of uploaded invoice
            filename: Name of uploaded file
            
        Returns:
            Created AuditLog object
        """
        return AuditService.log_invoice_action(
            user_id=user_id,
            action=AuditLog.ACTION_UPLOADED,
            invoice_id=invoice_id,
            remarks=f"Uploaded file: {filename}"
        )
    
    @staticmethod
    def log_invoice_submission(user_id: int, invoice_id: int) -> AuditLog:
        """
        Log invoice submission action.
        
        Args:
            user_id: ID of user who submitted
            invoice_id: ID of submitted invoice
            
        Returns:
            Created AuditLog object
        """
        return AuditService.log_invoice_action(
            user_id=user_id,
            action=AuditLog.ACTION_SUBMITTED,
            invoice_id=invoice_id,
            remarks="Submitted for approval"
        )

    @staticmethod
    def log_invoice_save_as_draft(user_id: int, invoice_id: int) -> AuditLog:
        """Log when user saves changes to create/update a draft."""
        return AuditService.log_invoice_action(
            user_id=user_id,
            action='saved_draft',
            invoice_id=invoice_id,
            remarks="Saved changes (draft)"
        )
    
    @staticmethod
    def log_invoice_approval(
        user_id: int, 
        invoice_id: int, 
        approver_remarks: Optional[str] = None
    ) -> AuditLog:
        """
        Log invoice approval action.
        
        Args:
            user_id: ID of user who approved
            invoice_id: ID of approved invoice
            approver_remarks: Remarks from approver
            
        Returns:
            Created AuditLog object
        """
        remarks = "Invoice approved"
        if approver_remarks:
            remarks += f" - {approver_remarks}"
        
        return AuditService.log_invoice_action(
            user_id=user_id,
            action=AuditLog.ACTION_APPROVED,
            invoice_id=invoice_id,
            remarks=remarks
        )
    
    @staticmethod
    def log_invoice_rejection(
        user_id: int, 
        invoice_id: int, 
        rejection_reason: str
    ) -> AuditLog:
        """
        Log invoice rejection action.
        
        Args:
            user_id: ID of user who rejected
            invoice_id: ID of rejected invoice
            rejection_reason: Reason for rejection
            
        Returns:
            Created AuditLog object
        """
        return AuditService.log_invoice_action(
            user_id=user_id,
            action=AuditLog.ACTION_REJECTED,
            invoice_id=invoice_id,
            remarks=f"Rejected: {rejection_reason}"
        )
    
    @staticmethod
    def log_invoice_edit(
        user_id: int, 
        invoice_id: int, 
        old_values: Dict[str, Any], 
        new_values: Dict[str, Any]
    ) -> AuditLog:
        """
        Log invoice edit action.
        
        Args:
            user_id: ID of user who edited
            invoice_id: ID of edited invoice
            old_values: Previous values
            new_values: New values
            
        Returns:
            Created AuditLog object
        """
        return AuditService.log_invoice_action(
            user_id=user_id,
            action=AuditLog.ACTION_EDITED,
            invoice_id=invoice_id,
            old_values=old_values,
            new_values=new_values,
            remarks="Invoice data updated"
        )

    @staticmethod
    def log_priority_change(user_id: int, invoice_id: int, old_priority: str, new_priority: str) -> AuditLog:
        """Log priority change with old/new values."""
        return AuditService.log_invoice_action(
            user_id=user_id,
            action='priority_changed',
            invoice_id=invoice_id,
            remarks=f"Priority changed: {old_priority} -> {new_priority}"
        )
    
    @staticmethod
    def log_invoice_deletion(user_id: int, invoice_id: int, filename: str) -> AuditLog:
        """
        Log invoice deletion action.
        
        Args:
            user_id: ID of user who deleted
            invoice_id: ID of deleted invoice
            filename: Name of deleted file
            
        Returns:
            Created AuditLog object
        """
        return AuditService.log_invoice_action(
            user_id=user_id,
            action=AuditLog.ACTION_DELETED,
            invoice_id=invoice_id,
            remarks=f"Deleted file: {filename}"
        )
    
    @staticmethod
    def log_invoice_view(user_id: int, invoice_id: int) -> AuditLog:
        """
        Log invoice view action.
        
        Args:
            user_id: ID of user who viewed
            invoice_id: ID of viewed invoice
            
        Returns:
            Created AuditLog object
        """
        return AuditService.log_invoice_action(
            user_id=user_id,
            action=AuditLog.ACTION_VIEWED,
            invoice_id=invoice_id,
            remarks="Invoice viewed"
        )
    
    @staticmethod
    def log_invoice_download(user_id: int, invoice_id: int, filename: str) -> AuditLog:
        """
        Log invoice download action.
        
        Args:
            user_id: ID of user who downloaded
            invoice_id: ID of downloaded invoice
            filename: Name of downloaded file
            
        Returns:
            Created AuditLog object
        """
        return AuditService.log_invoice_action(
            user_id=user_id,
            action=AuditLog.ACTION_DOWNLOADED,
            invoice_id=invoice_id,
            remarks=f"Downloaded file: {filename}"
        )
    
    @staticmethod
    def get_audit_logs_for_invoice(
        invoice_id: int, 
        limit: int = 50
    ) -> List[AuditLog]:
        """
        Get audit logs for a specific invoice.
        
        Args:
            invoice_id: Invoice ID
            limit: Maximum number of logs to return
            
        Returns:
            List of AuditLog objects
        """
        try:
            return AuditLog.query.filter(AuditLog.invoice_id == invoice_id)\
                .order_by(AuditLog.timestamp.desc())\
                .limit(limit).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error getting audit logs for invoice {invoice_id}: {str(e)}")
            raise DatabaseError(f"Failed to get audit logs: {str(e)}")
    
    @staticmethod
    def get_audit_logs_for_user(
        user_id: int, 
        limit: int = 100
    ) -> List[AuditLog]:
        """
        Get audit logs for a specific user.
        
        Args:
            user_id: User ID
            limit: Maximum number of logs to return
            
        Returns:
            List of AuditLog objects
        """
        try:
            return AuditLog.query.filter(AuditLog.user_id == user_id)\
                .order_by(AuditLog.timestamp.desc())\
                .limit(limit).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error getting audit logs for user {user_id}: {str(e)}")
            raise DatabaseError(f"Failed to get audit logs: {str(e)}")
    
    @staticmethod
    def get_recent_audit_logs(limit: int = 100) -> List[AuditLog]:
        """
        Get recent audit logs across all users.
        
        Args:
            limit: Maximum number of logs to return
            
        Returns:
            List of AuditLog objects
        """
        try:
            return AuditLog.query.order_by(AuditLog.timestamp.desc())\
                .limit(limit).all()
        except SQLAlchemyError as e:
            logger.error(f"Database error getting recent audit logs: {str(e)}")
            raise DatabaseError(f"Failed to get recent audit logs: {str(e)}")

    @staticmethod
    def get_recent_activity_for_dashboard(limit: int = 20) -> List[Dict[str, Any]]:
        """Return formatted activity feed for dashboard including invoice/user info."""
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
    
    @staticmethod
    def get_audit_logs_with_filters(
        user_id: Optional[int] = None,
        invoice_id: Optional[int] = None,
        action: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AuditLog]:
        """
        Get audit logs with various filters.
        
        Args:
            user_id: Filter by user ID
            invoice_id: Filter by invoice ID
            action: Filter by action
            date_from: Filter by date from
            date_to: Filter by date to
            limit: Maximum number of logs to return
            
        Returns:
            List of AuditLog objects
        """
        try:
            query = AuditLog.query
            
            if user_id:
                query = query.filter(AuditLog.user_id == user_id)
            
            if invoice_id:
                query = query.filter(AuditLog.invoice_id == invoice_id)
            
            if action:
                query = query.filter(AuditLog.action == action)
            
            if date_from:
                query = query.filter(AuditLog.timestamp >= date_from)
            
            if date_to:
                query = query.filter(AuditLog.timestamp <= date_to)
            
            return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
            
        except SQLAlchemyError as e:
            logger.error(f"Database error getting filtered audit logs: {str(e)}")
            raise DatabaseError(f"Failed to get filtered audit logs: {str(e)}")
    
    @staticmethod
    def get_audit_statistics() -> Dict[str, Any]:
        """
        Get audit log statistics.
        
        Returns:
            Dictionary containing audit statistics
        """
        try:
            from app import db
            
            total_logs = AuditLog.query.count()
            
            # Count by action
            action_counts = db.session.query(
                AuditLog.action,
                db.func.count(AuditLog.id).label('count')
            ).group_by(AuditLog.action).all()
            
            # Count by user
            user_counts = db.session.query(
                User.username,
                db.func.count(AuditLog.id).label('count')
            ).join(AuditLog, User.id == AuditLog.user_id)\
            .group_by(User.id, User.username)\
            .order_by(db.func.count(AuditLog.id).desc())\
            .limit(10).all()
            
            return {
                'total_logs': total_logs,
                'action_counts': [{'action': action, 'count': count} for action, count in action_counts],
                'top_users': [{'username': username, 'count': count} for username, count in user_counts]
            }
            
        except SQLAlchemyError as e:
            logger.error(f"Database error getting audit statistics: {str(e)}")
            raise DatabaseError(f"Failed to get audit statistics: {str(e)}")
