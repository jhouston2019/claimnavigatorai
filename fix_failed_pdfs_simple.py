#!/usr/bin/env python3
"""
Simple fix for failed PDF protection
Uses the existing protection system to re-protect the failed files
"""

import os
import sys
import logging
from pathlib import Path
import subprocess

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fix_failed_simple.log'),
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

def fix_specific_files():
    """
    Fix specific failed files by re-protecting them individually
    """
    logging.info("Starting simple PDF protection fix...")
    
    spanish_dir = Path("Document Library - Final Spanish")
    
    for filename in FAILED_FILES:
        file_path = spanish_dir / filename
        
        if not file_path.exists():
            logging.warning(f"File not found: {file_path}")
            continue
            
        logging.info(f"Processing: {filename}")
        
        try:
            # Use the existing protection script to re-protect this specific file
            cmd = [
                "python", 
                "protect_documents_print_copy_allowed.py",
                "--file", str(file_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                logging.info(f"Successfully re-protected: {filename}")
            else:
                logging.error(f"Failed to re-protect {filename}: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            logging.error(f"Timeout processing {filename}")
        except Exception as e:
            logging.error(f"Error processing {filename}: {str(e)}")

def main():
    """
    Main function
    """
    logging.info("Starting simple PDF fix process...")
    
    # Check if we're in the right directory
    if not os.path.exists("Document Library - Final Spanish"):
        logging.error("Spanish document library not found. Please run from project root.")
        return False
    
    fix_specific_files()
    logging.info("Simple fix process completed.")
    return True

if __name__ == "__main__":
    main()
