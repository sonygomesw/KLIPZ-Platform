// Configuration pour le mode démonstration
export const DEMO_CONFIG = {
  enabled: false,
  users: {
    streamer: {
      id: 'demo-streamer-1',
      email: 'streamer@klipz.demo',
      role: 'streamer' as const,
      twitchUrl: 'https://twitch.tv/kaicenat',
      balance: 250.75,
      createdAt: new Date(),
    },
    clipper: {
      id: 'demo-clipper-1',
      email: 'clipper@klipz.demo',
      role: 'clipper' as const,
      tiktokUsername: 'clipper',
      balance: 45.50,
      createdAt: new Date(),
    },
  },
};

// Service d'authentification de démonstration
export const demoAuthService = {
  currentUser: null as any,
  
  async signUpStreamer(data: any) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler délai réseau
    this.currentUser = {
      ...DEMO_CONFIG.users.streamer,
      email: data.email,
      twitchUrl: data.twitchUrl,
    };
    return this.currentUser;
  },

  async signUpClipper(data: any) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.currentUser = {
      ...DEMO_CONFIG.users.clipper,
      email: data.email,
      tiktokUsername: data.tiktokUsername,
    };
    return this.currentUser;
  },

  async signIn(email: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simuler différents utilisateurs selon l'email
    if (email.includes('streamer') || email.includes('stream')) {
      this.currentUser = {
        ...DEMO_CONFIG.users.streamer,
        email,
      };
    } else {
      this.currentUser = {
        ...DEMO_CONFIG.users.clipper,
        email,
      };
    }
    
    return this.currentUser;
  },

  async signOut() {
    await new Promise(resolve => setTimeout(resolve, 500));
    this.currentUser = null;
  },

  async getCurrentUser() {
    return this.currentUser;
  },

  onAuthStateChange(callback: (user: any) => void) {
    // Simuler un changement d'état d'authentification
    setTimeout(() => {
      callback(this.currentUser);
    }, 100);
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  },

  validateTwitchUrl(url: string) {
    return /^https?:\/\/(www\.)?twitch\.tv\/[a-zA-Z0-9_]{4,25}$/.test(url);
  },

  validateTikTokUsername(username: string) {
    return /^[a-zA-Z0-9._]{1,24}$/.test(username);
  },

  async updateProfile(userId: string, updates: any) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...updates };
    }
    return this.currentUser;
  },

  async isAuthenticated() {
    return this.currentUser !== null;
  },
}; 