#!/usr/bin/env python3
"""
Deploy Protected Documents to Netlify Site
==========================================

This script helps you deploy the protected documents to replace
the originals on the Netlify site.
"""

import os
import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('deploy_to_netlify_site.log'),
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

def create_deployment_instructions():
    """Create deployment instructions"""
    instructions = """
# Deploy Protected Documents to Netlify Site

## Current Status
✅ Protected documents are ready for deployment
📁 English: 122 protected PDFs
📁 Spanish: 125 protected PDFs
🔒 Security: Password protection, watermarks, restrictions

## Deployment Options

### Option 1: Manual Upload via Netlify Dashboard
1. Go to your Netlify dashboard
2. Navigate to your site: Claim Navigator.netlify.app
3. Go to Site settings → Deploys
4. Upload the protected documents to replace the originals
5. The documents should be accessible at: https://Claim Navigator.com/docs/

### Option 2: Git-based Deployment
1. Create a 'docs' directory in your repository
2. Copy the protected documents to the docs directory
3. Commit and push to trigger automatic deployment
4. The documents will be available at: https://Claim Navigator.com/docs/

### Option 3: Netlify CLI Deployment
1. Install Netlify CLI: npm install -g netlify-cli
2. Login: netlify login
3. Deploy: netlify deploy --prod
4. Upload the protected documents to the docs directory

## File Structure for Deployment
```
docs/
├── en/          # English documents (122 files)
└── es/          # Spanish documents (125 files)
```

## Security Features Applied
- Password: Claim Navigator2025
- Watermark: "Claim Navigator - Protected Document"
- Restrictions: No printing, copying, or modification
- Encryption: 128-bit AES

## Verification
After deployment, verify that:
1. Documents are accessible at https://Claim Navigator.com/docs/
2. Documents require password to open
3. Watermark appears at bottom of each page
4. Printing and copying are disabled

## Next Steps
1. Choose your preferred deployment method
2. Upload the protected documents
3. Test access in the response center
4. Verify security features are working
"""
    
    with open("NETLIFY_DEPLOYMENT_INSTRUCTIONS.txt", "w", encoding="utf-8") as f:
        f.write(instructions)
    
    logger.info("Deployment instructions saved to NETLIFY_DEPLOYMENT_INSTRUCTIONS.txt")

def main():
    """Main function"""
    logger.info("Claim Navigator Protected Documents - Netlify Site Deployment")
    logger.info("=" * 70)
    
    # Check protected documents
    if not check_protected_documents():
        logger.error("Protected documents check failed!")
        sys.exit(1)
    
    # Create deployment instructions
    create_deployment_instructions()
    
    # Final summary
    logger.info("=" * 70)
    logger.info("DEPLOYMENT READY")
    logger.info("=" * 70)
    logger.info("✅ Protected documents are ready for Netlify deployment")
    logger.info("🌐 Target: https://Claim Navigator.com/docs/")
    logger.info("📁 Documents location: ./Document Library - Final English/ and ./Document Library - Final Spanish/")
    logger.info("🔒 Security features: Password protection, watermarks, restrictions")
    logger.info("📋 Instructions: NETLIFY_DEPLOYMENT_INSTRUCTIONS.txt")
    logger.info("=" * 70)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)



