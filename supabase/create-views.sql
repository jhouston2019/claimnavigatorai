-- Create views for the professional dashboard

-- View for anonymized leads (what professionals can see before purchasing)
CREATE OR REPLACE VIEW professional_leads_anonymized AS
SELECT 
    le.id,
    le.original_lead_id,
    le.lead_status,
    le.price,
    le.created_at,
    l.type_of_loss,
    l.property_type,
    l.loss_location,
    l.date_of_loss,
    l.insurer,
    l.status
FROM lead_exchange le
JOIN leads l ON le.original_lead_id = l.id
WHERE le.lead_status = 'new';

-- View for claimed leads (leads purchased by the current professional)
CREATE OR REPLACE VIEW professional_claimed_leads AS
SELECT 
    le.id,
    le.original_lead_id,
    le.lead_status,
    le.price,
    le.claimed_by,
    le.created_at,
    l.insured_name,
    l.phone,
    l.email,
    l.type_of_loss,
    l.property_type,
    l.loss_location,
    l.date_of_loss,
    l.insurer,
    l.status
FROM lead_exchange le
JOIN leads l ON le.original_lead_id = l.id
WHERE le.lead_status = 'claimed';

-- Grant permissions to authenticated users
GRANT SELECT ON professional_leads_anonymized TO authenticated;
GRANT SELECT ON professional_claimed_leads TO authenticated;

