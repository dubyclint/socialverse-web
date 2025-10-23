// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  
  const profile = ref(null);
  const loading = ref(false);
  const isAdmin = computed(() => profile.value?.role === 'admin');
  const isAuthenticated = computed(() => !!user.value);
  
  const initializeSession = async () => {
    try {
      loading.value = true;
      // Fetch current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile();
      }
    } catch (err) {
      console.error('Session initialization error:', err);
    } finally {
      loading.value = false;
    }
  };
  
  const fetchProfile = async () => {
    if (!user.value) return;
    
    try {
      loading.value = true;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      profile.value = data;
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      loading.value = false;
    }
  };
  
  const updateProfile = async (updates: any) => {
    if (!user.value) return;
    
    try {
      loading.value = true;
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.value.id, 
          ...updates,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      await fetchProfile();
    } catch (err) {
      console.error('Profile update error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  // Watch for user changes and fetch profile
  watch(user, (newUser) => {
    if (newUser) {
      fetchProfile();
    } else {
      profile.value = null;
    }
  }, { immediate: true });
  
  return {
    user: readonly(user),
    profile: readonly(profile),
    loading: readonly(loading),
    isAdmin,
    isAuthenticated,
    initializeSession,
    fetchProfile,
    updateProfile
  };
});


