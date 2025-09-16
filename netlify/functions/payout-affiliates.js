const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async () => {
  try {
    const { data: affiliates, error } = await supabase.from("affiliates").select("*");
    if (error) throw error;

    for (const aff of affiliates) {
      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("affiliateid", aff.id)
        .eq("payout_status", "pending");

      if (txError) throw txError;

      if (transactions.length > 0) {
        const totalCommission = transactions.reduce(
          (sum, tx) => sum + tx.amount * aff.commission_rate,
          0
        );

        if (totalCommission > 0 && aff.stripe_account_id) {
          await stripe.transfers.create({
            amount: Math.round(totalCommission * 100), // cents
            currency: "usd",
            destination: aff.stripe_account_id,
          });

          const txIds = transactions.map((t) => t.id);
          await supabase
            .from("transactions")
            .update({ payout_status: "paid" })
            .in("id", txIds);
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
