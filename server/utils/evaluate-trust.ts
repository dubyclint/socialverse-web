interface TrustCriteria {
  priority: string[];
  general: string[];
}

interface User {
  isVerified?: boolean;
  kycVerified?: boolean;
  profilePic?: { isReal?: boolean };
  lastActive?: number;
  postsPerWeek?: number;
  isPremium?: boolean;
  pewGiftBalance?: number;
  hasPaidActivity?: boolean;
  region?: string;
  country?: string;
}

interface TrustEvaluation {
  isTrusted: boolean;
  criteriaMet: string[];
  priorityRatio: number;
}

let trustCriteria: TrustCriteria = {
  priority: [
    'postsPerWeek>=12',
    'isPremium',
    'pewGiftBalance>=10',
    'sameRegion',
    'hasPaidActivity',
    'tierOneCountry'
  ],
  general: [
    'isVerified',
    'kycVerified',
    'hasRealProfilePic',
    'isActive'
  ]
};

export function setTrustCriteria(newCriteria: TrustCriteria): void {
  trustCriteria = { ...newCriteria }; // Create copy to avoid mutations
}

export function getTrustCriteria(): TrustCriteria {
  return { ...trustCriteria }; // Return copy to prevent mutations
}

export function evaluateTrust(user: User): TrustEvaluation {
  const met: string[] = [];

  // General criteria
  if (user.isVerified) met.push('isVerified');
  if (user.kycVerified) met.push('kycVerified');
  if (user.profilePic?.isReal) met.push('hasRealProfilePic');
  if (user.lastActive && Date.now() - user.lastActive < 7 * 86400000) {
    met.push('isActive');
  }

  // Priority criteria
  if ((user.postsPerWeek || 0) >= 12) met.push('postsPerWeek>=12');
  if (user.isPremium) met.push('isPremium');
  if ((user.pewGiftBalance || 0) >= 10) met.push('pewGiftBalance>=10');
  if (user.hasPaidActivity) met.push('hasPaidActivity');
  if (user.region === user.country) met.push('sameRegion');

  const tierOneCountries = [
    'USA', 'Canada', 'Sweden', 'Norway', 'Denmark', 
    'Finland', 'Germany', 'France', 'Japan', 'UK', 
    'Australia', 'New Zealand', 'Switzerland'
  ];
  
  if (user.country && tierOneCountries.includes(user.country)) {
    met.push('tierOneCountry');
  }

  const priorityMet = met.filter(c => trustCriteria.priority.includes(c)).length;
  const priorityRatio = priorityMet / trustCriteria.priority.length;

  return {
    isTrusted: priorityRatio >= 0.5,
    criteriaMet: met,
    priorityRatio
  };
}

