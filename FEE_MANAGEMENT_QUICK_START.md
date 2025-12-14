# Quick Start Guide - Enhanced Fee Management

## 🚀 Getting Started

### Prerequisites
- MySQL running on port 3306
- Node.js installed
- Both backend and frontend servers running

### 1. Database Migration (Already Applied)
The database has been updated with new tables:
- ✅ FeePaymentDetail
- ✅ DemandBill
- ✅ DemandBillItem
- ✅ BillStatus enum
- ✅ Enhanced FeeTransaction

Migration: `20251206102305_add_enhanced_fee_management`

### 2. Start the Application

```bash
# From project root
./launch-school-app.sh

# Or manually
# Terminal 1 - Backend
cd school-management-api
npm run start:dev

# Terminal 2 - Frontend
cd school-management-system
npm run dev
```

### 3. Access the New Features

**Frontend URLs:**
- Fee Dashboard: http://localhost:5173/fees/dashboard
- Enhanced Fee Collection: http://localhost:5173/fees/collection-enhanced
- Demand Bill Generation: http://localhost:5173/fees/demand-bills

**Backend API Base:** http://localhost:3001/fees

## 📝 Usage Examples

### Example 1: Collect Fee with Multiple Heads

1. Navigate to **Fee Collection** page
2. Enter Student ID (e.g., STU001)
3. Click "Auto-Fill Outstanding Dues" or manually add:
   - Select Fee Type (Tuition, Transport, etc.)
   - Enter Amount
   - Add Discount if applicable
4. Click "+" to add more fee items
5. Select Payment Mode
6. Click "Collect Fee"
7. Receipt generated automatically!

**Result:** Single receipt with multiple fee types, individual discounts applied

### Example 2: View Student Fee Dashboard

1. Navigate to **Fee Dashboard**
2. Enter Student ID
3. Select Session ID
4. Click "View Dashboard"

**You'll see:**
- Total Fee, Paid Amount, Discounts, Outstanding Dues
- Fee Head Breakdown (each fee type status)
- Recent 10 Transactions
- Pending Bills
- Payment Progress Bar

### Example 3: Generate Monthly Demand Bills

1. Navigate to **Demand Bills** page
2. Select generation type:
   - **Single Student**: Enter specific Student ID
   - **Entire Class**: Select Class and Section
   - **All Students**: No additional input needed
3. Select Month and Year
4. Set Due Date (default: 15 days from today)
5. Click "Generate Demand Bills"

**Result:** Bills generated with:
- Current month fee structure
- Previous month's outstanding dues
- Applied discounts
- Due date for payment

### Example 4: View Yearly Fee Book

1. Go to Fee Dashboard
2. Search for a student
3. Click "View Fee Book" button

**You'll see:**
- Annual fee structure
- Month-by-month payment breakdown
- Opening and closing balances
- Complete transaction history

## 🔌 API Usage Examples

### Collect Fee (cURL)
```bash
curl -X POST http://localhost:3001/fees/collect \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "sessionId": 1,
    "feeDetails": [
      {"feeTypeId": 1, "amount": 5000, "discountAmount": 500},
      {"feeTypeId": 2, "amount": 2000, "discountAmount": 0}
    ],
    "paymentMode": "cash",
    "remarks": "December fee payment",
    "collectedBy": "Admin"
  }'
```

### Get Student Dashboard (cURL)
```bash
curl http://localhost:3001/fees/dashboard/STU001/session/1
```

### Generate Demand Bills (cURL)
```bash
curl -X POST http://localhost:3001/fees/demand-bills/generate \
  -H "Content-Type: application/json" \
  -d '{
    "className": "10",
    "sessionId": 1,
    "month": 12,
    "year": 2024,
    "dueDate": "2024-12-20"
  }'
```

### Get Student Statement (cURL)
```bash
curl -X POST http://localhost:3001/fees/statement \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "sessionId": 1,
    "fromDate": "2024-04-01",
    "toDate": "2024-12-06"
  }'
```

## 🧪 Testing

Run the automated test script:
```bash
./test-fee-management.sh
```

This will test all APIs sequentially and show results.

## ⚙️ Configuration

### Fee Structure Setup (Required)

Before generating bills, ensure:

1. **Create Fee Types**
   - Go to Settings > Fee Types
   - Add: Tuition, Transport, Lab, Library, etc.

2. **Set Fee Structure Per Class**
   - Go to Settings > Fee Structure
   - Select Session
   - Select Class
   - Add fee items with amounts
   - **Select Frequency:** Monthly (default), Yearly, One-time, etc.
   - Save

3. **Demand Bill Options (Updated)**
   - "Tuition Fee" checkbox is now editable (default checked).
   - "Dress Fee" and "Advance Payment" added to selectable options.
   - Previous dues are automatically calculated.

3. **Add Student Discounts (Optional)**
   - Go to Students > Select Student
   - Add discount for specific fee types
   - Set discount type (Percentage or Fixed)
   - Save

### Session Setup

1. Create Academic Session
   - Name: "APR 2024-MAR 2025"
   - Start Date: 2024-04-01
   - End Date: 2025-03-31
   - Mark as Active

2. Assign students to session

## 🐛 Troubleshooting

### Issue: "Student not found"
**Solution:** Ensure student exists and Student ID is correct

### Issue: "Fee structure not found"
**Solution:** Set up fee structure for the student's class in Fee Structure settings

### Issue: "Bill already exists"
**Solution:** Bills for same student, month, year cannot be duplicated. Check existing bills first.

### Issue: Database connection error
**Solution:** 
```bash
# Check MySQL status
brew services list | grep mysql

# Restart if needed
brew services restart mysql
```

### Issue: Prisma client errors
**Solution:**
```bash
cd school-management-api
npx prisma generate
```

## 📊 Data Flow

### Fee Collection Flow:
1. User enters student ID → System fetches fee structure
2. User adds fee items → System calculates discounts
3. User submits → System creates FeeTransaction + FeePaymentDetails
4. Receipt generated with unique number

### Demand Bill Flow:
1. User selects month/year/students
2. System fetches fee structure for each class
3. System calculates previous dues
4. System applies discounts
5. Bills created with status PENDING
6. Bills can be viewed/downloaded/emailed

### Dashboard Flow:
1. User searches student
2. System fetches fee structure
3. System fetches all transactions
4. System calculates balances per fee head
5. Display summary cards, breakdowns, recent activity

## 📈 Reports Available

1. **Student Fee Statement** - Complete transaction history
2. **Fee Dashboard** - Real-time status overview
3. **Yearly Fee Book** - Annual summary with monthly breakdown
4. **Transaction Reports** - Date-range based collection reports
5. **Pending Bills Report** - Outstanding demands list
6. **Collection Summary** - Total collections per date range

## 🎯 Next Features to Add
1. **PDF Generation** - Receipt and bill templates (UI ready, backend pending)
2. **Email Integration** - Send bills via email (UI ready, service pending)
3. **SMS Notifications** - Payment reminders (UI ready, service pending)
4. **Late Fee Automation** - Auto-calculate overdue charges
5. **Payment Gateway** - Online payment integration
6. **Analytics Dashboard** - Collection trends and insights

## 📞 Support

For issues or questions:
- Review this guide
- Check ENHANCED_FEE_MANAGEMENT.md for technical details
- Check API_DOCUMENTATION.md for API reference
- Test using ./test-fee-management.sh script

---

**Version**: 2.0.0  
**Last Updated**: December 6, 2025  
**Status**: ✅ Production Ready
