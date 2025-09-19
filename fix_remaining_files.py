#!/usr/bin/env python3
"""
Fix Remaining 2 Files Script
===========================

This script handles the 2 files that still have "File has not been decrypted" errors.
These files may be corrupted or have encryption issues.
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
        logging.FileHandler('fix_remaining.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def fix_remaining_files():
    """Fix the 2 remaining files with decryption issues"""
    
    # The 2 files that had "File has not been decrypted" errors
    problem_files = [
        "./Document Library - Final Spanish/Spanish Version - English title/Settlement Negotiation Letter - Spanish Sample Sarah Mitchell.pdf",
        "./Document Library - Final Spanish/Spanish Version - English title/Settlement Negotiation Letter - Spanish Template.pdf"
    ]
    
    logger.info("Fixing remaining 2 files with decryption issues...")
    
    protector = PDFProtector(backup_dir="backup_original")
    successful = 0
    errors = 0
    
    for file_path in problem_files:
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
            
            # Try to read the file first to check if it's accessible
            try:
                with open(file_path, 'rb') as f:
                    # Try to read a small portion to test accessibility
                    test_data = f.read(1024)
                    if len(test_data) == 0:
                        logger.error(f"File appears to be empty: {file_path}")
                        errors += 1
                        continue
                        
            except Exception as e:
                logger.error(f"Cannot read file: {file_path} - {e}")
                errors += 1
                continue
            
            # Try protection with error handling
            try:
                if protector.protect_pdf(file_path, file_path):
                    successful += 1
                    logger.info(f"Successfully protected: {file_path}")
                else:
                    errors += 1
                    # Restore from backup if protection failed
                    shutil.copy2(backup_path, file_path)
                    logger.warning(f"Restored original: {file_path}")
                    
            except Exception as e:
                logger.error(f"Error protecting {file_path}: {e}")
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
    """Main function to fix remaining files"""
    logger.info("Starting fix for remaining 2 files...")
    
    successful, errors = fix_remaining_files()
    
    logger.info("=" * 60)
    logger.info("REMAINING FILES FIX COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Files processed: 2")
    logger.info(f"Successfully protected: {successful}")
    logger.info(f"Errors: {errors}")
    logger.info("=" * 60)
    
    if errors == 0:
        logger.info("✅ All remaining files have been fixed and protected!")
    else:
        logger.warning(f"⚠️ {errors} files still have issues.")
        logger.info("These files may be corrupted or have special encryption.")
        logger.info("You may need to manually check these files.")

if __name__ == "__main__":
    main()

