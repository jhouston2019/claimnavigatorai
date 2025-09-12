const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { fileName, email } = JSON.parse(event.body);

    // entitlement check (optional, depending on your verify-entitlement logic)
    const { data: entitlement, error: entitlementError } = await supabase
      .from("entitlements")
      .select("credits")
      .eq("email", email)
      .single();

    if (entitlementError || !entitlement || entitlement.credits <= 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "No valid entitlement" })
      };
    }

    // generate signed URL
    const { data, error } = await supabase.storage
      .from("claimnavigatorai-docs")
      .createSignedUrl(fileName, 300); // 5 minutes

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.signedUrl })
    };
  } catch (err) {
    console.error("Signed URL error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};
