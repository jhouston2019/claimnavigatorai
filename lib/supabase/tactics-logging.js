/**
 * Supabase Tactics Usage Logging Utility
 * Handles logging of user interactions with insurance tactics
 */

class TacticsLogging {
  constructor() {
    this.supabase = null;
    this.isInitialized = false;
    this.userId = null;
  }

  async initialize() {
    try {
      // Dynamic import of Supabase client
      const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
      
      // Initialize Supabase client
      this.supabase = createClient(
        'https://your-project.supabase.co', // Replace with your Supabase URL
        'your-anon-key' // Replace with your Supabase anon key
      );

      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      this.userId = user?.id || this.getAnonymousUserId();
      
      this.isInitialized = true;
      console.log('TacticsLogging initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TacticsLogging:', error);
      this.isInitialized = false;
    }
  }

  getAnonymousUserId() {
    // Generate or retrieve anonymous user ID
    let anonymousId = localStorage.getItem('anonymous_user_id');
    if (!anonymousId) {
      anonymousId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('anonymous_user_id', anonymousId);
    }
    return anonymousId;
  }

  async logTacticUsage(tacticNumber, clicked = true, additionalData = {}) {
    if (!this.isInitialized) {
      console.warn('TacticsLogging not initialized, skipping log');
      return false;
    }

    try {
      const logData = {
        user_id: this.userId,
        tactic_number: tacticNumber,
        clicked: clicked,
        created_at: new Date().toISOString(),
        ...additionalData
      };

      const { data, error } = await this.supabase
        .from('tactics_usage')
        .insert([logData])
        .select();

      if (error) {
        console.error('Error logging tactic usage:', error);
        return false;
      }

      console.log('Tactic usage logged successfully:', data);
      return true;
    } catch (error) {
      console.error('Error in logTacticUsage:', error);
      return false;
    }
  }

  async getTacticUsageStats(userId = null) {
    if (!this.isInitialized) {
      console.warn('TacticsLogging not initialized');
      return null;
    }

    try {
      const targetUserId = userId || this.userId;
      
      const { data, error } = await this.supabase
        .from('tactics_usage')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tactic usage stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTacticUsageStats:', error);
      return null;
    }
  }

  async getPopularTactics(limit = 10) {
    if (!this.isInitialized) {
      console.warn('TacticsLogging not initialized');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('tactics_usage')
        .select('tactic_number, clicked')
        .eq('clicked', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching popular tactics:', error);
        return null;
      }

      // Count occurrences of each tactic
      const tacticCounts = {};
      data.forEach(record => {
        const tacticNum = record.tactic_number;
        tacticCounts[tacticNum] = (tacticCounts[tacticNum] || 0) + 1;
      });

      return tacticCounts;
    } catch (error) {
      console.error('Error in getPopularTactics:', error);
      return null;
    }
  }

  // Batch logging for multiple interactions
  async logBatchTacticUsage(interactions) {
    if (!this.isInitialized) {
      console.warn('TacticsLogging not initialized, skipping batch log');
      return false;
    }

    try {
      const logData = interactions.map(interaction => ({
        user_id: this.userId,
        tactic_number: interaction.tacticNumber,
        clicked: interaction.clicked || false,
        created_at: new Date().toISOString(),
        ...interaction.additionalData
      }));

      const { data, error } = await this.supabase
        .from('tactics_usage')
        .insert(logData)
        .select();

      if (error) {
        console.error('Error logging batch tactic usage:', error);
        return false;
      }

      console.log('Batch tactic usage logged successfully:', data);
      return true;
    } catch (error) {
      console.error('Error in logBatchTacticUsage:', error);
      return false;
    }
  }

  // Development mode logging (for testing)
  logToConsole(tacticNumber, clicked = true, additionalData = {}) {
    console.log('TacticsLogging (Dev Mode):', {
      tacticNumber,
      clicked,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      additionalData
    });
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.userId && !this.userId.startsWith('anon_');
  }

  // Get current user ID
  getCurrentUserId() {
    return this.userId;
  }
}

// Create global instance
const tacticsLogging = new TacticsLogging();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  tacticsLogging.initialize();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TacticsLogging, tacticsLogging };
} else if (typeof window !== 'undefined') {
  window.TacticsLogging = TacticsLogging;
  window.tacticsLogging = tacticsLogging;
}
