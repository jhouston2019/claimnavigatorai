const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { affiliateID, email, product, amount } = JSON.parse(event.body);

    if (!affiliateID || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing affiliateID or email" }),
      };
    }

    // Save transaction
    const { error } = await supabase.from("transactions").insert([
      {
        user_email: email,
        product,
        amount,
        affiliateid: affiliateID,
      },
    ]);

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
