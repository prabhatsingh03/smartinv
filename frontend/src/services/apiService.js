import axios from 'axios';
import { getAppStore } from '../store/storeRef';
import { clearUser } from '../store/authSlice';
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : 'http://localhost:5170/api',
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
                if (shouldAttachDept && (!config.params || typeof config.params.department_id === 'undefined')) {
                    config.params = { ...(config.params || {}), department_id: user.department_id };
                }
            }
        }
        catch (error) {
            console.warn('Failed to parse user from localStorage:', error);
        }
    }
    return config;
});
// Handle 401 responses by clearing user data
api.interceptors.response.use((r) => r, async (err) => {
    if (err?.response?.status === 401) {
        // Clear user data on authentication failure
        getAppStore()?.dispatch(clearUser());
        localStorage.removeItem('user');
        localStorage.removeItem('authenticated');
    }
    throw err;
});
export default api;
export async function uploadInvoiceFile(file, onProgress) {
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
    }
    catch { }
    const res = await api.post('/invoices/upload', formData, {
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
    const res = await api.get('/invoices/', { params });
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
    const res = await api.get(`/invoices/${id}`);
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
    const res = await api.put(`/invoices/${id}`, payload);
    return res.data;
}
export async function deleteInvoice(id) {
    const res = await api.delete(`/invoices/${id}`);
    return res.data;
}
export async function submitInvoice(id) {
    console.log('submitInvoice API called with id:', id);
    try {
        const res = await api.post(`/invoices/${id}/submit`, {});
        console.log('submitInvoice API response:', res.data);
        return res.data;
    }
    catch (error) {
        console.error('submitInvoice API error:', error);
        throw error;
    }
}
export async function approveInvoice(id, remarks) {
    const res = await api.post(`/invoices/${id}/approve`, { remarks });
    return res.data;
}
export async function rejectInvoice(id, remarks) {
    const res = await api.post(`/invoices/${id}/reject`, { remarks });
    return res.data;
}
export async function listPending(params = {}) {
    const res = await api.get('/invoices/pending', { params });
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
    const res = await api.get('/invoices/approved', { params });
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
    const res = await api.get('/invoices/statistics');
    return res.data;
}
export async function getInvoiceAuditLogs(id) {
    const res = await api.get(`/invoices/${id}/audit-logs`);
    return res.data;
}
// Authenticated file download helper (attaches Authorization header)
export async function downloadInvoiceFile(id) {
    // Return Blob so caller can open/save
    const res = await api.get(`/invoices/${id}/file`, { responseType: 'blob' });
    return res.data;
}
export async function getSystemStatistics() {
    const res = await api.get('/admin/statistics');
    return res.data;
}
export async function getAuditLogs(params = {}) {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data.logs;
}
export async function getAuditStats() {
    const res = await api.get('/admin/audit-logs/statistics');
    return res.data;
}
export async function getComprehensiveReport() {
    const res = await api.get('/admin/reports/comprehensive');
    return res.data.report;
}
export async function getSystemConfig() {
    const res = await api.get('/admin/config');
    return res.data.settings;
}
export async function updateSystemConfig(payload) {
    const res = await api.put('/admin/config', payload);
    return res.data;
}
export async function listUsers(params = {}) {
    const res = await api.get('/users/', { params });
    const d = res.data;
    return { items: d.users, total: d.total, pages: d.pages, current_page: d.current_page, per_page: d.per_page };
}
export async function createUser(payload) {
    const res = await api.post('/users/', payload);
    return res.data;
}
export async function updateUser(userId, payload) {
    const res = await api.put(`/users/${userId}`, payload);
    return res.data;
}
export async function deactivateUser(userId) {
    const res = await api.delete(`/users/${userId}`);
    return res.data;
}
export async function activateUser(userId) {
    const res = await api.post(`/users/${userId}/activate`, {});
    return res.data;
}
