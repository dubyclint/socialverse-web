import { defineStore } from 'pinia';

interface Ad {
  id: string;
  type: 'image' | 'video' | 'text' | 'audio' | 'external';
  title: string;
  content: string;
  html?: string;
  bid: number;
  status: 'pending' | 'approved' | 'rejected';
  ownerId: string;
  createdAt: string;
}

interface AdsState {
  servedAds: Ad[];
  userAds: Ad[];
  loading: boolean;
  error: string | null;
}

export const useAdsStore = defineStore('ads', {
  state: (): AdsState => ({
    servedAds: [],
    userAds: [],
    loading: false,
    error: null
  }),

  getters: {
    approvedAds: (state) => state.userAds.filter(ad => ad.status === 'approved'),
    pendingAds: (state) => state.userAds.filter(ad => ad.status === 'pending'),
    rejectedAds: (state) => state.userAds.filter(ad => ad.status === 'rejected')
  },

  actions: {
    async fetchServedAds(page = 'Home Feed') {
      try {
        this.loading = true;
        this.error = null;
        
        const response = await fetch(`/api/ads/serve?page=${encodeURIComponent(page)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ads: ${response.statusText}`);
        }
        
        this.servedAds = await response.json();
      } catch (error) {
        console.error('Error fetching served ads:', error);
        this.error = error.message || 'Failed to fetch ads';
        this.servedAds = [];
      } finally {
        this.loading = false;
      }
    },

    async fetchUserAds() {
      try {
        this.loading = true;
        this.error = null;
        
        const response = await fetch('/api/ads/user');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user ads: ${response.statusText}`);
        }
        
        this.userAds = await response.json();
      } catch (error) {
        console.error('Error fetching user ads:', error);
        this.error = error.message || 'Failed to fetch user ads';
        this.userAds = [];
      } finally {
        this.loading = false;
      }
    },

    async submitAd(adData: Omit<Ad, 'id' | 'status' | 'ownerId' | 'createdAt'>) {
      try {
        this.loading = true;
        this.error = null;
        
        const response = await fetch('/api/ads/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(adData)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to submit ad: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Refresh user ads after successful submission
        await this.fetchUserAds();
        
        return result;
      } catch (error) {
        console.error('Error submitting ad:', error);
        this.error = error.message || 'Failed to submit ad';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    clearError() {
      this.error = null;
    }
  }
});
