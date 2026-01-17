# Refactoring Plan: Deprecated Code & Technical Debt

**Status**: Planning
**Created**: January 17, 2026

## 🎯 Objective
This plan outlines the strategy to modernize the School Management System codebase by removing deprecated fields, consolidating logic, and addressing known technical debt. The primary goals are to ensure data consistency, reduce maintenance overhead, and implement missing features.

---

## 🔍 Analysis & Findings

### 1. `paymentMode` (Single) vs `paymentModes` (Split)
- **Status**: The legacy `paymentMode` (string) field in `fee-collection.dto.ts` is marked as deprecated but is still heavily used for backward compatibility in the frontend (`EnhancedFeeCollection.tsx`, `DailyCollectionReport.tsx`) and backend (`fees.service.ts`).
- **Impact**: Maintaining both fields creates confusion and potential data inconsistencies. The backend currently has logic to "normalize" single usages into the array format, but the frontend still relies on the single field for many display components.
- **Risk**: High. Removing `paymentMode` will break existing UI components (chips, tables) that expect a simple string.

### 2. `Route.monthlyFee` vs `TransportFareSlab`
- **Status**: The system has moved to a distance-based fare calculation using `TransportFareSlab`. However, `Route.monthlyFee` still exists in the Prisma schema and is used as a fallback or display value in reports (`TransportReports.tsx`) and route lists.
- **Impact**: Having two sources of truth for transport fees is dangerous. A route might display a static fee of ₹500, but the distance-based calculation might charge ₹700, leading to billing discrepancies.
- **Risk**: Medium. Removing `monthlyFee` requires ensuring that *every* student transport assignment has a valid distance/stop-based fare calculation.

### 3. Transport Discount (TODO)
- **Status**: A TODO comment exists in `fees.service.ts`: `// TODO: Implement Transport Discount if needed`.
- **Impact**: Currently, there is no standardized way to apply discounts specifically to transport fees, other than manual adjustments.
- **Risk**: Low. This is a missing feature rather than a regression risk.

---

## 🛠️ Refactoring Roadmap

### Phase 1: Preparation & Safety (Week 1)
- [ ] **Audit Data**: Run a script to identify any `FeeTransaction` records that *only* have `paymentMode` set and no entries in the `paymentModeDetails` array (if applicable/JSON).
- [ ] **Frontend Migration (Display)**: Update `TransactionHistory` and `DailyCollectionReport` to prefer `paymentModes[0]` if `paymentMode` is missing.
- [ ] **Dual-Write Validation**: Ensure that whenever the frontend sends a request, it *only* populates `paymentModes`. The backend should log a warning if it receives legacy `paymentMode`.

### Phase 2: Feature Implementation (Week 2)
- [ ] **Transport Discount**: Implement a `transportDiscount` field in the student transport assignment or fee structure.
- [ ] **Transport Fee Source**: Create a migration to fill any missing `TransportFareSlab` or stop distances so `Route.monthlyFee` is never needed as a fallback.

### Phase 3: Deprecation & Cleanup (Week 3)
- [ ] **Remove `paymentMode`**:
    - Update `fee-collection.dto.ts` to remove the field.
    - Update `fees.service.ts` to reject requests with this field.
    - Refactor `EnhancedFeeCollection.tsx` to remove the deprecated field from the Zod schema.
- [ ] **Remove `Route.monthlyFee`**:
    - Remove the field from `schema.prisma`.
    - Generate a migration.
    - Update `TransportReports.tsx` to display "Variable" or a calculated range instead of a static fee.

---

## 🧪 Verification Plan

### Automated Tests
- **Fees**: Create test cases submitting *only* `paymentModes` (split and single) to verify correct processing.
- **Transport**: Create test cases for students with varying distances to ensure `TransportFareSlab` is always used.

### Manual Verification
1. **Fee Collection**: Collect fees using Cash, Split (Cash + Online), and verify the receipt and database record.
2. **Reports**: Check Daily Collection Report to ensure payment modes are displayed correctly without the legacy field.
3. **Transport**: Assign a student to a route and verify the fee is calculated via slab, not the route's static fee.
