/**
 * Think Lab. - Supabase Cloud Database Client
 * Provides high-performance, real-time cloud data layer with PostgreSQL
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://')) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log('⚡ [SUPABASE] Cloud client connected successfully to:', supabaseUrl);
  } catch (error) {
    console.error('❌ [SUPABASE] Initialization error:', error.message);
  }
} else {
  console.warn('⚠️ [SUPABASE] SUPABASE_URL or SUPABASE_ANON_KEY missing in .env. Running on local storage.');
}

function isSupabaseConfigured() {
  return Boolean(supabase);
}

module.exports = {
  supabase,
  isSupabaseConfigured
};
