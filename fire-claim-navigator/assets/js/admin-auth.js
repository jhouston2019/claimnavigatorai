// Admin Authentication Utility
class AdminAuth {
    constructor() {
        this.isAuthenticated = this.checkAuthStatus();
    }

    checkAuthStatus() {
        const authStatus = sessionStorage.getItem('adminAuthenticated');
        const loginTime = sessionStorage.getItem('adminLoginTime');
        
        if (!authStatus || !loginTime) {
            return false;
        }

        // Check if session is still valid (24 hours)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            this.logout();
            return false;
        }

        return true;
    }

    requireAuth() {
        if (!this.isAuthenticated) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }

    redirectToLogin() {
        // Store current page for redirect after login
        sessionStorage.setItem('adminRedirectUrl', window.location.href);
        window.location.href = 'admin-login.html';
    }

    logout() {
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminLoginTime');
        sessionStorage.removeItem('adminRedirectUrl');
        this.redirectToLogin();
    }

    // Add logout button to admin pages
    addLogoutButton() {
        if (!this.isAuthenticated) return;

        // Create logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.innerHTML = '🔓 Logout';
        logoutBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc2626;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: background-color 0.2s;
        `;
        
        logoutBtn.addEventListener('mouseenter', () => {
            logoutBtn.style.background = '#b91c1c';
        });
        
        logoutBtn.addEventListener('mouseleave', () => {
            logoutBtn.style.background = '#dc2626';
        });

        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                this.logout();
            }
        });

        document.body.appendChild(logoutBtn);
    }

    // Check for redirect after login
    checkRedirect() {
        const redirectUrl = sessionStorage.getItem('adminRedirectUrl');
        if (redirectUrl && redirectUrl !== window.location.href) {
            sessionStorage.removeItem('adminRedirectUrl');
            window.location.href = redirectUrl;
        }
    }
}

// Initialize admin auth
const adminAuth = new AdminAuth();

// Auto-check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    if (adminAuth.requireAuth()) {
        adminAuth.addLogoutButton();
        adminAuth.checkRedirect();
    }
});

// Export for use in other scripts
window.AdminAuth = AdminAuth;
