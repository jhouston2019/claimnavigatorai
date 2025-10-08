exports.handler = async () => {
  const checks = [];
  const push = (k, ok) => checks.push(`${ok ? '✅' : '❌'} ${k}`);
  
  try {
    push('Supabase URL', !!process.env.SUPABASE_URL);
    push('Supabase Anon Key', !!process.env.SUPABASE_ANON_KEY);
    push('Supabase Service Role Key', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    push('Stripe Secret Key', !!process.env.STRIPE_SECRET_KEY);
    push('Stripe Webhook Secret', !!process.env.STRIPE_WEBHOOK_SECRET);
    push('OpenAI API Key', !!process.env.OPENAI_API_KEY);
  } catch (e) {
    push('Env load error', false);
  }
  
  return { 
    statusCode: 200, 
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*'
    },
    body: checks.join('\n') 
  };
};

