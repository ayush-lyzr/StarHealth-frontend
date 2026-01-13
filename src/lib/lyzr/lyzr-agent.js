// Dynamic import to avoid SSR issues with localStorage
let memberstackDom = null;

if (typeof window !== 'undefined') {
  // Only import on client side
  import('@memberstack/dom').then((module) => {
    memberstackDom = module.default;
  }).catch((error) => {
    console.error('Error loading @memberstack/dom:', error);
  });
}

class LyzrAgent {
  constructor(publicKey) {
    // console.log('Initializing LyzrAgent');
    if (!publicKey) {
      throw new Error('Public key is required');
    }

    this.publicKey = publicKey;
    this.memberstack = null;
    this.badge = null;
    this.modal = null;
    this.isAuthenticated = false;
    this.isLoading = false;
    this.token = null;
    this.apiKey = "";
    this.authStateCallbacks = [];
    this.pagosUrl = "https://pagos-prod.studio.lyzr.ai";
    this.agentStudioUrl = "https://studio.lyzr.ai/auth/sign-in";
    this.agentStudioUrlSignup = "https://studio.lyzr.ai/auth/sign-up";
    this.badgePosition = {
      x: 'right: 20px',
      y: 'bottom: 20px'
    };
    this.creditWarningModal = null;
    this.creditErrorModal = null;
    this.reloginModal = null;
    this.isLoggingOut = false;
  }

  async init(publicKey) {
    try {
      // console.log('Starting initialization');


      // Ensure memberstack is loaded
      if (!memberstackDom && typeof window !== 'undefined') {
        const memberstackModule = await import('@memberstack/dom');
        memberstackDom = memberstackModule.default;
      }

      if (!memberstackDom) {
        throw new Error('Memberstack DOM not available');
      }

      // Initialize Memberstack
      this.memberstack = memberstackDom.init({
        publicKey,
        sessionDurationDays: 30
      });

      // Wait a bit for memberstack to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create badge
      this.createBadge();

      // Hide the app content initially
      // console.log('Hiding app content');
      this.hideAppContent();

      // Check for token in url for previous authentication
      // console.log('Checking url for token query param');
      const hadToken = await this.checkBearerAuth();

      // If we just processed a token, wait a bit for it to be set
      if (hadToken) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Check auth status and redirect if not authenticated
      // console.log('Checking auth status');
      await this.checkAuthStatus();

      // Set up auth state listener
      this.setupAuthStateListener();
      // console.log('Initialization complete');
      return this;
    } catch (error) {
      console.error('Error during initialization:', error);
      throw error;
    }
  }

  async checkBearerAuth() {
    if (typeof window === 'undefined') {
      return false;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      this.token = token;
      try {
        const res = await fetch('https://client.memberstack.com/member', {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'Authorization': `Bearer ${token}`,
            "x-api-key": this.publicKey,
          }
        });
        const response = await res.json();
        localStorage.setItem("_ms-mem", JSON.stringify(response?.data ?? "{}"));
        localStorage.setItem("_ms-mid", token);
        const date = new Date();
        let expires = "";
        date.setTime(date.getTime() + (15 * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
        document.cookie = "_ms-mid=" + token + expires;
        document.cookie = "user_id=" + response?.data?.id;
        this.isAuthenticated = true;
        this.notifyAuthStateChange();

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      } catch (error) {
        console.error('Error processing bearer auth:', error);
        return false;
      }
    }
    return false;
  }

  setupAuthStateListener() {
    // Check auth state periodically
    setInterval(async () => {
      const member = await this.memberstack.getMemberCookie();
      const newAuthState = !!member;
      if (newAuthState !== this.isAuthenticated) {
        this.isAuthenticated = newAuthState;
        this.token = member;
        this.notifyAuthStateChange();

        // If user becomes unauthenticated, redirect to login
        if (!newAuthState) {
          this.redirectToLogin();
        }
      }
    }, 1000); // Check every second
  }

  notifyAuthStateChange() {
    this.authStateCallbacks.forEach(callback => {
      callback(this.isAuthenticated);
    });
  }

  onAuthStateChange(callback) {
    this.authStateCallbacks.push(callback);
    // Immediately call with current state
    callback(this.isAuthenticated);
    // Return unsubscribe function
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter(cb => cb !== callback);
    };
  }

  async getMember() {
    try {
      // Check if memberstack is initialized
      if (!this.memberstack) {
        throw new Error('Memberstack not initialized. Please wait for Lyzr SDK to initialize.');
      }

      const member = await this.memberstack.getMemberCookie();
      if (!member) {
        return null;
      }
      this.token = member;
      const response = await fetch('https://client.memberstack.com/member', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${member}`,
          "x-api-key": this.publicKey,
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data?.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting member:', error);
      return null;
    }
  }

  async getKeys() {
    try {
      if (!this.token) {
        console.error('No authentication token available');
        return null;
      }

      const response = await fetch(
        `${this.pagosUrl}/api/v1/keys`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${this.token}`
          }
        }
      );

      if (response.status === 401) {
        this.showReloginModal();
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching keys:', error);
      return null;
    }
  }

  async getKeysUser() {
    try {
      if (!this.token || !this.apiKey) {
        console.error('No authentication token available');
        return null;
      }

      const response = await fetch(`${this.pagosUrl}/api/v1/keys/user?api_key=${this.apiKey}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'authorization': `Bearer ${this.token}`
        }
      });

      if (response.status === 401) {
        this.showReloginModal();
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, token: this.token };
    } catch (error) {
      console.error('Error fetching keys user:', error);
      return null;
    }
  }

  getApiKeyFromStorage() {
    if (typeof window === 'undefined') {
      return null;
    }
    const storedKey = localStorage.getItem('lyzr_api_key');
    if (storedKey) {
      this.apiKey = storedKey;
    }
    return storedKey;
  }

  async logout() {
    await this.memberstack.logout();
    document.cookie = "_ms-mid" + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.reload();
  }

  async logoutWithoutReload() {
    this.isLoggingOut = true;
    try {
      await this.memberstack.logout();
      document.cookie = "_ms-mid" + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      this.token = null;
      this.isAuthenticated = false;
      this.notifyAuthStateChange();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.isLoggingOut = false;
    }
  }

  hideAppContent() {
    // console.log('Hiding app content');
    const body = document.body;
    if (body) {
      body.style.opacity = '0';
      body.style.pointerEvents = 'none';
    }
  }

  showAppContent() {
    // console.log('Showing app content');
    const body = document.body;
    if (body) {
      body.style.opacity = '1';
      body.style.pointerEvents = 'auto';
    }
  }

  async checkAuthStatus() {
    try {
      const member = await this.memberstack.getMemberCookie();
      this.token = member;
      const newAuthState = !!member;
      if (this.isAuthenticated !== newAuthState) {
        this.isAuthenticated = newAuthState;
        this.notifyAuthStateChange();
      }
      if (member) {
        this.showAppContent();
        await this.checkCredits();
        this.hideLoginModal();
      } else {
        // User is not authenticated - redirect to login immediately
        this.hideAppContent();
        this.redirectToLogin();
      }
      console.log('Auth status checked:', { member, isAuthenticated: this.isAuthenticated });
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.isAuthenticated = false;
      this.notifyAuthStateChange();
      this.redirectToLogin();
      this.hideAppContent();
    }
  }

  redirectToLogin() {
    // Redirect to Lyzr Agent Studio login page
    if (typeof window === 'undefined') {
      return;
    }

    // Prevent multiple redirects
    if (window.location.href.includes(this.agentStudioUrl)) {
      return;
    }

    const currentUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const loginUrl = `${this.agentStudioUrl}/?redirect=${encodeURIComponent(currentUrl)}`;

    // Immediate redirect
    window.location.href = loginUrl;
  }

  createBadge() {
    const badgeHtml = `
      <div id="lyzr-badge" style="
        position: fixed;
        ${this.badgePosition.x};
        ${this.badgePosition.y};
        background: white;
        padding: 8px 12px;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 1000;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <span>Powered by Lyzr Agent Studio</span>
        <img src="https://studio.lyzr.ai/images/Lyzr-Logo.svg" alt="Lyzr Logo" style="height: 20px; width: auto;">
      </div>
    `;
    const badgeElement = document.createElement('div');
    badgeElement.innerHTML = badgeHtml;
    document.body.appendChild(badgeElement);
    this.badge = badgeElement.firstElementChild;

    // Add click handler for the entire badge
    if (this.badge) {
      // Add hover effect
      this.badge.addEventListener('mouseover', () => {
        this.badge.style.transform = 'scale(1.02)';
      });
      this.badge.addEventListener('mouseout', () => {
        this.badge.style.transform = 'scale(1)';
      });

      // Add click handler to redirect to Lyzr Studio
      this.badge.addEventListener('click', () => {
        window.open('https://studio.lyzr.ai/', '_blank');
      });
    }
  }

  hideLoginModal() {
    // console.log('Hiding login modal');
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  async checkCredits() {
    try {
      const response = await fetch(`${this.pagosUrl}/api/v1/usages/current`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'authorization': `Bearer ${this.token}`
        }
      });

      if (response.status === 401) {
        this.showReloginModal();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const totalCredits = (data.recurring_credits || 0) + (data.paid_credits || 0) + (data.used_credits || 0);
      const usedCredits = data.used_credits || 0;
      const remainingCredits = (data.recurring_credits || 0) + (data.paid_credits || 0);

      if (remainingCredits <= 0) {
        this.showCreditErrorModal();
      } else if (remainingCredits <= 20) {
        this.showCreditWarningModal(remainingCredits);
      }
    } catch (error) {
      console.error('Error checking credits:', error);
    }
  }

  showCreditErrorModal() {
    if (!this.creditErrorModal) {
      this.createCreditErrorModal();
    }
    if (this.creditErrorModal) {
      this.creditErrorModal.style.display = 'flex';
    }
  }

  hideCreditErrorModal() {
    if (this.creditErrorModal) {
      this.creditErrorModal.style.display = 'none';
    }
  }

  showCreditWarningModal(remainingCredits) {
    if (!this.creditWarningModal) {
      this.createCreditWarningModal();
    }
    if (this.creditWarningModal) {
      const messageElement = document.getElementById('lyzr-credit-warning-message');
      if (messageElement) {
        messageElement.textContent = `You have ${remainingCredits} credits remaining. Consider topping up to ensure uninterrupted service.`;
      }
      this.creditWarningModal.style.display = 'flex';
    }
  }

  hideCreditWarningModal() {
    if (this.creditWarningModal) {
      this.creditWarningModal.style.display = 'none';
    }
  }

  createCreditErrorModal() {
    const modalHtml = `
      <div id="lyzr-credit-error-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      ">
        <div style="
          position: relative;
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
          width: 400px;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <div style="display: flex; justify-content: center; margin-bottom: 24px;">
            <img src="https://studio.lyzr.ai/images/Lyzr-Logo.svg" alt="Lyzr Logo" style="height: 40px;">
          </div>
          <h2 style="
            margin: 0 0 12px;
            color: #dc2626;
            font-size: 24px;
            font-weight: 600;
          ">Credits Exhausted</h2>
          <p style="
            margin: 0 0 24px;
            color: #666;
            font-size: 16px;
            line-height: 1.5;
          ">You've used all your available credits. Please recharge to continue using the service.</p>
          <div style="display: flex; gap: 12px;">
            <button id="lyzr-credit-error-redirect" style="
              flex: 1;
              padding: 12px 24px;
              background: rgba(129, 64, 241, 0.75);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
            ">Get Credits</button>
            <button id="lyzr-logout-button" style="
              flex: 1;
              padding: 12px 12px;
              background: white;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              color: black;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
            ">Logout</button>
          </div>
        </div>
      </div>
    `;

    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHtml;
    document.body.appendChild(modalElement);
    this.creditErrorModal = modalElement.firstElementChild;

    const redirectButton = document.getElementById('lyzr-credit-error-redirect');
    const logoutButton = document.getElementById('lyzr-logout-button');

    if (redirectButton) {
      redirectButton.addEventListener('click', () => {
        window.open('https://studio.lyzr.ai/organization', '_blank');
      });
    }
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        await this.logout();
        this.hideCreditErrorModal();
      });
    }
  }

  createCreditWarningModal() {
    const modalHtml = `
      <div id="lyzr-credit-warning-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      ">
        <div style="
          position: relative;
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
          width: 400px;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <button id="lyzr-credit-warning-close" style="
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
            color: #666;
          ">×</button>
          <img src="https://studio.lyzr.ai/images/Lyzr-Logo.svg" alt="Lyzr Logo" style="height: 40px; margin-bottom: 24px;">
          <h2 style="
            margin: 0 0 12px;
            color: #f59e0b;
            font-size: 24px;
            font-weight: 600;
          ">Low Credits Warning</h2>
          <p id="lyzr-credit-warning-message" style="
            margin: 0 0 24px;
            color: #666;
            font-size: 16px;
            line-height: 1.5;
          ">Your credits are running low. Consider topping up to ensure uninterrupted service.</p>
          <div style="display: flex; gap: 12px;">
            <button id="lyzr-credit-warning-continue" style="
              flex: 1;
              padding: 12px 24px;
              background: #e5e7eb;
              color: #374151;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
            ">Continue</button>
            <button id="lyzr-credit-warning-redirect" style="
              flex: 1;
              padding: 12px 24px;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
            ">Top Up Now</button>
          </div>
        </div>
      </div>
    `;

    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHtml;
    document.body.appendChild(modalElement);
    this.creditWarningModal = modalElement.firstElementChild;

    const closeButton = document.getElementById('lyzr-credit-warning-close');
    const continueButton = document.getElementById('lyzr-credit-warning-continue');
    const redirectButton = document.getElementById('lyzr-credit-warning-redirect');

    if (closeButton) {
      closeButton.addEventListener('click', () => this.hideCreditWarningModal());
    }
    if (continueButton) {
      continueButton.addEventListener('click', () => this.hideCreditWarningModal());
    }
    if (redirectButton) {
      redirectButton.addEventListener('click', () => {
        window.open('https://studio.lyzr.ai/organization', '_blank');
      });
    }
  }

  showReloginModal() {
    if (!this.reloginModal) {
      this.createReloginModal();
    }
    if (this.reloginModal) {
      this.reloginModal.style.display = 'flex';
    }
  }

  hideReloginModal() {
    if (this.reloginModal) {
      this.reloginModal.style.display = 'none';
    }
  }

  createReloginModal() {
    const modalHtml = `
      <div id="lyzr-relogin-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(41, 41, 41, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(41, 41, 41, 0.1);
          width: 480px;
          max-width: 90vw;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <div style="display: flex; justify-content: center; margin-bottom: 24px;">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="25" stroke="#6B7280" stroke-width="2" fill="none"/>
              <rect x="28" y="15" width="4" height="20" rx="2" fill="#6B7280"/>
              <circle cx="30" cy="42" r="2" fill="#6B7280"/>
            </svg>
          </div>
          <h2 style="
            margin: 0 0 16px;
            color: #292929;
            font-size: 20px;
            font-weight: 600;
          ">Session Timeout!</h2>
          <p style="
            margin: 0 0 24px;
            color: #666;
            font-size: 16px;
            line-height: 1.5;
          ">Your authentication session has expired. Please login to continue using the application.</p>
          <button id="lyzr-relogin-button" style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            margin-bottom: 16px;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            background: #292929;
            color: white;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
          ">
            <span id="relogin-text">Login with Lyzr Agent Studio</span>
            <span id="relogin-loader" style="display: none; margin-left: 8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
                <style>
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                </style>
                <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
              </svg>
            </span>
          </button>
          <p style="
            margin: 24px 0 0;
            color: #666;
            font-size: 12px;
            line-height: 1.5;
          ">You will be redirected to Lyzr Agent Studio for secure authentication.</p>
        </div>
      </div>
    `;
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHtml;
    document.body.appendChild(modalElement);
    this.reloginModal = modalElement.firstElementChild;

    const reloginButton = document.getElementById('lyzr-relogin-button');
    if (reloginButton) {
      reloginButton.addEventListener('click', async () => {
        await this.handleRelogin();
      });
    }
  }

  async handleRelogin() {
    const reloginText = document.getElementById('relogin-text');
    const reloginLoader = document.getElementById('relogin-loader');

    if (reloginText && reloginLoader) {
      reloginText.style.opacity = '0.7';
      reloginLoader.style.display = 'inline-block';
    }

    await this.logoutWithoutReload();
    window.location.href = `${this.agentStudioUrl}/?redirect=${window.location.origin}`;
  }

  getToken() {
    return this.token;
  }

  getIsAuthenticated() {
    return this.isAuthenticated;
  }
}

// Create and export a function to get the instance (lazy initialization)
let lyzrInstance = null;

function getLyzrInstance() {
  if (!lyzrInstance) {
    const publicKey = typeof window !== 'undefined'
      ? (import.meta.env.VITE_LYZR_PUBLIC_KEY || 'pk_c14a2728e715d9ea67bf')
      : 'pk_c14a2728e715d9ea67bf';
    lyzrInstance = new LyzrAgent(publicKey);

    // Explicitly set as global on client side
    if (typeof window !== 'undefined') {
      window.lyzr = lyzrInstance;
    }
  }
  return lyzrInstance;
}

// Export the getter function (not the instance) to avoid SSR issues
export default getLyzrInstance;




