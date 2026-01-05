#!/usr/bin/env python3
"""
Protect Documents with Print and Copy Allowed
============================================

This script protects all documents with password protection and watermarks,
but allows printing and copying for user convenience.
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
        logging.FileHandler('protect_documents_print_copy.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def protect_documents():
    """Protect all documents with print/copy allowed"""
    logger.info("Starting protection of documents with print/copy allowed...")
    
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
        
        logger.info(f"Protecting {language} documents in {directory}")
        
        # Get all PDF files
        pdf_files = [f for f in os.listdir(directory) if f.endswith('.pdf')]
        logger.info(f"Found {len(pdf_files)} {language} documents to protect")
        
        for pdf_file in pdf_files:
            input_path = os.path.join(directory, pdf_file)
            output_path = os.path.join(directory, f"temp_{pdf_file}")
            
            try:
                logger.info(f"Protecting: {pdf_file}")
                
                # Protect with print/copy allowed
                success = protector.protect_pdf(input_path, output_path)
                
                if success:
                    # Replace original with protected version
                    os.replace(output_path, input_path)
                    total_successful += 1
                    logger.info(f"Successfully protected: {pdf_file}")
                else:
                    total_failed += 1
                    logger.error(f"Failed to protect: {pdf_file}")
                    # Clean up temp file if it exists
                    if os.path.exists(output_path):
                        os.remove(output_path)
                
                total_processed += 1
                
            except Exception as e:
                total_failed += 1
                logger.error(f"Error protecting {pdf_file}: {e}")
                # Clean up temp file if it exists
                if os.path.exists(output_path):
                    os.remove(output_path)
    
    # Summary
    logger.info("=" * 60)
    logger.info("PROTECTION COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Total documents processed: {total_processed}")
    logger.info(f"Successfully protected: {total_successful}")
    logger.info(f"Failed to protect: {total_failed}")
    logger.info(f"Success rate: {(total_successful/total_processed*100):.1f}%" if total_processed > 0 else "0%")
    logger.info("=" * 60)
    logger.info("Security settings applied:")
    logger.info("   Password protection: Claim Navigator2025")
    logger.info("   Watermark: Claim Navigator - Protected Document")
    logger.info("   Allow printing: YES")
    logger.info("   Allow copying: YES")
    logger.info("   Disable modification: YES")
    logger.info("=" * 60)
    
    return total_successful, total_failed

def main():
    """Main function"""
    logger.info("Claim Navigator Document Protection - Print/Copy Allowed")
    logger.info("=" * 70)
    logger.info("Protecting documents with print and copy permissions enabled")
    logger.info("=" * 70)
    
    # Protect documents
    successful, failed = protect_documents()
    
    if failed == 0:
        logger.info("All documents successfully protected!")
        logger.info("Next step: Deploy updated documents to GitHub")
    else:
        logger.warning(f"{failed} documents failed to protect")
    
    return successful, failed

if __name__ == "__main__":
    success, failed = main()
    sys.exit(0 if failed == 0 else 1)




