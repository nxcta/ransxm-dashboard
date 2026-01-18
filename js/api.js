// RANSXM API Client

// API URL - Production
const API_BASE = 'https://ransxm-api.onrender.com/api';

const API = {
    // Get auth token from storage
    getToken() {
        return localStorage.getItem('token');
    },
    
    // Make authenticated request
    async request(endpoint, options = {}) {
        const token = this.getToken();
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        };
        
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }
        
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            const data = await response.json();
            
            if (response.status === 401) {
                // Token expired, redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
                return { error: 'Session expired' };
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { error: 'Connection failed' };
        }
    },
    
    // Auth
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
    },
    
    async register(email, password, key) {
        return this.request('/auth/register', {
            method: 'POST',
            body: { email, password, key }
        });
    },
    
    async getMe() {
        return this.request('/auth/me');
    },
    
    // Keys
    async getKeys(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/keys${query ? '?' + query : ''}`);
    },
    
    async createKey(data) {
        return this.request('/keys', {
            method: 'POST',
            body: data
        });
    },
    
    async bulkCreateKeys(data) {
        return this.request('/keys/bulk', {
            method: 'POST',
            body: data
        });
    },
    
    async updateKey(id, data) {
        return this.request(`/keys/${id}`, {
            method: 'PUT',
            body: data
        });
    },
    
    async deleteKey(id) {
        return this.request(`/keys/${id}`, {
            method: 'DELETE'
        });
    },
    
    async resetHWID(id) {
        return this.request(`/keys/${id}/reset-hwid`, {
            method: 'POST'
        });
    },
    
    async resetUses(id) {
        return this.request(`/keys/${id}/reset-uses`, {
            method: 'POST'
        });
    },
    
    async batchDelete(ids) {
        return this.request('/keys/batch-delete', {
            method: 'POST',
            body: { ids }
        });
    },
    
    async batchStatus(ids, status) {
        return this.request('/keys/batch-status', {
            method: 'POST',
            body: { ids, status }
        });
    },
    
    // Admin
    async getStats() {
        return this.request('/admin/stats');
    },
    
    async getLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/logs${query ? '?' + query : ''}`);
    },
    
    async getUsers() {
        return this.request('/admin/users');
    },
    
    async getAnalytics(days = 7) {
        return this.request(`/admin/analytics?days=${days}`);
    },
    
    // User Management (Super Admin only)
    async createAdminUser(data) {
        return this.request('/admin/users', {
            method: 'POST',
            body: data
        });
    },
    
    async updateUserRole(userId, role) {
        return this.request(`/admin/users/${userId}/role`, {
            method: 'PUT',
            body: { role }
        });
    },
    
    async deleteUser(userId) {
        return this.request(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
    },
    
    // User self-service
    async getMyLogs() {
        return this.request('/auth/my-logs');
    }
};

