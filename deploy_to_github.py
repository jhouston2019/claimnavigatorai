#!/usr/bin/env python3
"""
Deploy Protected Documents to GitHub Repository
==============================================

This script helps you deploy the protected documents to GitHub
to replace the originals in the repository.
"""

import os
import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('deploy_to_github.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def check_protected_documents():
    """Check if protected documents are ready"""
    logger.info("Checking protected documents...")
    
    english_dir = "./Document Library - Final English"
    spanish_dir = "./Document Library - Final Spanish"
    
    if not os.path.exists(english_dir):
        logger.error(f"English directory not found: {english_dir}")
        return False
    
    if not os.path.exists(spanish_dir):
        logger.error(f"Spanish directory not found: {spanish_dir}")
        return False
    
    # Count PDF files
    english_files = [f for f in os.listdir(english_dir) if f.endswith('.pdf')]
    spanish_files = [f for f in os.listdir(spanish_dir) if f.endswith('.pdf')]
    
    logger.info(f"English documents: {len(english_files)} files")
    logger.info(f"Spanish documents: {len(spanish_files)} files")
    logger.info(f"Total protected documents: {len(english_files) + len(spanish_files)} files")
    
    return True

def create_github_deployment_instructions():
    """Create GitHub deployment instructions"""
    instructions = """
# Deploy Protected Documents to GitHub Repository

## Current Status
✅ Protected documents are ready for GitHub deployment
📁 English: 122 protected PDFs
📁 Spanish: 125 protected PDFs
🔒 Security: Password protection, watermarks, restrictions

## The Challenge
The documents are stored in the GitHub repository at:
- https://github.com/jhouston2019/Claim Navigator
- They are served from: https://Claim Navigator.com/docs/

## Deployment Strategy

### Option 1: Manual GitHub Upload (Recommended)
1. Go to your GitHub repository: https://github.com/jhouston2019/Claim Navigator
2. Navigate to the docs/ directory (or wherever the original documents are stored)
3. For each protected document:
   - Click on the file
   - Click "Edit" (pencil icon)
   - Upload the protected version
   - Commit the changes
4. This will trigger automatic Netlify deployment

### Option 2: GitHub CLI (If you have it installed)
1. Install GitHub CLI: https://cli.github.com/
2. Login: gh auth login
3. Clone the repository locally
4. Copy protected documents to the docs directory
5. Commit and push: git add . && git commit -m "Deploy protected documents" && git push

### Option 3: Git Commands (If you have Git access)
1. Clone the repository: git clone https://github.com/jhouston2019/Claim Navigator.git
2. Copy protected documents to the docs directory
3. Commit and push: git add . && git commit -m "Deploy protected documents" && git push

## File Structure for GitHub
```
docs/
├── en/          # English documents (122 files)
└── es/          # Spanish documents (125 files)
```

## Security Features Applied
- Password: Claim Navigator2025
- Watermark: "Claim Navigator - Protected Document"
- Restrictions: No printing, copying, or modification
- Encryption: 128-bit AES

## Verification
After deployment, verify that:
1. Documents are accessible at https://Claim Navigator.com/docs/
2. Documents require password to open
3. Watermark appears at bottom of each page
4. Printing and copying are disabled

## Important Notes
- This will replace ALL original documents with protected versions
- The original documents are safely backed up in backup_original/
- Netlify will automatically deploy the changes
- The process may take several minutes to complete

## Next Steps
1. Choose your preferred deployment method
2. Upload the protected documents to GitHub
3. Wait for Netlify to automatically deploy
4. Test access in the response center
5. Verify security features are working
"""
    
    with open("GITHUB_DEPLOYMENT_INSTRUCTIONS.txt", "w", encoding="utf-8") as f:
        f.write(instructions)
    
    logger.info("GitHub deployment instructions saved to GITHUB_DEPLOYMENT_INSTRUCTIONS.txt")

def main():
    """Main function"""
    logger.info("Claim Navigator Protected Documents - GitHub Deployment")
    logger.info("=" * 70)
    
    # Check protected documents
    if not check_protected_documents():
        logger.error("Protected documents check failed!")
        sys.exit(1)
    
    # Create deployment instructions
    create_github_deployment_instructions()
    
    # Final summary
    logger.info("=" * 70)
    logger.info("GITHUB DEPLOYMENT READY")
    logger.info("=" * 70)
    logger.info("✅ Protected documents are ready for GitHub deployment")
    logger.info("🌐 Target: https://github.com/jhouston2019/Claim Navigator")
    logger.info("📁 Documents location: ./Document Library - Final English/ and ./Document Library - Final Spanish/")
    logger.info("🔒 Security features: Password protection, watermarks, restrictions")
    logger.info("📋 Instructions: GITHUB_DEPLOYMENT_INSTRUCTIONS.txt")
    logger.info("⚠️  WARNING: This will replace ALL original documents!")
    logger.info("=" * 70)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)



