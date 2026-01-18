// RANSXM Authentication

const Auth = {
    async login(email, password) {
        const result = await API.login(email, password);
        
        if (result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            return { success: true, user: result.user };
        }
        
        return { success: false, error: result.error };
    },
    
    async register(email, password, key) {
        const result = await API.register(email, password, key);
        
        if (result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            return { success: true, user: result.user };
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
        return user && (user.role === 'admin' || user.role === 'super_admin');
    },
    
    isSuperAdmin() {
        const user = this.getUser();
        return user && user.role === 'super_admin';
    },
    
    isUser() {
        const user = this.getUser();
        return user && user.role === 'user';
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
            // Regular users go to user dashboard
            window.location.href = 'user-dashboard.html';
            return false;
        }
        return true;
    },
    
    // Redirect to appropriate dashboard based on role
    redirectToDashboard() {
        const user = this.getUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        if (user.role === 'admin' || user.role === 'super_admin') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html';
        }
    }
};

