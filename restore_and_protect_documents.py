#!/usr/bin/env python3
"""
Restore and Protect Documents Script
This script restores original documents from the autoclaimnavigator folder and then protects them.
"""

import os
import shutil
from pathlib import Path
import sys

# ============= CONFIGURATION =============
# Source paths (where original documents are)
SOURCE_DOCS_FOLDER = "./autoclaimnavigator/docs"  # Use autoclaimnavigator as source
TARGET_DOCS_FOLDER = "./docs"  # Main docs folder
TARGET_PROTECTED_FOLDER = "./docs/protected"  # Where to save protected versions

# =========================================

def copy_documents(source_folder, target_folder):
    """Copy documents from source to target folder."""
    print(f"Copying documents from {source_folder} to {target_folder}")
    
    try:
        # Create target directory if it doesn't exist
        os.makedirs(target_folder, exist_ok=True)
        
        # Copy all PDF files
        for root, dirs, files in os.walk(source_folder):
            for file in files:
                if file.endswith('.pdf'):
                    # Get relative path
                    rel_path = os.path.relpath(root, source_folder)
                    
                    # Create destination path
                    if rel_path == '.':
                        dest_folder = target_folder
                    else:
                        dest_folder = os.path.join(target_folder, rel_path)
                    
                    # Create destination directory if it doesn't exist
                    os.makedirs(dest_folder, exist_ok=True)
                    
                    # Copy file
                    source_file = os.path.join(root, file)
                    dest_file = os.path.join(dest_folder, file)
                    
                    shutil.copy2(source_file, dest_file)
                    print(f"  Copied: {file}")
        
        print(f"  ✓ Documents copied successfully")
        return True
        
    except Exception as e:
        print(f"  ✗ Error copying documents: {str(e)}")
        return False

def main():
    """Main function to restore and protect documents."""
    print("=" * 60)
    print("RESTORE AND PROTECT DOCUMENTS")
    print("=" * 60)
    
    # Check if source folder exists
    if not os.path.exists(SOURCE_DOCS_FOLDER):
        print(f"Error: Source documents folder not found: {SOURCE_DOCS_FOLDER}")
        return False
    
    # Step 1: Copy documents from autoclaimnavigator to main docs folder
    print(f"\n{'='*40}")
    print("STEP 1: RESTORING DOCUMENTS")
    print(f"{'='*40}")
    
    if not copy_documents(SOURCE_DOCS_FOLDER, TARGET_DOCS_FOLDER):
        print("Failed to restore documents")
        return False
    
    # Step 2: Run protection script
    print(f"\n{'='*40}")
    print("STEP 2: PROTECTING DOCUMENTS")
    print(f"{'='*40}")
    
    print("Running protection script...")
    import subprocess
    result = subprocess.run([sys.executable, "protect_documents.py"], capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✓ Protection completed successfully")
        print(result.stdout)
    else:
        print("✗ Protection failed")
        print(result.stderr)
        return False
    
    # Step 3: Replace original documents with protected versions
    print(f"\n{'='*40}")
    print("STEP 3: REPLACING WITH PROTECTED VERSIONS")
    print(f"{'='*40}")
    
    try:
        # Remove original PDFs from main docs folder
        for root, dirs, files in os.walk(TARGET_DOCS_FOLDER):
            for file in files:
                if file.endswith('.pdf') and not file.endswith('-protected.pdf'):
                    file_path = os.path.join(root, file)
                    os.remove(file_path)
                    print(f"  Removed: {file}")
        
        # Copy protected documents back to main docs folder
        for root, dirs, files in os.walk(TARGET_PROTECTED_FOLDER):
            for file in files:
                if file.endswith('-protected.pdf'):
                    # Get relative path
                    rel_path = os.path.relpath(root, TARGET_PROTECTED_FOLDER)
                    
                    # Create destination path
                    if rel_path == '.':
                        dest_folder = TARGET_DOCS_FOLDER
                    else:
                        dest_folder = os.path.join(TARGET_DOCS_FOLDER, rel_path)
                    
                    # Create destination directory if it doesn't exist
                    os.makedirs(dest_folder, exist_ok=True)
                    
                    # Copy file and rename (remove -protected suffix)
                    source_file = os.path.join(root, file)
                    dest_file = os.path.join(dest_folder, file.replace('-protected.pdf', '.pdf'))
                    
                    shutil.copy2(source_file, dest_file)
                    print(f"  Replaced: {file.replace('-protected.pdf', '.pdf')}")
        
        print(f"  ✓ Documents replaced with protected versions")
        
    except Exception as e:
        print(f"  ✗ Error replacing documents: {str(e)}")
        return False
    
    print(f"\n{'='*60}")
    print("RESTORE AND PROTECT COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Documents have been restored and protected!")
    print(f"🔒 All documents now require password: Claim Navigator2025")
    print(f"🏷️ All documents are watermarked for identification.")
    
    return True

if __name__ == "__main__":
    if main():
        print("\n🎉 Document restoration and protection completed successfully!")
    else:
        print("\n❌ Document restoration and protection failed. Check the errors above.")
        sys.exit(1)

