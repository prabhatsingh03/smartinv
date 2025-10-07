## SmartInv API Documentation

### Authentication
- JWT required for all endpoints. Include `Authorization: Bearer <token>`.

### Invoices
- GET `/api/invoices/` — list invoices with filters: `department_id, status, vendor_name, search, date_from, date_to, page, per_page, sort_by, sort_order`. Department users see all invoices in their department.
- GET `/api/invoices/<id>` — get invoice. Department users can access invoices in their department; Finance/Super Admin can access all; uploader always has access.
- PUT `/api/invoices/<id>` — update invoice (uploader in draft/rejected or Super Admin).
- DELETE `/api/invoices/<id>` — delete invoice (uploader or Super Admin).
- POST `/api/invoices/<id>/submit` — submit for approval (uploader or Super Admin). Sets `submitted_at` timestamp and `pending` status.
- POST `/api/invoices/<id>/approve` — approve (Finance & Accounts or Super Admin). Body: `{remarks?}`.
- POST `/api/invoices/<id>/reject` — reject (Finance & Accounts or Super Admin). Body: `{remarks}` required.
- GET `/api/invoices/pending` — list pending with filters: `department_id, vendor_name, search, date_from, date_to, page, per_page, sort_by, sort_order` (Finance/Super Admin only).
- GET `/api/invoices/approved` — list approved with pagination.
- GET `/api/invoices/statistics` — dashboard statistics.
- GET `/api/invoices/<id>/audit-logs` — audit history for invoice.

Upload endpoint is POST `/api/invoices/upload`.

### Notifications
- GET `/api/notifications/` — list user notifications. Query: `only_unread, page, per_page`.
- GET `/api/notifications/unread-count` — unread count.
- PUT `/api/notifications/<id>/read` — mark as read.
- PUT `/api/notifications/mark-all-read` — mark all read.
- DELETE `/api/notifications/<id>` — delete notification.

### Roles
- Finance & Accounts: can approve/reject, view all pending.
- Super Admin: full access.
- Department users: upload, view/edit own and department as constrained.

### Response Format
Success responses:
```
{
  "success": true,
  "message": "...",
  "data": { ... },
  "meta": { ... }
}
```
Error responses:
```
{
  "success": false,
  "message": "...",
  "details": { ... }
}
```


