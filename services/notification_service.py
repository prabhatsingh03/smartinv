"""
Notification service integrating with Notification, User, and Invoice models.
Provides helpers to create and manage notifications for invoice workflow events.
"""

import logging
from typing import List, Optional, Dict, Any

from models.notification import Notification
from models.user import User
from models.invoice import Invoice
from services.database_service import DatabaseService

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for creating and managing notifications."""

    @staticmethod
    def _commit_entities(entities: List[Notification]):
        try:
            from app import db
            for entity in entities:
                db.session.add(entity)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to commit notifications: {str(e)}")
            raise

    @staticmethod
    def get_finance_users() -> List[User]:
        """Deprecated: use DatabaseService.get_finance_users instead."""
        try:
            return DatabaseService.get_finance_users()
        except Exception as e:
            logger.error(f"Failed to fetch finance users: {str(e)}")
            return []

    @staticmethod
    def notify_finance_on_submission(invoice: Invoice) -> List[Notification]:
        """Create notifications for finance approvers when an invoice is submitted."""
        finance_users = NotificationService.get_finance_users()
        # Include priority context in notification templates via Notification model helpers
        notifications = Notification.create_invoice_submitted_notification(invoice, finance_users)
        NotificationService._commit_entities(notifications)
        return notifications

    @staticmethod
    def notify_uploader_on_approval(invoice: Invoice) -> Notification:
        """Notify uploader that their invoice was approved."""
        notification = Notification.create_invoice_approved_notification(invoice)
        NotificationService._commit_entities([notification])
        return notification

    @staticmethod
    def notify_uploader_on_rejection(invoice: Invoice) -> Notification:
        """Notify uploader that their invoice was rejected."""
        notification = Notification.create_invoice_rejected_notification(invoice)
        NotificationService._commit_entities([notification])
        return notification

    @staticmethod
    def notify_finance_on_priority_change(invoice: Invoice) -> List[Notification]:
        """Optional: notify finance when priority changes."""
        try:
            finance_users = NotificationService.get_finance_users()
            notifications = Notification.create_invoice_priority_changed_notification(invoice, finance_users)
            NotificationService._commit_entities(notifications)
            return notifications
        except Exception:
            # Soft-fail notifications
            return []

    @staticmethod
    def get_user_notifications(user_id: int, only_unread: bool = False, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get notifications for a user with optional unread filter and pagination."""
        try:
            query = Notification.query.filter(Notification.user_id == user_id)
            if only_unread:
                query = query.filter(Notification.is_read.is_(False))
            pagination = query.order_by(Notification.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
            return {
                'notifications': [n.to_dict() for n in pagination.items],
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page,
                'per_page': per_page,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        except Exception as e:
            logger.error(f"Failed to get notifications for user {user_id}: {str(e)}")
            raise

    @staticmethod
    def mark_as_read(user_id: int, notification_id: int) -> Optional[Notification]:
        """Mark a specific notification as read for a user."""
        try:
            from app import db
            notification = Notification.query.get(notification_id)
            if not notification or notification.user_id != user_id:
                return None
            notification.mark_as_read()
            db.session.commit()
            return notification
        except Exception as e:
            from app import db
            db.session.rollback()
            logger.error(f"Failed to mark notification {notification_id} as read: {str(e)}")
            raise

    @staticmethod
    def mark_all_as_read(user_id: int) -> int:
        """Mark all notifications for a user as read. Returns count affected."""
        try:
            from app import db
            updated = Notification.query.filter_by(user_id=user_id, is_read=False).update({Notification.is_read: True})
            db.session.commit()
            return int(updated or 0)
        except Exception as e:
            from app import db
            db.session.rollback()
            logger.error(f"Failed to mark all notifications as read for user {user_id}: {str(e)}")
            raise

    @staticmethod
    def delete_notification(user_id: int, notification_id: int) -> bool:
        """Delete a user's notification."""
        try:
            from app import db
            n = Notification.query.get(notification_id)
            if not n or n.user_id != user_id:
                return False
            db.session.delete(n)
            db.session.commit()
            return True
        except Exception as e:
            from app import db
            db.session.rollback()
            logger.error(f"Failed to delete notification {notification_id}: {str(e)}")
            raise

    @staticmethod
    def get_unread_count(user_id: int) -> int:
        try:
            return Notification.query.filter_by(user_id=user_id, is_read=False).count()
        except Exception as e:
            logger.error(f"Failed to get unread count for user {user_id}: {str(e)}")
            return 0


