#!/bin/bash
# Claim Navigator PDF Protection Dependencies Installer
# Repository: https://github.com/jhouston2019/Claim Navigator.git

echo "========================================"
echo "Claim Navigator PDF Protection Setup"
echo "========================================"
echo

echo "Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo
    echo "✅ Dependencies installed successfully!"
    echo
    echo "Next steps:"
    echo "1. Run: python protect_pdf_library.py --dry-run"
    echo "2. If everything looks good, run: python protect_pdf_library.py"
    echo
else
    echo
    echo "❌ Error installing dependencies. Please check your Python installation."
    echo
fi