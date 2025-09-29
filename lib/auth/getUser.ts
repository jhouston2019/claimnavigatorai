import jwt from 'jsonwebtoken';
import { env } from '../env';

export interface User {
  userId: string;
  email?: string;
}

export function getUserFromRequest(req: Request): User | null {
  try {
    // Try multiple auth methods in order of preference
    
    // Method 1: JWT token in Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return decodeJWT(token);
    }
    
    // Method 2: JWT token in custom header
    const sessionToken = req.headers.get('x-session-jwt');
    if (sessionToken) {
      return decodeJWT(sessionToken);
    }
    
    // Method 3: JWT token in cookie
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const token = cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['session-token'];
      if (token) {
        return decodeJWT(token);
      }
    }
    
    // Method 4: Check for Supabase session in cookie
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const sessionData = cookies['sb-session'] || cookies['supabase-session'];
      if (sessionData) {
        try {
          const session = JSON.parse(decodeURIComponent(sessionData));
          if (session?.user?.id) {
            return {
              userId: session.user.id,
              email: session.user.email
            };
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Auth extraction error:', error);
    return null;
  }
}

function decodeJWT(token: string): User | null {
  try {
    // For development, we might not have JWT_SECRET set
    if (env.JWT_SECRET) {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      if (decoded?.sub || decoded?.user_id) {
        return {
          userId: decoded.sub || decoded.user_id,
          email: decoded.email
        };
      }
    } else {
      // Fallback to decode without verification (development only)
      const decoded = jwt.decode(token) as any;
      if (decoded?.sub || decoded?.user_id) {
        return {
          userId: decoded.sub || decoded.user_id,
          email: decoded.email
        };
      }
    }
    return null;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

// Helper function to require authentication
export function requireAuth(req: Request): User {
  const user = getUserFromRequest(req);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Helper function to get user ID specifically
export function getUserId(req: Request): string {
  const user = requireAuth(req);
  return user.userId;
}
