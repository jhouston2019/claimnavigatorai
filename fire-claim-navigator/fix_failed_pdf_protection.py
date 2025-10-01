#!/usr/bin/env python3
"""
Fix Failed PDF Protection Script
This script addresses the 5 PDF files that failed protection due to decryption issues.
"""

import os
import sys
import logging
from pathlib import Path
import fitz  # PyMuPDF
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import io

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fix_failed_protection.log'),
        logging.StreamHandler()
    ]
)

# Failed files from the log
FAILED_FILES = [
    "Verificación y Documentación de Daños a la Propiedad - Plantilla en Español.pdf",
    "Verificación de Daños por Granizada - Ejemplo Completo en Español.pdf", 
    "Verificación de Daños por Tormenta Severa - Ejemplo de Georgia en Español.pdf",
    "Índice Maestro - Documentos de Reclamación de Seguros en Español.pdf",
    "Índice Completo de Traducciones - Complete Translation Index.pdf"
]

def fix_pdf_protection(file_path):
    """
    Fix PDF protection by recreating the file with proper encryption
    """
    try:
        # Open the original PDF
        doc = fitz.open(file_path)
        
        # Create a new PDF with the same content
        new_doc = fitz.open()
        
        # Copy all pages
        for page_num in range(len(doc)):
            page = doc[page_num]
            new_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
        
        # Close original
        doc.close()
        
        # Save with new protection settings
        new_doc.save(
            file_path,
            encryption=fitz.PDF_ENCRYPT_AES_256,
            user_pwd="ClaimNav1",  # User password
            owner_pwd="AdminClaimNav2025",  # Owner password
            permissions=fitz.PDF_PERM_PRINT | fitz.PDF_PERM_COPY,  # Allow print and copy
            garbage=4,
            deflate=True
        )
        
        new_doc.close()
        
        logging.info(f"Successfully fixed protection for: {file_path}")
        return True
        
    except Exception as e:
        logging.error(f"Error fixing {file_path}: {str(e)}")
        return False

def main():
    """
    Main function to fix all failed PDF files
    """
    logging.info("Starting PDF protection fix process...")
    
    # Check if we're in the right directory
    if not os.path.exists("Document Library - Final Spanish"):
        logging.error("Spanish document library not found. Please run from project root.")
        return False
    
    spanish_dir = Path("Document Library - Final Spanish")
    fixed_count = 0
    failed_count = 0
    
    for filename in FAILED_FILES:
        file_path = spanish_dir / filename
        
        if not file_path.exists():
            logging.warning(f"File not found: {file_path}")
            continue
            
        logging.info(f"Processing: {filename}")
        
        # Create backup first
        backup_path = file_path.with_suffix('.pdf.backup')
        if not backup_path.exists():
            import shutil
            shutil.copy2(file_path, backup_path)
            logging.info(f"Created backup: {backup_path}")
        
        # Fix the protection
        if fix_pdf_protection(str(file_path)):
            fixed_count += 1
        else:
            failed_count += 1
    
    logging.info(f"Fix process completed. Fixed: {fixed_count}, Failed: {failed_count}")
    return failed_count == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
