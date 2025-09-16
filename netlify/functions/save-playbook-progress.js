const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { email, phase, tasks } = JSON.parse(event.body);

    if (!email || !phase || !tasks) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing email, phase, or tasks" }) };
    }

    // Upsert playbook progress (insert if not exists, update if exists)
    const { data, error } = await supabase
      .from('playbook_progress')
      .upsert(
        { email, phase, tasks },
        { onConflict: ['email','phase'] }
      )
      .select();

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };
  } catch (err) {
    console.error("Save playbook progress error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
