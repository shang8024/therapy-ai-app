import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { createUserProfile } from '../lib/supabase-services';
import { performFullSyncToCloud } from '../lib/sync-manager';
import { database } from '../utils/database';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  syncData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Session error:', error.message);
        // If refresh token is invalid, clear the session
        if (error.message.includes('Refresh Token')) {
          console.log('Clearing invalid session...');
          supabase.auth.signOut().catch(console.error);
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to get session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        return { error: new Error(error.message) };
      }

      // Create user profile after successful sign up
      if (data.user) {
        try {
          await createUserProfile(data.user.id, email);
          console.log('✅ User profile created');
        } catch (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't fail sign up if profile creation fails
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    }
  };

  const signOut = async () => {
    try {
      await database.clearCurrentUserData();
    } catch (error) {
      console.error('Failed to clear local data during sign out:', error);
    } finally {
      await supabase.auth.signOut();
    }
  };

  const syncData = async () => {
    if (!user) {
      console.warn('Cannot sync: No user logged in');
      return;
    }

    try {
      console.log('Starting data sync...');
      await performFullSyncToCloud(user.id);
      console.log('✅ Data synced successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  };

  const value: AuthContextValue = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    syncData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

