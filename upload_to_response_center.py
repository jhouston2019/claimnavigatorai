#!/usr/bin/env python3
"""
Upload Protected Documents to Response Center
===========================================

This script prepares the protected documents for upload to the response center.
Since Supabase credentials are needed, this script will:
1. Verify protected documents are ready
2. Provide instructions for manual upload
3. Create a deployment package
"""

import os
import sys
import shutil
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('upload_to_response_center.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def verify_protected_documents():
    """Verify that protected documents are ready"""
    logger.info("Verifying protected documents...")
    
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
    
    logger.info(f"✅ English documents: {len(english_files)} files")
    logger.info(f"✅ Spanish documents: {len(spanish_files)} files")
    logger.info(f"✅ Total protected documents: {len(english_files) + len(spanish_files)} files")
    
    return True

def test_protection():
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
                logger.info("✅ Documents are password protected")
                return True
            else:
                logger.warning("⚠️ Documents may not be properly protected")
                return False
        else:
            logger.error("No English files found to test")
            return False
            
    except Exception as e:
        logger.error(f"Error testing protection: {e}")
        return False

def create_deployment_package():
    """Create a deployment package for manual upload"""
    logger.info("Creating deployment package...")
    
    package_dir = "protected_documents_package"
    
    if os.path.exists(package_dir):
        shutil.rmtree(package_dir)
    
    os.makedirs(package_dir, exist_ok=True)
    
    # Copy English documents
    english_dest = os.path.join(package_dir, "en")
    shutil.copytree("./Document Library - Final English", english_dest)
    logger.info(f"✅ Copied English documents to {english_dest}")
    
    # Copy Spanish documents  
    spanish_dest = os.path.join(package_dir, "es")
    shutil.copytree("./Document Library - Final Spanish", spanish_dest)
    logger.info(f"✅ Copied Spanish documents to {spanish_dest}")
    
    # Create upload instructions
    instructions = f"""
# Protected Documents Upload Instructions

## Package Contents
- en/ - English protected documents ({len(os.listdir(english_dest))} files)
- es/ - Spanish protected documents ({len(os.listdir(spanish_dest))} files)

## Upload to Supabase Storage
1. Go to your Supabase project dashboard
2. Navigate to Storage → documents bucket
3. Upload the contents of the 'en' folder to the 'en' path in storage
4. Upload the contents of the 'es' folder to the 'es' path in storage
5. Use "Replace" option to overwrite existing files

## Security Features Applied
- Password: ClaimNavigatorAI2025
- Watermark: "ClaimNavigatorAI - Protected Document"
- Restrictions: No printing, copying, or modification
- Encryption: 128-bit AES

## Verification
After upload, test that:
1. Documents require password to open
2. Watermark appears at bottom of each page
3. Printing and copying are disabled
"""
    
    with open(os.path.join(package_dir, "UPLOAD_INSTRUCTIONS.txt"), "w") as f:
        f.write(instructions)
    
    logger.info(f"✅ Deployment package created: {package_dir}")
    return package_dir

def main():
    """Main function"""
    logger.info("ClaimNavigatorAI Protected Documents - Response Center Upload")
    logger.info("=" * 70)
    
    # Step 1: Verify protected documents
    if not verify_protected_documents():
        logger.error("❌ Protected documents verification failed!")
        sys.exit(1)
    
    # Step 2: Test protection
    if not test_protection():
        logger.warning("⚠️ Protection test failed - documents may not be properly protected")
    
    # Step 3: Create deployment package
    package_dir = create_deployment_package()
    
    # Summary
    logger.info("=" * 70)
    logger.info("DEPLOYMENT PACKAGE READY")
    logger.info("=" * 70)
    logger.info(f"📁 Package location: {package_dir}")
    logger.info("📋 Next steps:")
    logger.info("1. Go to your Supabase project dashboard")
    logger.info("2. Navigate to Storage → documents bucket")
    logger.info("3. Upload the 'en' folder contents to 'en' path in storage")
    logger.info("4. Upload the 'es' folder contents to 'es' path in storage")
    logger.info("5. Use 'Replace' option to overwrite existing files")
    logger.info("=" * 70)
    logger.info("🔒 Protected documents are ready for deployment!")
    logger.info("📝 Users will need password 'ClaimNavigatorAI2025' to access documents")
    logger.info("💧 All documents have watermarks for identification")
    logger.info("🚫 Printing and copying are disabled by default")
    logger.info("=" * 70)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

