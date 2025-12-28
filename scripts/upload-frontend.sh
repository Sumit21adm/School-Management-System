#!/bin/bash

# Upload updated frontend to Hostinger
# This script uploads the newly built frontend files to the server

echo "📦 Preparing to upload frontend to Hostinger..."

# Navigate to the frontend dist directory
cd "$(dirname "$0")/../school-management-system/dist" || exit 1

echo "📁 Current directory: $(pwd)"
echo "📋 Files to upload:"
ls -lh

echo ""
echo "🚀 Upload these files to your Hostinger server:"
echo "   Server path: ~/domains/wenvite.in/public_html/"
echo ""
echo "Options:"
echo "  1. Use File Manager in hPanel"
echo "  2. Use SCP command:"
echo "     scp -r * u938917427@in-mum-web918.main-hosting.eu:~/domains/wenvite.in/public_html/"
echo ""
echo "  3. Use SFTP client (FileZilla, Cyberduck, etc.)"
echo ""
echo "After uploading, clear your browser cache and try logging in again!"
