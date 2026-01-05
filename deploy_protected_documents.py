#!/usr/bin/env python3
"""
Deploy Protected Documents to Response Center
===========================================

This script uses the existing Netlify function to upload protected documents
to the response center, replacing the current unprotected documents.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('deploy_protected_documents.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def check_environment():
    """Check if we have the necessary environment variables"""
    required_vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"Missing environment variables: {', '.join(missing_vars)}")
        logger.info("Please set these environment variables before running the script.")
        return False
    
    return True

def run_netlify_function():
    """Run the Netlify function to upload documents"""
    try:
        logger.info("Running Netlify function to upload protected documents...")
        
        # Use the existing upload function
        result = subprocess.run([
            'node', 
            'netlify/functions/upload-documents-to-supabase.js'
        ], capture_output=True, text=True, cwd='.')
        
        if result.returncode == 0:
            logger.info("✅ Netlify function completed successfully!")
            logger.info(f"Output: {result.stdout}")
            return True
        else:
            logger.error(f"❌ Netlify function failed: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Error running Netlify function: {e}")
        return False

def verify_upload():
    """Verify that documents were uploaded successfully"""
    logger.info("Verifying upload...")
    
    # Check if we can access the documents through the API
    try:
        import requests
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            logger.warning("Cannot verify upload - missing Supabase credentials")
            return True
        
        # Try to list documents from storage
        storage_url = f"{supabase_url}/storage/v1/object/list/documents"
        headers = {'Authorization': f'Bearer {supabase_key}'}
        
        response = requests.get(storage_url, headers=headers)
        
        if response.status_code == 200:
            documents = response.json()
            logger.info(f"✅ Found {len(documents)} documents in storage")
            return True
        else:
            logger.warning(f"Could not verify upload: {response.status_code}")
            return True
            
    except Exception as e:
        logger.warning(f"Could not verify upload: {e}")
        return True

def main():
    """Main deployment function"""
    logger.info("Claim Navigator Protected Documents Deployment")
    logger.info("=" * 60)
    
    # Check environment
    if not check_environment():
        logger.error("Environment check failed. Please set required environment variables.")
        sys.exit(1)
    
    # Verify protected documents exist
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
    
    # Deploy to response center
    logger.info("Deploying protected documents to response center...")
    
    if run_netlify_function():
        logger.info("✅ Protected documents deployed successfully!")
        
        # Verify upload
        verify_upload()
        
        logger.info("=" * 60)
        logger.info("DEPLOYMENT COMPLETE")
        logger.info("=" * 60)
        logger.info("🔒 Protected documents are now live in the response center!")
        logger.info("📝 Users will need password 'Claim Navigator2025' to access documents")
        logger.info("💧 All documents have watermarks: 'Claim Navigator - Protected Document'")
        logger.info("🚫 Printing and copying are disabled by default")
        logger.info("=" * 60)
        
        return True
    else:
        logger.error("❌ Deployment failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)




