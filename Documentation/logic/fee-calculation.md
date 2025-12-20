# 🧮 Fee Calculation Logic

Understanding how the system calculates totals, dues, and balances.

## The Formula

The total payable amount for a student is dynamic:

$$
Total Payable = \sum (Fee Head Amount) - \sum (Discounts) + Previous Dues
$$

## Components

### 1. Fee Structure Application
- When a student is selected, the system fetches the `FeeStructure` for their **Class** and **Session**.
- It iterates through all `FeeTypes` (Tuition, Transport, etc.).

### 2. Discount Logic
- Discounts are applied per Fee Head.
- **Fixed**: Subtracts a specific amount (e.g., ₹500 off).
- **Percentage**: Subtracts a % of the head amount (e.g., 50% off Tuition).

### 3. Previous Dues (Carry Forward)
- The system checks the running balance of the student's ledger.
- If `Balance > 0` at the end of the previous month, it is added as "Arrears" or "Previous Dues" to the current bill.

## Edge Cases
- **Overpayment**: If a parent pays more than the due amount, the surplus is stored as a credit balance (negative due).
- **Partial Payment**: Remaining amount carries forward to next month.
