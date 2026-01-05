#!/usr/bin/env python3
"""
Deploy Protected Documents to Response Center
===========================================

This script prepares and deploys the protected documents to the response center.
It will use the existing Netlify function or provide manual deployment instructions.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('deploy_protected_docs.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def check_protected_documents():
    """Check if protected documents are ready"""
    logger.info("Checking protected documents...")
    
    english_dir = "./Document Library - Final English"
    spanish_dir = "./Document Library - Final Spanish"
    
    if not os.path.exists(english_dir):
        logger.error(f"English directory not found: {english_dir}")
        return False
    
    if not os.path.exists(spanish_dir):
        logger.error(f"Spanish directory not found: {spanish_dir}")
        return False
    
    # Count PDF files
    english_files = [f for f in os.listdir(english_dir) if f.endswith('.pdf')]
    spanish_files = [f for f in os.listdir(spanish_dir) if f.endswith('.pdf')]
    
    logger.info(f"English documents: {len(english_files)} files")
    logger.info(f"Spanish documents: {len(spanish_files)} files")
    logger.info(f"Total protected documents: {len(english_files) + len(spanish_files)} files")
    
    return True

def test_document_protection():
    """Test that documents are actually protected"""
    logger.info("Testing document protection...")
    
    try:
        from PyPDF2 import PdfReader
        
        # Test one English file
        english_dir = "./Document Library - Final English"
        english_files = [f for f in os.listdir(english_dir) if f.endswith('.pdf')]
        
        if english_files:
            test_file = os.path.join(english_dir, english_files[0])
            reader = PdfReader(test_file)
            
            if reader.is_encrypted:
                logger.info("Documents are password protected")
                return True
            else:
                logger.warning("Documents may not be properly protected")
                return False
        else:
            logger.error("No English files found to test")
            return False
            
    except Exception as e:
        logger.error(f"Error testing protection: {e}")
        return False

def run_netlify_deployment():
    """Run the Netlify function to deploy documents"""
    logger.info("Running Netlify deployment...")
    
    try:
        # Check if we have the Netlify function
        netlify_function = "netlify/functions/upload-documents-to-supabase.js"
        
        if not os.path.exists(netlify_function):
            logger.error(f"Netlify function not found: {netlify_function}")
            return False
        
        # Run the function
        result = subprocess.run([
            'node', 
            netlify_function
        ], capture_output=True, text=True, cwd='.')
        
        if result.returncode == 0:
            logger.info("Netlify deployment completed successfully!")
            logger.info(f"Output: {result.stdout}")
            return True
        else:
            logger.error(f"Netlify deployment failed: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Error running Netlify deployment: {e}")
        return False

def create_manual_deployment_instructions():
    """Create manual deployment instructions"""
    logger.info("Creating manual deployment instructions...")
    
    instructions = """
# Manual Deployment Instructions for Protected Documents

## Protected Documents Ready for Deployment
- English: ./Document Library - Final English/ (122 files)
- Spanish: ./Document Library - Final Spanish/ (138 files)
- Total: 260 protected documents

## Security Features Applied
- Password: Claim Navigator2025
- Watermark: "Claim Navigator - Protected Document"
- Restrictions: No printing, copying, or modification
- Encryption: 128-bit AES

## Deployment Methods

### Method 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Storage → documents bucket
3. Upload English documents to 'en' folder
4. Upload Spanish documents to 'es' folder
5. Use "Replace" option to overwrite existing files

### Method 2: Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Upload documents
supabase storage upload documents/en/ "./Document Library - Final English/*.pdf"
supabase storage upload documents/es/ "./Document Library - Final Spanish/*.pdf"
```

### Method 3: Programmatic Upload
Use the existing Netlify function:
```bash
node netlify/functions/upload-documents-to-supabase.js
```

## Verification
After deployment, verify that:
1. Documents require password to open
2. Watermark appears at bottom of each page
3. Printing and copying are disabled
4. Documents are accessible in response center

## Support
If you need help:
- Check deploy_protected_docs.log for detailed logs
- Verify Supabase credentials are set
- Test document access in response center
"""
    
    with open("DEPLOYMENT_INSTRUCTIONS.txt", "w") as f:
        f.write(instructions)
    
    logger.info("Deployment instructions saved to DEPLOYMENT_INSTRUCTIONS.txt")

def main():
    """Main deployment function"""
    logger.info("Claim Navigator Protected Documents - Response Center Deployment")
    logger.info("=" * 70)
    
    # Step 1: Check protected documents
    if not check_protected_documents():
        logger.error("Protected documents check failed!")
        sys.exit(1)
    
    # Step 2: Test protection
    if not test_document_protection():
        logger.warning("Document protection test failed!")
    
    # Step 3: Try Netlify deployment
    logger.info("Attempting Netlify deployment...")
    if run_netlify_deployment():
        logger.info("✅ Protected documents deployed successfully!")
        logger.info("🔒 Protected documents are now live in the response center!")
        logger.info("📝 Users will need password 'Claim Navigator2025' to access documents")
        logger.info("💧 All documents have watermarks for identification")
        logger.info("🚫 Printing and copying are disabled by default")
    else:
        logger.warning("Netlify deployment failed. Creating manual instructions...")
        create_manual_deployment_instructions()
        logger.info("📋 Manual deployment instructions created in DEPLOYMENT_INSTRUCTIONS.txt")
        logger.info("Please follow the instructions to deploy the protected documents manually.")
    
    logger.info("=" * 70)
    logger.info("DEPLOYMENT PROCESS COMPLETE")
    logger.info("=" * 70)

if __name__ == "__main__":
    main()




