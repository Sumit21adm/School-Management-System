# Data Migration Guide

Complete guide for importing student data and fee records from legacy school management systems.

---

## Overview

The Data Migration feature allows schools migrating from legacy systems to import:
- **Complete Student Records** (35+ fields including personal, parent, guardian, transport details)
- **Fee Receipts/Transactions** (historical payment records)
- **Demand Bills** (outstanding fee bills)
- **Student Discounts** (fee-specific discounts)

---

## Prerequisites

Before importing, ensure these are set up in the system:

| Requirement | Where to Set Up |
|-------------|-----------------|
| Academic Session (Active) | Settings → Sessions |
| School Classes | Settings → Classes |
| Sections | Settings → Classes → Sections |
| Fee Types | Settings → Fee Structure |
| Transport Routes & Stops | Transport → Routes (optional) |

---

## Step-by-Step Process

### Step 1: Download Template

1. Navigate to **Settings → Data Migration**
2. Click **Download Template**
3. Open the downloaded `data_migration_template.xlsx`

The template contains 6 sheets:
- **Instructions** - Read this first!
- **Reference_Data** - Valid values for dropdowns
- **Students** - Student records to import
- **Fee_Receipts** - Historical fee payments
- **Demand_Bills** - Outstanding bills
- **Discounts** - Student-specific discounts

### Step 2: Prepare Your Data

1. **Export from Legacy System**: Get your data in Excel/CSV format
2. **Map Fields**: Match your columns to template columns
3. **Fill Template**: Copy data into the appropriate sheets

> ⚠️ **Important**: Use exact values from Reference_Data sheet for Classes, Fee Types, etc.

### Step 3: Import Data

**Import Order Matters!**

```
1. Students First → 2. Fee Receipts → 3. Demand Bills → 4. Discounts
```

Fee records require students to exist first.

For each import:
1. Select the data type (Students, Fee Receipts, etc.)
2. Upload the filled Excel file
3. Click **Validate** to check for errors
4. Fix any errors and re-upload, OR
5. Enable "Skip rows with errors" to import valid rows
6. Click **Import**

---

## Template Column Reference

### Students Sheet (Required fields marked with *)

| Column | Field | Format | Example |
|--------|-------|--------|---------|
| A | Student ID * | Alphanumeric | STU2024001 |
| B | Name * | Text | Rahul Kumar |
| C | Father Name * | Text | Rajesh Kumar |
| D | Mother Name * | Text | Priya Kumar |
| E | DOB * | DD-MM-YYYY | 15-03-2015 |
| F | Gender * | male/female/other | male |
| G | Class * | From Reference_Data | 5 |
| H | Section * | A-Z | A |
| I | Roll Number | Text | 15 |
| J | Admission Date * | DD-MM-YYYY | 01-04-2024 |
| K | Address * | Text | 123 Main St |
| L | Phone * | 10-15 digits | 9876543210 |
| ... | (See full list in template) | | |
| AH | Previous Dues | Number | 5000 |
| AI | Advance Balance | Number | 0 |

### Fee_Receipts Sheet

| Column | Field | Format | Example |
|--------|-------|--------|---------|
| A | Student ID * | Must exist | STU2024001 |
| B | Receipt No * | Unique | REC/2024/001 |
| C | Receipt Date * | DD-MM-YYYY | 15-05-2024 |
| D | Fee Type * | From Reference_Data | Tuition Fee |
| E | Amount * | Number | 2500 |
| F | Discount | Number | 0 |
| G | Net Amount * | Number | 2500 |
| H | Payment Mode * | cash/upi/card/cheque/online | cash |

### Demand_Bills Sheet

| Column | Field | Format | Example |
|--------|-------|--------|---------|
| A | Student ID * | Must exist | STU2024001 |
| B | Bill No * | Unique | BILL/2024/001 |
| C | Bill Date * | DD-MM-YYYY | 01-04-2024 |
| D | Due Date * | DD-MM-YYYY | 15-04-2024 |
| E | Month * | 1-12 | 4 |
| F | Year * | YYYY | 2024 |
| G | Fee Type * | From Reference_Data | Tuition Fee |
| N | Status * | PENDING/PAID/PARTIALLY_PAID | PAID |

---

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Class not found" | Check Reference_Data sheet for valid class names |
| "Student not found" | Import students before fee records |
| "Fee Type not found" | Create fee type in Settings → Fee Structure |
| "Duplicate ID" | Student ID or Receipt No already exists |
| "Invalid date format" | Use DD-MM-YYYY format (15-04-2024) |
| "Phone must be 10-15 digits" | Remove spaces/dashes from phone numbers |

---

## Tips for Large Imports

- **Validate First**: Always validate before importing
- **Use Skip Mode**: Enable "Skip rows with errors" for partial imports
- **Batch Large Files**: For 1000+ records, consider splitting into batches
- **Check Reference Data**: Ensure all Classes, Fee Types exist before starting

---

## Support

If you encounter issues:
1. Check the error messages - they include row numbers
2. Verify data matches Reference_Data sheet values exactly (case-sensitive)
3. Ensure dates are in DD-MM-YYYY format
4. Remove any special characters from ID fields
