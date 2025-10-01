-- Claim Timeline & Sequence Schema
-- This schema supports the 12-month claim timeline with phases, milestones, and deadlines

-- Create claim_timeline_phases table
CREATE TABLE IF NOT EXISTS claim_timeline_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    phase_description TEXT,
    start_day INTEGER NOT NULL, -- Days from loss date
    end_day INTEGER NOT NULL,   -- Days from loss date
    color_code TEXT NOT NULL,   -- Color for UI (e.g., #22c55e for green)
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create claim_timeline_milestones table
CREATE TABLE IF NOT EXISTS claim_timeline_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES claim_timeline_phases(id) ON DELETE CASCADE,
    milestone_name TEXT NOT NULL,
    milestone_description TEXT,
    due_day INTEGER NOT NULL, -- Days from loss date
    is_critical BOOLEAN DEFAULT false,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create claim_timeline_deadlines table
CREATE TABLE IF NOT EXISTS claim_timeline_deadlines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    deadline_name TEXT NOT NULL,
    deadline_description TEXT,
    due_day INTEGER NOT NULL, -- Days from loss date
    deadline_type TEXT NOT NULL CHECK (deadline_type IN ('statutory', 'policy', 'custom')),
    is_missed BOOLEAN DEFAULT false,
    missed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create claim_timeline_actions table for user actions
CREATE TABLE IF NOT EXISTS claim_timeline_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES claim_timeline_milestones(id) ON DELETE CASCADE,
    action_name TEXT NOT NULL,
    action_description TEXT,
    action_type TEXT NOT NULL CHECK (action_type IN ('document', 'communication', 'payment', 'inspection', 'other')),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB, -- Store additional action data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timeline_phases_claim_id ON claim_timeline_phases(claim_id);
CREATE INDEX IF NOT EXISTS idx_timeline_milestones_claim_id ON claim_timeline_milestones(claim_id);
CREATE INDEX IF NOT EXISTS idx_timeline_milestones_phase_id ON claim_timeline_milestones(phase_id);
CREATE INDEX IF NOT EXISTS idx_timeline_deadlines_claim_id ON claim_timeline_deadlines(claim_id);
CREATE INDEX IF NOT EXISTS idx_timeline_actions_claim_id ON claim_timeline_actions(claim_id);
CREATE INDEX IF NOT EXISTS idx_timeline_actions_milestone_id ON claim_timeline_actions(milestone_id);

-- Add RLS policies
ALTER TABLE claim_timeline_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_timeline_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_timeline_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_timeline_actions ENABLE ROW LEVEL SECURITY;

-- Policies for claim_timeline_phases
CREATE POLICY "Users can view their own claim phases" ON claim_timeline_phases
    FOR SELECT USING (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own claim phases" ON claim_timeline_phases
    FOR INSERT WITH CHECK (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own claim phases" ON claim_timeline_phases
    FOR UPDATE USING (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

-- Policies for claim_timeline_milestones
CREATE POLICY "Users can view their own claim milestones" ON claim_timeline_milestones
    FOR SELECT USING (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own claim milestones" ON claim_timeline_milestones
    FOR INSERT WITH CHECK (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own claim milestones" ON claim_timeline_milestones
    FOR UPDATE USING (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

-- Policies for claim_timeline_deadlines
CREATE POLICY "Users can view their own claim deadlines" ON claim_timeline_deadlines
    FOR SELECT USING (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own claim deadlines" ON claim_timeline_deadlines
    FOR INSERT WITH CHECK (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own claim deadlines" ON claim_timeline_deadlines
    FOR UPDATE USING (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

-- Policies for claim_timeline_actions
CREATE POLICY "Users can view their own claim actions" ON claim_timeline_actions
    FOR SELECT USING (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own claim actions" ON claim_timeline_actions
    FOR INSERT WITH CHECK (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own claim actions" ON claim_timeline_actions
    FOR UPDATE USING (
        claim_id IN (
            SELECT id FROM claims WHERE user_id = auth.uid()
        )
    );

-- Function to initialize timeline for a new claim
CREATE OR REPLACE FUNCTION initialize_claim_timeline(claim_uuid UUID)
RETURNS VOID AS $$
DECLARE
    loss_date DATE;
    phase_id UUID;
BEGIN
    -- Get the loss date from the claim
    SELECT date_of_loss INTO loss_date FROM claims WHERE id = claim_uuid;
    
    -- Phase 1: Immediate Response (Day 0-7)
    INSERT INTO claim_timeline_phases (claim_id, phase_number, phase_name, phase_description, start_day, end_day, color_code)
    VALUES (claim_uuid, 1, 'Immediate Response', 'Secure safety, document damages, file claim', 0, 7, '#22c55e');
    
    -- Phase 2: Early Claim Development (Day 8-28)
    INSERT INTO claim_timeline_phases (claim_id, phase_number, phase_name, phase_description, start_day, end_day, color_code)
    VALUES (claim_uuid, 2, 'Early Claim Development', 'Adjuster assignment, preliminary documentation', 8, 28, '#eab308');
    
    -- Phase 3: Initial Investigation & Offer (Day 29-60)
    INSERT INTO claim_timeline_phases (claim_id, phase_number, phase_name, phase_description, start_day, end_day, color_code)
    VALUES (claim_uuid, 3, 'Initial Investigation & Offer', 'Adjuster inspection, initial settlement offer', 29, 60, '#f97316');
    
    -- Phase 4: Negotiation & Supplemental Evidence (Day 61-120)
    INSERT INTO claim_timeline_phases (claim_id, phase_number, phase_name, phase_description, start_day, end_day, color_code)
    VALUES (claim_uuid, 4, 'Negotiation & Supplemental Evidence', 'Counter-offers, supplemental claims, documentation', 61, 120, '#3b82f6');
    
    -- Phase 5: Escalation Pathways (Day 121-180)
    INSERT INTO claim_timeline_phases (claim_id, phase_number, phase_name, phase_description, start_day, end_day, color_code)
    VALUES (claim_uuid, 5, 'Escalation Pathways', 'Appeals, appraisal, mediation', 121, 180, '#8b5cf6');
    
    -- Phase 6: Legal Consideration (Day 181-270)
    INSERT INTO claim_timeline_phases (claim_id, phase_number, phase_name, phase_description, start_day, end_day, color_code)
    VALUES (claim_uuid, 6, 'Legal Consideration', 'Attorney consultation, bad faith claims', 181, 270, '#ef4444');
    
    -- Phase 7: Litigation Prep (Day 271-365)
    INSERT INTO claim_timeline_phases (claim_id, phase_number, phase_name, phase_description, start_day, end_day, color_code)
    VALUES (claim_uuid, 7, 'Litigation Prep', 'Lawsuit filing, discovery, trial prep', 271, 365, '#a855f7');
    
    -- Phase 8: Resolution & Recovery (Day 366+)
    INSERT INTO claim_timeline_phases (claim_id, phase_number, phase_name, phase_description, start_day, end_day, color_code)
    VALUES (claim_uuid, 8, 'Resolution & Recovery', 'Settlement finalization, fund release, recovery', 366, 999, '#6b7280');
    
    -- Get the first phase ID for milestones
    SELECT id INTO phase_id FROM claim_timeline_phases WHERE claim_id = claim_uuid AND phase_number = 1;
    
    -- Critical milestones for Phase 1
    INSERT INTO claim_timeline_milestones (claim_id, phase_id, milestone_name, milestone_description, due_day, is_critical)
    VALUES 
    (claim_uuid, phase_id, 'Secure Safety & Document Damages', 'Take timestamped photos/videos before cleanup', 1, true),
    (claim_uuid, phase_id, 'File Insurance Claim', 'Contact insurance company to file claim', 3, true),
    (claim_uuid, phase_id, 'Get Claim Number', 'Obtain claim number and adjuster assignment', 7, true);
    
    -- Critical deadlines
    INSERT INTO claim_timeline_deadlines (claim_id, deadline_name, deadline_description, due_day, deadline_type)
    VALUES 
    (claim_uuid, 'Proof of Loss Filing', 'Must file Proof of Loss within 60 days', 60, 'statutory'),
    (claim_uuid, 'Insurer Response Deadline', 'Insurer must respond within 30-60 days', 60, 'statutory'),
    (claim_uuid, 'Appeal Filing Window', 'File appeal within 30-90 days after denial', 90, 'statutory'),
    (claim_uuid, 'Statute of Limitations', 'Lawsuit must be filed before statute expires', 730, 'statutory');
    
END;
$$ LANGUAGE plpgsql;

-- Function to update phase status based on current date
CREATE OR REPLACE FUNCTION update_timeline_status(claim_uuid UUID)
RETURNS VOID AS $$
DECLARE
    loss_date DATE;
    days_since_loss INTEGER;
    phase_record RECORD;
BEGIN
    -- Get the loss date
    SELECT date_of_loss INTO loss_date FROM claims WHERE id = claim_uuid;
    days_since_loss := EXTRACT(DAY FROM (CURRENT_DATE - loss_date));
    
    -- Update phase statuses
    FOR phase_record IN 
        SELECT * FROM claim_timeline_phases WHERE claim_id = claim_uuid
    LOOP
        IF days_since_loss < phase_record.start_day THEN
            -- Phase hasn't started yet
            UPDATE claim_timeline_phases 
            SET status = 'pending' 
            WHERE id = phase_record.id;
        ELSIF days_since_loss >= phase_record.start_day AND days_since_loss <= phase_record.end_day THEN
            -- Phase is currently active
            UPDATE claim_timeline_phases 
            SET status = 'in_progress' 
            WHERE id = phase_record.id;
        ELSIF days_since_loss > phase_record.end_day THEN
            -- Phase is overdue
            UPDATE claim_timeline_phases 
            SET status = 'overdue' 
            WHERE id = phase_record.id;
        END IF;
    END LOOP;
    
    -- Update deadline statuses
    UPDATE claim_timeline_deadlines 
    SET is_missed = true, missed_at = NOW()
    WHERE claim_id = claim_uuid 
    AND due_day < days_since_loss 
    AND is_missed = false;
    
END;
$$ LANGUAGE plpgsql;
