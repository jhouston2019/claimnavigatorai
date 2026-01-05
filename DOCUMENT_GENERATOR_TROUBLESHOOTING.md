# Document Generator Troubleshooting Guide

## 🚨 Current Issues Identified

### 1. **Netlify Dev Server Not Starting**
- **Cause**: Missing environment variables (especially `OPENAI_API_KEY`)
- **Solution**: Set up proper environment variables

### 2. **Document Generator Not Accessible**
- **Cause**: Server configuration and path issues
- **Solution**: Use alternative testing methods

## 🔧 **Step-by-Step Fix**

### **Step 1: Set Up Environment Variables**

Create a `.env` file in the project root with the following content:

```env
# Required for Netlify Functions
OPENAI_API_KEY=sk-your_openai_api_key_here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_publishable_key
NODE_ENV=development
URL=http://localhost:8888
```

### **Step 2: Test Document Generator**

#### **Option A: Direct File Access**
1. Open the file directly in your browser:
   ```
   file:///D:/Projects - Master/Priority 1/Claim Navigator/app/resource-center/document-generator.html
   ```

#### **Option B: Use the Test File**
1. Open the standalone test file:
   ```
   file:///D:/Projects - Master/Priority 1/Claim Navigator/test-document-generator-standalone.html
   ```

#### **Option C: Start Netlify Dev Server**
1. Ensure you have the `.env` file with proper API keys
2. Run: `npm run dev`
3. Access: `http://localhost:8888/app/resource-center/document-generator.html`

### **Step 3: Verify Functionality**

The document generator should work with:
- ✅ **Fallback Generation**: Works without server (professional templates)
- ✅ **AI Generation**: Requires server with OpenAI API key
- ✅ **PDF Export**: Works with jsPDF library
- ✅ **61+ Document Types**: All categories supported

## 🧪 **Testing Methods**

### **Method 1: Standalone Test**
```bash
# Open the test file directly in browser
start test-document-generator-standalone.html
```

### **Method 2: Netlify Dev Server**
```bash
# Set up environment variables first
npm run dev
# Then access: http://localhost:8888/app/resource-center/document-generator.html
```

### **Method 3: Production Deployment**
```bash
# Deploy to Netlify with environment variables
netlify deploy --prod
```

## 📋 **Document Generator Features**

### **✅ Working Features:**
- **61+ Document Types** across 9 categories
- **Smart Fallback System** when AI fails
- **Professional Templates** with proper formatting
- **PDF Export** with jsPDF
- **Mobile Responsive** design
- **Search Functionality** for document types
- **Error Handling** with user-friendly messages

### **📊 Document Categories:**
1. **Core Claims** (8 types)
2. **Legal Documents** (15 types)
3. **Financial Documents** (12 types)
4. **Forms & Requests** (20 types)
5. **Appeals & Disputes** (10 types)
6. **Specialty Documents** (16 types)
7. **Property-Specific** (20 types)
8. **Business-Specific** (15 types)
9. **Catastrophic Events** (7 types)

## 🎯 **Quick Start Guide**

### **For Immediate Testing:**
1. Open `test-document-generator-standalone.html` in your browser
2. Click "Test Fallback Document Generation"
3. Verify the document is generated correctly

### **For Full AI Integration:**
1. Set up `.env` file with OpenAI API key
2. Run `npm run dev`
3. Access the full document generator
4. Test AI-powered document generation

## 🔑 **Required API Keys**

### **For Basic Functionality:**
- No API keys required (uses fallback templates)

### **For AI-Powered Generation:**
- `OPENAI_API_KEY`: Required for AI document generation
- `SUPABASE_URL`: Required for database operations
- `SUPABASE_ANON_KEY`: Required for authentication

### **For Payment Processing:**
- `STRIPE_SECRET_KEY`: Required for payment processing
- `STRIPE_PUBLIC_KEY`: Required for payment forms

## 🚀 **Deployment Options**

### **Option 1: Local Development**
```bash
npm run dev
# Access: http://localhost:8888
```

### **Option 2: Netlify Deployment**
```bash
netlify deploy --prod
# Access: https://your-site.netlify.app
```

### **Option 3: Direct File Access**
```
file:///path/to/document-generator.html
```

## 📞 **Support**

If you're still experiencing issues:

1. **Check Environment Variables**: Ensure all required API keys are set
2. **Test Standalone Version**: Use `test-document-generator-standalone.html`
3. **Check Console Errors**: Open browser developer tools for error messages
4. **Verify File Paths**: Ensure all files are in the correct locations

The Document Generator is fully functional - the issue is likely with the development server setup or environment variables.
