import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut, getCurrentUser, isSupabaseConfigured } from '../lib/supabase';
import { profileService } from '../lib/database';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: 'player' | 'organizer' | 'admin', phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (isSupabaseConfigured) {
        console.log('🔗 Supabase configured, checking for existing session...');
        
        // Check for existing session more carefully
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('⚠️ Session check error:', error);
            // Clear any stale auth data
            await supabase.auth.signOut();
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
          } else if (session) {
            console.log('✅ Found valid session');
          } else {
            console.log('ℹ️ No active session found');
          }
        } catch (tokenError) {
          console.warn('⚠️ Session check failed:', tokenError);
          // Don't force sign out here, just clear storage
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
        }
        
        const { user: supabaseUser } = await getCurrentUser();
        if (supabaseUser) {
          console.log('✅ Found existing session for:', supabaseUser.email);
          await loadUserProfile(supabaseUser);
        } else {
          console.log('ℹ️ No existing session found');
        }
        
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 Auth state changed:', event);
            
            try {
              // Handle auth errors
              if (event === 'TOKEN_REFRESHED' && !session) {
                console.warn('⚠️ Token refresh failed, clearing auth state');
                setUser(null);
                localStorage.removeItem('current_user');
                return;
              }
              
              if (event === 'SIGNED_IN' && session?.user) {
                console.log('✅ User signed in:', session.user.email);
                await loadUserProfile(session.user);
              } else if (event === 'SIGNED_OUT') {
                console.log('👋 User signed out');
                setUser(null);
                localStorage.removeItem('current_user');
                // Clear auth storage more carefully
                const keysToRemove = Object.keys(localStorage).filter(key => 
                  key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
                );
                keysToRemove.forEach(key => localStorage.removeItem(key));
              }
            } catch (error) {
              console.error('❌ Error handling auth state change:', error);
              // Don't crash the app, just log the error
            }
          }
        );

        // Cleanup subscription on unmount
        return () => subscription.unsubscribe();
      } else {
        console.log('⚠️ Supabase not configured, using fallback mode');
        
        // Check for stored user in fallback mode
        const storedUser = localStorage.getItem('current_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log('✅ Loaded stored user:', parsedUser.email);
          } catch (error) {
            console.error('❌ Error parsing stored user:', error);
            localStorage.removeItem('current_user');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (supabaseUser: any) => {
    try {
      // Try to get profile from database, create if doesn't exist
      let profile = await profileService.getProfile(supabaseUser.id);
      
      // If profile doesn't exist, create it
      if (!profile) {
        console.log('📝 Creating new profile for user:', supabaseUser.email);
        profile = await profileService.upsertProfile({
          id: supabaseUser.id,
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
          role: supabaseUser.user_metadata?.role || 'player',
          phone: supabaseUser.user_metadata?.phone || null
        });
        console.log('✅ Profile created successfully');
      }
      
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: profile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
        role: profile?.role || supabaseUser.user_metadata?.role || 'player',
        phone: profile?.phone || supabaseUser.user_metadata?.phone,
        created_at: supabaseUser.created_at
      };
      
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
      console.log('✅ User profile loaded:', userData.email, 'Role:', userData.role);
      
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      
      // Fallback to auth metadata
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
        role: supabaseUser.user_metadata?.role || 'player',
        phone: supabaseUser.user_metadata?.phone,
        created_at: supabaseUser.created_at
      };
      
      setUser(userData);
      localStorage.setItem('current_user', JSON.stringify(userData));
      console.log('✅ User loaded with auth metadata:', userData.email);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Login attempt for:', email);
    
    try {
      if (isSupabaseConfigured) {
        console.log('🔗 Attempting Supabase authentication...');
        
        const { data, error } = await supabaseSignIn(email, password);
        
        if (error) {
          console.error('❌ Supabase login failed:', error.message);
          return { error };
        }
        
        if (data.user) {
          console.log('✅ Supabase login successful');
          // User profile will be loaded by the auth state change listener
          return { error: null };
        }
        
        return { error: { message: 'Login failed - no user returned' } };
      } else {
        console.log('⚠️ Supabase not configured, using fallback authentication');
        
        // Fallback credentials for development
        const fallbackCredentials = [
          { email: 'adminsabin@gmail.com', password: 'windows8.1', role: 'admin', name: 'Admin Sabin', id: 'admin-001' },
          { email: 'mahatsabin611@gmail.com', password: 'windows8.1', role: 'organizer', name: 'Sabin Mahat', id: 'organizer-sabin' },
          { email: 'mahatsabin116@gmail.com', password: 'windows8.1', role: 'organizer', name: 'Sabin Mahat', id: 'organizer-sabin2' },
          { email: 'organizer@khelkheleko.com', password: 'organizer123', role: 'organizer', name: 'Sabin Mahat', id: 'organizer-001' },
          { email: 'player@khelkheleko.com', password: 'player123', role: 'player', name: 'Rajesh Shrestha', id: 'player-001' }
        ];
        
        const matchedCredential = fallbackCredentials.find(cred => 
          cred.email === email && cred.password === password
        );
        
        if (matchedCredential) {
          const fallbackUser: User = {
            id: matchedCredential.id,
            email: matchedCredential.email,
            full_name: matchedCredential.name,
            role: matchedCredential.role as any,
            created_at: new Date().toISOString()
          };
          
          setUser(fallbackUser);
          localStorage.setItem('current_user', JSON.stringify(fallbackUser));
          console.log('✅ Fallback login successful for:', email);
          return { error: null };
        }
        
        return { error: { message: 'Invalid email or password' } };
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return { error: { message: error.message || 'Authentication failed' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'player' | 'organizer' | 'admin', phone?: string) => {
    try {
      if (!isSupabaseConfigured) {
        return { error: { message: 'Signup requires Supabase connection. Please connect to Supabase first.' } };
      }

      const { data, error } = await supabaseSignUp(email, password, fullName, role, phone);
      
      if (error) {
        return { error };
      }

      if (data.user) {
        // Create profile in database
        try {
          await profileService.upsertProfile({
            id: data.user.id,
            full_name: fullName,
            role: role,
            phone: phone
          });
        } catch (profileError) {
          console.warn('Profile creation failed, but user was created:', profileError);
        }
      }
      
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Signup failed' } };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      
      // Clear user state immediately
      setUser(null);
      localStorage.removeItem('current_user');
      
      // Clear all Supabase auth storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Sign out from Supabase if configured
      
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('⚠️ Supabase signout warning:', error.message);
        } else {
          console.log('✅ Supabase signout successful');
        }
      }
      
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Signout error:', error);
      // Still clear user state even if Supabase signout fails
      setUser(null);
      localStorage.removeItem('current_user');
      // Force clear all auth storage on error
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};