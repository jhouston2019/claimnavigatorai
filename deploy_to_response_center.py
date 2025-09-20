#!/usr/bin/env python3
"""
Deploy Protected Documents to Response Center Claim Library
=========================================================

This script deploys the protected documents to the response center claim library,
replacing the current unprotected documents with password-protected versions.
"""

import os
import sys
import json
import requests
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('deploy_to_response_center.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ResponseCenterDeployer:
    """Deploys protected documents to the response center claim library"""
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            logger.error("Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.")
            sys.exit(1)
    
    def upload_file_to_storage(self, file_path, storage_path):
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
        """Upload all PDF files from a directory to Supabase storage"""
        if not os.path.exists(local_dir):
            logger.warning(f"Directory not found: {local_dir}")
            return 0, 0
        
        successful = 0
        failed = 0
        
        # Get all PDF files
        pdf_files = [f for f in os.listdir(local_dir) if f.lower().endswith('.pdf')]
        
        logger.info(f"Uploading {len(pdf_files)} {language_code} documents...")
        
        for pdf_file in pdf_files:
            local_path = os.path.join(local_dir, pdf_file)
            storage_path = f"{language_code}/{pdf_file}"
            
            if self.upload_file_to_storage(local_path, storage_path):
                successful += 1
            else:
                failed += 1
        
        return successful, failed
    
    def deploy_protected_documents(self):
        """Deploy all protected documents to the response center"""
        logger.info("Starting deployment of protected documents to response center...")
        
        # Define directories and their language codes
        directories = [
            ("./Document Library - Final English", "en"),
            ("./Document Library - Final Spanish", "es")
        ]
        
        total_successful = 0
        total_failed = 0
        
        for local_dir, lang_code in directories:
            logger.info(f"Deploying {lang_code} documents from {local_dir}")
            successful, failed = self.upload_directory(local_dir, lang_code)
            total_successful += successful
            total_failed += failed
        
        # Summary
        logger.info("=" * 60)
        logger.info("DEPLOYMENT COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Total files uploaded: {total_successful}")
        logger.info(f"Total files failed: {total_failed}")
        logger.info(f"Success rate: {(total_successful/(total_successful+total_failed)*100):.1f}%" if (total_successful+total_failed) > 0 else "0%")
        logger.info("=" * 60)
        
        return total_successful, total_failed

def main():
    """Main deployment function"""
    logger.info("ClaimNavigatorAI Protected Documents - Response Center Deployment")
    logger.info("=" * 70)
    
    # Check if protected documents exist
    english_dir = "./Document Library - Final English"
    spanish_dir = "./Document Library - Final Spanish"
    
    if not os.path.exists(english_dir) or not os.path.exists(spanish_dir):
        logger.error("Protected document directories not found!")
        logger.error("Please run the protection script first.")
        sys.exit(1)
    
    # Count protected documents
    english_files = len([f for f in os.listdir(english_dir) if f.endswith('.pdf')])
    spanish_files = len([f for f in os.listdir(spanish_dir) if f.endswith('.pdf')])
    
    logger.info(f"Found {english_files} English protected documents")
    logger.info(f"Found {spanish_files} Spanish protected documents")
    logger.info(f"Total: {english_files + spanish_files} protected documents")
    
    # Initialize deployer
    deployer = ResponseCenterDeployer()
    
    # Deploy protected documents
    successful, failed = deployer.deploy_protected_documents()
    
    if failed == 0:
        logger.info("✅ All protected documents deployed successfully!")
        logger.info("🔒 Protected documents are now live in the response center!")
        logger.info("📝 Users will need password 'ClaimNavigatorAI2025' to access documents")
        logger.info("💧 All documents have watermarks for identification")
        logger.info("🚫 Printing and copying are disabled by default")
    else:
        logger.warning(f"⚠️ {failed} files failed to upload. Check the log for details.")
    
    return successful, failed

if __name__ == "__main__":
    success, failed = main()
    sys.exit(0 if failed == 0 else 1)



