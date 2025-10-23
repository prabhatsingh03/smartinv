"""Utilities to standardize API responses across endpoints."""

from typing import Any, Dict, List, Optional


def success(message: str = "Success", data: Optional[Dict[str, Any]] = None, meta: Optional[Dict[str, Any]] = None, status: int = 200):
    body: Dict[str, Any] = {
        'success': True,
        'message': message
    }
    if data is not None:
        body['data'] = data
    if meta is not None:
        body['meta'] = meta
    return body, status


def error(message: str, details: Optional[Dict[str, Any]] = None, status: int = 400):
    body: Dict[str, Any] = {
        'success': False,
        'message': message
    }
    if details is not None:
        body['details'] = details
    return body, status


def paginated_list(items: List[Dict[str, Any]], total: int, page: int, per_page: int, pages: int, has_next: bool, has_prev: bool):
    return {
        'items': items,
        'pagination': {
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': pages,
            'has_next': has_next,
            'has_prev': has_prev
        }
    }


