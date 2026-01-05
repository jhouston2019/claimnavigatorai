#!/usr/bin/env python3
"""
Re-protect Documents with ClaimNav1 Password
===========================================

This script re-protects all documents with the new password ClaimNav1
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
        logging.FileHandler('reprotect_with_claimnav1.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def reprotect_with_claimnav1():
    """Re-protect all documents with ClaimNav1 password"""
    logger.info("Starting re-protection with ClaimNav1 password...")
    
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
                logger.info(f"Re-protecting: {filename}")
                
                # Protect the file with new password (overwrite original)
                success = protector.protect_pdf(file_path, file_path)
                
                if success:
                    protected_files += 1
                    logger.info(f"Successfully protected: {filename}")
                else:
                    failed_files += 1
                    logger.error(f"Failed to protect: {filename}")
                    
            except Exception as e:
                failed_files += 1
                logger.error(f"Error protecting {filename}: {e}")
    
    # Summary
    logger.info("=" * 50)
    logger.info("RE-PROTECTION SUMMARY")
    logger.info("=" * 50)
    logger.info(f"Total files processed: {total_files}")
    logger.info(f"Successfully protected: {protected_files}")
    logger.info(f"Failed protections: {failed_files}")
    logger.info(f"New password: ClaimNav1")
    logger.info(f"Print/Copy: Allowed")
    logger.info(f"Watermark: Claim Navigator - Protected Document")
    
    return protected_files, failed_files

if __name__ == "__main__":
    try:
        protected, failed = reprotect_with_claimnav1()
        
        if failed == 0:
            logger.info("All documents successfully re-protected with ClaimNav1!")
        else:
            logger.warning(f"{failed} documents failed to re-protect")
            
    except Exception as e:
        logger.error(f"Script failed: {e}")
        sys.exit(1)




