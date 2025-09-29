import { supabaseAdmin } from '../supabase/server';
import { startOfMonth } from 'date-fns';

export type QuotaTable = 
  | 'documents' 
  | 'advisories' 
  | 'policy_analyses' 
  | 'settlement_comparisons' 
  | 'negotiations' 
  | 'escalations'
  | 'financial_calcs'
  | 'state_rights';

export async function checkMonthlyQuota(
  userId: string, 
  table: QuotaTable, 
  freeLimit = 2
): Promise<boolean> {
  try {
    const monthStart = startOfMonth(new Date()).toISOString();
    
    const { count, error } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error checking quota:', error);
      return false;
    }
    
    return (count ?? 0) < freeLimit;
  } catch (error) {
    console.error('Error checking monthly quota:', error);
    return false;
  }
}

export async function getUsageCount(
  userId: string, 
  table: QuotaTable,
  monthStart?: Date
): Promise<number> {
  try {
    const startDate = monthStart || startOfMonth(new Date());
    
    const { count, error } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting usage count:', error);
      return 0;
    }
    
    return count ?? 0;
  } catch (error) {
    console.error('Error getting usage count:', error);
    return 0;
  }
}

export async function recordUsage(
  userId: string,
  feature: string,
  usageCount = 1
): Promise<void> {
  try {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Try to update existing record first
    const { data: existing } = await supabaseAdmin
      .from('usage_tracking')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('feature', feature)
      .eq('month_year', monthYear)
      .single();
    
    if (existing) {
      // Update existing record
      await supabaseAdmin
        .from('usage_tracking')
        .update({ 
          usage_count: existing.usage_count + usageCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('feature', feature)
        .eq('month_year', monthYear);
    } else {
      // Insert new record
      await supabaseAdmin
        .from('usage_tracking')
        .insert({
          user_id: userId,
          feature,
          usage_count: usageCount,
          month_year: monthYear
        });
    }
  } catch (error) {
    console.error('Error recording usage:', error);
    // Don't throw - usage tracking shouldn't break the main flow
  }
}

export async function checkFeatureAccess(
  userId: string,
  feature: string,
  hasActiveSubscription: boolean,
  freeLimit = 2
): Promise<{ allowed: boolean; reason?: string; usageCount?: number }> {
  try {
    // If user has active subscription, they have unlimited access
    if (hasActiveSubscription) {
      return { allowed: true };
    }
    
    // Check quota for free users
    const allowed = await checkMonthlyQuota(userId, feature as QuotaTable, freeLimit);
    const usageCount = await getUsageCount(userId, feature as QuotaTable);
    
    if (!allowed) {
      return {
        allowed: false,
        reason: 'Monthly limit reached. Please upgrade for unlimited access.',
        usageCount
      };
    }
    
    return { allowed: true, usageCount };
  } catch (error) {
    console.error('Error checking feature access:', error);
    return { allowed: false, reason: 'Error checking access permissions' };
  }
}

// Helper function to get user's subscription status from database
export async function getUserSubscriptionStatus(userId: string): Promise<{
  hasActiveSubscription: boolean;
  subscriptionDetails?: any;
}> {
  try {
    const { data: subscription, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching subscription status:', error);
      return { hasActiveSubscription: false };
    }
    
    if (!subscription) {
      return { hasActiveSubscription: false };
    }
    
    // Check if subscription is still active
    const now = new Date();
    const isActive = subscription.current_period_end && 
      new Date(subscription.current_period_end) > now;
    
    return {
      hasActiveSubscription: isActive,
      subscriptionDetails: subscription
    };
  } catch (error) {
    console.error('Error getting user subscription status:', error);
    return { hasActiveSubscription: false };
  }
}
