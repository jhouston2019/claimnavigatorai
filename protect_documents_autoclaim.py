#!/usr/bin/env python3
"""
PDF Batch Processor for AutoClaimNavigator - Add Watermarks and Password Protection
This script processes all PDFs in the autoclaimnavigator docs folder, adding watermarks and password protection.
"""

import os
import sys
from pathlib import Path
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import io

# ============= CONFIGURATION =============
# Modify these settings as needed

# Paths - specifically for autoclaimnavigator
INPUT_FOLDER = "./autoclaimnavigator/docs"  # Folder containing your original PDFs
OUTPUT_FOLDER = "./autoclaimnavigator/docs/protected"  # Where to save protected PDFs

# Watermark Settings
WATERMARK_TEXT = "AutoClaim Navigator - Protected Document"
WATERMARK_OPACITY = 0.3  # 0.0 (invisible) to 1.0 (fully opaque)
WATERMARK_FONT_SIZE = 14
WATERMARK_COLOR = (0.5, 0.5, 0.5)  # RGB values (0-1), this is gray
WATERMARK_ROTATION = 0  # Degrees (0 for horizontal, 45 for diagonal)

# Position: 'bottom', 'center', or 'diagonal'
WATERMARK_POSITION = 'bottom'  

# Password Settings
USER_PASSWORD = "AutoClaimNav2025"  # Password to open the document
OWNER_PASSWORD = "AdminAutoClaim2025"  # Password for permissions (should be different)

# Permissions (set False to restrict)
ALLOW_PRINTING = False
ALLOW_COPYING = False

# =========================================

def create_watermark(page_width, page_height, text=WATERMARK_TEXT):
    """Create a watermark PDF with specified text."""
    # Create a buffer for the watermark
    watermark_buffer = io.BytesIO()
    
    # Create a canvas for the watermark
    c = canvas.Canvas(watermark_buffer, pagesize=(page_width, page_height))
    
    # Set transparency
    c.setFillColorRGB(*WATERMARK_COLOR, alpha=WATERMARK_OPACITY)
    c.setFont("Helvetica", WATERMARK_FONT_SIZE)
    
    # Calculate position based on settings
    if WATERMARK_POSITION == 'bottom':
        x = page_width / 2
        y = 30  # 30 points from bottom
        c.saveState()
        c.translate(x, y)
        c.rotate(WATERMARK_ROTATION)
        c.drawCentredString(0, 0, text)
        c.restoreState()
    elif WATERMARK_POSITION == 'center':
        x = page_width / 2
        y = page_height / 2
        c.saveState()
        c.translate(x, y)
        c.rotate(45 if WATERMARK_ROTATION == 0 else WATERMARK_ROTATION)  # Default diagonal for center
        c.drawCentredString(0, 0, text)
        c.restoreState()
    elif WATERMARK_POSITION == 'diagonal':
        # Multiple diagonal watermarks
        c.saveState()
        c.translate(page_width / 2, page_height / 2)
        c.rotate(45)
        for i in range(-3, 4):
            c.drawCentredString(0, i * 100, text)
        c.restoreState()
    
    c.save()
    watermark_buffer.seek(0)
    return PdfReader(watermark_buffer)

def process_pdf(input_path, output_path):
    """Process a single PDF: add watermark and password protection."""
    try:
        # Read the original PDF
        print(f"Processing: {input_path.name}")
        reader = PdfReader(str(input_path))
        writer = PdfWriter()
        
        # Process each page
        for page_num, page in enumerate(reader.pages):
            # Get page dimensions
            page_width = float(page.mediabox.width)
            page_height = float(page.mediabox.height)
            
            # Create watermark for this page size
            watermark_pdf = create_watermark(page_width, page_height)
            watermark_page = watermark_pdf.pages[0]
            
            # Merge watermark with original page
            page.merge_page(watermark_page)
            writer.add_page(page)
        
        # Copy metadata if it exists
        if reader.metadata:
            writer.add_metadata(reader.metadata)
        
        # Add password protection and set permissions
        writer.encrypt(
            user_password=USER_PASSWORD,
            owner_password=OWNER_PASSWORD,
            permissions_flag=(
                (4 if ALLOW_PRINTING else 0) |  # Print permission
                (16 if ALLOW_COPYING else 0)    # Copy permission
            )
        )
        
        # Save the protected PDF
        with open(str(output_path), 'wb') as output_file:
            writer.write(output_file)
        
        print(f"  ✓ Saved to: {output_path.name}")
        return True
        
    except Exception as e:
        print(f"  ✗ Error processing {input_path.name}: {str(e)}")
        return False

def main():
    """Main function to process all PDFs in the input folder."""
    print("=" * 50)
    print("AUTOCLAIMNAVIGATOR PDF BATCH PROCESSOR")
    print("=" * 50)
    print(f"Input folder: {INPUT_FOLDER}")
    print(f"Output folder: {OUTPUT_FOLDER}")
    print(f"Watermark: {WATERMARK_TEXT}")
    print(f"User password: {USER_PASSWORD}")
    print("=" * 50)
    
    # Create output folder if it doesn't exist
    output_dir = Path(OUTPUT_FOLDER)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Find all PDF files
    input_dir = Path(INPUT_FOLDER)
    pdf_files = list(input_dir.glob("**/*.pdf"))
    
    if not pdf_files:
        print(f"No PDF files found in {INPUT_FOLDER}")
        return
    
    print(f"\nFound {len(pdf_files)} PDF files to process\n")
    
    # Process each PDF
    success_count = 0
    error_count = 0
    
    for pdf_path in pdf_files:
        # Create output path with -protected suffix
        relative_path = pdf_path.relative_to(input_dir)
        output_path = output_dir / relative_path.parent / f"{pdf_path.stem}-protected.pdf"
        
        # Create subdirectories if needed
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Process the PDF
        if process_pdf(pdf_path, output_path):
            success_count += 1
        else:
            error_count += 1
    
    # Print summary
    print("\n" + "=" * 50)
    print("PROCESSING COMPLETE")
    print(f"Successfully processed: {success_count} files")
    if error_count > 0:
        print(f"Errors: {error_count} files")
    print("=" * 50)

def test_single_file():
    """Test function to process just one PDF file."""
    test_file = Path(INPUT_FOLDER) / "test.pdf"  # Change this to your test file
    
    if not test_file.exists():
        print(f"Test file not found: {test_file}")
        # Try to find any PDF to test with
        pdf_files = list(Path(INPUT_FOLDER).glob("*.pdf"))
        if pdf_files:
            test_file = pdf_files[0]
            print(f"Using first PDF found: {test_file}")
        else:
            print("No PDF files found to test with")
            return
    
    output_file = Path(OUTPUT_FOLDER) / f"{test_file.stem}-protected.pdf"
    Path(OUTPUT_FOLDER).mkdir(parents=True, exist_ok=True)
    
    print(f"Testing with: {test_file}")
    if process_pdf(test_file, output_file):
        print(f"Test successful! Check: {output_file}")
    else:
        print("Test failed!")

# Installation check
def check_dependencies():
    """Check if required packages are installed."""
    required = ['PyPDF2', 'reportlab']
    missing = []
    
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print("Missing required packages:")
        print(f"Please run: pip install {' '.join(missing)}")
        return False
    return True

if __name__ == "__main__":
    if not check_dependencies():
        sys.exit(1)
    
    # Uncomment the line below to test with a single file first
    # test_single_file()
    
    # Run the main batch processor
    main()

