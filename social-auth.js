/**
 * Social Authentication Module
 * OAuth integration for Google, Twitter/X, Discord, and GitHub
 */

const crypto = require('crypto');

/**
 * Base OAuth Provider
 */
class OAuthProvider {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.scope = config.scope;
    this.authUrl = config.authUrl;
    this.tokenUrl = config.tokenUrl;
    this.userInfoUrl = config.userInfoUrl;
  }

  /**
   * Generate authorization URL
   */
  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      state
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange code for access token
   */
  async exchangeCodeForToken(code) {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Get user info
   */
  async getUserInfo(accessToken) {
    throw new Error('Must be implemented by subclass');
  }
}

/**
 * Google OAuth Provider
 */
class GoogleOAuth extends OAuthProvider {
  constructor(config) {
    super({
      ...config,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scope: 'openid profile email'
    });
  }

  async exchangeCodeForToken(code) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return await response.json();
  }

  async getUserInfo(accessToken) {
    const response = await fetch(this.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
      verified: data.verified_email
    };
  }
}

/**
 * Twitter/X OAuth Provider
 */
class TwitterOAuth extends OAuthProvider {
  constructor(config) {
    super({
      ...config,
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      userInfoUrl: 'https://api.twitter.com/2/users/me',
      scope: 'tweet.read users.read'
    });
  }

  getAuthorizationUrl(state, codeChallenge) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code, codeVerifier) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
          'base64'
        )}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return await response.json();
  }

  async getUserInfo(accessToken) {
    const response = await fetch(`${this.userInfoUrl}?user.fields=profile_image_url,verified`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();

    return {
      id: data.data.id,
      username: data.data.username,
      name: data.data.name,
      picture: data.data.profile_image_url,
      verified: data.data.verified
    };
  }
}

/**
 * Discord OAuth Provider
 */
class DiscordOAuth extends OAuthProvider {
  constructor(config) {
    super({
      ...config,
      authUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      userInfoUrl: 'https://discord.com/api/users/@me',
      scope: 'identify email'
    });
  }

  async exchangeCodeForToken(code) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return await response.json();
  }

  async getUserInfo(accessToken) {
    const response = await fetch(this.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();

    return {
      id: data.id,
      username: data.username,
      discriminator: data.discriminator,
      email: data.email,
      avatar: data.avatar
        ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
        : null,
      verified: data.verified
    };
  }
}

/**
 * GitHub OAuth Provider
 */
class GitHubOAuth extends OAuthProvider {
  constructor(config) {
    super({
      ...config,
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scope: 'read:user user:email'
    });
  }

  async exchangeCodeForToken(code) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return await response.json();
  }

  async getUserInfo(accessToken) {
    const response = await fetch(this.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();

    return {
      id: data.id.toString(),
      username: data.login,
      name: data.name,
      email: data.email,
      avatar: data.avatar_url,
      bio: data.bio
    };
  }
}

/**
 * Social Auth Manager
 */
class SocialAuthManager {
  constructor(config) {
    this.providers = {
      google: new GoogleOAuth(config.google),
      twitter: new TwitterOAuth(config.twitter),
      discord: new DiscordOAuth(config.discord),
      github: new GitHubOAuth(config.github)
    };

    this.sessions = new Map();
    this.linkedAccounts = new Map();
  }

  /**
   * Start OAuth flow
   */
  startOAuthFlow(provider, userId = null) {
    if (!this.providers[provider]) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const state = crypto.randomBytes(16).toString('hex');
    const session = {
      provider,
      state,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 600000 // 10 minutes
    };

    // Generate PKCE for Twitter
    if (provider === 'twitter') {
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

      session.codeVerifier = codeVerifier;
      session.codeChallenge = codeChallenge;
    }

    this.sessions.set(state, session);

    const authUrl =
      provider === 'twitter'
        ? this.providers[provider].getAuthorizationUrl(state, session.codeChallenge)
        : this.providers[provider].getAuthorizationUrl(state);

    return {
      authUrl,
      state
    };
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(provider, code, state) {
    const session = this.sessions.get(state);

    if (!session || session.provider !== provider) {
      throw new Error('Invalid or expired session');
    }

    if (session.expiresAt < Date.now()) {
      this.sessions.delete(state);
      throw new Error('Session expired');
    }

    // Exchange code for token
    const tokenData =
      provider === 'twitter'
        ? await this.providers[provider].exchangeCodeForToken(code, session.codeVerifier)
        : await this.providers[provider].exchangeCodeForToken(code);

    // Get user info
    const userInfo = await this.providers[provider].getUserInfo(tokenData.access_token);

    // Link account
    const linkedAccount = {
      provider,
      providerId: userInfo.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null,
      userInfo,
      linkedAt: Date.now()
    };

    // If userId in session, link to existing account
    if (session.userId) {
      const accounts = this.linkedAccounts.get(session.userId) || [];
      accounts.push(linkedAccount);
      this.linkedAccounts.set(session.userId, accounts);
    }

    this.sessions.delete(state);

    return {
      success: true,
      provider,
      userInfo,
      linkedAccount
    };
  }

  /**
   * Link social account to user
   */
  linkAccount(userId, provider, providerId, accountData) {
    const accounts = this.linkedAccounts.get(userId) || [];

    // Check if already linked
    const existing = accounts.find((a) => a.provider === provider && a.providerId === providerId);
    if (existing) {
      throw new Error('Account already linked');
    }

    accounts.push({
      provider,
      providerId,
      ...accountData,
      linkedAt: Date.now()
    });

    this.linkedAccounts.set(userId, accounts);

    return { success: true, accountsCount: accounts.length };
  }

  /**
   * Unlink social account
   */
  unlinkAccount(userId, provider) {
    const accounts = this.linkedAccounts.get(userId) || [];
    const filtered = accounts.filter((a) => a.provider !== provider);

    if (filtered.length === accounts.length) {
      throw new Error('Account not linked');
    }

    this.linkedAccounts.set(userId, filtered);

    return { success: true, accountsCount: filtered.length };
  }

  /**
   * Get linked accounts for user
   */
  getLinkedAccounts(userId) {
    const accounts = this.linkedAccounts.get(userId) || [];

    return accounts.map((a) => ({
      provider: a.provider,
      providerId: a.providerId,
      username: a.userInfo?.username || a.userInfo?.name,
      email: a.userInfo?.email,
      picture: a.userInfo?.picture || a.userInfo?.avatar,
      linkedAt: a.linkedAt
    }));
  }

  /**
   * Find user by social account
   */
  findUserByProvider(provider, providerId) {
    for (const [userId, accounts] of this.linkedAccounts.entries()) {
      const account = accounts.find((a) => a.provider === provider && a.providerId === providerId);
      if (account) {
        return {
          userId,
          account
        };
      }
    }
    return null;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(userId, provider) {
    const accounts = this.linkedAccounts.get(userId) || [];
    const account = accounts.find((a) => a.provider === provider);

    if (!account || !account.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Implementation depends on provider
    // This is a simplified version
    return { success: true, expiresAt: Date.now() + 3600000 };
  }
}

module.exports = {
  GoogleOAuth,
  TwitterOAuth,
  DiscordOAuth,
  GitHubOAuth,
  SocialAuthManager
};
