import axios from 'axios';
import { getAppStore } from '../store/storeRef';
import { clearUser } from '../store/authSlice';
import type { ApiResponse, Invoice, SystemStatistics, AuditLog, AuditStatistics, PagedResult, User } from '@types';

// In production we want same-origin "/api"
// In development we still call "/api", and Vite proxy forwards to Flask at 127.0.0.1:5170
const base = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || '/api');

const api = axios.create({
  baseURL: base,
  withCredentials: false,
});

// Attach user email for simplified authentication
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      config.headers = config.headers || {};
      // For simplified auth, we'll pass user email in a custom header
      config.headers['X-User-Email'] = user.email;
      
      // Attach department_id by default for invoice endpoints
      const url = config.url || '';
      const isInvoiceEndpoint = url.startsWith('/invoices') && 
        !url.startsWith('/invoices/upload') && 
        !url.match(/\/invoices\/\d+$/);
      if (isInvoiceEndpoint && user.department_id) {
        const role = user.role?.toUpperCase();
        // For FINANCE and SUPER_ADMIN, do not auto-constrain by department
        const shouldAttachDept = role !== 'FINANCE' && role !== 'SUPER_ADMIN';
        if (shouldAttachDept && (!config.params || typeof (config.params as any).department_id === 'undefined')) {
          config.params = { ...(config.params || {}), department_id: user.department_id } as any;
        }
      }
    } catch (error) {
      console.warn('Failed to parse user from localStorage:', error);
    }
  }
  
  return config;
});

// Handle 401 responses by clearing user data
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err?.response?.status === 401) {
      // Clear user data on authentication failure
      getAppStore()?.dispatch(clearUser());
      localStorage.removeItem('user');
      localStorage.removeItem('authenticated');
    }
    throw err;
  }
);

export default api;

// Invoice API helpers
export type InvoiceListQuery = {
  department_id?: number;
  status?: string;
  vendor_name?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export async function uploadInvoiceFile(file: File, onProgress?: (p: number) => void) {
  const formData = new FormData();
  formData.append('file', file);
  // Append department_id to form-data (backend expects it in body/form, not query params)
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.department_id) {
        formData.append('department_id', String(user.department_id));
      }
    }
  } catch {}
  const res = await api.post<ApiResponse<{ item: any }>>('/invoices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        onProgress(pct);
      }
    }
  });
  // Debug log: show line items if present
  try {
    const item: any = (res.data as any)?.data?.item ?? null;
    if (item?.invoice_data?.line_items) {
      console.debug('[uploadInvoiceFile] received line_items:', item.invoice_data.line_items);
    }
  } catch {}
  return res.data;
}

export async function getInvoices(params: InvoiceListQuery = {}) {
  const res = await api.get<ApiResponse<{ items: Invoice[]; meta?: any }>>('/invoices/', { params });
  const normalizeInvoice = (inv: any) => {
    const data = inv?.invoice_data || {};
    return { ...data, ...inv, department: inv?.department_name };
  };
  if ((res.data as any)?.data?.items) {
    (res.data as any).data.items = (res.data as any).data.items.map(normalizeInvoice);
  }
  return res.data;
}

export async function getInvoice(id: number) {
  const res = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
  const normalizeInvoice = (inv: any) => {
    const data = inv?.invoice_data || {};
    return { ...data, ...inv, department: inv?.department_name };
  };
  if ((res.data as any)?.data) {
    const item = (res.data as any).data?.item ?? (res.data as any).data;
    (res.data as any).data = normalizeInvoice(item);
  }
  return res.data;
}

export async function updateInvoice(id: number, payload: Partial<Invoice>) {
  const res = await api.put<ApiResponse<Invoice>>(`/invoices/${id}`, payload);
  return res.data;
}

export async function deleteInvoice(id: number) {
  const res = await api.delete<ApiResponse<{}>>(`/invoices/${id}`);
  return res.data;
}

export async function submitInvoice(id: number) {
  console.log('submitInvoice API called with id:', id);
  try {
    const res = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/submit`, {});
    console.log('submitInvoice API response:', res.data);
    return res.data;
  } catch (error) {
    console.error('submitInvoice API error:', error);
    throw error;
  }
}

export async function approveInvoice(id: number, remarks?: string) {
  const res = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/approve`, { remarks });
  return res.data;
}

export async function rejectInvoice(id: number, remarks: string) {
  const res = await api.post<ApiResponse<Invoice>>(`/invoices/${id}/reject`, { remarks });
  return res.data;
}

export async function listPending(params: InvoiceListQuery = {}) {
  const res = await api.get<ApiResponse<{ items: Invoice[]; meta?: any }>>('/invoices/pending', { params });
  const normalizeInvoice = (inv: any) => {
    const data = inv?.invoice_data || {};
    return { ...data, ...inv, department: inv?.department_name };
  };
  if ((res.data as any)?.data?.items) {
    (res.data as any).data.items = (res.data as any).data.items.map(normalizeInvoice);
  }
  return res.data;
}

export async function listApproved(params: { page?: number; per_page?: number } = {}) {
  const res = await api.get<ApiResponse<{ items: Invoice[]; meta?: any }>>('/invoices/approved', { params });
  const normalizeInvoice = (inv: any) => {
    const data = inv?.invoice_data || {};
    return { ...data, ...inv, department: inv?.department_name };
  };
  if ((res.data as any)?.data?.items) {
    (res.data as any).data.items = (res.data as any).data.items.map(normalizeInvoice);
  }
  return res.data;
}

export async function getInvoiceStatistics() {
  const res = await api.get<ApiResponse<any>>('/invoices/statistics');
  return res.data;
}

export async function getInvoiceAuditLogs(id: number) {
  const res = await api.get<ApiResponse<{ logs: any[] }>>(`/invoices/${id}/audit-logs`);
  return res.data;
}

// Authenticated file download helper (attaches Authorization header)
export async function downloadInvoiceFile(id: number) {
  // Return Blob so caller can open/save
  const res = await api.get(`/invoices/${id}/file`, { responseType: 'blob' });
  return res.data as Blob;
}


// Super Admin API helpers
export type AuditLogQuery = {
  user_id?: number;
  invoice_id?: number;
  action?: string;
  date_from?: string; // ISO
  date_to?: string;   // ISO
  limit?: number;
};

export async function getSystemStatistics() {
  const res = await api.get<SystemStatistics>('/admin/statistics');
  return res.data;
}

export async function getAuditLogs(params: AuditLogQuery = {}) {
  const res = await api.get<{ logs: AuditLog[] }>('/admin/audit-logs', { params });
  return res.data.logs;
}

export async function getAuditStats() {
  const res = await api.get<AuditStatistics>('/admin/audit-logs/statistics');
  return res.data;
}

export async function getComprehensiveReport() {
  const res = await api.get<{ report: any }>('/admin/reports/comprehensive');
  return res.data.report;
}

export async function getSystemConfig() {
  const res = await api.get<{ settings: Record<string, any> }>('/admin/config');
  return res.data.settings;
}

export async function updateSystemConfig(payload: Record<string, any>) {
  const res = await api.put<{ message: string; applied: Record<string, any> }>('/admin/config', payload);
  return res.data;
}

// User management (Super Admin)
export type UserListQuery = { page?: number; per_page?: number; role?: string; department_id?: number; search?: string };

export async function listUsers(params: UserListQuery = {}) {
  const res = await api.get('/users/', { params });
  const d = res.data as { users: User[]; total: number; pages: number; current_page: number; per_page: number };
  return { items: d.users, total: d.total, pages: d.pages, current_page: d.current_page, per_page: d.per_page } as PagedResult<User>;
}

export async function createUser(payload: Partial<User> & { password: string }) {
  const res = await api.post('/users/', payload);
  return res.data as { user?: User; message: string };
}

export async function updateUser(userId: number, payload: Partial<User>) {
  const res = await api.put(`/users/${userId}`, payload);
  return res.data as { user?: User; message: string };
}

export async function deactivateUser(userId: number) {
  const res = await api.delete(`/users/${userId}`);
  return res.data as { message: string };
}

export async function activateUser(userId: number) {
  const res = await api.post(`/users/${userId}/activate`, {});
  return res.data as { message: string };
}

