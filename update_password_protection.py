#!/usr/bin/env python3
"""
Update Password Protection
=========================

This script re-protects all documents with the new password ClaimNav2025
while maintaining print and copy permissions.
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
        logging.FileHandler('update_password_protection.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def update_password_protection():
    """Update all documents with new password"""
    logger.info("Starting password update to ClaimNav2025...")
    
    # Initialize protector
    protector = PDFProtector()
    
    # Define directories
    directories = [
        "./Document Library - Final English",
        "./Document Library - Final Spanish"
    ]
    
    total_files = 0
    protected_files = 0
    failed_files = 0
    
    for directory in directories:
        if not os.path.exists(directory):
            logger.warning(f"Directory not found: {directory}")
            continue
            
        logger.info(f"Processing directory: {directory}")
        
        # Get all PDF files
        pdf_files = [f for f in os.listdir(directory) if f.lower().endswith('.pdf')]
        total_files += len(pdf_files)
        
        for filename in pdf_files:
            file_path = os.path.join(directory, filename)
            
            try:
                logger.info(f"Updating protection for: {filename}")
                
                # Protect the file with new password (overwrite original)
                success = protector.protect_pdf(file_path, file_path)
                
                if success:
                    protected_files += 1
                    logger.info(f"✅ Successfully updated: {filename}")
                else:
                    failed_files += 1
                    logger.error(f"❌ Failed to update: {filename}")
                    
            except Exception as e:
                failed_files += 1
                logger.error(f"❌ Error updating {filename}: {e}")
    
    # Summary
    logger.info("=" * 50)
    logger.info("PASSWORD UPDATE SUMMARY")
    logger.info("=" * 50)
    logger.info(f"Total files processed: {total_files}")
    logger.info(f"Successfully updated: {protected_files}")
    logger.info(f"Failed updates: {failed_files}")
    logger.info(f"New password: ClaimNav2025")
    logger.info(f"Print/Copy: Allowed")
    logger.info(f"Watermark: Claim Navigator - Protected Document")
    
    return protected_files, failed_files

if __name__ == "__main__":
    try:
        protected, failed = update_password_protection()
        
        if failed == 0:
            logger.info("🎉 All documents successfully updated with new password!")
        else:
            logger.warning(f"⚠️ {failed} documents failed to update")
            
    except Exception as e:
        logger.error(f"Script failed: {e}")
        sys.exit(1)
