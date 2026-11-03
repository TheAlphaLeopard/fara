function isElectron() {
  // Renderer process
  if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
    return true;
  }

  // Main process
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` is set to true
  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
    return true;
  }

  return false;
}
// Discord OAuth2 configuration
const DISCORD_CONFIG = {
    clientId: '707329663827050536',
    redirectUri: isElectron() ? 'http://localhost:30123/callback' : 'http://playfara.com/numbers/callback.html',
    webhookUrl: 'https://discord.com/api/webhooks/1325937541416751208/7GO0z-K-sEeYQhii_PZ2Va4zoYY7IYBJeL57oG4y7B8GdptEmUKL2Z-4JmJurvRB093e'
};


class DiscordAuthClient {
    constructor() {
        // Store the authentication state in localStorage
        this.state = localStorage.getItem('discordAuthState');
        this.accessToken = localStorage.getItem('discordAccessToken');
        this.userData = JSON.parse(localStorage.getItem('discordUserData') || 'null');

    }

    // Generate a random state parameter for security
    generateState() {
        const state = Math.random().toString(36).substring(2);
        localStorage.setItem('discordAuthState', state);
        this.state = state;
        return state;
    }

    // Initiate the Discord login process
    async login() {
        const state = this.generateState();
        
        // Construct the Discord authorization URL
        const authUrl = new URL('https://discord.com/api/oauth2/authorize');
        authUrl.searchParams.set('response_type', 'token'); // Using implicit grant flow
        authUrl.searchParams.set('client_id', DISCORD_CONFIG.clientId);
        authUrl.searchParams.set('redirect_uri', DISCORD_CONFIG.redirectUri);
        authUrl.searchParams.set('scope', 'identify');
        authUrl.searchParams.set('state', state);

        
        if (isElectron()) {
            // Running in Electron: Use IPC to ask main process to handle login
            if (!window.electronAPI || !window.electronAPI.startDiscordLogin) {
                throw new Error("Electron communication API not available.");
            }
            try {
                const tokenData = await window.electronAPI.startDiscordLogin(authUrl.toString(), state);
                
                if (tokenData.error) {
                    console.error("[discord-auth.js] Error from main process during login:", tokenData.error);
                    throw new Error(tokenData.error);
                }
                if (!tokenData.accessToken) {
                    console.error("[discord-auth.js] No access token received from main process.");
                    throw new Error("Authentication failed: No access token received.");
                }

                localStorage.setItem('discordAccessToken', tokenData.accessToken);
                this.accessToken = tokenData.accessToken;
                
                await this.fetchUserData(); // This should now use the acquired token
                return this.userData;

            } catch (error) {
                console.error("[discord-auth.js] Discord login process via Electron failed:", error);
                throw error; // Re-throw for the UI to handle
            }
        } else {
            // Running in Web Browser: Standard redirect
            window.location.href = authUrl.toString();
            // The web version will rely on its own callback.html to handle the redirect.
            // This login() method returns a Promise that won't resolve in the web case here,
            // as the page navigates away.
            return new Promise(() => {}); // Return a non-resolving promise for web redirect
        }
    }

    async handleCallbackWithUrl(url) {
        try {
            const urlObject = new URL(url); // Parse the received URL string
            const fragment = new URLSearchParams(urlObject.hash.slice(1));
            const accessToken = fragment.get('access_token');
            const receivedState = fragment.get('state');

            if (receivedState !== this.state) {
                throw new Error('Invalid state parameter');
            }
            if (!accessToken) {
                throw new Error('Access token not found in callback URL');
            }

            localStorage.setItem('discordAccessToken', accessToken);
            this.accessToken = accessToken;

            await this.fetchUserData();

            // Instead of redirecting, resolve the promise from login()
            if (this.resolveOAuthPromise) {
                this.resolveOAuthPromise(this.userData);
            }
        } catch (error) {
            console.error("Error handling OAuth callback:", error);
            if (this.rejectOAuthPromise) {
                this.rejectOAuthPromise(error);
            }
            // Re-throw if you want the calling code to also handle it
            throw error;
        } finally {
            this.resolveOAuthPromise = null;
            this.rejectOAuthPromise = null;
        }
    }

    // Fetch the user's Discord profile

    async fetchUserData() {
        if (!this.accessToken) {
            console.error("[discord-auth.js] fetchUserData: Not authenticated, no access token.");
            throw new Error('Not authenticated');
        }
        
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("[discord-auth.js] fetchUserData: Failed to fetch. Status:", response.status, "Response:", errorText);
            localStorage.removeItem('discordAccessToken'); // Token might be invalid
            this.accessToken = null;
            throw new Error(`Failed to fetch user data (status: ${response.status})`);
        }
        
        const userData = await response.json();
        localStorage.setItem('discordUserData', JSON.stringify(userData));
        this.userData = userData;
        return userData;
    }

    isLoggedIn() {
        // Re-check localStorage in case of multiple tabs/windows or direct manipulation
        this.accessToken = localStorage.getItem('discordAccessToken');
        this.userData = JSON.parse(localStorage.getItem('discordUserData') || 'null');
        return !!this.accessToken && !!this.userData;
    }

    // Log out
    logout() {
        localStorage.removeItem('discordAuthState');
        localStorage.removeItem('discordAccessToken');
        localStorage.removeItem('discordUserData');
        this.state = null;
        this.accessToken = null;
        this.userData = null;
        // Potentially notify main process or other parts of the app if needed
    }
    // Post game activity to Discord webhook
    async postActivity(activity) {
        if (!this.userData) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(DISCORD_CONFIG.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: `**${this.userData.username}** ${activity}`,
                username: 'Game Activity Bot',
                avatar_url: `https://cdn.discordapp.com/avatars/${this.userData.id}/${this.userData.avatar}.png`
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to post activity');
        }
        
        return response;
    }

    

    
}
