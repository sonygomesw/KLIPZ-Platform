export interface User {
  id: string;
  email: string;
  role: 'streamer' | 'clipper';
  twitchUrl?: string;
  tiktokUsername?: string;
  balance: number;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  streamerId: string;
  streamerName: string;
  streamerAvatar?: string;
  streamerFollowers?: number;
  title: string;
  description: string;
  imageUrl?: string; // URL de l'image/thumbnail de la campagne
  criteria: {
    hashtags: string[];
    style: string;
    duration: number; // en secondes
    minViews: number; // nombre de vues minimum par vidéo
  };
  budget: number;
  cpm: number; // coût pour 1000 vues
  fanPageCpm: number | null; // coût pour 1000 vues sur fan page
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  totalViews: number;
  totalSpent: number;
}

export interface Submission {
  id: string;
  campaignId: string;
  clipperId: string;
  clipperName: string;
  tiktokUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  views: number;
  earnings: number;
  submittedAt: Date;
  approvedAt?: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface CampaignFilters {
  sortBy: 'popular' | 'new' | 'budget';
  minBudget?: number;
  maxBudget?: number;
} 