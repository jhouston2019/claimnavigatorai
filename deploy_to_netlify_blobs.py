#!/usr/bin/env python3
"""
Deploy Protected Documents to Netlify Blobs
==========================================

This script uploads the protected documents to Netlify Blobs storage,
which is the actual storage system used by the response center.
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
        logging.FileHandler('deploy_to_netlify_blobs.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class NetlifyBlobsDeployer:
    """Deploys protected documents to Netlify Blobs storage"""
    
    def __init__(self):
        self.netlify_site_id = os.getenv('NETLIFY_SITE_ID')
        self.netlify_access_token = os.getenv('NETLIFY_ACCESS_TOKEN')
        
        if not self.netlify_site_id or not self.netlify_access_token:
            logger.error("Netlify credentials not found. Please set NETLIFY_SITE_ID and NETLIFY_ACCESS_TOKEN environment variables.")
            logger.info("You can get these from your Netlify dashboard.")
            sys.exit(1)
    
    def upload_file_to_blobs(self, file_path, blob_name):
        """Upload a single file to Netlify Blobs"""
        try:
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Netlify Blobs API endpoint
            upload_url = f"https://api.netlify.com/api/v1/sites/{self.netlify_site_id}/blobs"
            
            headers = {
                'Authorization': f'Bearer {self.netlify_access_token}',
                'Content-Type': 'application/pdf'
            }
            
            # Upload to Netlify Blobs
            response = requests.post(upload_url, data=file_data, headers=headers)
            
            if response.status_code in [200, 201]:
                logger.info(f"Successfully uploaded: {blob_name}")
                return True
            else:
                logger.error(f"Failed to upload {blob_name}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error uploading {file_path}: {e}")
            return False
    
    def upload_directory(self, local_dir, language_code):
        """Upload all PDF files from a directory to Netlify Blobs"""
        if not os.path.exists(local_dir):
            logger.warning(f"Directory not found: {local_dir}")
            return 0, 0
        
        successful = 0
        failed = 0
        
        # Get all PDF files
        pdf_files = [f for f in os.listdir(local_dir) if f.lower().endswith('.pdf')]
        
        logger.info(f"Uploading {len(pdf_files)} {language_code} documents to Netlify Blobs...")
        
        for pdf_file in pdf_files:
            local_path = os.path.join(local_dir, pdf_file)
            blob_name = f"{language_code}/{pdf_file}"
            
            if self.upload_file_to_blobs(local_path, blob_name):
                successful += 1
            else:
                failed += 1
        
        return successful, failed
    
    def deploy_protected_documents(self):
        """Deploy all protected documents to Netlify Blobs"""
        logger.info("Starting deployment of protected documents to Netlify Blobs...")
        
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
    logger.info("Claim Navigator Protected Documents - Netlify Blobs Deployment")
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
    deployer = NetlifyBlobsDeployer()
    
    # Deploy protected documents
    successful, failed = deployer.deploy_protected_documents()
    
    if failed == 0:
        logger.info("✅ All protected documents deployed successfully!")
        logger.info("🔒 Protected documents are now live in the response center!")
        logger.info("📝 Users will need password 'Claim Navigator2025' to access documents")
        logger.info("💧 All documents have watermarks for identification")
        logger.info("🚫 Printing and copying are disabled by default")
    else:
        logger.warning(f"⚠️ {failed} files failed to upload. Check the log for details.")
    
    return successful, failed

if __name__ == "__main__":
    success, failed = main()
    sys.exit(0 if failed == 0 else 1)




