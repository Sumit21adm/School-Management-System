# UI Specifications - Session Management

**Version:** 1.0  
**Date:** 2025-12-04  
**Status:** 📝 Draft

---

## Overview

This document defines all frontend pages, components, and user flows for the Session Management feature.

**Design System:** Material-UI v7  
**State Management:** TanStack Query  
**Form Library:** React Hook Form + Zod

---

## Global Components

### Session Selector (Header)

**Location:** App header (top right)  
**Always Visible:** Yes  
**Type:** Dropdown

**UI Elements:**
```
┌─────────────────────────────┐
│ 📅 APR 2024-MAR 2025  ▼    │
└─────────────────────────────┘
```

**Dropdown Options:**
- List of all sessions (active + past)
- Active session marked with ✓
- "Manage Sessions" link at bottom

**Behavior:**
- Click: Open dropdown
- Select session: Update global context
- All data re-fetches for selected session
- Selection persists in localStorage

**State:**
```typescript
const { activeSession, allSessions, switchSession } = useSessionContext();
```

---

## Page: Settings - Sessions

**Route:** `/settings/sessions`  
**Auth:** Admin only  
**Menu:** Settings → Academic Sessions

### Layout

```
┌─────────────────────────────────────────────┐
│ Academic Sessions                 + New     │
├─────────────────────────────────────────────┤
│                                             │
│  Session Name      Start      End    Active│
│  ─────────────────────────────────────────  │
│  📅 APR 2024-MAR 2025  Apr 1  Mar 31   ✓   │
│                              [Activate]      │
│                              [Edit] [Delete] │
│  ─────────────────────────────────────────  │
│  📅 APR 2023-MAR 2024  Apr 1  Mar 31   ○   │
│                              [Activate]      │
│                              [Edit] [Delete] │
└─────────────────────────────────────────────┘
```

**Table Columns:**
1. **Session Name** - "APR YYYY-MAR YYYY"
2. **Start Date** - April 1st
3. **End Date** - March 31st  
4. **Status** - Active badge or Setup badge
5. **Actions** - Activate, Edit, Delete buttons

**Features:**
- Sorted by start date (descending)
- Active session highlighted
- Cannot delete active session
- Cannot delete session with data
- Confirm dialog before deletion

---

### Dialog: New/Edit Session

**Trigger:** "New" button or "Edit" button  
**Size:** Medium (600px width)

**Form Fields:**

1. **Session Name** (Read-only for edit)
   ```
   APR 2025-MAR 2026
   ```
   - Auto-generated from dates
   - Format: APR YYYY-MAR YYYY

2. **Start Date** (Date Picker)
   ```
   📅 04/01/2025
   ```
   - Locked to April 1st
   - Year selector only

3. **End Date** (Date Picker)
   ```
   📅 03/31/2026
   ```
   - Locked to March 31st
   - Year selector only
   - Must be start year + 1

4. **Setup Mode** (Checkbox)
   ```
   ☐ Mark as setup mode (can be configured while another is active)
   ```
   - Checked by default for new sessions
   - Unchecked when activated

**Actions:**
- **Cancel** - Close dialog
- **Save** - Create/update session

**Validation:**
- End date must be after start date
- Session name must be unique
- Cannot modify active session dates if has data

---

## Page: Settings - Fee Structure

**Route:** `/settings/fee-structure`  
**Auth:** Admin only  
**Menu:** Settings → Fee Structure

### Layout

```
┌─────────────────────────────────────────────┐
│ Fee Structure Management                    │
├─────────────────────────────────────────────┤
│  Session: [APR 2024-MAR 2025 ▼]            │
│  Class:   [1 ▼]                  [Copy...] │
├─────────────────────────────────────────────┤
│                                             │
│  Fee Type          Amount        Optional   │
│  ─────────────────────────────────────────  │
│  Tuition Fee       ₹25,000.00      ☐       │
│  Computer Fee      ₹5,000.00       ☐       │
│  Activity Fee      ₹3,000.00       ☐       │
│  Exam Fee          ₹2,500.00       ☐       │
│  Library Fee       ₹1,500.00       ☐       │
│  Sports Fee        ₹2,000.00       ☐       │
│  Misc Fee          ₹1,000.00       ☐       │
│  ─────────────────────────────────────────  │
│  + Add Fee Type                             │
│                                             │
│  Total Annual Fee: ₹40,000.00               │
│                                             │
│                     [Cancel]  [Save All]   │
└─────────────────────────────────────────────┘
```

**Features:**
- Session selector (dropdown)
- Class selector (1-12)
- Editable amounts (inline editing)
- Add custom fee types
- Copy from previous session button
- Real-time total calculation
- Save all changes atomically

**Copy Dialog:**
```
┌─────────────────────────────────────┐
│ Copy Fee Structure                 │
├─────────────────────────────────────┤
│ From Session: [APR 2023-MAR 2024 ▼]│
│ To Session:   [APR 2024-MAR 2025]  │
│ Classes:      ☑ All Classes        │
│               ☐ Selected Classes   │
│                                     │
│ Apply Increase: ☑ Yes  [10]%       │
│                                     │
│           [Cancel]  [Copy]          │
└─────────────────────────────────────┘
```

---

## Page: Settings - Fee Types

**Route:** `/settings/fee-types`  
**Auth:** Admin only  
**Menu:** Settings → Fee Types

### Layout

```
┌─────────────────────────────────────────────┐
│ Fee Types Management              + New     │
├─────────────────────────────────────────────┤
│                                             │
│  Fee Type          Status      Default      │
│  ─────────────────────────────────────────  │
│  Tuition Fee        ✓ Active     Yes       │
│                     [Edit] [Deactivate]     │
│  ─────────────────────────────────────────  │
│  Computer Fee       ✓ Active     Yes       │
│                     [Edit] [Deactivate]     │
│  ─────────────────────────────────────────  │
│  Transport Fee      ✓ Active     No        │
│                     [Edit] [Delete]         │
└─────────────────────────────────────────────┘
```

**Features:**
- Cannot delete/deactivate default types
- Cannot delete types used in any fee structure
- Custom types can be deleted if unused

---

## Page: Student Discounts

**Route:** `/students/:id/discounts`  
**Auth:** Admin/Staff  
**Access:** Via student profile page (new tab)

### Layout

```
┌─────────────────────────────────────────────┐
│ Student: Rahul Kumar (2024001)   + New     │
├─────────────────────────────────────────────┤
│                                             │
│  Session          Fee Type    Discount      │
│  ─────────────────────────────────────────  │
│  APR 2024-MAR 2025  Tuition    10%         │
│    Reason: Merit scholarship                │
│    Approved by: Principal                   │
│                     [Edit] [Remove]         │
│  ─────────────────────────────────────────  │
│  APR 2024-MAR 2025  Computer   ₹500        │
│    Reason: Sibling discount                 │
│    Approved by: Admin                       │
│                     [Edit] [Remove]         │
└─────────────────────────────────────────────┘
```

**Add Discount Dialog:**
```
┌─────────────────────────────────────┐
│ Add Fee Discount                   │
├─────────────────────────────────────┤
│ Session:    [APR 2024-MAR 2025 ▼] │
│ Fee Type:   [Tuition Fee ▼]       │
│ Type:       ⦿ Percentage  ○ Fixed  │
│ Amount:     [10]%                  │
│ Reason:     [Merit scholarship]    │
│ Approved:   [Principal]            │
│                                     │
│           [Cancel]  [Add]           │
└─────────────────────────────────────┘
```

---

## Page: Student Promotion

**Route:** `/promotions`  
**Auth:** Admin only  
**Menu:** Operations → Student Promotion  
**Available:** FEB, MAR, APR only

### Step 1: Selection

```
┌─────────────────────────────────────────────┐
│ Student Promotion - Select Class            │
├─────────────────────────────────────────────┤
│                                             │
│  Current Session: [APR 2024-MAR 2025 ▼]   │
│  Next Session:    APR 2025-MAR 2026        │
│                                             │
│  Class:           [1 ▼]                    │
│  Section:         [A ▼]                    │
│                                             │
│  Next Class:      2 (auto-calculated)      │
│                                             │
│                  [Cancel]  [Next →]        │
└─────────────────────────────────────────────┘
```

---

### Step 2: Review Students

```
┌──────────────────────────────────────────────────────┐
│ Student Promotion - Review                 Step 2/3  │
├──────────────────────────────────────────────────────┤
│  Class 1-A → Class 2 (APR 2025-MAR 2026)            │
│  ☑ Select All  30 students selected                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ☑  2024001  Rahul Kumar      1-A → 2      Promote  │
│  ☑  2024002  Priya Sharma     1-A → 2      Promote  │
│  ☐  2024003  Amit Singh       1-A → 1      Retain   │
│  ☑  2024004  Sneha Gupta      1-A → 2      Promote  │
│  ...                                                 │
│                                                      │
│  Actions:  [⭘ Promote] [⭘ Retain] [⭘ Passout]      │
│                                                      │
│  Summary: 28 Promote, 2 Retain, 0 Passout           │
│                                                      │
│              [← Back]  [Cancel]  [Next →]           │
└──────────────────────────────────────────────────────┘
```

**Features:**
- Checkbox selection
- Select All / Deselect All
- Bulk action buttons
- Real-time summary
- **Passout option** only for Class 10 & 12
- Searchable table

---

### Step 3: Confirm

```
┌─────────────────────────────────────────────┐
│ Student Promotion - Confirm       Step 3/3  │
├─────────────────────────────────────────────┤
│                                             │
│  ⚠️ Review Before Confirming                │
│                                             │
│  Source: Class 1-A (APR 2024-MAR 2025)     │
│  Target: Class 2 (APR 2025-MAR 2026)       │
│                                             │
│  Actions:                                   │
│    → 28 students will be promoted          │
│    → 2 students will be retained           │
│    → 0 students marked as passout          │
│                                             │
│  Additional:                                │
│    ✓ Fee discounts will be carried forward │
│    ✓ Student records will be updated       │
│                                             │
│  ⚠️ This action cannot be undone           │
│                                             │
│        [← Back]  [Cancel]  [Confirm]       │
└─────────────────────────────────────────────┘
```

**After Confirmation:**
- Show progress bar
- Display success/failure for each student
- Show summary report
- Option to download report

---

## Component: Admission Form (Enhanced)

**Route:** `/admissions/new`  
**Changes:** Add session selector

### New Field

**Position:** After Student ID field

```
Session *
[APR 2024-MAR 2025 ▼]
```

**Behavior:**
- Defaults to active session
- Can select different session
- Required field
- Shows only active + setup sessions

---

## Component: Fee Collection (Enhanced)

**Route:** `/fees/collection`  
**Changes:** Auto-use active session's fee structure

### Fee Calculation

**Before:**
```typescript
// Manual fee entry
<TextField label="Amount" />
```

**After:**
```typescript
// Auto-loaded from fee structure
<FeeStructureDisplay 
  studentId={student.id}
  sessionId={activeSession.id}
  showDiscounts={true}
/>
```

**UI:**
```
Student: Rahul Kumar (Class 1-A)
Session: APR 2024-MAR 2025

Fee Structure:
  Tuition Fee:    ₹25,000.00
  (-10% discount) -₹2,500.00
  Computer Fee:   ₹5,000.00
  Activity Fee:   ₹3,000.00
  ───────────────────────────
  Total:          ₹30,500.00

[Proceed to Payment →]
```

---

## Dashboard (Enhanced)

**Route:** `/`  
**Changes:** Add session context

### Session Indicator

**Location:** Dashboard header

```
┌─────────────────────────────────────────────┐
│ Dashboard - APR 2024-MAR 2025        [↻]   │
│ (Switch session in header to view others)   │
└─────────────────────────────────────────────┘
```

**Filtered Stats:**
- Total Students (for selected session)
- Fee Collections (for selected session)
- Recent Activity (for selected session)

---

## User Flows

### Flow 1: Create New Session

1. Admin → Settings → Academic Sessions
2. Click "+ New" button
3. Select start year (auto-fills end year)
4. Check "Setup Mode"
5. Click "Save"
6. Success message shown
7. New session appears in list

---

### Flow 2: Configure Fee Structure

1. Admin → Settings → Fee Structure
2. Select session from dropdown
3. Select class from dropdown
4. Edit fee amounts inline
5. Click "Save All"
6. Confirmation message
7. Repeat for other classes

**Shortcut:**
1. Click "Copy..." button
2. Select source session
3. Apply percentage increase
4. Click "Copy"
5. All classes auto-populated

---

### Flow 3: Promote Students

1. Admin → Operations → Student Promotion
2. **Available:** FEB, MAR, APR only
3. Select current session, class, section
4. Click "Next"
5. Review student table
6. Use checkboxes to select students
7. Choose action (Promote/Retain/Passout)
8. Click "Next"
9. Review summary
10. Click "Confirm"
11. Progress shown
12. Success report displayed

---

### Flow 4: Add Student Discount

1. Navigate to student profile
2. Click "Discounts" tab
3. Click "+ New" button
4. Select session, fee type
5. Choose percentage or fixed
6. Enter amount and reason
7. Enter approver name
8. Click "Add"
9. Discount appears in list
10. **Auto-applied** in fee collection

---

## Design Specifications

### Colors

**Session Indicators:**
- Active: `#4caf50` (green)
- Setup: `#ff9800` (orange)
- Past: `#9e9e9e` (gray)

**Promotion Actions:**
- Promote: `#2196f3` (blue)
- Retain: `#ff9800` (orange)
- Passout: `#9c27b0` (purple)

---

### Typography

**Session Selector:**
- Font: Roboto
- Size: 14px
- Weight: 500

**Table Headers:**
- Font: Roboto
- Size: 12px
- Weight: 600
- Color: `#666`

---

### Responsive Breakpoints

- **Mobile:** < 600px - Stacked layout
- **Tablet:** 600-960px - 2 columns
- **Desktop:** > 960px - Full layout

---

## Accessibility

**WCAG 2.1 AA Compliance:**
- Keyboard navigation for all interactions
- ARIA labels for screen readers
- Focus indicators on all inputs
- Color contrast ratio ≥ 4.5:1
- Form validation messages announced

---

## Loading States

**Session Switch:**
```
⌛ Loading session data...
```

**Fee Structure:**
```
skeleton
skeleton
skeleton
```

**Promotion:**
```
Processing promotion...
⬤⬤⬤⬤⬤⬤⬤○○○ 60% complete
```

---

**Next Steps:**
1. Create figma mockups
2. Build component library
3. Implement pages in phases
4. Conduct usability testing
