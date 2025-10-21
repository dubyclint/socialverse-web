// ✅ FIXED - Removed blockchain requirements, only Supabase
export const initializeDatabase = async () => {
  // Database initialization is handled by Supabase
  // No local database connection needed
  console.log('✅ Database initialized (Supabase)')
}

export default initializeDatabase

