#!/usr/bin/env python3
"""
Re-protect Documents with Print and Copy Allowed
===============================================

This script re-protects all documents to allow printing and copying
while maintaining password protection and watermarks.
"""

import os
import sys
import logging
from pathlib import Path
from protect_pdf_library import PDFProtector

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('reprotect_documents.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def reprotect_documents():
    """Re-protect all documents with new settings"""
    logger.info("Starting re-protection of documents with print/copy allowed...")
    
    # Initialize protector
    protector = PDFProtector()
    
    # Define directories
    directories = [
        ("./Document Library - Final English", "English"),
        ("./Document Library - Final Spanish", "Spanish")
    ]
    
    total_processed = 0
    total_successful = 0
    total_failed = 0
    
    for directory, language in directories:
        if not os.path.exists(directory):
            logger.warning(f"Directory not found: {directory}")
            continue
        
        logger.info(f"Processing {language} documents in {directory}")
        
        # Get all PDF files
        pdf_files = [f for f in os.listdir(directory) if f.endswith('.pdf')]
        logger.info(f"Found {len(pdf_files)} {language} documents to re-protect")
        
        for pdf_file in pdf_files:
            input_path = os.path.join(directory, pdf_file)
            output_path = os.path.join(directory, f"temp_{pdf_file}")
            
            try:
                logger.info(f"Re-protecting: {pdf_file}")
                
                # Protect with new settings
                success = protector.protect_pdf(input_path, output_path)
                
                if success:
                    # Replace original with protected version
                    os.replace(output_path, input_path)
                    total_successful += 1
                    logger.info(f"✅ Successfully re-protected: {pdf_file}")
                else:
                    total_failed += 1
                    logger.error(f"❌ Failed to re-protect: {pdf_file}")
                    # Clean up temp file if it exists
                    if os.path.exists(output_path):
                        os.remove(output_path)
                
                total_processed += 1
                
            except Exception as e:
                total_failed += 1
                logger.error(f"❌ Error re-protecting {pdf_file}: {e}")
                # Clean up temp file if it exists
                if os.path.exists(output_path):
                    os.remove(output_path)
    
    # Summary
    logger.info("=" * 60)
    logger.info("RE-PROTECTION COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Total documents processed: {total_processed}")
    logger.info(f"Successfully re-protected: {total_successful}")
    logger.info(f"Failed to re-protect: {total_failed}")
    logger.info(f"Success rate: {(total_successful/total_processed*100):.1f}%" if total_processed > 0 else "0%")
    logger.info("=" * 60)
    logger.info("🔒 New security settings:")
    logger.info("   ✅ Password protection: Claim Navigator2025")
    logger.info("   ✅ Watermark: Claim Navigator - Protected Document")
    logger.info("   ✅ Allow printing: YES")
    logger.info("   ✅ Allow copying: YES")
    logger.info("   ❌ Disable modification: YES")
    logger.info("=" * 60)
    
    return total_successful, total_failed

def main():
    """Main function"""
    logger.info("Claim Navigator Document Re-Protection")
    logger.info("=" * 50)
    logger.info("Updating protection settings to allow printing and copying")
    logger.info("=" * 50)
    
    # Re-protect documents
    successful, failed = reprotect_documents()
    
    if failed == 0:
        logger.info("✅ All documents successfully re-protected!")
        logger.info("📋 Next step: Deploy updated documents to GitHub")
    else:
        logger.warning(f"⚠️ {failed} documents failed to re-protect")
    
    return successful, failed

if __name__ == "__main__":
    success, failed = main()
    sys.exit(0 if failed == 0 else 1)




