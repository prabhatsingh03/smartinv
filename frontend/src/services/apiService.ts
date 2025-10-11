import axios from 'axios';
import { getAppStore } from '../store/storeRef';
import { setAccessToken, clearAccessToken } from '../store/authSlice';
import type { ApiResponse, Invoice, SystemStatistics, AuditLog, AuditStatistics, PagedResult, User } from '@types';

function decodeJwt<T = any>(token: string | null): T | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1] || '';
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
                      .padEnd(Math.ceil(payload.length/4)*4, '=');
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

const api = axios.create({
  baseURL: '/api', // same-origin, Nginx proxies to Gunicorn
});

// Attach access token on every request
api.interceptors.request.use((config) => {
  const access = localStorage.getItem('access_token');
  if (access) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${access}`;
  }
  
  // Attach department_id by default for invoice endpoints (except file upload and update which need different handling)
  const url = config.url || '';
  const isInvoiceEndpoint = url.startsWith('/invoices') && 
    !url.startsWith('/invoices/upload') && 
    !url.match(/\/invoices\/\d+$/); // Exclude individual invoice update endpoints
  if (isInvoiceEndpoint) {
    const decoded: any = decodeJwt(access);
    const role = decoded?.role;
    const departmentId = decoded?.department_id;
    // For FINANCE and SUPER_ADMIN, do not auto-constrain by department to allow cross-department actions
    const normalized = String(role || '').toUpperCase().replace(/\s+/g, '_');
    const shouldAttachDept = departmentId && normalized !== 'FINANCE' && normalized !== 'SUPER_ADMIN';
    if (shouldAttachDept && (!config.params || typeof (config.params as any).department_id === 'undefined')) {
      config.params = { ...(config.params || {}), department_id: departmentId } as any;
    }
  }
  
  return config;
});

// Auto-refresh on 401 using the REFRESH TOKEN in Authorization header
let isRefreshing = false;
let queue: Array<(t: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    // Only try once per request
    if (err?.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      // If a refresh is in progress, wait for it and retry
      if (isRefreshing) {
        const newAccess = await new Promise<string>((resolve) => queue.push(resolve));
        original.headers = original.headers || {};
        original.headers['Authorization'] = `Bearer ${newAccess}`;
        return api(original);
      }

      isRefreshing = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token');

        // IMPORTANT: refresh token goes in Authorization header
        const { data } = await axios.post(
          '/api/auth/refresh',
          {},
          { headers: { Authorization: `Bearer ${refresh}` } }
        );

        const newAccess = data.access_token;
        localStorage.setItem('access_token', newAccess);
        getAppStore()?.dispatch(setAccessToken(newAccess));

        // Unblock queued requests
        queue.forEach((fn) => fn(newAccess));
        queue = [];

        original.headers = original.headers || {};
        original.headers['Authorization'] = `Bearer ${newAccess}`;
        return api(original);
      } finally {
        isRefreshing = false;
      }
    }
    
    if (err?.response?.status === 401) {
      // ensure state reflects logged-out when refresh fails
      getAppStore()?.dispatch(clearAccessToken());
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
    const token = localStorage.getItem('access_token');
    const decoded: any = decodeJwt(token);
    if (decoded?.department_id) {
      formData.append('department_id', String(decoded.department_id));
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
