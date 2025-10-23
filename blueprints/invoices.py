from flask import Blueprint, jsonify, request, current_app
import logging
from typing import Dict, Any

from services.invoice_service import InvoiceService
from services.database_service import DatabaseService
from services.fields import ALLOWED_INVOICE_UPDATE_FIELDS
from services.audit_service import AuditService
from services.notification_service import NotificationService
from models.user import User
from models.department import Department
from models.invoice import Invoice
from utils.simple_auth import simple_auth_required, role_required_simple
from utils.workflow_validators import ensure_can_submit, ensure_can_approve, ensure_can_update, ensure_valid_rejection
from utils.response_formatters import success, error, paginated_list
from utils.exceptions import InvoiceProcessingError, FileValidationError, PermissionError, DatabaseError
from dateutil import parser as date_parser
from datetime import datetime
from flask import send_file

logger = logging.getLogger(__name__)

invoices_bp = Blueprint('invoices', __name__)


def get_invoice_service():
    return InvoiceService(
        upload_folder=current_app.config['UPLOAD_FOLDER'],
        max_file_size=current_app.config['MAX_CONTENT_LENGTH']
    )

def get_current_user():
    """Get current user from request context (set by simple_auth decorators)."""
    return getattr(request, 'current_user', None)


@invoices_bp.route('/', methods=['GET'])
@simple_auth_required
def list_invoices():
    user = get_current_user()
    args = request.args
    filters: Dict[str, Any] = {
        'department_id': args.get('department_id', type=int),
        'user_id': args.get('user_id', type=int),
        'status': args.get('status'),
        'vendor_name': args.get('vendor_name'),
        'search': args.get('search'),
        'amount_min': args.get('amount_min', type=float),
        'amount_max': args.get('amount_max', type=float)
    }
    date_from_raw = args.get('date_from')
    date_to_raw = args.get('date_to')
    date_from = None
    date_to = None
    try:
        if date_from_raw:
            date_from = date_parser.parse(date_from_raw).date()
        if date_to_raw:
            date_to = date_parser.parse(date_to_raw).date()
    except Exception:
        body, status = error('Invalid date format for date_from/date_to', status=400)
        return jsonify(body), status
    page = args.get('page', default=1, type=int)
    per_page = args.get('per_page', default=20, type=int)
    sort_by = args.get('sort_by', default='created_at')
    sort_order = args.get('sort_order', default='desc')

    # Department scoping for non super-admin users
    if user and not user.is_super_admin() and not user.is_finance():
        # Department users can see all department invoices
        filters['department_id'] = user.department_id
        filters['user_id'] = None

    result = DatabaseService.get_invoices_with_filters(
        department_id=filters['department_id'],
        user_id=filters['user_id'],
        status=filters['status'],
        vendor_name=filters['vendor_name'],
        date_from=date_from,
        date_to=date_to,
        search=filters['search'],
        amount_min=filters['amount_min'],
        amount_max=filters['amount_max'],
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
        requesting_user_id=(user.id if user else None)
    )

    items = [inv.to_dict() for inv in result['invoices']]
    payload = paginated_list(items, result['total'], result['current_page'], result['per_page'], result['pages'], result['has_next'], result['has_prev'])
    body, status = success('Invoices fetched', {'items': payload['items']}, {'pagination': payload['pagination']})
    return jsonify(body), status


@invoices_bp.route('/<int:invoice_id>', methods=['GET'])
@simple_auth_required
def get_invoice(invoice_id: int):
    user = get_current_user()
    invoice = DatabaseService.get_invoice_by_id(invoice_id)
    if not invoice:
        body, status = error('Invoice not found', status=404)
        return jsonify(body), status
    # Department-based access
    if not (user.is_super_admin() or user.is_finance() or user.department_id == invoice.department_id or user.id == invoice.uploaded_by):
        body, status = error('Access denied', status=403)
        return jsonify(body), status
    AuditService.log_invoice_view(user_id=user.id, invoice_id=invoice_id)
    body, status = success('Invoice fetched', {'item': invoice.to_dict()})
    return jsonify(body), status


@invoices_bp.route('/<int:invoice_id>', methods=['PUT'])
@simple_auth_required
def update_invoice(invoice_id: int):
    user = get_current_user()
    invoice = DatabaseService.get_invoice_by_id(invoice_id)
    if not invoice:
        body, status = error('Invoice not found', status=404)
        return jsonify(body), status

    data = request.get_json() or {}
    
    # Special case: Finance & Super Admin can update payment fields on approved invoices
    PAYMENT_FIELDS = {'payment_status', 'amount_paid', 'paid_at'}
    data_field_keys = set([k for k in data.keys() if k != 'priority'])
    if data_field_keys and data_field_keys.issubset(PAYMENT_FIELDS):
        if not (user.is_finance() or user.is_super_admin()):
            body, status = error('Only Finance or Super Admin can update payment status', status=403)
            return jsonify(body), status
        try:
            old_values = invoice.to_dict()
            updated = DatabaseService.update_invoice(invoice_id, data)
            if updated:
                AuditService.log_invoice_edit(user_id=user.id, invoice_id=invoice_id, old_values=old_values, new_values=updated.to_dict())
            body, status = success('Payment status updated', {'item': (updated.to_dict() if updated else invoice.to_dict())})
            return jsonify(body), status
        except DatabaseError as e:
            body, status = error('Database error while updating payment status', {'error': str(e)}, status=400)
            return jsonify(body), status
    
    ok, msg = ensure_can_update(invoice, user)
    if not ok:
        # Enhanced error message for department-related permission failures
        logger.warning(f'Invoice update permission denied for user {user.id} on invoice {invoice_id}: {msg}')
        body, status = error(msg, status=403)
        return jsonify(body), status
    
    # Treat department_id as context-only
    CONTEXT_FIELDS = {'department_id'}
    for f in list(data.keys()):
        if f in CONTEXT_FIELDS:
            data.pop(f, None)
    
    action = data.get('action')
    # Special save-as-draft action (only for non-finance users)
    if action == 'save' and not (user.is_finance() or user.is_super_admin()):
        try:
            # Collect business fields from payload
            business_payload = {k: v for k, v in data.items() if k in ALLOWED_INVOICE_UPDATE_FIELDS}
            # Validate and map priority if provided
            if 'priority' in data and data['priority']:
                try:
                    invoice.set_priority(data['priority'])
                    business_payload['priority'] = invoice.priority
                except ValueError:
                    body, status = error('Invalid priority value', status=400)
                    return jsonify(body), status

            # Workflow fields for saving as draft
            workflow_payload = {'status': Invoice.STATUS_DRAFT, 'is_saved': True}

            # Persist combined payload; allow workflow fields
            updated = DatabaseService.update_invoice(
                invoice_id,
                {**business_payload, **workflow_payload},
                allow_workflow_fields=True
            )

            # Ensure we return fresh updated invoice
            AuditService.log_invoice_save_as_draft(user_id=user.id, invoice_id=invoice_id)
            body, status = success('Changes saved', {'item': updated.to_dict()})
            return jsonify(body), status
        except DatabaseError as e:
            body, status = error('Database error while saving draft', {'error': str(e)}, status=400)
            return jsonify(body), status

    # Restrict updatable fields
    # allowed_fields includes DB fields (centralized) + selected_line_items for frontend processing
    allowed_fields = set(ALLOWED_INVOICE_UPDATE_FIELDS) | {'selected_line_items'}
    forbidden = set([k for k in data.keys() if k != 'priority']) - allowed_fields
    if forbidden:
        body, status = error('Forbidden fields in update', {'forbidden_fields': list(forbidden)}, status=400)
        return jsonify(body), status
    try:
        # Handle priority validation if present
        if 'priority' in data and data['priority'] is not None:
            try:
                invoice.set_priority(data['priority'])
            except ValueError:
                body, status = error('Invalid priority value', status=400)
                return jsonify(body), status
        # Prepare update payload including validated priority
        update_payload = dict(data)
        if 'priority' in data:
            update_payload['priority'] = invoice.priority

        old_values = invoice.to_dict()
        updated = DatabaseService.update_invoice(invoice_id, update_payload)
        # DatabaseService logs no-op internally; only audit when actual change
        if updated and updated.to_dict() != old_values:
            AuditService.log_invoice_edit(user_id=user.id, invoice_id=invoice_id, old_values=old_values, new_values=updated.to_dict())
        body, status = success('Invoice updated', {'item': (updated.to_dict() if updated else invoice.to_dict())})
        return jsonify(body), status
    except DatabaseError as e:
        body, status = error('Database error while updating invoice', {'error': str(e)}, status=400)
        return jsonify(body), status
    except Exception as e:
        body, status = error('Unexpected error while updating invoice', {'error': str(e)}, status=500)
        return jsonify(body), status


@invoices_bp.route('/<int:invoice_id>', methods=['DELETE'])
@simple_auth_required
def delete_invoice(invoice_id: int):
    user = get_current_user()
    invoice = DatabaseService.get_invoice_by_id(invoice_id)
    if not invoice:
        body, status = error('Invoice not found', status=404)
        return jsonify(body), status
    if not (user.is_super_admin() or user.id == invoice.uploaded_by):
        body, status = error('Only uploader or Super Admin can delete', status=403)
        return jsonify(body), status
    filename = invoice.filename or invoice.file_path or ''
    # Delete via service to remove file and DB row
    service = get_invoice_service()
    try:
        ok = service.delete_invoice(invoice)
    except Exception as e:
        body, status = error('Delete failed', {'error': str(e)}, status=400)
        return jsonify(body), status
    if ok:
        AuditService.log_invoice_deletion(user_id=user.id, invoice_id=invoice_id, filename=filename)
        body, status = success('Invoice deleted')
        return jsonify(body), status
    body, status = error('Delete failed', status=400)
    return jsonify(body), status


@invoices_bp.route('/<int:invoice_id>/submit', methods=['POST'])
@simple_auth_required
def submit_invoice(invoice_id: int):
    user = get_current_user()
    invoice = DatabaseService.get_invoice_by_id(invoice_id)
    if not invoice:
        body, status = error('Invoice not found', status=404)
        return jsonify(body), status
    ok, msg = ensure_can_submit(invoice, user)
    if not ok:
        body, status = error(msg, status=403)
        return jsonify(body), status

    # Set submitted timestamp and pending status
    invoice.submit()
    updated = DatabaseService.update_invoice(invoice_id, {
        'status': invoice.status,
        'submitted_at': invoice.submitted_at
    }, allow_workflow_fields=True)
    AuditService.log_invoice_submission(user_id=user.id, invoice_id=invoice_id)
    NotificationService.notify_finance_on_submission(updated)
    body, status = success('Invoice submitted for approval', {'item': updated.to_dict()})
    return jsonify(body), status


@invoices_bp.route('/<int:invoice_id>/approve', methods=['POST'])
@simple_auth_required
def approve_invoice(invoice_id: int):
    user = get_current_user()
    invoice = DatabaseService.get_invoice_by_id(invoice_id)
    if not invoice:
        body, status = error('Invoice not found', status=404)
        return jsonify(body), status
    ok, msg = ensure_can_approve(invoice, user)
    if not ok:
        body, status = error(msg, status=403)
        return jsonify(body), status

    data = request.get_json() or {}
    remarks = data.get('remarks')
    invoice.approve(approved_by_user_id=user.id, remarks=remarks)
    updated = DatabaseService.update_invoice(invoice_id, {
        'status': invoice.status,
        'approved_by': invoice.approved_by,
        'approved_at': invoice.approved_at,
        'approval_remarks': invoice.approval_remarks
    }, allow_workflow_fields=True)
    AuditService.log_invoice_approval(user_id=user.id, invoice_id=invoice_id, approver_remarks=remarks)
    NotificationService.notify_uploader_on_approval(updated)
    body, status = success('Invoice approved', {'item': updated.to_dict()})
    return jsonify(body), status


@invoices_bp.route('/<int:invoice_id>/reject', methods=['POST'])
@simple_auth_required
def reject_invoice(invoice_id: int):
    user = get_current_user()
    invoice = DatabaseService.get_invoice_by_id(invoice_id)
    if not invoice:
        body, status = error('Invoice not found', status=404)
        return jsonify(body), status
    ok, msg = ensure_can_approve(invoice, user)
    if not ok:
        body, status = error(msg, status=403)
        return jsonify(body), status

    data = request.get_json() or {}
    remarks = data.get('remarks')
    ok, msg = ensure_valid_rejection(remarks)
    if not ok:
        body, status = error(msg, status=400)
        return jsonify(body), status
    invoice.reject(rejected_by_user_id=user.id, remarks=remarks)
    updated = DatabaseService.update_invoice(invoice_id, {
        'status': invoice.status,
        'approved_by': invoice.approved_by,
        'approved_at': invoice.approved_at,
        'rejection_remarks': invoice.rejection_remarks
    }, allow_workflow_fields=True)
    AuditService.log_invoice_rejection(user_id=user.id, invoice_id=invoice_id, rejection_reason=remarks)
    NotificationService.notify_uploader_on_rejection(updated)
    body, status = success('Invoice rejected', {'item': updated.to_dict()})
    return jsonify(body), status


@invoices_bp.route('/pending', methods=['GET'])
@simple_auth_required
def list_pending():
    user = get_current_user()
    if not (user.is_finance() or user.is_super_admin()):
        body, status = error('Only Finance or Super Admin can view all pending invoices', status=403)
        return jsonify(body), status
    args = request.args
    # Parse dates
    date_from_raw = args.get('date_from')
    date_to_raw = args.get('date_to')
    date_from = None
    date_to = None
    try:
        if date_from_raw:
            date_from = date_parser.parse(date_from_raw).date()
        if date_to_raw:
            date_to = date_parser.parse(date_to_raw).date()
    except Exception:
        body, status = error('Invalid date format for date_from/date_to', status=400)
        return jsonify(body), status

    result = DatabaseService.get_invoices_with_filters(
        department_id=args.get('department_id', type=int),
        status=Invoice.STATUS_PENDING,
        vendor_name=args.get('vendor_name'),
        date_from=date_from,
        date_to=date_to,
        search=args.get('search'),
        amount_min=args.get('amount_min', type=float),
        amount_max=args.get('amount_max', type=float),
        page=args.get('page', default=1, type=int),
        per_page=args.get('per_page', default=20, type=int),
        sort_by=args.get('sort_by', default='submitted_at'),
        sort_order=args.get('sort_order', default='desc')
    )
    items = [inv.to_dict() for inv in result['invoices']]
    payload = paginated_list(items, result['total'], result['current_page'], result['per_page'], result['pages'], result['has_next'], result['has_prev'])
    body, status = success('Pending invoices fetched', {'items': payload['items']}, {'pagination': payload['pagination']})
    return jsonify(body), status


@invoices_bp.route('/approved', methods=['GET'])
@simple_auth_required
def list_approved():
    args = request.args
    # Parse dates
    date_from_raw = args.get('date_from')
    date_to_raw = args.get('date_to')
    date_from = None
    date_to = None
    try:
        if date_from_raw:
            date_from = date_parser.parse(date_from_raw).date()
        if date_to_raw:
            date_to = date_parser.parse(date_to_raw).date()
    except Exception:
        body, status = error('Invalid date format for date_from/date_to', status=400)
        return jsonify(body), status

    result = DatabaseService.get_invoices_with_filters(
        department_id=args.get('department_id', type=int),
        status=Invoice.STATUS_APPROVED,
        vendor_name=args.get('vendor_name'),
        date_from=date_from,
        date_to=date_to,
        search=args.get('search'),
        amount_min=args.get('amount_min', type=float),
        amount_max=args.get('amount_max', type=float),
        page=args.get('page', default=1, type=int),
        per_page=args.get('per_page', default=20, type=int),
        sort_by=args.get('sort_by', default='approved_at'),
        sort_order=args.get('sort_order', default='desc')
    )
    items = [inv.to_dict() for inv in result['invoices']]
    payload = paginated_list(items, result['total'], result['current_page'], result['per_page'], result['pages'], result['has_next'], result['has_prev'])
    body, status = success('Approved invoices fetched', {'items': payload['items']}, {'pagination': payload['pagination']})
    return jsonify(body), status


@invoices_bp.route('/statistics', methods=['GET'])
@simple_auth_required
def statistics():
    stats = DatabaseService.get_invoice_statistics()
    body, status = success('Statistics fetched', {'stats': stats})
    return jsonify(body), status


@invoices_bp.route('/<int:invoice_id>/audit-logs', methods=['GET'])
@simple_auth_required
def invoice_audit_logs(invoice_id: int):
    user = get_current_user()
    invoice = DatabaseService.get_invoice_by_id(invoice_id)
    if not invoice:
        body, status = error('Invoice not found', status=404)
        return jsonify(body), status
    if not (user.is_super_admin() or user.is_finance() or user.department_id == invoice.department_id or user.id == invoice.uploaded_by):
        body, status = error('Access denied', status=403)
        return jsonify(body), status
    from services.audit_service import AuditService as AS
    logs = AS.get_audit_logs_for_invoice(invoice_id)
    items = [l.to_dict() for l in logs]
    body, status = success('Audit logs fetched', {'items': items})
    return jsonify(body), status


@invoices_bp.route('/<int:invoice_id>/file', methods=['GET'])
@simple_auth_required
def download_file(invoice_id: int):
    user = get_current_user()
    invoice = DatabaseService.get_invoice_by_id(invoice_id)
    if not invoice:
        body, status = error('Invoice not found', status=404)
        return jsonify(body), status
    if not (user.is_super_admin() or user.is_finance() or user.department_id == invoice.department_id or user.id == invoice.uploaded_by):
        body, status = error('Access denied', status=403)
        return jsonify(body), status
    if not invoice.file_path:
        body, status = error('File not available', status=404)
        return jsonify(body), status
    try:
        return send_file(invoice.file_path, as_attachment=False)
    except Exception as e:
        body, status = error('Failed to serve file', {'error': str(e)}, status=500)
        return jsonify(body), status


@invoices_bp.route('/upload', methods=['POST'])
@simple_auth_required
def upload_invoice():
    user = get_current_user()
    # Accept department_id from form-data or JSON
    department_id = None
    if request.form:
        department_id = request.form.get('department_id', type=int)
    if department_id is None:
        json_data = None
        try:
            json_data = request.get_json(silent=True) or {}
        except Exception:
            json_data = {}
        department_id = json_data.get('department_id', None)
        if isinstance(department_id, str) and department_id.isdigit():
            department_id = int(department_id)

    if not department_id:
        body, status = error('department_id is required', status=400)
        return jsonify(body), status

    # Access control: non super-admin must upload to their own department
    if not (user.is_super_admin() or user.is_finance()) and user.department_id != department_id:
        body, status = error('Cannot upload invoice to another department', status=403)
        return jsonify(body), status

    if 'file' not in request.files:
        body, status = error('No file part in the request', status=400)
        return jsonify(body), status

    file = request.files['file']
    if file is None or file.filename is None or file.filename.strip() == '':
        body, status = error('No file provided', status=400)
        return jsonify(body), status

    service = get_invoice_service()
    try:
        result = service.process_uploaded_invoice(file, user, department_id)
        # Support both new tuple-like response (dict with keys) and legacy dict
        if isinstance(result, dict) and '__db_payload__' in result and '__api_payload__' in result:
            db_payload = result['__db_payload__']
            processed_data_api = result['__api_payload__']
        else:
            # Backward compatibility: use same dict for both, but avoid passing line_items to DB
            db_payload = {k: v for k, v in (result or {}).items() if k != 'line_items'}
            processed_data_api = dict(result or {})

        # Persist using DatabaseService with DB-only payload
        # Force extracted + unsaved on upload
        db_payload = dict(db_payload)
        db_payload['is_saved'] = False
        # Ensure extracted initial state by model __init__
        invoice = DatabaseService.create_invoice(db_payload)
        # Log upload
        AuditService.log_invoice_upload(user_id=user.id, invoice_id=invoice.id, filename=invoice.filename or '')

        # Build response including invoice_data snapshot and line_items
        item_payload = invoice.to_dict()
        # Populate uppercase canonical keys; fall back to lowercase DB fields if missing
        def upfirst(key_up: str, key_low: str):
            return processed_data_api.get(key_up) if processed_data_api.get(key_up) is not None else db_payload.get(key_low)

        item_payload['invoice_data'] = {
            'S_No': processed_data_api.get('S_No') if processed_data_api.get('S_No') is not None else db_payload.get('s_no'),
            'Invoice_Date': processed_data_api.get('Invoice_Date') if processed_data_api.get('Invoice_Date') is not None else db_payload.get('invoice_date'),
            'Invoice_Number': processed_data_api.get('Invoice_Number') if processed_data_api.get('Invoice_Number') is not None else db_payload.get('invoice_number'),
            'GST_Number': processed_data_api.get('GST_Number') if processed_data_api.get('GST_Number') is not None else db_payload.get('gst_number'),
            'Vendor_Name': processed_data_api.get('Vendor_Name') if processed_data_api.get('Vendor_Name') is not None else db_payload.get('vendor_name'),
            'Line_Item': processed_data_api.get('Line_Item') if processed_data_api.get('Line_Item') is not None else db_payload.get('line_item'),
            'HSN_SAC': processed_data_api.get('HSN_SAC') if processed_data_api.get('HSN_SAC') is not None else db_payload.get('hsn_sac'),
            'gst_percent': processed_data_api.get('gst_percent') if processed_data_api.get('gst_percent') is not None else db_payload.get('gst_percent'),
            'IGST_Amount': processed_data_api.get('IGST_Amount') if processed_data_api.get('IGST_Amount') is not None else db_payload.get('igst_amount'),
            'CGST_Amount': processed_data_api.get('CGST_Amount') if processed_data_api.get('CGST_Amount') is not None else db_payload.get('cgst_amount'),
            'SGST_Amount': processed_data_api.get('SGST_Amount') if processed_data_api.get('SGST_Amount') is not None else db_payload.get('sgst_amount'),
            'Basic_Amount': processed_data_api.get('Basic_Amount') if processed_data_api.get('Basic_Amount') is not None else db_payload.get('basic_amount'),
            'Total_Amount': processed_data_api.get('Total_Amount') if processed_data_api.get('Total_Amount') is not None else db_payload.get('total_amount'),
            'TDS': processed_data_api.get('TDS') if processed_data_api.get('TDS') is not None else db_payload.get('tds'),
            'Net_Payable': processed_data_api.get('Net_Payable') if processed_data_api.get('Net_Payable') is not None else db_payload.get('net_payable'),
            'filename': processed_data_api.get('filename') if processed_data_api.get('filename') is not None else db_payload.get('filename')
        }
        item_payload['line_items'] = processed_data_api.get('line_items', [])

        body, status = success('Invoice uploaded', {'item': item_payload})
        return jsonify(body), status
    except FileValidationError as e:
        body, status = error('File validation failed', {'error': str(e)}, status=400)
        return jsonify(body), status
    except DatabaseError as e:
        body, status = error('Database error while creating invoice', {'error': str(e)}, status=400)
        return jsonify(body), status
    except InvoiceProcessingError as e:
        body, status = error('Invoice processing failed', {'error': str(e)}, status=400)
        return jsonify(body), status
    except Exception as e:
        body, status = error('Unexpected error during upload', {'error': str(e)}, status=500)
        return jsonify(body), status
