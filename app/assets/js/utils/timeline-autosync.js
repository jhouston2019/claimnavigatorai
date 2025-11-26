/**
 * Timeline Autosync Engine
 * Centralized helper for adding timeline events from various sources
 */

import { getSupabaseClient, getAuthToken } from '../auth.js';
import { recordEvent } from './event-recorder.js';

// In-memory deduplication cache (by claim_id + event signature)
const eventCache = new Map();

/**
 * Generate event signature for deduplication
 */
function generateEventSignature(claimId, eventType, date, source) {
    return `${claimId}:${eventType}:${date}:${source}`;
}

/**
 * Normalize date to ISO date string (YYYY-MM-DD)
 */
function normalizeDate(dateInput) {
    if (!dateInput) {
        return new Date().toISOString().split('T')[0];
    }
    
    if (typeof dateInput === 'string') {
        // If it's already in YYYY-MM-DD format, return as-is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            return dateInput;
        }
        // Try to parse and format
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    }
    
    if (dateInput instanceof Date) {
        return dateInput.toISOString().split('T')[0];
    }
    
    // Fallback to today
    return new Date().toISOString().split('T')[0];
}

/**
 * Format date for display
 */
function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Add timeline event
 * @param {Object} event - Event object
 * @param {string} event.type - Event type (fnol_submitted, letter_received, evidence_uploaded, etc.)
 * @param {string|Date} event.date - Event date
 * @param {string} event.source - Source (fnol, compliance, journal, evidence, advanced-tool)
 * @param {string} event.title - Event title
 * @param {string} event.description - Event description
 * @param {Object} event.metadata - Additional metadata
 * @param {string} [event.claimId] - Claim ID (optional, will use localStorage if not provided)
 * @returns {Promise<Object>} Created event or null if duplicate
 */
export async function addTimelineEvent(event) {
    try {
        const {
            type,
            date,
            source,
            title,
            description,
            metadata = {},
            claimId: providedClaimId
        } = event;

        if (!type || !date || !source || !title) {
            console.warn('Missing required event fields:', event);
            return null;
        }

        // Get claim ID
        const claimId = providedClaimId || localStorage.getItem('claim_id') || `claim-${Date.now()}`;
        if (!providedClaimId) {
            localStorage.setItem('claim_id', claimId);
        }

        // Normalize date
        const normalizedDate = normalizeDate(date);
        const eventDate = normalizedDate;

        // Check for duplicates
        const signature = generateEventSignature(claimId, type, eventDate, source);
        if (eventCache.has(signature)) {
            console.log('Duplicate event skipped:', signature);
            return null;
        }

        // Get Supabase client
        const client = await getSupabaseClient();
        if (!client) {
            console.warn('Supabase client not available, storing event in cache only');
            eventCache.set(signature, { ...event, claimId, eventDate });
            dispatchTimelineUpdated();
            return { ...event, claimId, eventDate, cached: true };
        }

        // Get user
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            console.warn('User not authenticated, caching event');
            eventCache.set(signature, { ...event, claimId, eventDate });
            dispatchTimelineUpdated();
            return { ...event, claimId, eventDate, cached: true };
        }

        // Try to insert into claim_timeline_milestones (existing table)
        try {
            const { data, error } = await client
                .from('claim_timeline_milestones')
                .insert({
                    claim_id: claimId,
                    milestone_name: title,
                    milestone_description: description || '',
                    due_day: calculateDaysFromLoss(eventDate, claimId),
                    due_date: eventDate,
                    is_completed: true,
                    is_critical: source === 'compliance' || type.startsWith('deadline_'),
                    metadata: {
                        ...metadata,
                        event_type: type,
                        source: source,
                        original_date: date
                    }
                })
                .select()
                .single();

            if (error) throw error;

            // Mark as cached
            eventCache.set(signature, data);
            
            // Record system event
            await recordEvent('timeline.event.added', 'timeline-autosync', {
              event_type: type,
              claim_id: claimId,
              source: source
            });
            
            // Dispatch event
            dispatchTimelineUpdated();
            
            return data;
        } catch (insertError) {
            // If table doesn't exist, try claim_timeline table
            if (insertError.code === '42P01' || insertError.message.includes('does not exist')) {
                console.log('claim_timeline_milestones table not found, trying claim_timeline');
                
                try {
                    const { data, error } = await client
                        .from('claim_timeline')
                        .insert({
                            claim_id: claimId,
                            event_type: type,
                            event_date: eventDate,
                            source: source,
                            title: title,
                            description: description || '',
                            metadata: metadata
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    eventCache.set(signature, data);
                    dispatchTimelineUpdated();
                    
                    return data;
                } catch (fallbackError) {
                    console.warn('Could not insert into claim_timeline table:', fallbackError);
                    // Cache in memory as fallback
                    eventCache.set(signature, { ...event, claimId, eventDate });
                    dispatchTimelineUpdated();
                    return { ...event, claimId, eventDate, cached: true };
                }
            } else {
                throw insertError;
            }
        }

    } catch (error) {
        console.error('Error adding timeline event:', error);
        // Still dispatch event so UI can update from cache
        dispatchTimelineUpdated();
        return null;
    }
}

/**
 * Calculate days from loss date (for milestone due_day)
 */
async function calculateDaysFromLoss(eventDate, claimId) {
    try {
        const client = await getSupabaseClient();
        if (!client) return 0;

        // Try to get loss date from claim
        const { data: claim } = await client
            .from('claims')
            .select('date_of_loss')
            .eq('id', claimId)
            .single();

        if (claim && claim.date_of_loss) {
            const lossDate = new Date(claim.date_of_loss);
            const eventDateObj = new Date(eventDate + 'T00:00:00');
            const diffTime = eventDateObj - lossDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }
    } catch (error) {
        // Ignore errors, return 0
    }
    return 0;
}

/**
 * Dispatch browser event for timeline updates
 */
function dispatchTimelineUpdated() {
    const event = new CustomEvent('timeline-updated', {
        detail: {
            timestamp: new Date().toISOString()
        }
    });
    window.dispatchEvent(event);
}

/**
 * Get all timeline events for a claim
 */
export async function getTimelineEvents(claimId) {
    try {
        const client = await getSupabaseClient();
        if (!client) {
            // Return cached events
            return Array.from(eventCache.values())
                .filter(e => e.claimId === claimId)
                .sort((a, b) => new Date(a.eventDate || a.due_date) - new Date(b.eventDate || b.due_date));
        }

        const { data: { user } } = await client.auth.getUser();
        if (!user) return [];

        // Try claim_timeline_milestones first
        let events = [];
        try {
            const { data, error } = await client
                .from('claim_timeline_milestones')
                .select('*')
                .eq('claim_id', claimId)
                .order('due_date', { ascending: true });

            if (!error && data) {
                events = data.map(e => ({
                    ...e,
                    event_type: e.metadata?.event_type || 'milestone',
                    source: e.metadata?.source || 'system',
                    event_date: e.due_date
                }));
            }
        } catch (err) {
            // Try claim_timeline table
            const { data, error } = await client
                .from('claim_timeline')
                .select('*')
                .eq('claim_id', claimId)
                .order('event_date', { ascending: true });

            if (!error && data) {
                events = data;
            }
        }

        return events;
    } catch (error) {
        console.error('Error getting timeline events:', error);
        return [];
    }
}

/**
 * Clear event cache (useful for testing or reset)
 */
export function clearEventCache() {
    eventCache.clear();
}

// Export utility functions
export { normalizeDate, formatDateForDisplay };

