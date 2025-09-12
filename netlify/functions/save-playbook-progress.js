const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  try {
    const { email, phase, tasks } = JSON.parse(event.body);

    if (!email || !phase || !tasks) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing params" }) };
    }

    const { data, error } = await supabase
      .from("playbook_progress")
      .upsert({ email, phase, tasks, updated_at: new Date() }, { onConflict: "email,phase" });

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("save-playbook-progress error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
