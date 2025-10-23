from flask import Blueprint, request, jsonify
from datetime import datetime

from models.user import User
from models.invoice import Invoice
from models.department import Department
from models.audit_log import AuditLog
from services.audit_service import AuditService
from utils.simple_auth import role_required_simple

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/statistics', methods=['GET'])
@role_required_simple('Super Admin')
def get_system_statistics():
    """System-wide statistics for Super Admin dashboard."""
    try:
        from app import db

        total_users = User.query.count()
        total_active_users = User.query.filter_by(is_active=True).count()
        total_departments = Department.query.count()

        # Only count invoices that have been submitted for approval (not drafts)
        submitted_invoices = Invoice.query.filter(
            Invoice.status.in_([Invoice.STATUS_PENDING, Invoice.STATUS_APPROVED, Invoice.STATUS_REJECTED])
        ).count()
        pending_invoices = Invoice.query.filter_by(status=Invoice.STATUS_PENDING).count()
        approved_invoices = Invoice.query.filter_by(status=Invoice.STATUS_APPROVED).count()
        rejected_invoices = Invoice.query.filter_by(status=Invoice.STATUS_REJECTED).count()

        # Simple trend: last 12 months submitted invoice counts
        trend = []
        try:
            # Using SQLite/Postgres agnostic approach (approximate by timestamp month extraction via Python)
            twelve_months_ago = datetime.utcnow().replace(day=1)
            # Only include submitted invoices (pending, approved, rejected) in trend
            monthly_counts = (
                db.session.query(Invoice)
                .filter(Invoice.status.in_([Invoice.STATUS_PENDING, Invoice.STATUS_APPROVED, Invoice.STATUS_REJECTED]))
                .order_by(Invoice.created_at.desc())
                .all()
            )
            buckets = {}
            for inv in monthly_counts:
                if not getattr(inv, 'created_at', None):
                    continue
                key = inv.created_at.strftime('%Y-%m')
                buckets[key] = buckets.get(key, 0) + 1
            trend = [
                {'month': key, 'count': buckets[key]}
                for key in sorted(buckets.keys())[-12:]
            ]
        except Exception:
            trend = []

        recent_logs = [log.to_dict() for log in AuditService.get_recent_audit_logs(limit=20)]

        return jsonify({
            'users': {
                'total': total_users,
                'active': total_active_users,
            },
            'departments': {
                'total': total_departments
            },
            'invoices': {
                'total': submitted_invoices,
                'pending': pending_invoices,
                'approved': approved_invoices,
                'rejected': rejected_invoices,
                'trend': trend
            },
            'recent_activity': recent_logs
        }), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch system statistics: {str(e)}'}), 500


@admin_bp.route('/audit-logs', methods=['GET'])
@role_required_simple('Super Admin')
def get_audit_logs():
    """Get audit logs with advanced filters."""
    try:
        user_id = request.args.get('user_id', type=int)
        invoice_id = request.args.get('invoice_id', type=int)
        action = request.args.get('action', type=str)
        date_from = request.args.get('date_from', type=str)
        date_to = request.args.get('date_to', type=str)
        limit = request.args.get('limit', 100, type=int)

        df = datetime.fromisoformat(date_from) if date_from else None
        dt = datetime.fromisoformat(date_to) if date_to else None

        logs = AuditService.get_audit_logs_with_filters(
            user_id=user_id,
            invoice_id=invoice_id,
            action=action,
            date_from=df,
            date_to=dt,
            limit=limit
        )

        return jsonify({'logs': [log.to_dict() for log in logs]}), 200
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use ISO 8601 (YYYY-MM-DD or full timestamp).'}), 400
    except Exception as e:
        return jsonify({'message': f'Failed to fetch audit logs: {str(e)}'}), 500


@admin_bp.route('/audit-logs/statistics', methods=['GET'])
@role_required_simple('Super Admin')
def get_audit_statistics():
    try:
        stats = AuditService.get_audit_statistics()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch audit statistics: {str(e)}'}), 500


@admin_bp.route('/reports/comprehensive', methods=['GET'])
@role_required_simple('Super Admin')
def get_comprehensive_report():
    """Generate a simple comprehensive system report (aggregated stats)."""
    try:
        # Reuse statistics plus top users/actions
        from app import db
        stats = {}

        stats['summary'] = {
            'users_total': User.query.count(),
            'departments_total': Department.query.count(),
            'invoices_total': Invoice.query.count(),
        }

        # By department invoice counts
        try:
            dept_counts = db.session.query(
                Department.name,
                db.func.count(Invoice.id)
            ).outerjoin(Invoice, Department.id == Invoice.department_id)
            dept_counts = dept_counts.group_by(Department.id, Department.name).all()
            stats['invoices_by_department'] = [
                {'department': name, 'count': count} for name, count in dept_counts
            ]
        except Exception:
            stats['invoices_by_department'] = []

        stats['audit'] = AuditService.get_audit_statistics()

        return jsonify({'report': stats}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to generate report: {str(e)}'}), 500


@admin_bp.route('/config', methods=['GET', 'PUT'])
@role_required_simple('Super Admin')
def system_config():
    """Dummy system configuration endpoints (backed by environment/defaults)."""
    try:
        # For now return a static/dynamic config view
        if request.method == 'GET':
            return jsonify({
                'settings': {
                    'max_upload_mb': 16,
                    'log_level': 'INFO',
                    'report_schedule_cron': '0 6 * * *'
                }
            }), 200

        # PUT - accept payload and log it to audit for traceability
        payload = request.get_json() or {}
        current_user = request.current_user
        from app import db
        audit_log = AuditLog.log_system_action(
            user_id=current_user.id,
            action='system_config_updated',
            remarks='System configuration updated by Super Admin'
        )
        db.session.add(audit_log)
        db.session.commit()
        return jsonify({'message': 'Configuration updated', 'applied': payload}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to process configuration: {str(e)}'}), 500


