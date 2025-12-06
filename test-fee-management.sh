#!/bin/bash

# Enhanced Fee Management System - Quick Test Script
# This script tests the new fee management APIs

API_URL="http://localhost:3001"
STUDENT_ID="STU001"
SESSION_ID=1

echo "🧪 Testing Enhanced Fee Management System"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Get Student Dashboard
echo -e "${YELLOW}Test 1: Get Student Fee Dashboard${NC}"
echo "GET ${API_URL}/fees/dashboard/${STUDENT_ID}/session/${SESSION_ID}"
curl -s "${API_URL}/fees/dashboard/${STUDENT_ID}/session/${SESSION_ID}" | jq '.' || echo -e "${RED}❌ Failed${NC}"
echo ""
echo "---"
echo ""

# Test 2: Get Student Statement
echo -e "${YELLOW}Test 2: Get Student Statement${NC}"
echo "POST ${API_URL}/fees/statement"
curl -s -X POST "${API_URL}/fees/statement" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "'${STUDENT_ID}'",
    "sessionId": '${SESSION_ID}'
  }' | jq '.' || echo -e "${RED}❌ Failed${NC}"
echo ""
echo "---"
echo ""

# Test 3: Collect Fee
echo -e "${YELLOW}Test 3: Collect Fee (Multi-Head)${NC}"
echo "POST ${API_URL}/fees/collect"
curl -s -X POST "${API_URL}/fees/collect" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "'${STUDENT_ID}'",
    "sessionId": '${SESSION_ID}',
    "feeDetails": [
      {
        "feeTypeId": 1,
        "amount": 5000,
        "discountAmount": 500
      },
      {
        "feeTypeId": 2,
        "amount": 2000,
        "discountAmount": 0
      }
    ],
    "paymentMode": "cash",
    "remarks": "Test payment",
    "collectedBy": "Admin",
    "date": "'$(date +%Y-%m-%d)'"
  }' | jq '.' || echo -e "${RED}❌ Failed${NC}"
echo ""
echo "---"
echo ""

# Test 4: Generate Demand Bill (Single Student)
echo -e "${YELLOW}Test 4: Generate Demand Bill (Single Student)${NC}"
echo "POST ${API_URL}/fees/demand-bills/generate"
curl -s -X POST "${API_URL}/fees/demand-bills/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "'${STUDENT_ID}'",
    "sessionId": '${SESSION_ID}',
    "month": '$(date +%m)',
    "year": '$(date +%Y)',
    "dueDate": "'$(date -d '+15 days' +%Y-%m-%d)'"
  }' | jq '.' || echo -e "${RED}❌ Failed${NC}"
echo ""
echo "---"
echo ""

# Test 5: Get Yearly Fee Book
echo -e "${YELLOW}Test 5: Get Yearly Fee Book${NC}"
echo "GET ${API_URL}/fees/fee-book/${STUDENT_ID}/session/${SESSION_ID}"
curl -s "${API_URL}/fees/fee-book/${STUDENT_ID}/session/${SESSION_ID}" | jq '.' || echo -e "${RED}❌ Failed${NC}"
echo ""
echo "---"
echo ""

# Test 6: Get Transactions
echo -e "${YELLOW}Test 6: Get Transactions (Date Range)${NC}"
echo "GET ${API_URL}/fees/transactions?dateFrom=2024-01-01&dateTo=$(date +%Y-%m-%d)"
curl -s "${API_URL}/fees/transactions?dateFrom=2024-01-01&dateTo=$(date +%Y-%m-%d)" | jq '.' || echo -e "${RED}❌ Failed${NC}"
echo ""
echo "---"
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "📊 Summary:"
echo "  - Fee Dashboard API"
echo "  - Student Statement API"
echo "  - Multi-Head Fee Collection"
echo "  - Demand Bill Generation"
echo "  - Yearly Fee Book"
echo "  - Transaction Reports"
echo ""
echo "🌐 Frontend URLs:"
echo "  - Fee Dashboard: http://localhost:5173/fees/dashboard"
echo "  - Fee Collection: http://localhost:5173/fees/collection-enhanced"
echo "  - Demand Bills: http://localhost:5173/fees/demand-bills"
