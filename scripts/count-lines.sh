#!/bin/bash
# ============================================
# Lines of Code Counter
# ============================================
# Counts lines of code in the project and
# optionally updates the README badge
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
README_FILE="$PROJECT_DIR/README.md"

echo ""
echo " =========================================="
echo "  Lines of Code Counter"
echo " =========================================="
echo ""

# Count lines in source files (excluding node_modules, dist, etc.)
echo " Counting lines of code..."
TOTAL_LINES=$(find "$PROJECT_DIR/school-management-api/src" "$PROJECT_DIR/school-management-system/src" \
    -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/.next/*" \
    -not -path "*/build/*" \
    2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')

# Format the number (e.g., 19811 -> ~20k)
if [ "$TOTAL_LINES" -ge 1000 ]; then
    FORMATTED=$(echo "scale=0; $TOTAL_LINES / 1000" | bc)
    FORMATTED_LOC="~${FORMATTED}k"
else
    FORMATTED_LOC="$TOTAL_LINES"
fi

echo ""
echo " =========================================="
echo "  Results"
echo " =========================================="
echo ""
echo "  Total Lines:     $TOTAL_LINES"
echo "  Formatted:       $FORMATTED_LOC"
echo ""

# Check if update flag is provided
if [ "$1" == "--update" ] || [ "$1" == "-u" ]; then
    echo " Updating README.md..."
    
    # Update the badge in README
    if [ -f "$README_FILE" ]; then
        # Backup README
        cp "$README_FILE" "$README_FILE.bak"
        
        # Update the badge line
        sed -i.tmp "s/lines_of_code-~[0-9]*k/lines_of_code-$FORMATTED_LOC/" "$README_FILE"
        rm -f "$README_FILE.tmp"
        
        echo " ✅ README.md updated!"
        echo "    Badge now shows: $FORMATTED_LOC"
        echo ""
        echo "    Backup saved: README.md.bak"
    else
        echo " ❌ README.md not found!"
        exit 1
    fi
else
    echo " To update README.md, run:"
    echo "    ./scripts/count-lines.sh --update"
fi

echo ""
