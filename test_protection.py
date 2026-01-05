#!/usr/bin/env python3
"""
Test script for Claim Navigator PDF Protection System
Tests the protection functionality on a sample document
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from protect_pdf_library import PDFProtector
    from PyPDF2 import PdfReader
    import logging
except ImportError as e:
    print(f"Error: {e}")
    print("Please install dependencies first: pip install -r requirements.txt")
    sys.exit(1)

def create_test_pdf():
    """Create a simple test PDF for testing"""
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        test_file = "test_document.pdf"
        c = canvas.Canvas(test_file, pagesize=letter)
        c.drawString(100, 750, "Claim Navigator Test Document")
        c.drawString(100, 700, "This is a test document for PDF protection.")
        c.drawString(100, 650, "Testing password protection and watermarking.")
        c.showPage()
        c.save()
        
        print(f"✅ Created test PDF: {test_file}")
        return test_file
        
    except Exception as e:
        print(f"❌ Error creating test PDF: {e}")
        return None

def test_pdf_protection():
    """Test the PDF protection functionality"""
    print("=" * 60)
    print("Claim Navigator PDF Protection Test")
    print("=" * 60)
    
    # Create test PDF
    test_file = create_test_pdf()
    if not test_file:
        return False
    
    try:
        # Create test directory structure
        test_dir = "test_protection"
        os.makedirs(test_dir, exist_ok=True)
        
        # Copy test file to test directory
        test_path = os.path.join(test_dir, test_file)
        shutil.copy2(test_file, test_path)
        
        # Initialize protector
        protector = PDFProtector(backup_dir="test_backup")
        
        # Test protection
        protected_file = "test_protected.pdf"
        print(f"🔒 Testing PDF protection...")
        
        success = protector.protect_pdf(test_path, protected_file)
        
        if success:
            print("✅ PDF protection successful!")
            
            # Test password protection
            print("🔐 Testing password protection...")
            try:
                # Try to read without password (should fail)
                with open(protected_file, 'rb') as file:
                    reader = PdfReader(file)
                    if reader.is_encrypted:
                        print("✅ PDF is encrypted")
                        
                        # Try with correct password
                        if reader.decrypt("Claim Navigator2025"):
                            print("✅ Password protection working correctly")
                            
                            # Check watermark
                            print("💧 Checking watermark...")
                            page = reader.pages[0]
                            if "Claim Navigator - Protected Document" in str(page):
                                print("✅ Watermark applied successfully")
                            else:
                                print("⚠️  Watermark not detected in text extraction")
                            
                        else:
                            print("❌ Password decryption failed")
                            return False
                    else:
                        print("❌ PDF is not encrypted")
                        return False
                        
            except Exception as e:
                print(f"❌ Error testing protected PDF: {e}")
                return False
        else:
            print("❌ PDF protection failed")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    
    finally:
        # Cleanup
        try:
            if os.path.exists(test_file):
                os.remove(test_file)
            if os.path.exists(protected_file):
                os.remove(protected_file)
            if os.path.exists(test_dir):
                shutil.rmtree(test_dir)
            if os.path.exists("test_backup"):
                shutil.rmtree("test_backup")
            print("🧹 Cleanup completed")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")
    
    return True

def test_dry_run():
    """Test the dry run functionality"""
    print("\n" + "=" * 60)
    print("Testing Dry Run Mode")
    print("=" * 60)
    
    try:
        # This would normally be called with --dry-run flag
        # For testing, we'll simulate the directory scanning
        from protect_pdf_library import DOCUMENT_DIRS
        
        total_files = 0
        for dir_path in DOCUMENT_DIRS:
            if os.path.exists(dir_path):
                for root, dirs, files in os.walk(dir_path):
                    for file in files:
                        if file.lower().endswith('.pdf'):
                            total_files += 1
        
        print(f"📊 Found {total_files} PDF files across all directories")
        
        for dir_path in DOCUMENT_DIRS:
            if os.path.exists(dir_path):
                count = 0
                for root, dirs, files in os.walk(dir_path):
                    for file in files:
                        if file.lower().endswith('.pdf'):
                            count += 1
                print(f"  📁 {dir_path}: {count} PDF files")
        
        return True
        
    except Exception as e:
        print(f"❌ Dry run test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Claim Navigator PDF Protection Tests")
    
    # Test 1: PDF Protection
    test1_success = test_pdf_protection()
    
    # Test 2: Dry Run
    test2_success = test_dry_run()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"PDF Protection Test: {'✅ PASSED' if test1_success else '❌ FAILED'}")
    print(f"Dry Run Test: {'✅ PASSED' if test2_success else '❌ FAILED'}")
    
    if test1_success and test2_success:
        print("\n🎉 All tests passed! The protection system is ready to use.")
        print("\nNext steps:")
        print("1. Run: python protect_pdf_library.py --dry-run")
        print("2. If everything looks good, run: python protect_pdf_library.py")
        return True
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

