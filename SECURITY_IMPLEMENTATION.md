# Security Implementation Guide

## Overview

This document outlines the security measures implemented in the Claim Command Center system.

## 1. Authentication & Authorization

### Supabase Authentication

All API routes require valid Supabase authentication tokens:

```javascript
// In every API route
const authResult = await validateAuth(event.headers.authorization);
if (!authResult.valid) {
  return sendError(authResult.error, 'AUTH-001', 401);
}
userId = authResult.user.id;
```

### Claim Ownership Validation

Every API call validates that the user owns the claim:

```javascript
const { data: claim, error: claimError } = await supabase
  .from('claims')
  .select('id, user_id')
  .eq('id', body.claim_id)
  .eq('user_id', userId)
  .single();

if (claimError || !claim) {
  return sendError('Claim not found or access denied', 'CLAIM-001', 404);
}
```

### Row Level Security (RLS)

All database tables have RLS policies enabled:

```sql
-- Example policy
CREATE POLICY "Users can view their own claim documents"
ON public.claim_documents
FOR SELECT
USING (auth.uid() = user_id);
```

## 2. Input Validation

### File Upload Validation

```javascript
// File size validation (15MB max)
if (file.size > 15 * 1024 * 1024) {
  throw new Error('File size exceeds 15MB limit');
}

// MIME type validation
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

if (!allowedTypes.includes(file.type)) {
  throw new Error('File type not allowed');
}

// Filename sanitization
const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
```

### URL Validation

```javascript
// Validate URL format and protocol
try {
  const url = new URL(pdfUrl);
  
  if (url.protocol !== 'https:') {
    return sendError('URLs must use HTTPS protocol', 'VAL-001', 400);
  }
} catch (e) {
  return sendError('Invalid URL format', 'VAL-002', 400);
}
```

### Request Body Validation

```javascript
// Using validateSchema utility
const validation = validateSchema(body, {
  claim_id: { required: true, type: 'string' },
  policy_pdf_url: { required: true, type: 'string', maxLength: 2048 }
});

if (!validation.valid) {
  return sendError(validation.errors[0].message, 'VAL-003', 400);
}
```

## 3. Data Sanitization

### Input Sanitization

```javascript
// Remove dangerous characters
function sanitizeInput(input, maxLength = 10000) {
  if (typeof input !== 'string') {
    return input;
  }

  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}
```

### AI Output Sanitization

All AI-generated content is sanitized before storage:

```javascript
const sanitizeHtml = require('sanitize-html');

const cleanHtml = sanitizeHtml(aiGeneratedHtml, {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th'],
  allowedAttributes: {
    'a': ['href'],
    'table': ['class'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan']
  },
  allowedSchemes: ['https']
});
```

## 4. Storage Security

### Signed URLs

All document access uses signed URLs with expiration:

```javascript
const { data: urlData } = await supabaseClient.storage
  .from('claim-documents')
  .createSignedUrl(filePath, 3600); // 1 hour expiry
```

### Path Validation

Prevent path traversal attacks:

```javascript
// Enforce user-specific folder structure
const filePath = `${userId}/${claimId}/${subfolder}/${fileName}`;

// Validate path doesn't contain traversal attempts
if (filePath.includes('..') || filePath.includes('//')) {
  throw new Error('Invalid file path');
}
```

### Storage Policies

```sql
-- Users can only access their own folders
CREATE POLICY "Users can view their own claim documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'claim-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## 5. API Security

### Rate Limiting

Implemented in `api-utils.js`:

```javascript
const RATE_LIMITS = {
  perMinutePerKey: 120,
  perMinutePerIP: 300,
  burstLimit: 50,
  burstWindowMs: 10000
};
```

Rate limiting checks:
- Per-key rate limit (120 req/min)
- Per-IP rate limit (300 req/min)
- Burst protection (50 req/10s)
- Temporary blocking for violations

### CORS Configuration

```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}
```

**Production Note:** Replace `*` with specific domain:
```javascript
'Access-Control-Allow-Origin': 'https://yourdomain.com'
```

### Request Logging

All API requests are logged:

```javascript
await logAPIRequest({
  userId,
  endpoint: '/analyze-policy',
  method: 'POST',
  statusCode: 200,
  responseTime: Date.now() - startTime,
  ipAddress: getClientIP(event),
  userAgent: getUserAgent(event),
  errorMessage: error?.message
});
```

## 6. OpenAI API Security

### API Key Protection

```javascript
// API key stored in environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Never expose API key to client
```

### Prompt Injection Prevention

```javascript
// Structured prompts with clear boundaries
const prompt = `${POLICY_ANALYSIS_PROMPT}

POLICY DOCUMENT TEXT:
${policyText}

Return ONLY the JSON object.`;

// JSON-only responses
response_format: { type: 'json_object' }
```

### Temperature Control

```javascript
// Low temperature for deterministic outputs
temperature: 0.1
```

## 7. Database Security

### Prepared Statements

Supabase client uses parameterized queries by default:

```javascript
await supabase
  .from('claims')
  .select('*')
  .eq('id', claimId)  // Parameterized
  .eq('user_id', userId);  // Parameterized
```

### Service Role Key Protection

```javascript
// Service role key only used server-side
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Never exposed to client
);
```

### Encryption at Rest

- All data encrypted at rest by Supabase
- TLS 1.3 for data in transit
- Encrypted backups

## 8. Error Handling

### Safe Error Messages

```javascript
// Generic error messages to clients
return sendError('Analysis failed', 'AI-001', 500);

// Detailed errors only in server logs
console.error('OpenAI API error:', aiError);
```

### No Stack Traces

```javascript
// Never return stack traces to client
catch (error) {
  console.error('Error:', error);  // Log server-side
  return sendError('Internal server error', 'SYS-001', 500);  // Generic to client
}
```

## 9. Environment Variables

Required environment variables:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Optional
NODE_ENV=production
```

**Security Notes:**
- Never commit `.env` files
- Use Netlify environment variables in production
- Rotate keys regularly
- Use separate keys for dev/staging/prod

## 10. Client-Side Security

### XSS Prevention

```javascript
// Sanitize all user input before display
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

### Content Security Policy

Add to HTML head:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://*.supabase.co;">
```

### Token Storage

```javascript
// Tokens stored in httpOnly cookies (handled by Supabase)
// Never store tokens in localStorage
```

## 11. Monitoring & Alerts

### API Logging

All requests logged to `api_logs` table:
- User ID
- Endpoint
- Method
- Status code
- Response time
- IP address
- User agent
- Error messages

### Rate Limit Violations

Logged to `api_rate_limits` table:
- API key (masked)
- IP address
- Request count
- Blocked until timestamp

### Security Events

Monitor for:
- Failed authentication attempts
- Invalid claim access attempts
- File upload violations
- Rate limit violations
- Unusual API patterns

## 12. Compliance

### GDPR Compliance

- User data deletion on request
- Data export functionality
- Consent tracking
- Data retention policies

### Data Retention

```sql
-- Delete old logs after 90 days
DELETE FROM api_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete expired signed URLs
DELETE FROM claim_documents 
WHERE uploaded_at < NOW() - INTERVAL '1 year'
AND claim_id IN (
  SELECT id FROM claims WHERE status = 'completed'
);
```

## 13. Security Checklist

Before going to production:

- [ ] Enable RLS on all tables
- [ ] Apply all security policies
- [ ] Configure storage bucket policies
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Add Content Security Policy
- [ ] Rotate all API keys
- [ ] Set up monitoring and alerts
- [ ] Configure backup retention
- [ ] Test authentication flows
- [ ] Test authorization checks
- [ ] Validate file upload restrictions
- [ ] Test rate limiting
- [ ] Audit error messages
- [ ] Review all environment variables
- [ ] Enable HTTPS only
- [ ] Configure firewall rules
- [ ] Set up DDoS protection
- [ ] Enable audit logging
- [ ] Document security procedures

## 14. Incident Response

### If API Key is Compromised

1. Immediately rotate the key in OpenAI dashboard
2. Update environment variable in Netlify
3. Redeploy all functions
4. Review API logs for unauthorized usage
5. Monitor for unusual patterns

### If Database is Compromised

1. Immediately change Supabase service role key
2. Review RLS policies
3. Audit recent database changes
4. Check for data exfiltration
5. Notify affected users if required

### If User Account is Compromised

1. Force password reset
2. Invalidate all sessions
3. Review claim access logs
4. Check for unauthorized document access
5. Notify user

## 15. Regular Security Tasks

### Weekly
- Review API logs for anomalies
- Check rate limit violations
- Monitor error rates

### Monthly
- Review and update dependencies
- Audit user access patterns
- Review storage usage
- Check for security updates

### Quarterly
- Rotate API keys
- Security audit
- Penetration testing
- Update security documentation

## 16. Security Contacts

- **Supabase Support:** https://supabase.com/support
- **OpenAI Security:** security@openai.com
- **Netlify Security:** security@netlify.com

## Conclusion

This security implementation provides multiple layers of protection:
- Authentication & authorization
- Input validation & sanitization
- Rate limiting & monitoring
- Encrypted storage & transmission
- Comprehensive logging & auditing

Regular security reviews and updates are essential to maintain security posture.
