# 💰 Fee Management Module

A comprehensive system for handling school fees, featuring flexible structures, robust collection, and detailed reporting.

## Core Components

### 1. Fee Structure
Define how much students pay based on their class.
- **Heads**: Tuition Fee, Transport, Library, Exam Fee, etc.
- **Frequency**: Monthly, Yearly, One-time.
- **Configuration**: `Settings > Fee Structure`.

### 2. Fee Collection
**Route:** `/fees/collection-enhanced`
- **Multi-Head Collection**: Collect multiple fee types in one receipt.
- **Payment Modes**: Cash, Cheque, Online, Card, UPI.
- **Discounts**: Apply specific discounts (Fixed amount or Percentage).
- **Auto-Fill**: Automatically calculates outstanding dues including previous months.

### 3. Demand Bills
**Route:** `/fees/demand-bills`
- Generate monthly bills for a whole class or single student.
- **Carry Forward**: Automatically adds previous unpaid dues to the new bill.
- **Print**: Bulk print A4/A5 bills for distribution.

### 4. Reporting & Receipts
- **Receipts**: Auto-generated PDF receipts (A6 thermal printer friendly).
- **Fee Book**: Complete yearly ledger for a student.
- **Defaulters List**: Identify students with outstanding dues.
- **Daily Collection**: Summary of total fees collected by date/mode.

## Database Schema Highlights

### `FeeTransaction`
Records every payment event.
- `receiptNo`: Unique sequence.
- `amount`: Total paid.
- `paymentMode`: Method of payment.

### `FeePaymentDetail`
Links a transaction to specific fee heads.
- `feeHeadId`: Link to FeeType.
- `amount`: Amount allocated to this head.
