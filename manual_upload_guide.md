# Manual Upload Guide for Protected Documents

## 🚀 **Deploy Protected Documents to Response Center**

Your protected documents are ready to be uploaded to the response center. Here are the steps:

### 📁 **Protected Documents Location**
- **English:** `./Document Library - Final English/` (122 protected PDFs)
- **Spanish:** `./Document Library - Final Spanish/` (138 protected PDFs)
- **Total:** 260 protected documents

### 🔧 **Upload Methods**

#### **Method 1: Using Netlify Functions (Recommended)**
```bash
# Set environment variables (if not already set)
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run the deployment script
python deploy_protected_documents.py
```

#### **Method 2: Manual Upload via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to Storage → documents bucket
3. Upload files to:
   - `en/` folder for English documents
   - `es/` folder for Spanish documents
4. Use "Replace" option to overwrite existing files

#### **Method 3: Using Supabase CLI**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Upload documents
supabase storage upload documents/en/ "./Document Library - Final English/*.pdf"
supabase storage upload documents/es/ "./Document Library - Final Spanish/*.pdf"
```

### 🔒 **Security Features Applied**
- **Password:** `Claim Command Pro2025`
- **Watermark:** "Claim Command Pro - Protected Document"
- **Restrictions:** No printing, copying, or modification
- **Encryption:** 128-bit AES

### 📋 **Verification Steps**
After upload, verify that:
1. Documents require password to open
2. Watermark appears at bottom of each page
3. Printing and copying are disabled
4. Documents are accessible in response center

### 🛠️ **Troubleshooting**
If upload fails:
1. Check Supabase credentials
2. Verify network connection
3. Check file permissions
4. Review upload logs

### 📞 **Support**
If you need help with the upload process, check:
- `deploy_protected_documents.log` for detailed logs
- Supabase dashboard for storage status
- Response center for document accessibility

---

**Status:** Ready for deployment ✅  
**Protected Documents:** 260 files  
**Security Level:** Maximum protection applied 🔒




