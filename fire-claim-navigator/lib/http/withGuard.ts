import { Handler } from '@netlify/functions';
import { getUserFromRequest } from '../auth/getUser';
import { hasActiveSubscription } from '../stripe/subscription';
import { checkFeatureAccess } from '../usage/quota';

export interface GuardOptions {
  requireAuth?: boolean;
  requireSubscription?: boolean;
  feature?: string;
  freeLimit?: number;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  identifier: string, 
  windowMs: number, 
  maxRequests: number
): boolean {
  const now = Date.now();
  const key = `rate_limit_${identifier}`;
  const stored = rateLimitStore.get(key);
  
  if (!stored || now > stored.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (stored.count >= maxRequests) {
    return false;
  }
  
  stored.count++;
  return true;
}

export function withGuard(
  handler: Handler,
  options: GuardOptions = {}
): Handler {
  return async (event, context) => {
    try {
      const {
        requireAuth = true,
        requireSubscription = false,
        feature,
        freeLimit = 2,
        rateLimit
      } = options;
      
      // Rate limiting
      if (rateLimit) {
        const identifier = event.headers['x-forwarded-for'] || 
                          event.headers['x-real-ip'] || 
                          context.clientContext?.identity?.user?.id || 
                          'anonymous';
        
        if (!checkRateLimit(identifier, rateLimit.windowMs, rateLimit.maxRequests)) {
          return {
            statusCode: 429,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Rate limit exceeded. Please try again later.',
              retryAfter: Math.ceil(rateLimit.windowMs / 1000)
            })
          };
        }
      }
      
      // Authentication check
      if (requireAuth) {
        const user = getUserFromRequest(event);
        if (!user) {
          return {
            statusCode: 401,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Authentication required',
              authRequired: true
            })
          };
        }
        
        // Add user to context for handler
        (event as any).user = user;
      }
      
      // Subscription and quota checks
      if (requireSubscription || feature) {
        const user = (event as any).user || getUserFromRequest(event);
        if (!user) {
          return {
            statusCode: 401,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Authentication required',
              authRequired: true
            })
          };
        }
        
        // Check subscription status
        const hasSubscription = await hasActiveSubscription(user.email);
        
        // Check feature access
        if (feature) {
          const access = await checkFeatureAccess(
            user.userId,
            feature,
            hasSubscription,
            freeLimit
          );
          
          if (!access.allowed) {
            return {
              statusCode: 402,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                success: false,
                error: access.reason || 'Upgrade required',
                upgradeRequired: true,
                usageCount: access.usageCount
              })
            };
          }
        }
        
        // If subscription is required but user doesn't have one
        if (requireSubscription && !hasSubscription) {
          return {
            statusCode: 402,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Active subscription required',
              upgradeRequired: true
            })
          };
        }
      }
      
      // Execute the handler
      const result = await handler(event, context);
      
      // Ensure consistent response format
      if (result && typeof result === 'object' && 'body' in result) {
        // Check if body is already JSON
        if (typeof result.body === 'string') {
          try {
            JSON.parse(result.body);
          } catch {
            // If not JSON, wrap it
            result.body = JSON.stringify({
              success: true,
              data: result.body
            });
          }
        }
        
        // Ensure content-type header
        if (!result.headers?.['Content-Type']) {
          result.headers = {
            ...result.headers,
            'Content-Type': 'application/json'
          };
        }
      }
      
      return result;
      
    } catch (error: any) {
      console.error('Guard error:', error);
      
      // Handle specific error types
      if (error.message === 'Authentication required') {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: 'Authentication required',
            authRequired: true
          })
        };
      }
      
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        return {
          statusCode: 402,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: error.message,
            upgradeRequired: true
          })
        };
      }
      
      // Generic error response
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        })
      };
    }
  };
}

// Convenience wrappers for common patterns
export const withAuth = (handler: Handler) => 
  withGuard(handler, { requireAuth: true });

export const withSubscription = (handler: Handler) => 
  withGuard(handler, { requireAuth: true, requireSubscription: true });

export const withFeatureAccess = (feature: string, freeLimit = 2) => 
  (handler: Handler) => 
    withGuard(handler, { requireAuth: true, feature, freeLimit });

export const withRateLimit = (windowMs: number, maxRequests: number) => 
  (handler: Handler) => 
    withGuard(handler, { rateLimit: { windowMs, maxRequests } });
