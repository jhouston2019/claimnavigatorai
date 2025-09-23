#!/usr/bin/env python3
"""
Protect Specific Files Script
============================

This script attempts to protect the 2 specific problematic files using a different approach.
"""

import os
import sys
import shutil
import logging
from pathlib import Path

# Import our protection functions
from protect_pdf_library import PDFProtector

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('protect_specific.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def protect_specific_files():
    """Protect the 2 specific problematic files"""
    
    files_to_protect = [
        "./Document Library - Final Spanish/Spanish Version - English title/Settlement Negotiation Letter - Spanish Sample Sarah Mitchell.pdf",
        "./Document Library - Final Spanish/Spanish Version - English title/Settlement Negotiation Letter - Spanish Template.pdf"
    ]
    
    logger.info("Attempting to protect the 2 specific problematic files...")
    
    protector = PDFProtector(backup_dir="backup_original")
    successful = 0
    errors = 0
    
    for file_path in files_to_protect:
        if not os.path.exists(file_path):
            logger.warning(f"File not found: {file_path}")
            continue
            
        try:
            logger.info(f"Processing: {file_path}")
            
            # Create backup
            relative_path = os.path.relpath(file_path, ".")
            backup_path = os.path.join(protector.backup_dir, relative_path)
            
            # Ensure backup directory exists
            os.makedirs(os.path.dirname(backup_path), exist_ok=True)
            
            # Create backup
            shutil.copy2(file_path, backup_path)
            logger.info(f"Backed up: {file_path}")
            
            # Try a different approach - create a temporary file first
            temp_file = file_path + ".temp"
            
            try:
                # Try to protect to a temporary file first
                if protector.protect_pdf(file_path, temp_file):
                    # If successful, replace the original
                    shutil.move(temp_file, file_path)
                    successful += 1
                    logger.info(f"Successfully protected: {file_path}")
                else:
                    # Clean up temp file
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                    errors += 1
                    # Restore from backup
                    shutil.copy2(backup_path, file_path)
                    logger.warning(f"Restored original: {file_path}")
                    
            except Exception as e:
                logger.error(f"Error protecting {file_path}: {e}")
                # Clean up temp file
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                errors += 1
                # Restore from backup
                try:
                    shutil.copy2(backup_path, file_path)
                    logger.info(f"Restored original: {file_path}")
                except:
                    logger.error(f"Could not restore original: {file_path}")
                
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
            errors += 1
    
    return successful, errors

def main():
    """Main function to protect specific files"""
    logger.info("Starting protection for specific problematic files...")
    
    successful, errors = protect_specific_files()
    
    logger.info("=" * 60)
    logger.info("SPECIFIC FILES PROTECTION COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Files processed: 2")
    logger.info(f"Successfully protected: {successful}")
    logger.info(f"Errors: {errors}")
    logger.info("=" * 60)
    
    if errors == 0:
        logger.info("✅ Both specific files have been protected!")
    else:
        logger.warning(f"⚠️ {errors} files still have issues.")
        logger.info("These files may have special encryption or be corrupted.")
        logger.info("The files exist and are readable, but cannot be processed by PyPDF2.")

if __name__ == "__main__":
    main()




