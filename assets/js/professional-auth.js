// Professional Authentication System
class ProfessionalAuth {
  constructor() {
    this.sessionKey = 'professional_session_token';
    this.sessionExpiryKey = 'professional_session_expiry';
    this.sessionDuration = 8 * 60 * 60 * 1000; // 8 hours
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.attemptsKey = 'professional_login_attempts';
    this.lockoutKey = 'professional_lockout_until';
    
    this.initializeEventListeners();
    this.checkExistingSession();
  }

  initializeEventListeners() {
    const form = document.getElementById('professional-login-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleLogin(e));
    }
  }

  async handleLogin(event) {
    event.preventDefault();
    
    // Check if account is locked out
    if (this.isAccountLocked()) {
      this.showError('Account temporarily locked due to too many failed attempts. Please try again later.');
      return;
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const licenseNumber = document.getElementById('license-number').value;

    // Validate inputs
    if (!this.validateInputs(email, password)) {
      return;
    }

    this.setLoadingState(true);

    try {
      // Simulate professional verification (in production, this would call a real API)
      const isProfessional = await this.verifyProfessional(email, password, licenseNumber);
      
      if (isProfessional) {
        // Successful login
        this.createSession(email, licenseNumber);
        this.showSuccess('Login successful! Redirecting to Professional Dashboard...');
        
        // Reset failed attempts
        this.resetFailedAttempts();
        
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = 'app/professional-dashboard.html';
        }, 1500);
      } else {
        // Failed login
        this.recordFailedAttempt();
        this.showError('Invalid credentials or insufficient professional qualifications.');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Login failed. Please try again.');
    } finally {
      this.setLoadingState(false);
    }
  }

  validateInputs(email, password) {
    if (!email || !password) {
      this.showError('Email and password are required.');
      return false;
    }

    if (!this.isValidEmail(email)) {
      this.showError('Please enter a valid email address.');
      return false;
    }

    if (password.length < 6) {
      this.showError('Password must be at least 6 characters long.');
      return false;
    }

    return true;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async verifyProfessional(email, password, licenseNumber) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Professional verification logic (in production, this would be server-side)
    const professionalEmails = [
      'admin@Claim Navigator.com',
      'professional@Claim Navigator.com',
      'adjuster@Claim Navigator.com',
      'attorney@Claim Navigator.com',
      'contractor@Claim Navigator.com'
    ];

    const professionalPasswords = [
      'Professional2025!',
      'ClaimNav2025!',
      'Adjuster2025!',
      'Attorney2025!',
      'Contractor2025!'
    ];

    // Check if email is in professional list
    const emailIndex = professionalEmails.indexOf(email.toLowerCase());
    if (emailIndex === -1) {
      return false;
    }

    // Check if password matches
    if (password !== professionalPasswords[emailIndex]) {
      return false;
    }

    // License number validation (optional but recommended)
    if (licenseNumber && !this.isValidLicenseNumber(licenseNumber)) {
      return false;
    }

    return true;
  }

  isValidLicenseNumber(licenseNumber) {
    // Basic license number validation (adjust based on your requirements)
    return licenseNumber.length >= 6 && /^[A-Za-z0-9]+$/.test(licenseNumber);
  }

  createSession(email, licenseNumber) {
    const token = this.generateToken();
    const expiry = Date.now() + this.sessionDuration;
    
    localStorage.setItem(this.sessionKey, token);
    localStorage.setItem(this.sessionExpiryKey, expiry.toString());
    localStorage.setItem('professional_email', email);
    if (licenseNumber) {
      localStorage.setItem('professional_license', licenseNumber);
    }
  }

  generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  checkExistingSession() {
    const token = localStorage.getItem(this.sessionKey);
    const expiry = localStorage.getItem(this.sessionExpiryKey);
    
    if (token && expiry && Date.now() < parseInt(expiry)) {
      // Valid session exists, redirect to dashboard
      window.location.href = 'app/professional-dashboard.html';
    }
  }

  isAccountLocked() {
    const lockoutUntil = localStorage.getItem(this.lockoutKey);
    if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
      const remainingTime = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 60000);
      this.showError(`Account locked. Please try again in ${remainingTime} minutes.`);
      return true;
    }
    return false;
  }

  recordFailedAttempt() {
    const attempts = parseInt(localStorage.getItem(this.attemptsKey) || '0') + 1;
    localStorage.setItem(this.attemptsKey, attempts.toString());
    
    if (attempts >= this.maxLoginAttempts) {
      const lockoutUntil = Date.now() + this.lockoutDuration;
      localStorage.setItem(this.lockoutKey, lockoutUntil.toString());
      this.showError('Too many failed attempts. Account locked for 15 minutes.');
    }
  }

  resetFailedAttempts() {
    localStorage.removeItem(this.attemptsKey);
    localStorage.removeItem(this.lockoutKey);
  }

  setLoadingState(loading) {
    const button = document.getElementById('login-button');
    const spinner = document.getElementById('loading-spinner');
    const buttonText = document.getElementById('button-text');
    
    if (loading) {
      button.disabled = true;
      spinner.style.display = 'inline-block';
      buttonText.textContent = 'Verifying...';
    } else {
      button.disabled = false;
      spinner.style.display = 'none';
      buttonText.textContent = 'Access Professional Dashboard';
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide success message if shown
    const successDiv = document.getElementById('success-message');
    successDiv.style.display = 'none';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // Hide error message if shown
    const errorDiv = document.getElementById('error-message');
    errorDiv.style.display = 'none';
  }

  // Static method to check if user is authenticated
  static isAuthenticated() {
    const token = localStorage.getItem('professional_session_token');
    const expiry = localStorage.getItem('professional_session_expiry');
    
    if (!token || !expiry) {
      return false;
    }
    
    if (Date.now() > parseInt(expiry)) {
      // Session expired, clean up
      localStorage.removeItem('professional_session_token');
      localStorage.removeItem('professional_session_expiry');
      localStorage.removeItem('professional_email');
      localStorage.removeItem('professional_license');
      return false;
    }
    
    return true;
  }

  // Static method to logout
  static logout() {
    localStorage.removeItem('professional_session_token');
    localStorage.removeItem('professional_session_expiry');
    localStorage.removeItem('professional_email');
    localStorage.removeItem('professional_license');
    window.location.href = 'professional-login.html';
  }

  // Static method to get current user info
  static getCurrentUser() {
    if (!this.isAuthenticated()) {
      return null;
    }
    
    return {
      email: localStorage.getItem('professional_email'),
      license: localStorage.getItem('professional_license'),
      sessionExpiry: localStorage.getItem('professional_session_expiry')
    };
  }
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', () => {
  new ProfessionalAuth();
});

// Export for use in other files
window.ProfessionalAuth = ProfessionalAuth;
