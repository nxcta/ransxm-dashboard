// RANSXM Authentication

const Auth = {
    async login(email, password) {
        const result = await API.login(email, password);
        
        if (result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            return { success: true };
        }
        
        return { success: false, error: result.error };
    },
    
    async register(email, password) {
        const result = await API.register(email, password);
        
        if (result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            return { success: true };
        }
        
        return { success: false, error: result.error };
    },
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },
    
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    isLoggedIn() {
        return !!localStorage.getItem('token');
    },
    
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },
    
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },
    
    requireAdmin() {
        if (!this.isAdmin()) {
            window.location.href = 'user.html';
            return false;
        }
        return true;
    }
};

