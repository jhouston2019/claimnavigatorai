# Fire Claim Navigator AI

AI-powered fire claim documentation tools with Netlify Functions, Supabase, and Stripe integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Netlify CLI (`npm install -g netlify-cli`)
- Supabase account
- Stripe account
- OpenAI API key

### Local Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd fireclaimnavigatorai
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   
   # OpenAI Configuration
   OPENAI_API_KEY=sk-your_openai_api_key
   
   # Development Configuration
   NODE_ENV=development
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   The site will be available at `http://localhost:8888`

4. **Kill port if needed:**
   ```bash
   npx kill-port 8888
   ```

## 🏗️ Deployment

### Netlify Deployment

1. **Connect to Netlify:**
   - Push your code to GitHub
   - Connect the repository to Netlify
   - Netlify will auto-deploy on push to main

2. **Configure Environment Variables in Netlify Dashboard:**
   - Go to Site Settings → Environment Variables
   - Add all variables from `.env.example`
   - **Important:** Use production keys for Supabase and Stripe

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

### Environment Variables Required

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_... for production) | ✅ |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | ✅ |
| `URL` | Site URL (auto-set by Netlify) | ✅ |

## 🧪 Testing Functions

### Test AI Response Generation
```bash
curl -X POST http://localhost:8888/.netlify/functions/generate-response \
  -H "Content-Type: application/json" \
  -d '{
    "inputText": "I need help with an insurance claim denial",
    "language": "en"
  }'
```

### Test Document Generation
```bash
curl -X POST http://localhost:8888/.netlify/functions/generate-document \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "fileName": "test-document",
    "content": "This is a test document content"
  }'
```

### Test Checkout Session Creation
```bash
curl -X POST http://localhost:8888/.netlify/functions/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "affiliateID": "optional-affiliate-id"
  }'
```

### Test Document Retrieval
```bash
curl -X POST http://localhost:8888/.netlify/functions/get-doc \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "documents/example.pdf"
  }'
```

## 📁 Project Structure

```
fireclaimnavigatorai/
├── netlify/
│   └── functions/           # Netlify serverless functions
│       ├── generate-response.js    # AI response generation
│       ├── generate-document.js    # PDF document generation
│       ├── create-checkout-session.js # Stripe checkout
│       ├── get-doc.js              # Document retrieval
│       ├── checkout.js             # Alternative checkout
│       └── utils/
│           └── auth.js             # Authentication utilities
├── app/                     # Frontend pages
├── assets/                  # Static assets and data
├── supabase/               # Database schema
├── netlify.toml            # Netlify configuration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Available Scripts

```bash
npm run dev      # Start development server on port 8888
npm run start    # Alias for dev
npm run build    # Build check (no build required for this project)
npm run lint     # Linting (placeholder)
npm run format   # Formatting (placeholder)
npm run test     # Testing (placeholder)
```

## 🛡️ Security Features

- **Input Validation:** All functions validate and sanitize inputs
- **Authentication:** JWT token validation for protected endpoints
- **Error Handling:** Comprehensive error handling with proper logging
- **Rate Limiting:** Built into Netlify Functions
- **CORS:** Properly configured for cross-origin requests
- **Security Headers:** XSS protection, content type validation, etc.

## 🐛 Debugging

### Common Issues

1. **Port 8888 already in use:**
   ```bash
   npx kill-port 8888
   npm run dev
   ```

2. **Environment variables not loading:**
   - Check `.env` file exists and has correct format
   - Restart development server
   - Verify variable names match exactly

3. **Supabase connection errors:**
   - Verify `SUPABASE_URL` and keys are correct
   - Check Supabase project is active
   - Ensure RLS policies are configured

4. **Stripe errors:**
   - Use test keys for development
   - Verify webhook endpoints are configured
   - Check Stripe dashboard for error logs

5. **OpenAI API errors:**
   - Verify API key is valid and has credits
   - Check rate limits in OpenAI dashboard
   - Ensure model access permissions

### Logging

All functions include comprehensive logging:
- Request processing times
- Error details (with stack traces in development)
- User actions and authentication
- API call results

Check Netlify function logs in the dashboard for production debugging.

## 💰 Pricing

- **Base Fire Toolkit:** $997 (includes 20 AI responses)
- **Additional Responses:** $29 each
- **Features:** AI-powered fire claim letters, document generation, PDF export

## 📞 Support

For technical support or questions:
1. Check the debugging section above
2. Review Netlify function logs
3. Verify environment variables are correctly set
4. Test with the provided curl commands

## 🔄 Updates

To update dependencies:
```bash
npm update
npm audit
```

To deploy updates:
```bash
git add .
git commit -m "Update dependencies"
git push origin main
# Netlify will auto-deploy
```
