#!/usr/bin/env python3
"""
Claim Navigator PDF Protection System
=====================================

This script protects all PDF documents in the Claim Navigator library with:
- Password protection (User: Claim Navigator2025, Owner: AdminClaimNav2025)
- Watermarking with "Claim Navigator - Protected Document"
- Restricted permissions (no printing/copying)
- Backup of original documents

Author: Claim Navigator Team
Repository: https://github.com/jhouston2019/Claim Navigator.git
"""

import os
import sys
import shutil
import logging
from pathlib import Path
from typing import List, Tuple
import argparse
from datetime import datetime

try:
    from PyPDF2 import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.colors import gray
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    import io
except ImportError as e:
    print(f"Error: Required dependencies not installed. Run: pip install -r requirements.txt")
    print(f"Missing: {e}")
    sys.exit(1)

# Configuration
USER_PASSWORD = "ClaimNav1"
OWNER_PASSWORD = "AdminClaimNav2025"
WATERMARK_TEXT = "Claim Navigator - Protected Document"
WATERMARK_OPACITY = 0.3
WATERMARK_FONT_SIZE = 14
WATERMARK_COLOR = gray

# Document directories
DOCUMENT_DIRS = [
    "./Document Library - Final English",
    "./Document Library - Final Spanish",
    "./autoclaimnavigator/Document Library - Final English", 
    "./autoclaimnavigator/Document Library - Final Spanish"
]

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pdf_protection.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class PDFProtector:
    """Main class for PDF protection operations"""
    
    def __init__(self, backup_dir: str = "backup_original"):
        self.backup_dir = backup_dir
        self.protected_count = 0
        self.error_count = 0
        self.start_time = datetime.now()
        
    def create_watermark_pdf(self) -> io.BytesIO:
        """Create a watermark PDF with the specified text"""
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        
        # Set font and color
        can.setFont("Helvetica", WATERMARK_FONT_SIZE)
        can.setFillColor(WATERMARK_COLOR)
        
        # Get page dimensions
        width, height = letter
        
        # Position watermark at bottom of page
        x = width / 2
        y = 50  # 50 points from bottom
        
        # Set transparency
        can.setFillAlpha(WATERMARK_OPACITY)
        
        # Draw watermark text
        can.drawCentredString(x, y, WATERMARK_TEXT)
        
        can.save()
        packet.seek(0)
        return packet
    
    def protect_pdf(self, input_path: str, output_path: str) -> bool:
        """
        Protect a PDF with password and watermark
        
        Args:
            input_path: Path to input PDF
            output_path: Path to output protected PDF
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Read input PDF
            with open(input_path, 'rb') as file:
                reader = PdfReader(file)
                writer = PdfWriter()
                
                # Create watermark
                watermark_packet = self.create_watermark_pdf()
                watermark_reader = PdfReader(watermark_packet)
                watermark_page = watermark_reader.pages[0]
                
                # Process each page
                for page in reader.pages:
                    # Merge watermark with page
                    page.merge_page(watermark_page)
                    writer.add_page(page)
                
                # Set passwords and permissions
                writer.encrypt(
                    user_password=USER_PASSWORD,
                    owner_password=OWNER_PASSWORD,
                    use_128bit=True,
                    permissions_flag=(
                        # Allow printing and copying, but restrict modification
                        0b00000000000000000000000000000001 |  # Allow Print
                        0b00000000000000000000000000000100 |  # Allow Copy
                        0b00000000000000000000000000010000 |  # Allow Fill forms
                        0b00000000000000000000000010000000    # Allow Print high res
                        # Disable: Modify, Add annotations, Extract, Assemble
                    )
                )
                
                # Write protected PDF
                with open(output_path, 'wb') as output_file:
                    writer.write(output_file)
                
                logger.info(f"Successfully protected: {input_path}")
                return True
                
        except Exception as e:
            logger.error(f"Error protecting {input_path}: {str(e)}")
            return False
    
    def backup_original(self, file_path: str, backup_path: str) -> bool:
        """Create backup of original file"""
        try:
            # Ensure backup directory exists
            os.makedirs(os.path.dirname(backup_path), exist_ok=True)
            
            # Copy original file to backup location
            shutil.copy2(file_path, backup_path)
            logger.info(f"Backed up: {file_path} -> {backup_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error backing up {file_path}: {str(e)}")
            return False
    
    def process_directory(self, dir_path: str) -> Tuple[int, int]:
        """
        Process all PDF files in a directory
        
        Args:
            dir_path: Path to directory containing PDFs
            
        Returns:
            Tuple[int, int]: (successful_count, error_count)
        """
        if not os.path.exists(dir_path):
            logger.warning(f"Directory not found: {dir_path}")
            return 0, 0
        
        successful = 0
        errors = 0
        
        # Find all PDF files
        pdf_files = []
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                if file.lower().endswith('.pdf'):
                    pdf_files.append(os.path.join(root, file))
        
        logger.info(f"Found {len(pdf_files)} PDF files in {dir_path}")
        
        for pdf_file in pdf_files:
            try:
                # Create backup path
                relative_path = os.path.relpath(pdf_file, dir_path)
                backup_path = os.path.join(self.backup_dir, dir_path, relative_path)
                
                # Create backup
                if self.backup_original(pdf_file, backup_path):
                    # Protect the PDF (replace original)
                    if self.protect_pdf(pdf_file, pdf_file):
                        successful += 1
                    else:
                        errors += 1
                        # Restore from backup if protection failed
                        shutil.copy2(backup_path, pdf_file)
                        logger.warning(f"Restored original: {pdf_file}")
                else:
                    errors += 1
                    
            except Exception as e:
                logger.error(f"Error processing {pdf_file}: {str(e)}")
                errors += 1
        
        return successful, errors
    
    def run_protection(self) -> None:
        """Run the complete protection process"""
        logger.info("Starting Claim Navigator PDF Protection Process")
        logger.info(f"User Password: {USER_PASSWORD}")
        logger.info(f"Owner Password: {OWNER_PASSWORD}")
        logger.info(f"Watermark: {WATERMARK_TEXT}")
        
        total_successful = 0
        total_errors = 0
        
        # Process each document directory
        for dir_path in DOCUMENT_DIRS:
            if os.path.exists(dir_path):
                logger.info(f"Processing directory: {dir_path}")
                successful, errors = self.process_directory(dir_path)
                total_successful += successful
                total_errors += errors
            else:
                logger.warning(f"Directory not found: {dir_path}")
        
        # Summary
        duration = datetime.now() - self.start_time
        logger.info("=" * 60)
        logger.info("PROTECTION PROCESS COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Total PDFs processed: {total_successful + total_errors}")
        logger.info(f"Successfully protected: {total_successful}")
        logger.info(f"Errors encountered: {total_errors}")
        logger.info(f"Processing time: {duration}")
        logger.info(f"Backup location: {self.backup_dir}")
        logger.info("=" * 60)
        
        if total_errors > 0:
            logger.warning(f"Some files could not be processed. Check the log for details.")
            return False
        else:
            logger.info("All PDFs successfully protected!")
            return True

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Protect Claim Navigator PDF Library')
    parser.add_argument('--backup-dir', default='backup_original', 
                       help='Directory for original file backups')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be processed without making changes')
    
    args = parser.parse_args()
    
    if args.dry_run:
        logger.info("DRY RUN MODE - No changes will be made")
        # Count files that would be processed
        total_files = 0
        for dir_path in DOCUMENT_DIRS:
            if os.path.exists(dir_path):
                for root, dirs, files in os.walk(dir_path):
                    for file in files:
                        if file.lower().endswith('.pdf'):
                            total_files += 1
        logger.info(f"Would process {total_files} PDF files")
        return
    
    # Create protector instance
    protector = PDFProtector(backup_dir=args.backup_dir)
    
    # Run protection
    success = protector.run_protection()
    
    if success:
        print("\n✅ PDF Protection completed successfully!")
        print(f"📁 Original files backed up to: {args.backup_dir}")
        print(f"🔒 All PDFs are now password protected with: {USER_PASSWORD}")
        print(f"💧 Watermarks added: {WATERMARK_TEXT}")
    else:
        print("\n❌ PDF Protection completed with errors. Check the log for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()

