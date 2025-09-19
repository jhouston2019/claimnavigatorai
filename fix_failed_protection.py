#!/usr/bin/env python3
"""
Fix Failed PDF Protection Script
================================

This script specifically handles the 14 files that failed during protection:
- Files with special characters in paths
- Files that were in use during protection
- Files in subdirectories with complex names
"""

import os
import sys
import shutil
import logging
from pathlib import Path
import tempfile
import unicodedata

# Import our protection functions
from protect_pdf_library import PDFProtector

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fix_protection.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def sanitize_filename(filename):
    """Remove or replace problematic characters in filenames"""
    # Replace problematic characters
    filename = filename.replace('(', '').replace(')', '')
    filename = filename.replace('[', '').replace(']', '')
    filename = filename.replace('{', '').replace('}', '')
    filename = filename.replace(':', '-')
    filename = filename.replace('?', '')
    filename = filename.replace('*', '')
    filename = filename.replace('<', '')
    filename = filename.replace('>', '')
    filename = filename.replace('|', '-')
    filename = filename.replace('"', "'")
    
    # Normalize unicode characters
    filename = unicodedata.normalize('NFKD', filename)
    
    return filename

def fix_special_character_files():
    """Fix files with special characters in their paths"""
    logger.info("Fixing files with special character issues...")
    
    # Problematic directory
    problem_dir = "./Document Library - Final Spanish/Spanish Version - English title"
    
    if not os.path.exists(problem_dir):
        logger.warning(f"Directory not found: {problem_dir}")
        return []
    
    fixed_files = []
    
    # Get all PDF files in the problematic directory
    for root, dirs, files in os.walk(problem_dir):
        for file in files:
            if file.lower().endswith('.pdf'):
                original_path = os.path.join(root, file)
                
                # Create a sanitized filename
                sanitized_name = sanitize_filename(file)
                sanitized_path = os.path.join(root, sanitized_name)
                
                try:
                    # Rename the file to remove special characters
                    if original_path != sanitized_path:
                        os.rename(original_path, sanitized_path)
                        logger.info(f"Renamed: {file} -> {sanitized_name}")
                        fixed_files.append(sanitized_path)
                    else:
                        fixed_files.append(original_path)
                        
                except Exception as e:
                    logger.error(f"Error renaming {file}: {e}")
    
    return fixed_files

def fix_permission_issues():
    """Fix files that had permission issues"""
    logger.info("Fixing files with permission issues...")
    
    # Files that had permission issues
    problem_files = [
        "./Document Library - Final English/additional-living-expenses-ale-reimbursement-request.pdf"
    ]
    
    fixed_files = []
    
    for file_path in problem_files:
        if os.path.exists(file_path):
            try:
                # Check if file is accessible
                with open(file_path, 'rb') as f:
                    f.read(1)  # Try to read first byte
                
                logger.info(f"File is now accessible: {file_path}")
                fixed_files.append(file_path)
                
            except Exception as e:
                logger.error(f"File still not accessible: {file_path} - {e}")
        else:
            logger.warning(f"File not found: {file_path}")
    
    return fixed_files

def protect_fixed_files(fixed_files):
    """Protect the files that were fixed"""
    if not fixed_files:
        logger.info("No files to protect")
        return
    
    logger.info(f"Protecting {len(fixed_files)} fixed files...")
    
    protector = PDFProtector(backup_dir="backup_original")
    successful = 0
    errors = 0
    
    for file_path in fixed_files:
        try:
            # Create backup
            relative_path = os.path.relpath(file_path, ".")
            backup_path = os.path.join(protector.backup_dir, relative_path)
            
            # Ensure backup directory exists
            os.makedirs(os.path.dirname(backup_path), exist_ok=True)
            
            # Create backup
            shutil.copy2(file_path, backup_path)
            logger.info(f"Backed up: {file_path}")
            
            # Protect the file
            if protector.protect_pdf(file_path, file_path):
                successful += 1
                logger.info(f"Successfully protected: {file_path}")
            else:
                errors += 1
                # Restore from backup if protection failed
                shutil.copy2(backup_path, file_path)
                logger.warning(f"Restored original: {file_path}")
                
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
            errors += 1
    
    logger.info(f"Fixed protection results: {successful} successful, {errors} errors")
    return successful, errors

def main():
    """Main function to fix all failed files"""
    logger.info("Starting fix for failed PDF protection...")
    
    # Step 1: Fix special character files
    special_char_files = fix_special_character_files()
    
    # Step 2: Fix permission issues
    permission_files = fix_permission_issues()
    
    # Step 3: Combine all files to protect
    all_files = special_char_files + permission_files
    
    if all_files:
        logger.info(f"Found {len(all_files)} files to fix and protect")
        
        # Step 4: Protect the fixed files
        successful, errors = protect_fixed_files(all_files)
        
        logger.info("=" * 60)
        logger.info("FIX COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Files processed: {len(all_files)}")
        logger.info(f"Successfully protected: {successful}")
        logger.info(f"Errors: {errors}")
        logger.info("=" * 60)
        
        if errors == 0:
            logger.info("✅ All failed files have been fixed and protected!")
        else:
            logger.warning(f"⚠️ {errors} files still have issues. Check the log for details.")
    else:
        logger.info("No files found to fix")

if __name__ == "__main__":
    main()

