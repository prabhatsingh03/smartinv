import axios from 'axios';
import { refreshToken as refreshAccessToken } from '@services/authService';
function decodeJwt(token) {
    if (!token)
        return null;
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    }
    catch {
        return null;
    }
}
const api = axios.create({
    baseURL: '', // Use empty base URL to rely on Vite proxy
    withCredentials: true
});
// Normalize URLs to avoid duplicate "/api/api" when endpoints already include "/api"
api.interceptors.request.use((cfg) => {
    const url = cfg.url || '';
    // No need to normalize since we're using empty base URL and Vite proxy
    // Attach department_id by default for invoice endpoints (except file upload and update which need different handling)
    const isInvoiceEndpoint = url.startsWith('/api/invoices') &&
        !url.startsWith('/api/invoices/upload') &&
        !url.match(/\/api\/invoices\/\d+$/); // Exclude individual invoice update endpoints
    if (isInvoiceEndpoint) {
        const token = localStorage.getItem('accessToken');
        const decoded = decodeJwt(token);
        const role = decoded?.role;
        const departmentId = decoded?.department_id;
        // For FINANCE and SUPER_ADMIN, do not auto-constrain by department to allow cross-department actions
        const shouldAttachDept = departmentId && role !== 'FINANCE' && role !== 'SUPER_ADMIN';
        if (shouldAttachDept && (!cfg.params || typeof cfg.params.department_id === 'undefined')) {
            cfg.params = { ...(cfg.params || {}), department_id: departmentId };
        }
    }
    const token = localStorage.getItem('accessToken');
    if (token) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
});
api.interceptors.response.use((res) => res, async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        try {
            const newToken = await refreshAccessToken();
            if (newToken) {
                original.headers = original.headers || {};
                original.headers.Authorization = `Bearer ${newToken}`;
                return api(original);
            }
        }
        catch { }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
export default api;
export async function uploadInvoiceFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    // Append department_id to form-data (backend expects it in body/form, not query params)
    try {
        const token = localStorage.getItem('accessToken');
        const decoded = decodeJwt(token);
        if (decoded?.department_id) {
            formData.append('department_id', String(decoded.department_id));
        }
    }
    catch { }
    const res = await api.post('/api/invoices/upload', formData, {
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
        const item = res.data?.data?.item ?? null;
        if (item?.invoice_data?.line_items) {
            console.debug('[uploadInvoiceFile] received line_items:', item.invoice_data.line_items);
        }
    }
    catch { }
    return res.data;
}
export async function getInvoices(params = {}) {
    const res = await api.get('/api/invoices/', { params });
    const normalizeInvoice = (inv) => {
        const data = inv?.invoice_data || {};
        return { ...data, ...inv, department: inv?.department_name };
    };
    if (res.data?.data?.items) {
        res.data.data.items = res.data.data.items.map(normalizeInvoice);
    }
    return res.data;
}
export async function getInvoice(id) {
    const res = await api.get(`/api/invoices/${id}`);
    const normalizeInvoice = (inv) => {
        const data = inv?.invoice_data || {};
        return { ...data, ...inv, department: inv?.department_name };
    };
    if (res.data?.data) {
        const item = res.data.data?.item ?? res.data.data;
        res.data.data = normalizeInvoice(item);
    }
    return res.data;
}
export async function updateInvoice(id, payload) {
    const res = await api.put(`/api/invoices/${id}`, payload);
    return res.data;
}
export async function deleteInvoice(id) {
    const res = await api.delete(`/api/invoices/${id}`);
    return res.data;
}
export async function submitInvoice(id) {
    console.log('submitInvoice API called with id:', id);
    try {
        const res = await api.post(`/api/invoices/${id}/submit`, {});
        console.log('submitInvoice API response:', res.data);
        return res.data;
    }
    catch (error) {
        console.error('submitInvoice API error:', error);
        throw error;
    }
}
export async function approveInvoice(id, remarks) {
    const res = await api.post(`/api/invoices/${id}/approve`, { remarks });
    return res.data;
}
export async function rejectInvoice(id, remarks) {
    const res = await api.post(`/api/invoices/${id}/reject`, { remarks });
    return res.data;
}
export async function listPending(params = {}) {
    const res = await api.get('/api/invoices/pending', { params });
    const normalizeInvoice = (inv) => {
        const data = inv?.invoice_data || {};
        return { ...data, ...inv, department: inv?.department_name };
    };
    if (res.data?.data?.items) {
        res.data.data.items = res.data.data.items.map(normalizeInvoice);
    }
    return res.data;
}
export async function listApproved(params = {}) {
    const res = await api.get('/api/invoices/approved', { params });
    const normalizeInvoice = (inv) => {
        const data = inv?.invoice_data || {};
        return { ...data, ...inv, department: inv?.department_name };
    };
    if (res.data?.data?.items) {
        res.data.data.items = res.data.data.items.map(normalizeInvoice);
    }
    return res.data;
}
export async function getInvoiceStatistics() {
    const res = await api.get('/api/invoices/statistics');
    return res.data;
}
export async function getInvoiceAuditLogs(id) {
    const res = await api.get(`/api/invoices/${id}/audit-logs`);
    return res.data;
}
// Authenticated file download helper (attaches Authorization header)
export async function downloadInvoiceFile(id) {
    // Return Blob so caller can open/save
    const res = await api.get(`/api/invoices/${id}/file`, { responseType: 'blob' });
    return res.data;
}
export async function getSystemStatistics() {
    const res = await api.get('/api/admin/statistics');
    return res.data;
}
export async function getAuditLogs(params = {}) {
    const res = await api.get('/api/admin/audit-logs', { params });
    return res.data.logs;
}
export async function getAuditStats() {
    const res = await api.get('/api/admin/audit-logs/statistics');
    return res.data;
}
export async function getComprehensiveReport() {
    const res = await api.get('/api/admin/reports/comprehensive');
    return res.data.report;
}
export async function getSystemConfig() {
    const res = await api.get('/api/admin/config');
    return res.data.settings;
}
export async function updateSystemConfig(payload) {
    const res = await api.put('/api/admin/config', payload);
    return res.data;
}
export async function listUsers(params = {}) {
    const res = await api.get('/api/users/', { params });
    const d = res.data;
    return { items: d.users, total: d.total, pages: d.pages, current_page: d.current_page, per_page: d.per_page };
}
export async function createUser(payload) {
    const res = await api.post('/api/users/', payload);
    return res.data;
}
export async function updateUser(userId, payload) {
    const res = await api.put(`/api/users/${userId}`, payload);
    return res.data;
}
export async function deactivateUser(userId) {
    const res = await api.delete(`/api/users/${userId}`);
    return res.data;
}
export async function activateUser(userId) {
    const res = await api.post(`/api/users/${userId}/activate`, {});
    return res.data;
}
