# Claim Navigator Production Checklist

## Pre-Deployment Testing

### 1. Backend Functions (Netlify)

#### ✅ export-document.js
- [ ] Function deploys successfully to Netlify
- [ ] Accepts AI response text + format (PDF/DOCX)
- [ ] Generates downloadable PDF files using pdfkit
- [ ] Generates downloadable DOCX files using docx package
- [ ] Returns proper file streams with correct headers
- [ ] Stores generated documents in Netlify Blobs
- [ ] Requires Netlify Identity authentication
- [ ] Handles errors gracefully

#### ✅ get-template.js
- [ ] Function deploys successfully to Netlify
- [ ] Securely serves claim document templates
- [ ] Requires Netlify Identity authentication
- [ ] Maps template names to correct file paths
- [ ] Streams/downloads files to users
- [ ] Falls back from Blobs to local filesystem
- [ ] Logs access in analytics store
- [ ] Handles missing templates gracefully

#### ✅ delete-user-data.js
- [ ] Function deploys successfully to Netlify
- [ ] Requires explicit confirmation ("DELETE_MY_DATA_PERMANENTLY")
- [ ] Requires Netlify Identity authentication
- [ ] Deletes user entitlements from Blobs
- [ ] Deletes user responses from Blobs
- [ ] Deletes user access logs from Blobs
- [ ] Deletes user templates from Blobs
- [ ] Creates audit trail of deletion
- [ ] Returns detailed deletion results

#### ✅ ai-generate-response.js (Updated)
- [ ] Function deploys successfully to Netlify
- [ ] Parses PDFs using pdf-parse
- [ ] Performs OCR on images using tesseract.js
- [ ] Handles text file uploads
- [ ] Requires Netlify Identity authentication
- [ ] Checks user credits before processing
- [ ] Deducts credits after successful generation
- [ ] Stores responses in Netlify Blobs
- [ ] Logs usage analytics
- [ ] Handles file uploads with multer

### 2. Document Templates

#### ✅ Template Files (20+ Required)
- [ ] First Notice of Loss (FNOL)
- [ ] Proof of Loss
- [ ] Standard Claim Form
- [ ] Damage Assessment
- [ ] Demand Letter
- [ ] Appeal Letter
- [ ] Complaint Letter
- [ ] Settlement Offer
- [ ] Estimate Request
- [ ] Repair Authorization
- [ ] Inspection Request
- [ ] Document Request
- [ ] Internal Appeal
- [ ] External Appeal
- [ ] Regulatory Complaint
- [ ] Payment Demand
- [ ] Coverage Demand
- [ ] Timeline Demand
- [ ] Witness Statement
- [ ] Medical Records Request
- [ ] Expert Opinion Request
- [ ] Mediation Request

#### ✅ Template Organization
- [ ] Templates stored in `/assets/docs/[category]/`
- [ ] File naming follows pattern: `[file-name].docx`
- [ ] Categories: claims, legal, forms, appeals, demands
- [ ] Templates are accessible via get-template.js

### 3. Legal Pages

#### ✅ Legal Page Verification
- [ ] terms.html renders correctly
- [ ] privacy.html renders correctly
- [ ] disclaimer.html renders correctly
- [ ] Footer links in product.html work correctly
- [ ] All pages match existing site UI

### 4. Netlify Configuration

#### ✅ netlify.toml
- [ ] Functions directory specified: `"netlify/functions"`
- [ ] Node bundler set to: `"esbuild"`
- [ ] API redirects configured: `/api/*` → `/.netlify/functions/:splat`
- [ ] External modules specified for pdfkit, docx, pdf-parse, tesseract.js, multer
- [ ] Security headers configured
- [ ] Cache control headers set

### 5. Dependencies

#### ✅ package.json
- [ ] All required packages included
- [ ] Node.js version specified: `>=18.0.0`
- [ ] Production-ready packages only
- [ ] No placeholder or stub packages

## Production Testing

### 1. Stripe Integration

#### ✅ Payment Flow
- [ ] Stripe checkout creates successful payments
- [ ] Webhook receives payment confirmations
- [ ] User credits are updated correctly
- [ ] User entitlements are created/updated
- [ ] Payment failures are handled gracefully

#### ✅ Credit System
- [ ] AI generation deducts credits correctly
- [ ] Users cannot generate responses without credits
- [ ] Credit balance is accurate after operations
- [ ] Credit history is maintained

### 2. AI Generation

#### ✅ Response Generation
- [ ] AI generates responses for text input
- [ ] AI generates responses for PDF uploads
- [ ] AI generates responses for image uploads
- [ ] Responses are stored in Blobs
- [ ] Usage analytics are logged
- [ ] Credit deduction works correctly

### 3. Template System

#### ✅ Template Access
- [ ] Templates download correctly
- [ ] Authentication required for access
- [ ] Template mapping works correctly
- [ ] File streaming functions properly
- [ ] Access logs are created

### 4. Document Export

#### ✅ Export Functionality
- [ ] PDF export generates valid files
- [ ] DOCX export generates valid files
- [ ] Files are downloadable
- [ ] Generated files are stored in Blobs
- [ ] Export requires authentication

### 5. Data Management

#### ✅ User Data Deletion
- [ ] Deletion requires confirmation
- [ ] All user data is removed from Blobs
- [ ] Audit trail is created
- [ ] Deletion results are reported
- [ ] Authentication required

## Security Verification

### 1. Authentication
- [ ] All functions require Netlify Identity
- [ ] Users can only access their own data
- [ ] No unauthorized access possible
- [ ] Token validation works correctly

### 2. Data Protection
- [ ] User data is isolated by user ID
- [ ] No cross-user data access
- [ ] Sensitive data is not logged
- [ ] Blob storage is secure

### 3. Input Validation
- [ ] File uploads are validated
- [ ] Text input is sanitized
- [ ] Malicious input is rejected
- [ ] File size limits are enforced

## Performance Testing

### 1. Response Times
- [ ] AI generation completes within 30 seconds
- [ ] Template downloads complete within 10 seconds
- [ ] Document export completes within 15 seconds
- [ ] File uploads handle 10MB+ files

### 2. Scalability
- [ ] Functions handle concurrent requests
- [ ] Blob storage scales appropriately
- [ ] No memory leaks in functions
- [ ] Error handling prevents crashes

## Final Verification

### 1. End-to-End Testing
- [ ] Complete user journey works
- [ ] Payment → Credits → AI Generation → Export
- [ ] Template download → Use → AI Generation
- [ ] User data deletion → Confirmation → Cleanup

### 2. Error Handling
- [ ] Network failures are handled
- [ ] Invalid inputs are rejected
- [ ] Authentication failures are handled
- [ ] Service failures are logged

### 3. Monitoring
- [ ] Function logs are accessible
- [ ] Error tracking is in place
- [ ] Performance metrics are available
- [ ] Usage analytics are working

## Deployment Checklist

### 1. Environment Variables
- [ ] OPENAI_API_KEY is set
- [ ] STRIPE_SECRET_KEY is set
- [ ] STRIPE_WEBHOOK_SECRET is set
- [ ] NETLIFY_BLOBS_TOKEN is set

### 2. Function Deployment
- [ ] All functions deploy successfully
- [ ] No build errors
- [ ] External modules are bundled correctly
- [ ] Function URLs are accessible

### 3. Integration Testing
- [ ] Stripe webhook endpoint is accessible
- [ ] AI generation works with OpenAI
- [ ] Blob storage is accessible
- [ ] Identity authentication works

## Post-Deployment

### 1. Monitoring
- [ ] Check function logs for errors
- [ ] Monitor Stripe webhook deliveries
- [ ] Track AI generation success rates
- [ ] Monitor credit system usage

### 2. User Testing
- [ ] Test with real user accounts
- [ ] Verify payment flow works
- [ ] Confirm AI generation quality
- [ ] Test template downloads

### 3. Documentation
- [ ] Update user documentation
- [ ] Document any configuration changes
- [ ] Note any environment-specific settings
- [ ] Update deployment procedures

---

**Status**: Ready for Production Testing
**Last Updated**: January 20, 2025
**Next Review**: After initial deployment
