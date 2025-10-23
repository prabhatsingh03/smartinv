import api from './apiService';
export async function login(email, password) {
    const res = await api.post(`/auth/login`, { email, password });
    // Store user data in localStorage for simplified authentication
    if (res.data?.authenticated) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('authenticated', 'true');
    }
    return res.data;
}
export async function logout() {
    try {
        await api.post('/auth/logout');
    }
    catch (error) {
        console.warn('Logout API call failed:', error);
    }
    finally {
        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('authenticated');
    }
}
export function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}
export function isAuthenticated() {
    return localStorage.getItem('authenticated') === 'true';
}
