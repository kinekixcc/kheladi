import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
                            supabaseAnonKey && 
                            !supabaseUrl.includes('placeholder') && 
                            !supabaseAnonKey.includes('placeholder') &&
                            !supabaseUrl.includes('your-project') &&
                            !supabaseUrl.includes('your_supabase_url_here') &&
                            !supabaseAnonKey.includes('your-anon-key') &&
                            !supabaseAnonKey.includes('your_supabase_anon_key_here');

if (!isSupabaseConfigured) {
  console.warn('⚠️  Supabase not configured. Please check your environment variables.')
  console.warn('VITE_SUPABASE_URL:', supabaseUrl)
  console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'khelkheleko-web'
      }
    }
  }
)

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('sports_facilities')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ Supabase connection test successful:', data);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Supabase connection test error:', err);
    return { success: false, error: err };
  }
};

// Simple auth helpers
export const signIn = async (email: string, password: string) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
};

export const signUp = async (email: string, password: string, fullName: string, role: string, phone?: string) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
        phone: phone
      }
    }
  });
  
  return { data, error };
};

export const signOut = async () => {
  if (!isSupabaseConfigured) {
    return { error: null };
  }
  
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured) {
    return { user: null, error: null };
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export { isSupabaseConfigured };