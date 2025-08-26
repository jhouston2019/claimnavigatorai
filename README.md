# ClaimNavigatorAI Deployment

## Setup
1. Push this repo to GitHub.
2. Connect repo to Netlify.
3. Add env variables in Netlify:
   - OPENAI_API_KEY
   - STRIPE_SECRET_KEY
4. Netlify will auto-deploy.

## Functions
- `/functions/generate.js` → Calls OpenAI to analyze/generate claim letters.
- `/functions/checkout.js` → Creates Stripe Checkout sessions.

## Pricing
- Base toolkit: $499 includes 20 AI responses.
- Additional response: $29.
