import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

const SESSION_KEY = 'xgram_session';
const API_CREDENTIALS_KEY = 'xgram_api_credentials';

class TelegramService {
  constructor() {
    this.client = null;
    this._connecting = null;
  }

  /**
   * Get stored API credentials from localStorage
   */
  getStoredCredentials() {
    try {
      const stored = localStorage.getItem(API_CREDENTIALS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.apiId && parsed.apiHash) return parsed;
      }
    } catch { /* ignore */ }

    // Try env variables as fallback
    const apiId = import.meta.env.VITE_TELEGRAM_API_ID;
    const apiHash = import.meta.env.VITE_TELEGRAM_API_HASH;
    if (apiId && apiHash) {
      return { apiId: Number(apiId), apiHash };
    }

    return null;
  }

  /**
   * Save API credentials to localStorage
   */
  saveCredentials(apiId, apiHash) {
    localStorage.setItem(API_CREDENTIALS_KEY, JSON.stringify({ apiId: Number(apiId), apiHash }));
  }

  /**
   * Get the saved session string
   */
  getSavedSession() {
    return localStorage.getItem(SESSION_KEY) || '';
  }

  /**
   * Initialize TelegramClient with given or stored credentials
   */
  createClient(apiId, apiHash, sessionString = '') {
    const session = new StringSession(sessionString);
    this.client = new TelegramClient(session, Number(apiId), apiHash, {
      connectionRetries: 5,
      useWSS: true,
    });
    return this.client;
  }

  /**
   * Connect to Telegram servers (only connect, do not auth)
   */
  async connect() {
    if (!this.client) throw new Error('Client not initialized');
    if (this.client.connected) return;

    if (this._connecting) return this._connecting;

    this._connecting = this.client.connect();
    try {
      await this._connecting;
    } finally {
      this._connecting = null;
    }
  }

  /**
   * Send verification code to the phone number
   */
  async sendCode(phoneNumber) {
    await this.connect();
    const result = await this.client.sendCode(
      {
        apiId: Number(this.client.apiId ?? this.client._apiId),
        apiHash: this.client.apiHash ?? this.client._apiHash,
      },
      phoneNumber
    );
    return result;
  }

  /**
   * Sign in with phone code
   * Returns: { status: 'success' | '2fa_required', user? }
   */
  async signIn(phoneNumber, phoneCode, phoneCodeHash) {
    try {
      const result = await this.client.invoke(
        new (await import('telegram/tl')).Api.auth.SignIn({
          phoneNumber,
          phoneCode,
          phoneCodeHash,
        })
      );
      this._saveSession();
      return { status: 'success', user: result.user };
    } catch (err) {
      if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        return { status: '2fa_required' };
      }
      throw err;
    }
  }

  /**
   * Complete 2FA authentication with cloud password
   */
  async signInWith2FA(password) {
    const user = await this.client.signInWithPassword(
      {
        apiId: Number(this.client.apiId ?? this.client._apiId),
        apiHash: this.client.apiHash ?? this.client._apiHash,
      },
      {
        password: async () => password,
        onError: (err) => {
          throw err;
        },
      }
    );
    this._saveSession();
    return { status: 'success', user };
  }

  /**
   * Full auth flow using client.start() — simpler approach with callbacks
   */
  async startWithCallbacks({ phoneNumber, phoneCode, password, onError }) {
    await this.connect();
    await this.client.start({
      phoneNumber: async () => phoneNumber,
      phoneCode: async () => {
        return new Promise((resolve) => {
          phoneCode._resolve = resolve;
        });
      },
      password: async () => {
        return new Promise((resolve) => {
          password._resolve = resolve;
        });
      },
      onError: onError || ((err) => console.error('Auth error:', err)),
    });
    this._saveSession();
  }

  /**
   * Save session to localStorage
   */
  _saveSession() {
    if (this.client?.session) {
      const sessionStr = this.client.session.save();
      if (sessionStr) {
        localStorage.setItem(SESSION_KEY, sessionStr);
      }
    }
  }

  /**
   * Try to restore session and check if it's valid
   */
  async tryRestoreSession() {
    const credentials = this.getStoredCredentials();
    const sessionStr = this.getSavedSession();

    if (!credentials || !sessionStr) return false;

    try {
      this.createClient(credentials.apiId, credentials.apiHash, sessionStr);
      await this.connect();

      // Verify the session is still valid
      const me = await this.client.getMe();
      return me ? true : false;
    } catch (err) {
      console.warn('Session restore failed:', err);
      this.clearSession();
      return false;
    }
  }

  /**
   * Get current user info
   */
  async getMe() {
    if (!this.client?.connected) return null;
    return await this.client.getMe();
  }

  /**
   * Logout and clear session
   */
  async logout() {
    try {
      if (this.client?.connected) {
        await this.client.invoke(
          new (await import('telegram/tl')).Api.auth.LogOut()
        );
      }
    } catch { /* ignore */ }
    this.clearSession();
  }

  /**
   * Clear stored session
   */
  clearSession() {
    localStorage.removeItem(SESSION_KEY);
    if (this.client) {
      try {
        this.client.disconnect();
      } catch { /* ignore */ }
    }
    this.client = null;
  }

  /**
   * Check if client is connected and authorized
   */
  isConnected() {
    return this.client?.connected ?? false;
  }
}

// Singleton
export const telegramService = new TelegramService();
export default telegramService;
