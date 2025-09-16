const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing email" }),
      };
    }

    const { data: entitlement, error } = await supabase
      .from("entitlements")
      .select("credits")
      .eq("email", email)
      .single();

    if (error || !entitlement) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "No entitlement found for this user" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ credits: entitlement.credits }),
    };
  } catch (err) {
    console.error("verify-entitlement error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
