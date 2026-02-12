# Claim Command Center - Deployment Checklist

## 📋 Pre-Deployment Checklist

### 1. Database Setup ✅

- [ ] **Run Migration**
  ```bash
  # In Supabase SQL Editor, run:
  supabase/migrations/20260212_claim_command_center_schema.sql
  ```

- [ ] **Verify Tables Created**
  - [ ] `claim_steps`
  - [ ] `claim_documents`
  - [ ] `claim_outputs`
  - [ ] `claim_financial_summary`
  - [ ] `claim_estimate_discrepancies`
  - [ ] `claim_policy_coverage`
  - [ ] `claim_generated_documents`

- [ ] **Verify RLS Policies**
  - [ ] All tables have RLS enabled
  - [ ] SELECT policies in place
  - [ ] INSERT policies in place
  - [ ] UPDATE policies in place
  - [ ] DELETE policies in place (where applicable)

- [ ] **Test Database Access**
  - [ ] Can create claim record
  - [ ] Can initialize claim steps
  - [ ] Can initialize financial summary
  - [ ] RLS prevents cross-user access

### 2. Storage Setup ✅

- [ ] **Create Storage Bucket**
  - [ ] Bucket name: `claim-documents`
  - [ ] Public: `false`
  - [ ] File size limit: `15MB`

- [ ] **Configure MIME Types**
  - [ ] `application/pdf`
  - [ ] `image/jpeg`
  - [ ] `image/png`
  - [ ] `image/gif`
  - [ ] `image/webp`
  - [ ] `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

- [ ] **Apply Storage Policies**
  - [ ] Users can upload to their folder
  - [ ] Users can view their own documents
  - [ ] Users can update their own documents
  - [ ] Users can delete their own documents

- [ ] **Test Storage**
  - [ ] Can upload file
  - [ ] Can generate signed URL
  - [ ] Can download file
  - [ ] Cannot access other user's files

### 3. Environment Variables ✅

- [ ] **Supabase Variables**
  ```env
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

- [ ] **OpenAI Variables**
  ```env
  OPENAI_API_KEY=sk-your-api-key
  ```

- [ ] **Application Variables**
  ```env
  NODE_ENV=production
  ```

- [ ] **Verify in Netlify Dashboard**
  - [ ] All variables added
  - [ ] No typos in variable names
  - [ ] Values are correct
  - [ ] Sensitive variables are masked

### 4. Dependencies ✅

- [ ] **Install Dependencies**
  ```bash
  npm install
  ```

- [ ] **Verify Package Versions**
  - [ ] `@supabase/supabase-js`: ^2.39.0
  - [ ] `openai`: ^4.24.1
  - [ ] `pdf-parse`: ^1.1.1
  - [ ] All other dependencies up to date

- [ ] **No Security Vulnerabilities**
  ```bash
  npm audit
  ```

### 5. Code Review ✅

- [ ] **API Routes**
  - [ ] All 6 endpoints implemented
  - [ ] Authentication checks in place
  - [ ] Claim ownership verification
  - [ ] Error handling complete
  - [ ] Logging implemented

- [ ] **Frontend Components**
  - [ ] StepToolModal functional
  - [ ] StructuredOutputPanel renders correctly
  - [ ] FinancialSummaryPanel loads data
  - [ ] All tool buttons wired up

- [ ] **Security**
  - [ ] Input validation on all endpoints
  - [ ] File upload restrictions enforced
  - [ ] Rate limiting configured
  - [ ] No sensitive data in logs
  - [ ] No API keys in client code

---

## 🚀 Deployment Steps

### Step 1: Database Migration

```bash
# 1. Open Supabase Dashboard
# 2. Navigate to SQL Editor
# 3. Copy contents of: supabase/migrations/20260212_claim_command_center_schema.sql
# 4. Paste and run
# 5. Verify "Success" message
```

**Verification:**
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'claim_%';

-- Should return 7 tables
```

### Step 2: Storage Configuration

```bash
# 1. Open Supabase Dashboard
# 2. Navigate to Storage
# 3. Create new bucket: "claim-documents"
# 4. Set public: false
# 5. Set file size limit: 15728640 (15MB)
# 6. Navigate to Policies
# 7. Run SQL from: supabase/STORAGE_SETUP.md
```

**Verification:**
```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'claim-documents';

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

### Step 3: Environment Variables

```bash
# 1. Open Netlify Dashboard
# 2. Navigate to: Site Settings > Environment Variables
# 3. Add each variable:
#    - SUPABASE_URL
#    - SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - OPENAI_API_KEY
#    - NODE_ENV
# 4. Save changes
```

**Verification:**
```bash
# In Netlify CLI
netlify env:list
```

### Step 4: Deploy to Netlify

```bash
# Option A: Git Push (Recommended)
git add .
git commit -m "Deploy Claim Command Center"
git push origin main

# Option B: Manual Deploy
netlify deploy --prod

# Option C: Netlify CLI
netlify deploy --prod --dir=.
```

**Verification:**
```bash
# Check deployment status
netlify status

# View site
netlify open:site
```

### Step 5: Post-Deployment Testing

```bash
# 1. Open deployed site
# 2. Login with test user
# 3. Navigate to Claim Command Center
# 4. Test each tool:
#    - Policy Analysis
#    - Estimate Comparison
#    - Supplement Generation
#    - Settlement Analysis
#    - Release Analysis
#    - Demand Letter Generation
```

---

## 🧪 Testing Checklist

### Functional Testing

- [ ] **Authentication**
  - [ ] Can login
  - [ ] Can logout
  - [ ] Session persists
  - [ ] Unauthorized access blocked

- [ ] **Step 2: Policy Analysis**
  - [ ] Modal opens
  - [ ] Can upload PDF
  - [ ] Analysis runs successfully
  - [ ] Results display correctly
  - [ ] Data saved to database
  - [ ] Step marked complete

- [ ] **Step 8: Estimate Comparison**
  - [ ] Modal opens
  - [ ] Can upload 2 PDFs
  - [ ] Analysis runs successfully
  - [ ] Discrepancies displayed
  - [ ] Financial summary updates
  - [ ] Underpayment calculated

- [ ] **Step 10: Supplement Generation**
  - [ ] Modal opens
  - [ ] Generation runs successfully
  - [ ] Letter displays correctly
  - [ ] Can view HTML/Markdown
  - [ ] Data saved to database

- [ ] **Step 13: Settlement Analysis**
  - [ ] Modal opens
  - [ ] Can upload PDF
  - [ ] Analysis runs successfully
  - [ ] Financial breakdown displayed
  - [ ] Recovery opportunities shown

- [ ] **Step 14: Demand Letter**
  - [ ] Modal opens
  - [ ] Generation runs successfully
  - [ ] Letter displays correctly
  - [ ] Policy citations included
  - [ ] Timeline accurate

- [ ] **Step 17: Release Analysis**
  - [ ] Modal opens
  - [ ] Can upload PDF
  - [ ] Analysis runs successfully
  - [ ] Risk assessment displayed
  - [ ] Flagged clauses shown

- [ ] **Financial Summary Panel**
  - [ ] Loads on page load
  - [ ] Updates after analysis
  - [ ] All metrics display
  - [ ] Formatting correct

### Security Testing

- [ ] **Authentication**
  - [ ] Cannot access without login
  - [ ] Cannot access other user's claims
  - [ ] Token expires properly
  - [ ] Refresh token works

- [ ] **File Upload**
  - [ ] Rejects files > 15MB
  - [ ] Rejects invalid MIME types
  - [ ] Sanitizes filenames
  - [ ] Stores in correct folder

- [ ] **API Endpoints**
  - [ ] Require authentication
  - [ ] Verify claim ownership
  - [ ] Validate input
  - [ ] Handle errors gracefully
  - [ ] No stack traces to client

- [ ] **Rate Limiting**
  - [ ] Enforces 120 req/min per user
  - [ ] Enforces 300 req/min per IP
  - [ ] Enforces burst limit
  - [ ] Blocks violators temporarily

### Performance Testing

- [ ] **Page Load**
  - [ ] Initial load < 2s
  - [ ] Financial summary loads < 1s
  - [ ] No console errors

- [ ] **File Upload**
  - [ ] 5MB file uploads in < 5s
  - [ ] Progress indicator works
  - [ ] Error handling works

- [ ] **AI Analysis**
  - [ ] Policy analysis < 20s
  - [ ] Estimate comparison < 25s
  - [ ] Letter generation < 15s
  - [ ] Loading states display

### Responsive Testing

- [ ] **Desktop (1920x1080)**
  - [ ] Layout correct
  - [ ] Modals centered
  - [ ] Tables readable
  - [ ] Buttons accessible

- [ ] **Tablet (768x1024)**
  - [ ] Layout adapts
  - [ ] Modals fit screen
  - [ ] Tables scroll
  - [ ] Touch targets adequate

- [ ] **Mobile (375x667)**
  - [ ] Single column layout
  - [ ] Full-width modals
  - [ ] Readable text
  - [ ] Easy navigation

### Browser Testing

- [ ] **Chrome (Latest)**
- [ ] **Firefox (Latest)**
- [ ] **Safari (Latest)**
- [ ] **Edge (Latest)**
- [ ] **Mobile Safari (iOS)**
- [ ] **Chrome Mobile (Android)**

---

## 🔍 Monitoring Setup

### Netlify Analytics

- [ ] **Enable Analytics**
  - [ ] Navigate to: Analytics tab
  - [ ] Enable if not already active
  - [ ] Review baseline metrics

### Supabase Monitoring

- [ ] **Database Monitoring**
  - [ ] Navigate to: Database > Monitoring
  - [ ] Review query performance
  - [ ] Check connection pool

- [ ] **Storage Monitoring**
  - [ ] Navigate to: Storage > Usage
  - [ ] Review storage usage
  - [ ] Check bandwidth

### OpenAI Monitoring

- [ ] **API Usage**
  - [ ] Navigate to: OpenAI Dashboard > Usage
  - [ ] Review token usage
  - [ ] Set up usage alerts
  - [ ] Monitor costs

### Error Tracking

- [ ] **Netlify Function Logs**
  - [ ] Navigate to: Functions tab
  - [ ] Review recent invocations
  - [ ] Check for errors
  - [ ] Set up alerts

- [ ] **Supabase Logs**
  - [ ] Navigate to: Logs > API
  - [ ] Review recent queries
  - [ ] Check for errors
  - [ ] Set up alerts

---

## 📊 Success Criteria

### Immediate (Day 1)

- [ ] All 6 API endpoints responding
- [ ] No 500 errors
- [ ] Authentication working
- [ ] File uploads successful
- [ ] AI analysis completing

### Short-term (Week 1)

- [ ] 10+ successful policy analyses
- [ ] 10+ successful estimate comparisons
- [ ] 5+ supplement letters generated
- [ ] No security incidents
- [ ] < 1% error rate

### Medium-term (Month 1)

- [ ] 100+ claims processed
- [ ] Average response time < 20s
- [ ] 99.9% uptime
- [ ] User satisfaction > 4.5/5
- [ ] No data breaches

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** "Not authenticated" error
- **Solution:** Check Supabase session, verify token

**Issue:** File upload fails
- **Solution:** Check file size, MIME type, storage policies

**Issue:** AI analysis times out
- **Solution:** Check OpenAI API key, increase timeout

**Issue:** Financial summary not loading
- **Solution:** Initialize financial summary record

**Issue:** Modal not opening
- **Solution:** Check console for JavaScript errors

### Emergency Contacts

- **Supabase Support:** https://supabase.com/support
- **Netlify Support:** https://www.netlify.com/support/
- **OpenAI Support:** https://help.openai.com/

---

## 🎉 Go Live!

### Final Steps

1. [ ] Complete all checklist items above
2. [ ] Run full test suite
3. [ ] Review monitoring dashboards
4. [ ] Notify team of deployment
5. [ ] Monitor for first 24 hours
6. [ ] Celebrate! 🎊

### Post-Launch

- [ ] Monitor error rates daily
- [ ] Review user feedback
- [ ] Track performance metrics
- [ ] Plan next iteration
- [ ] Document lessons learned

---

## 📝 Deployment Log

```
Date: _______________
Deployed By: _______________
Version: 1.0.0
Status: _______________

Pre-Deployment Checks:
- Database: ☐ Pass ☐ Fail
- Storage: ☐ Pass ☐ Fail
- Environment: ☐ Pass ☐ Fail
- Dependencies: ☐ Pass ☐ Fail
- Code Review: ☐ Pass ☐ Fail

Deployment:
- Start Time: _______________
- End Time: _______________
- Duration: _______________
- Issues: _______________

Post-Deployment:
- Functional Tests: ☐ Pass ☐ Fail
- Security Tests: ☐ Pass ☐ Fail
- Performance Tests: ☐ Pass ☐ Fail
- Responsive Tests: ☐ Pass ☐ Fail

Notes:
_________________________________
_________________________________
_________________________________

Sign-off: _______________
```

---

**Ready to deploy? Let's go! 🚀**
