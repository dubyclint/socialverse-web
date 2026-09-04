import { useUserStore } from '~/stores/user'

/**
 * Backwards-compatible alias. The canonical session store is `useUserStore`;
 * legacy components reference `useAuthStore`.
 */
export const useAuthStore = () => useUserStore()
