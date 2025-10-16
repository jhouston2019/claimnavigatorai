# Claim Analysis Tools Setup Guide

## 🚨 Why Claim Analysis Tools Are Not Working

The claim analysis tools are not connected/working because of missing configuration:

### 1. **Missing OpenAI API Key**
- The Netlify function requires `OPENAI_API_KEY` environment variable
- Without this, the AI analysis cannot run

### 2. **Netlify Functions Not Configured**
- Functions need to be deployed to Netlify with proper environment variables
- Dependencies need to be installed

## 🔧 How to Fix

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### Step 2: Configure Netlify Environment Variables
1. Go to your Netlify dashboard
2. Navigate to Site Settings → Environment Variables
3. Add new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (sk-...)

### Step 3: Deploy Functions
The functions are already created but need to be deployed:
- `netlify/functions/claim-analysis.js` ✅ (exists)
- `netlify/functions/package.json` ✅ (exists)
- Dependencies installed ✅ (completed)

### Step 4: Test the Function
Once deployed with the API key, the claim analysis tools will work.

## 🧪 Local Testing (Optional)

To test locally, create a `.env` file in the project root:

```bash
# .env file
OPENAI_API_KEY=sk-your_actual_api_key_here
```

Then run:
```bash
netlify dev
```

## 📋 Current Status

✅ **Completed:**
- Claim analysis HTML page created
- Netlify function code written
- Dependencies installed
- JavaScript integration complete

❌ **Missing:**
- OpenAI API key configuration
- Netlify environment variables setup
- Function deployment verification

## 🎯 Next Steps

1. **Add OpenAI API key to Netlify environment variables**
2. **Redeploy the site** (or trigger a new deployment)
3. **Test the claim analysis tools**

The tools will work once the API key is configured in Netlify!
