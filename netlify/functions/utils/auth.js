const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get user from authorization header
async function getUserFromAuth(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header required');
  }
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }
  
  return user;
}

module.exports = {
  supabase,
  getUserFromAuth
};