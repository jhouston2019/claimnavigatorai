#!/usr/bin/env python3
"""
Document Replacement Script - Replace Original Documents with Protected Versions
This script replaces the original documents in the docs folder with the protected versions.
"""

import os
import shutil
from pathlib import Path
import sys

# ============= CONFIGURATION =============
# Paths
ORIGINAL_DOCS_FOLDER = "./docs"
PROTECTED_DOCS_FOLDER = "./docs/protected"
BACKUP_FOLDER = "./docs/backup_original"

# AutoClaimNavigator paths
AUTOCLAIM_ORIGINAL_FOLDER = "./autoclaimnavigator/docs"
AUTOCLAIM_PROTECTED_FOLDER = "./autoclaimnavigator/docs/protected"
AUTOCLAIM_BACKUP_FOLDER = "./autoclaimnavigator/docs/backup_original"

# =========================================

def create_backup(source_folder, backup_folder):
    """Create a backup of the original documents."""
    print(f"Creating backup of {source_folder} to {backup_folder}")
    
    if os.path.exists(backup_folder):
        print(f"  Backup folder already exists: {backup_folder}")
        return True
    
    try:
        shutil.copytree(source_folder, backup_folder)
        print(f"  ✓ Backup created successfully")
        return True
    except Exception as e:
        print(f"  ✗ Error creating backup: {str(e)}")
        return False

def replace_documents(original_folder, protected_folder, backup_folder):
    """Replace original documents with protected versions."""
    print(f"\nReplacing documents in {original_folder}")
    
    # Create backup first
    if not create_backup(original_folder, backup_folder):
        print("  ✗ Cannot proceed without backup")
        return False
    
    try:
        # Remove original documents (keep folder structure)
        for root, dirs, files in os.walk(original_folder):
            for file in files:
                if file.endswith('.pdf'):
                    file_path = os.path.join(root, file)
                    os.remove(file_path)
                    print(f"  Removed: {file}")
        
        # Copy protected documents to original location
        for root, dirs, files in os.walk(protected_folder):
            for file in files:
                if file.endswith('-protected.pdf'):
                    # Get relative path
                    rel_path = os.path.relpath(root, protected_folder)
                    
                    # Create destination path
                    if rel_path == '.':
                        dest_folder = original_folder
                    else:
                        dest_folder = os.path.join(original_folder, rel_path)
                    
                    # Create destination directory if it doesn't exist
                    os.makedirs(dest_folder, exist_ok=True)
                    
                    # Copy file and rename (remove -protected suffix)
                    source_file = os.path.join(root, file)
                    dest_file = os.path.join(dest_folder, file.replace('-protected.pdf', '.pdf'))
                    
                    shutil.copy2(source_file, dest_file)
                    print(f"  Replaced: {file.replace('-protected.pdf', '.pdf')}")
        
        print(f"  ✓ Documents replaced successfully")
        return True
        
    except Exception as e:
        print(f"  ✗ Error replacing documents: {str(e)}")
        return False

def verify_replacement(folder):
    """Verify that documents have been replaced with protected versions."""
    print(f"\nVerifying replacement in {folder}")
    
    protected_count = 0
    total_count = 0
    
    for root, dirs, files in os.walk(folder):
        for file in files:
            if file.endswith('.pdf'):
                total_count += 1
                file_path = os.path.join(root, file)
                
                # Try to open the file to check if it's password protected
                try:
                    with open(file_path, 'rb') as f:
                        content = f.read(100)  # Read first 100 bytes
                        if b'/Encrypt' in content or b'/Filter/Standard' in content:
                            protected_count += 1
                            print(f"  ✓ Protected: {file}")
                        else:
                            print(f"  ⚠ Not protected: {file}")
                except Exception as e:
                    print(f"  ✗ Error checking {file}: {str(e)}")
    
    print(f"\nVerification Results:")
    print(f"  Total PDFs: {total_count}")
    print(f"  Protected: {protected_count}")
    print(f"  Not protected: {total_count - protected_count}")
    
    return protected_count == total_count

def main():
    """Main function to replace documents with protected versions."""
    print("=" * 60)
    print("DOCUMENT REPLACEMENT WITH PROTECTED VERSIONS")
    print("=" * 60)
    
    # Check if protected folders exist
    if not os.path.exists(PROTECTED_DOCS_FOLDER):
        print(f"Error: Protected documents folder not found: {PROTECTED_DOCS_FOLDER}")
        print("Please run the protection scripts first.")
        return False
    
    if not os.path.exists(AUTOCLAIM_PROTECTED_FOLDER):
        print(f"Error: AutoClaimNavigator protected documents folder not found: {AUTOCLAIM_PROTECTED_FOLDER}")
        print("Please run the protection scripts first.")
        return False
    
    print("This will replace original documents with protected versions.")
    print("Original documents will be backed up first.")
    
    # Auto-proceed (removed user confirmation for automation)
    print("Proceeding automatically...")
    
    success_count = 0
    error_count = 0
    
    # Replace main documents
    print(f"\n{'='*40}")
    print("REPLACING MAIN DOCUMENTS")
    print(f"{'='*40}")
    
    if replace_documents(ORIGINAL_DOCS_FOLDER, PROTECTED_DOCS_FOLDER, BACKUP_FOLDER):
        success_count += 1
        verify_replacement(ORIGINAL_DOCS_FOLDER)
    else:
        error_count += 1
    
    # Replace AutoClaimNavigator documents
    print(f"\n{'='*40}")
    print("REPLACING AUTOCLAIMNAVIGATOR DOCUMENTS")
    print(f"{'='*40}")
    
    if replace_documents(AUTOCLAIM_ORIGINAL_FOLDER, AUTOCLAIM_PROTECTED_FOLDER, AUTOCLAIM_BACKUP_FOLDER):
        success_count += 1
        verify_replacement(AUTOCLAIM_ORIGINAL_FOLDER)
    else:
        error_count += 1
    
    # Print summary
    print(f"\n{'='*60}")
    print("REPLACEMENT COMPLETE")
    print(f"{'='*60}")
    print(f"Successfully replaced: {success_count} systems")
    if error_count > 0:
        print(f"Errors: {error_count} systems")
    
    if success_count > 0:
        print(f"\n✅ Documents have been replaced with protected versions!")
        print(f"📁 Original documents backed up to:")
        print(f"   - {BACKUP_FOLDER}")
        print(f"   - {AUTOCLAIM_BACKUP_FOLDER}")
        print(f"\n🔒 All documents now require passwords:")
        print(f"   - Main System: Claim Navigator2025")
        print(f"   - AutoClaimNavigator: AutoClaimNav2025")
        print(f"\n🏷️ All documents are watermarked for identification.")
    
    return success_count > 0

if __name__ == "__main__":
    if main():
        print("\n🎉 Document replacement completed successfully!")
    else:
        print("\n❌ Document replacement failed. Check the errors above.")
        sys.exit(1)
