#!/usr/bin/env python3
"""
Upload Protected Documents to Response Center
===========================================

This script uploads the protected PDF documents to Supabase storage
to replace the current documents in the response center claim library.
"""

import os
import sys
import json
import requests
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('upload_protected_documents.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ProtectedDocumentUploader:
    """Handles uploading protected documents to Supabase storage"""
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            logger.error("Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.")
            sys.exit(1)
    
    def upload_file_to_supabase(self, file_path, storage_path):
        """Upload a single file to Supabase storage"""
        try:
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Supabase storage upload endpoint
            upload_url = f"{self.supabase_url}/storage/v1/object/documents/{storage_path}"
            
            headers = {
                'Authorization': f'Bearer {self.supabase_key}',
                'Content-Type': 'application/pdf'
            }
            
            response = requests.post(upload_url, data=file_data, headers=headers)
            
            if response.status_code in [200, 201]:
                logger.info(f"Successfully uploaded: {storage_path}")
                return True
            else:
                logger.error(f"Failed to upload {storage_path}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error uploading {file_path}: {e}")
            return False
    
    def upload_directory(self, local_dir, language_code):
        """Upload all PDF files from a directory"""
        if not os.path.exists(local_dir):
            logger.warning(f"Directory not found: {local_dir}")
            return 0, 0
        
        successful = 0
        failed = 0
        
        # Get all PDF files
        pdf_files = [f for f in os.listdir(local_dir) if f.lower().endswith('.pdf')]
        
        logger.info(f"Found {len(pdf_files)} PDF files in {local_dir}")
        
        for pdf_file in pdf_files:
            local_path = os.path.join(local_dir, pdf_file)
            storage_path = f"{language_code}/{pdf_file}"
            
            if self.upload_file_to_supabase(local_path, storage_path):
                successful += 1
            else:
                failed += 1
        
        return successful, failed
    
    def upload_protected_documents(self):
        """Upload all protected documents to Supabase storage"""
        logger.info("Starting upload of protected documents to response center...")
        
        # Define directories and their language codes
        directories = [
            ("./Document Library - Final English", "en"),
            ("./Document Library - Final Spanish", "es")
        ]
        
        total_successful = 0
        total_failed = 0
        
        for local_dir, lang_code in directories:
            logger.info(f"Uploading {lang_code} documents from {local_dir}")
            successful, failed = self.upload_directory(local_dir, lang_code)
            total_successful += successful
            total_failed += failed
        
        # Summary
        logger.info("=" * 60)
        logger.info("UPLOAD COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Total files uploaded: {total_successful}")
        logger.info(f"Total files failed: {total_failed}")
        logger.info(f"Success rate: {(total_successful/(total_successful+total_failed)*100):.1f}%" if (total_successful+total_failed) > 0 else "0%")
        logger.info("=" * 60)
        
        return total_successful, total_failed

def main():
    """Main function"""
    logger.info("Claim Navigator Protected Documents Upload")
    logger.info("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("./Document Library - Final English"):
        logger.error("Document Library directories not found. Please run this script from the project root.")
        sys.exit(1)
    
    # Initialize uploader
    uploader = ProtectedDocumentUploader()
    
    # Upload protected documents
    successful, failed = uploader.upload_protected_documents()
    
    if failed == 0:
        logger.info("✅ All protected documents uploaded successfully!")
        logger.info("🔒 Protected documents are now live in the response center!")
        logger.info("📝 Users will need password 'Claim Navigator2025' to access documents")
    else:
        logger.warning(f"⚠️ {failed} files failed to upload. Check the log for details.")
    
    return successful, failed

if __name__ == "__main__":
    success, failed = main()
    sys.exit(0 if failed == 0 else 1)




