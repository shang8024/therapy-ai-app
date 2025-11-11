import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Supabase credentials from environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Supabase credentials not found. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
} else {
  console.log('✅ Supabase client configured successfully');
}

/**
 * Supabase Client Configuration
 * 
 * IMPORTANT: Understanding the storage setup:
 * 
 * 1. USER ACCOUNTS are stored in Supabase's cloud database (PostgreSQL)
 *    - Email, password hashes, user metadata are all in Supabase cloud
 *    - Authentication happens on Supabase servers
 * 
 * 2. SESSION TOKENS are stored in AsyncStorage (local device)
 *    - The `storage: AsyncStorage` config tells Supabase to use AsyncStorage
 *    - This stores access tokens and refresh tokens locally
 *    - This allows users to stay logged in across app restarts
 *    - The actual user account is NOT stored locally, only the session tokens
 * 
 * 3. APP DATA (journal entries, check-ins) is stored separately in AsyncStorage
 *    - This is managed by database.async.ts
 *    - This is completely separate from authentication
 * 
 * When a user signs in:
 * - Credentials are sent to Supabase cloud servers for validation
 * - If valid, Supabase returns JWT tokens (access + refresh)
 * - These tokens are automatically saved to AsyncStorage by Supabase client
 * - The tokens are used to authenticate API requests
 * 
 * The user account itself remains in Supabase cloud, not in AsyncStorage.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage, // ← Uses AsyncStorage to persist session tokens (not user accounts!)
    autoRefreshToken: true, // ← Automatically refresh expired tokens
    persistSession: true, // ← Keep user logged in across app restarts
    detectSessionInUrl: false, // ← Not needed for mobile (web only)
  },
});

