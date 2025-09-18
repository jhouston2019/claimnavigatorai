const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { partnerEmail, filters } = JSON.parse(event.body);

    // Verify partner
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("*")
      .eq("email", partnerEmail)
      .single();

    if (partnerError || !partner) {
      return { statusCode: 403, body: JSON.stringify({ error: "Unauthorized partner" }) };
    }

    let query = supabase.from("leads").select("*").eq("status", "new");

    if (filters?.claim_type) query = query.eq("claim_type", filters.claim_type);
    if (filters?.location) query = query.eq("location", filters.location);

    const { data: leads, error } = await query;
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ leads }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
