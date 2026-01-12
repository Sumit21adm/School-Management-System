#!/bin/bash
# ============================================
# Setup Automated Daily Backups (macOS)
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PLIST_FILE="$HOME/Library/LaunchAgents/com.school.backup.plist"

echo ""
echo " Setting up automated daily backups..."
echo ""

# Create LaunchAgent plist
cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.school.backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$SCRIPT_DIR/backup-all.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$PROJECT_DIR/logs/backup.log</string>
    <key>StandardErrorPath</key>
    <string>$PROJECT_DIR/logs/backup.log</string>
</dict>
</plist>
EOF

# Load the agent
launchctl unload "$PLIST_FILE" 2>/dev/null || true
launchctl load "$PLIST_FILE"

echo " [OK] Automated backup configured!"
echo ""
echo " Schedule: Daily at 2:00 AM"
echo " Log file: $PROJECT_DIR/logs/backup.log"
echo ""
echo " To disable: launchctl unload $PLIST_FILE"
