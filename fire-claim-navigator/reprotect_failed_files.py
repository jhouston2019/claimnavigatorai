#!/usr/bin/env python3
"""
Re-protect Failed PDF Files
==========================
This script re-protects the 5 files that failed during the protection process.
"""

import os
import sys
import logging
from pathlib import Path
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('reprotect_failed.log'),
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

def restore_from_backup_and_reprotect():
    """
    Restore files from backup and re-protect them
    """
    logging.info("Starting re-protection of failed files...")
    
    spanish_dir = Path("Document Library - Final Spanish")
    backup_dir = Path("backup_original/Document Library - Final Spanish")
    
    if not backup_dir.exists():
        logging.error("Backup directory not found. Cannot restore files.")
        return False
    
    restored_count = 0
    protected_count = 0
    
    for filename in FAILED_FILES:
        file_path = spanish_dir / filename
        backup_path = backup_dir / filename
        
        if not backup_path.exists():
            logging.warning(f"Backup not found for: {filename}")
            continue
            
        logging.info(f"Restoring from backup: {filename}")
        
        try:
            # Restore from backup
            shutil.copy2(backup_path, file_path)
            restored_count += 1
            logging.info(f"Restored: {filename}")
            
            # Now the file should be unprotected and ready for re-protection
            logging.info(f"File {filename} restored and ready for re-protection")
            
        except Exception as e:
            logging.error(f"Error restoring {filename}: {str(e)}")
    
    logging.info(f"Restoration completed. Restored: {restored_count} files")
    logging.info("Files are now ready for re-protection with the main protection script")
    
    return restored_count > 0

def main():
    """
    Main function
    """
    logging.info("Starting failed PDF re-protection process...")
    
    # Check if we're in the right directory
    if not os.path.exists("Document Library - Final Spanish"):
        logging.error("Spanish document library not found. Please run from project root.")
        return False
    
    if not os.path.exists("backup_original"):
        logging.error("Backup directory not found. Cannot restore files.")
        return False
    
    success = restore_from_backup_and_reprotect()
    
    if success:
        logging.info("Files restored successfully. Run the main protection script to re-protect them.")
    else:
        logging.error("Failed to restore files.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
