export const ROUTES = {
  // Authentication
  AUTH: 'Auth',
  
  // Main tabs
  MAIN: 'Main',
  TODAY: 'Today',
  BOOSTS: 'Boosts',
  PROFILE: 'Profile',
  
  // Campaign screens
  CREATE_CAMPAIGN: 'CreateCampaign',
  CAMPAIGNS_LIST: 'CampaignsList',
  CAMPAIGN_DETAIL: 'CampaignDetail',
  MISSION_DETAIL: 'MissionDetail',
  
  // Submission screens
  SUBMISSIONS: 'Submissions',
  
  // Payment screens
  PAYMENT: 'Payment',
  // Admin
  ADMIN_DECLARATIONS: 'AdminDeclarations',
} as const;

export type RouteNames = typeof ROUTES[keyof typeof ROUTES]; 