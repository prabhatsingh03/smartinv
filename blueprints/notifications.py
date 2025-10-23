from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.notification_service import NotificationService
from utils.response_formatters import success, error

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def list_notifications():
    user_id = get_jwt_identity()
    only_unread = request.args.get('only_unread', 'false').lower() == 'true'
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=20, type=int)
    data = NotificationService.get_user_notifications(user_id, only_unread=only_unread, page=page, per_page=per_page)
    pagination = {
        'total': data['total'],
        'page': data['current_page'],
        'per_page': data['per_page'],
        'pages': data['pages'],
        'has_next': data['has_next'],
        'has_prev': data['has_prev']
    }
    body, status = success('Notifications fetched', {'items': data['notifications']}, {'pagination': pagination})
    return jsonify(body), status


@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def unread_count():
    user_id = get_jwt_identity()
    count = NotificationService.get_unread_count(user_id)
    body, status = success('Unread count', {'unread_count': count})
    return jsonify(body), status


@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notification_id: int):
    user_id = get_jwt_identity()
    n = NotificationService.mark_as_read(user_id, notification_id)
    if not n:
        body, status = error('Notification not found', status=404)
        return jsonify(body), status
    body, status = success('Marked as read', {'item': n.to_dict()})
    return jsonify(body), status


@notifications_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    count = NotificationService.mark_all_as_read(user_id)
    body, status = success('All marked as read', {'updated': count})
    return jsonify(body), status


@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id: int):
    user_id = get_jwt_identity()
    ok = NotificationService.delete_notification(user_id, notification_id)
    if not ok:
        body, status = error('Notification not found', status=404)
        return jsonify(body), status
    body, status = success('Notification deleted')
    return jsonify(body), status


