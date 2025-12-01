#!/bin/bash

# AI Console Test Script
# Tests the AI Console endpoints to verify deployment

echo "Testing AI Console Endpoints..."
echo "================================"
echo ""

# Base URL - Replace with your actual Netlify domain
BASE_URL="${NETLIFY_SITE_URL:-https://your-domain.netlify.app}"

# Get auth token (you'll need to set this as an environment variable)
# For testing, you can get a token from your Supabase dashboard or via login
AUTH_TOKEN="${SUPABASE_AUTH_TOKEN:-your-auth-token-here}"

echo "Base URL: $BASE_URL"
echo ""

# Test 1: Check admin status
echo "1. Testing check-admin endpoint..."
curl -X GET "$BASE_URL/.netlify/functions/admin/ai-console/check-admin" \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -w "\nHTTP Status: %{http_code}\n" \
     -s | jq '.' || echo "Response received (jq not installed, raw output above)"
echo ""

# Test 2: Get prompts list
echo "2. Testing get-prompts endpoint (list)..."
curl -X GET "$BASE_URL/.netlify/functions/admin/ai-console/get-prompts" \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -w "\nHTTP Status: %{http_code}\n" \
     -s | jq '.' || echo "Response received (jq not installed, raw output above)"
echo ""

# Test 3: Get dashboard stats
echo "3. Testing dashboard-stats endpoint..."
curl -X GET "$BASE_URL/.netlify/functions/admin/ai-console/dashboard-stats" \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -w "\nHTTP Status: %{http_code}\n" \
     -s | jq '.' || echo "Response received (jq not installed, raw output above)"
echo ""

# Test 4: Get rulesets list
echo "4. Testing get-rulesets endpoint (list)..."
curl -X GET "$BASE_URL/.netlify/functions/admin/ai-console/get-rulesets" \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -w "\nHTTP Status: %{http_code}\n" \
     -s | jq '.' || echo "Response received (jq not installed, raw output above)"
echo ""

echo "================================"
echo "Test complete!"
echo ""
echo "To use this script:"
echo "1. Set NETLIFY_SITE_URL environment variable: export NETLIFY_SITE_URL=https://your-site.netlify.app"
echo "2. Set SUPABASE_AUTH_TOKEN environment variable with a valid auth token"
echo "3. Run: bash scripts/ai-console-test.sh"
echo ""
echo "Note: Install jq for formatted JSON output: brew install jq (Mac) or apt-get install jq (Linux)"


