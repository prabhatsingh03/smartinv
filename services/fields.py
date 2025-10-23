"""
Shared field definitions for services dealing with invoices.
Keeps allowed update field lists centralized to avoid drift.
"""

# Business (DB) fields allowed to be updated via normal invoice edits
ALLOWED_INVOICE_UPDATE_FIELDS = {
    's_no',
    'invoice_date',
    'invoice_number',
    'gst_number',
    'vendor_name',
    'line_item',
    'hsn_sac',
    'gst_percent',
    'igst_amount',
    'cgst_amount',
    'sgst_amount',
    'basic_amount',
    'total_amount',
    'tds',
    'net_payable',
    'filename',
    'file_path',
    'remarks',  # Add remarks field
    'selected_line_items',  # Add selected_line_items for frontend processing
    # Payment fields
    'payment_status',
    'amount_paid',
    'paid_at',
}

# Workflow/system-managed fields that can be updated in workflow endpoints
ALLOWED_INVOICE_WORKFLOW_FIELDS = {
    'status',
    'approved_by',
    'approved_at',
    'submitted_at',
    'rejection_remarks',
    'approval_remarks',
    'is_saved',
    'priority',
}


