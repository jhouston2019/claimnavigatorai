#!/usr/bin/env python3
"""
Check Problematic Files Script
============================

This script checks the 2 problematic files to see if they exist and are accessible.
"""

import os
import sys

def check_files():
    """Check the 2 problematic files"""
    
    files_to_check = [
        "Settlement Negotiation Letter - Spanish Sample Sarah Mitchell.pdf",
        "Settlement Negotiation Letter - Spanish Template.pdf"
    ]
    
    base_path = "./Document Library - Final Spanish/Spanish Version - English title/"
    
    print("Checking problematic files...")
    print("=" * 50)
    
    for filename in files_to_check:
        full_path = base_path + filename
        
        print(f"\nFile: {filename}")
        print(f"Full path: {full_path}")
        print(f"Exists: {os.path.exists(full_path)}")
        
        if os.path.exists(full_path):
            try:
                file_size = os.path.getsize(full_path)
                print(f"Size: {file_size} bytes")
                
                # Try to open the file
                with open(full_path, 'rb') as f:
                    first_bytes = f.read(10)
                    print(f"First 10 bytes: {first_bytes}")
                    print(f"File is readable: True")
                    
            except Exception as e:
                print(f"Error reading file: {e}")
        else:
            print("File does not exist!")
    
    print("\n" + "=" * 50)
    print("File check complete!")

if __name__ == "__main__":
    check_files()

