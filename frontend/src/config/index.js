/// <reference types="vite/client" />
export const config = {
    // Keep endpoints in services starting with "/api/...". Use empty baseURL to avoid
    // accidental duplication like "/api/api/..." when no env override is provided.
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
    authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL || '/api/auth'
};
