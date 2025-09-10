const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { fileName, userEmail } = JSON.parse(event.body);

    if (!userEmail) {
      return { statusCode: 401, body: "Unauthorized" };
    }

    const customers = await stripe.customers.list({ email: userEmail });
    if (customers.data.length === 0) {
      return { statusCode: 403, body: "Access denied. No Stripe customer found." };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active"
    });
    if (subscriptions.data.length === 0) {
      return { statusCode: 403, body: "Access denied. No active subscription." };
    }

    const { data: entitlement, error } = await supabase
      .from("entitlements")
      .select("*")
      .eq("email", userEmail)
      .single();

    if (error || !entitlement || entitlement.credits <= 0) {
      return { statusCode: 403, body: "No credits left. Please purchase more." };
    }

    await supabase
      .from("entitlements")
      .update({ credits: entitlement.credits - 1 })
      .eq("email", userEmail);

    const { data: signedUrl, error: signError } = await supabase.storage
      .from("documents")
      .createSignedUrl(fileName, 300);

    if (signError) throw signError;

    return {
      statusCode: 200,
      body: JSON.stringify({ url: signedUrl.signedUrl })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Error generating signed URL" };
  }
};
