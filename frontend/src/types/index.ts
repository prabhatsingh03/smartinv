// Types inferred from backend models and API docs

export type Role =
  | 'ADMIN'
  | 'HR'
  | 'SITE'
  | 'PROCUREMENT'
  | 'FINANCE'
  | 'SUPER_ADMIN';

// Backend-facing roles (as stored in DB / returned by API)
export type BackendRole =
  | 'Admin'
  | 'HR'
  | 'Site'
  | 'Procurement'
  | 'Finance & Accounts'
  | 'Super Admin';

// Normalized role tokens used across FE gating
export type RoleCompat = Role;

export interface Department {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: string; // backend may return human-readable roles
  department?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  is_active?: boolean;
}

export type InvoiceStatus =
  | 'UPLOADED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID';

export interface Invoice {
  id: number;
  // 18 required fields based on backend required_fields.py
  S_No?: string | number;
  Invoice_Date?: string; // ISO date string
  Invoice_Number?: string;
  PO_Number?: string;
  GST_Number?: string;
  Vendor_Name?: string;
  Line_Item?: string;
  HSN_SAC?: string;
  gst_percent?: number | string;
  IGST_Amount?: number | string;
  CGST_Amount?: number | string;
  SGST_Amount?: number | string;
  Basic_Amount?: number | string;
  Total_Amount?: number | string;
  TDS?: number | string;
  Net_Payable?: number | string;
  filename?: string;

  // Derived/extra metadata used by UI and workflow
  status: InvoiceStatus;
  department?: string | null;
  uploaded_by?: number; // user id
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string
  submitted_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  remarks?: string | null;
  file_url?: string | null;
  file_path?: string | null;
  // Optional payment status provided by backend in some views
  payment_status?: string | null;
  // Extracted multi-line support
  line_items?: ExtractedLineItem[];
  selected_line_items?: ExtractedLineItem[];
}

export interface ExtractedLineItem {
  Line_Item?: string;
  HSN_SAC?: string;
  Basic_Amount?: number | string;
  IGST_Amount?: number | string;
  CGST_Amount?: number | string;
  SGST_Amount?: number | string;
  Total_Amount?: number | string;
  gst_percent?: number | string | null;
  description?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  amount?: number | string | null;
  hsn_sac?: string | null;
  igst_amount?: number | string | null;
  cgst_amount?: number | string | null;
  sgst_amount?: number | string | null;
  [key: string]: any;
}

export interface Notification {
  id: number;
  message: string;
  type?: string;
  is_read: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Super Admin types
export interface SystemUserSummary {
  total: number;
  active: number;
}

export interface SystemDepartmentSummary {
  total: number;
}

export interface SystemInvoiceTrendPoint {
  month: string; // YYYY-MM
  count: number;
}

export interface SystemInvoiceSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  trend: SystemInvoiceTrendPoint[];
}

export interface SystemStatistics {
  users: SystemUserSummary;
  departments: SystemDepartmentSummary;
  invoices: SystemInvoiceSummary;
  recent_activity: AuditLog[];
}

export interface AuditLog {
  id: number;
  invoice_id?: number | null;
  user_id: number;
  user_name?: string | null;
  action: string;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  remarks?: string | null;
  timestamp?: string | null;
  invoice_number?: string | null;
}

export interface AuditStatistics {
  total_logs: number;
  action_counts: { action: string; count: number }[];
  top_users: { username: string; count: number }[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  pages?: number;
  current_page?: number;
  per_page?: number;
}

// Upload helpers
export interface FileUploadProgress {
  totalBytes?: number;
  loadedBytes?: number;
  percentage?: number; // 0-100
}

export interface ValidationErrorMap {
  [fieldName: string]: string | undefined;
}

export type InvoiceFormValues = Pick<Invoice,
  | 'S_No'
  | 'Invoice_Date'
  | 'Invoice_Number'
  | 'PO_Number'
  | 'GST_Number'
  | 'Vendor_Name'
  | 'Line_Item'
  | 'HSN_SAC'
  | 'gst_percent'
  | 'IGST_Amount'
  | 'CGST_Amount'
  | 'SGST_Amount'
  | 'Basic_Amount'
  | 'Total_Amount'
  | 'TDS'
  | 'Net_Payable'
  | 'filename'
> & {
  remarks?: string | null;
};

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export interface DecodedToken {
  sub: string | number;
  exp: number;
  role: string; // may be backend or normalized string
  department?: string | null;
}


