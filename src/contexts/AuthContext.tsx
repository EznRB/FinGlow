import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { AnamnesisData } from '../types';
import { supabase, Profile, getProfile } from '../services/supabaseClient';

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: AuthError | null;

  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;

  // Profile methods
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  updateAnamnesis: (data: AnamnesisData) => Promise<{ error: Error | null }>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Fetch or create user profile
  const fetchProfile = useCallback(async (userId: string, email?: string, name?: string, avatarUrl?: string | null) => {
    try {
      let profileData = await getProfile(userId);

      // If no profile exists (common for Google signups), create one
      if (!profileData) {
        console.log('No profile found, creating one...');
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            name: name || 'User',
            avatar_url: avatarUrl || null,
            credits: 1 // Gift 1 credit for new signups
          })
          .select()
          .single();

        if (!error) {
          profileData = newProfile;
        } else {
          console.error('Error creating profile:', error);
        }
      }

      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching/creating profile:', err);
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id) {
      await fetchProfile(currentUser.id);
    }
  }, [fetchProfile]);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError);
        }

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            await fetchProfile(currentSession.user.id);
          }

          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);

      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Pass metadata for automatic profile creation if needed
          const meta = newSession.user.user_metadata;
          fetchProfile(
            newSession.user.id,
            newSession.user.email,
            meta?.full_name || meta?.name,
            meta?.avatar_url
          );

          // If this is a redirection from an email confirmation (type=signup)
          // We can check the URL hash to redirect to our success page
          const hash = window.location.hash;
          if (hash.includes('type=signup') || hash.includes('type=recovery')) {
            const target = hash.includes('type=signup') ? '/verify' : '/reset-password';
            // Use setTimeout to allow the session to be fully processed before redirecting
            setTimeout(() => {
              window.location.hash = `#${target}`;
            }, 100);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError);
      setLoading(false);
      return { error: signInError };
    }

    return { error: null };
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
      return { error: signUpError };
    }

    return { error: null };
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/#/dashboard`,
      },
    });

    if (oauthError) {
      setError(oauthError);
      return { error: oauthError };
    }

    return { error: null };
  };

  // Reset password (send email)
  const resetPassword = async (email: string) => {
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });

    if (resetError) {
      setError(resetError);
      return { error: resetError };
    }

    return { error: null };
  };

  // Update password
  const updatePassword = async (newPassword: string) => {
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError);
      return { error: updateError };
    }

    return { error: null };
  };

  // Update profile data
  const updateProfile = async (data: Partial<Profile>) => {
    if (!user?.id) {
      return { error: new Error('Not authenticated') };
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (updateError) {
      return { error: new Error(updateError.message) };
    }

    // Refresh profile data
    await refreshProfile();
    return { error: null };
  };

  // Update anamnesis specifically
  const updateAnamnesis = async (data: AnamnesisData) => {
    return updateProfile({ anamnesis: data });
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    refreshProfile,
    updateProfile,
    updateAnamnesis,
    isAdmin: profile?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================================================
// Protected Route Component
// ============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
