# Finalized Specifications - Academic Year/Session Management

**Version:** 1.0  
**Date:** 2025-12-04  
**Status:** ✅ Approved

---

## 1. Academic Session Format

### Session Naming
- **Format:** `APR YYYY-MAR YYYY`
- **Example:** "APR 2024-MAR 2025"
- **Duration:** April 1st to March 31st (12 months)
- **Rationale:** Aligns with standard Indian academic calendar

### Session Properties
- **Start Date:** Always April 1st
- **End Date:** Always March 31st of following year
- **Active Session:** Only ONE session can be active at a time
- **Setup Mode:** Can create/configure next session while current is active
- **Historical Access:** Admin can switch sessions to view past data

---

## 2. Fee Structure Management

### Core Requirements
- ✅ **Fully Customizable:** Complete control over all fee amounts
- ✅ **Class-wise:** Different fee structures for each class (1-12)
- ✅ **Session-wise:** Fee amounts can change per academic year
- ✅ **Unlimited Fee Types:** Admin can add custom fee types beyond defaults

### Default Fee Types
1. Tuition Fee
2. Computer Fee
3. Activity Fee
4. Exam Fee
5. Library Fee
6. Sports Fee
7. Miscellaneous Fee

**Note:** These are seeded by default but fully editable/deletable

### Fee Application Logic
- **New Admission:** Uses active session's fee structure
- **Fee Collection:** Auto-applies active session's structure
- **Session Selector:** Available in admission form for mid-year entries

---

## 3. Student Discount Management

### Discount Types
- **Percentage-based:** e.g., 10% of fee type
- **Fixed Amount:** e.g., ₹500 off
- **Per Fee Type:** Can discount specific fee types (e.g., tuition only)
- **Session-specific:** Discounts tied to academic session

### Discount Carry-forward Logic
When student is promoted to next session:
1. ✅ Copy all existing discounts to new session
2. ✅ Apply discounts to new class fee structure
3. ✅ Maintain discount percentage/amount
4. ✅ Update session ID link
5. ✅ Keep discount reason/notes

**Example:**
- Current: Class 5, Tuition discount = 10%
- Promoted to: Class 6
- Result: Class 6 tuition discount = 10% (auto-carried)

---

## 4. Student Promotion System

### Promotion Timing
- **Available During:** February, March, April
- **Triggered By:** Admin action (not automatic)
- **Frequency:** Once per academic year (year-end)

### Promotion Process
1. **Select Source:**
   - Current session
   - Class (1-12)
   - Section (A, B, C, etc.)

2. **Review Students:**
   - Table view with all students
   - Checkboxes for selection
   - "Select All" / "Deselect All" buttons
   - Shows current class → next class

3. **Actions Available:**
   - **Promote:** Move to next class in next session
   - **Mark Passout:** (Class 10 & 12 only)
   - **Do Nothing:** Keep in current class

4. **Execute:**
   - Batch process all selected students
   - Show progress indicator
   - Discounts auto-carry forward

### Next Class Mapping
```
Class 1  → Class 2
Class 2  → Class 3
...
Class 9  → Class 10
Class 10 → Class 11 (or Passout)
Class 11 → Class 12
Class 12 → Passout only
```

---

## 5. Passout/Inactive Logic

### Applicability
- ✅ **Class 10:** Option to mark passout
- ✅ **Class 12:** Option to mark passout
- ❌ **Other Classes:** No passout option

### Passout Actions
When student is marked passout:
1. Student `status` = "Passed"
2. Student `isActive` = false
3. Cannot be promoted further
4. Cannot be edited (read-only)
5. Appears in historical records only

### UI Safeguards
- Confirmation dialog before marking passout
- Warning: "This action cannot be undone"
- Requires admin authentication
- Bulk passout available with review

---

## 6. Session Overlap & Setup

### Concurrent Sessions
- ✅ **Allowed:** Can create next session while current is active
- ✅ **Setup Mode:** Mark session as "In Setup" vs "Active"
- ❌ **Multiple Active:** Only ONE session can be active

### Setup Workflow
1. Create new session (e.g., "APR 2025-MAR 2026")
2. Mark as "Setup Mode"
3. Configure fee structures
4. Set up initial data
5. When ready: Activate new session (deactivates current)

---

## 7. Mid-Year Admission

### Session Selection
- ✅ **Session Selector:** Dropdown in admission form
- ✅ **Default:** Active session pre-selected
- ✅ **Override:** Can select different session if needed
- ✅ **Validation:** Must select a session (required field)

### Use Cases
- Late admission after term started
- Transfer student from another school
- Re-admission after gap year

---

## 8. Historical Data Access

### Session Switching
- **Location:** Header dropdown (always visible)
- **Options:** All sessions (active + past)
- **Indicator:** Current selected session clearly shown
- **Persistence:** Selection saved per browser session

### Filtered Data
When session is switched:
- Dashboard stats filtered by selected session
- Admissions list filtered by selected session
- Fee transactions filtered by selected session
- Reports generated for selected session

### Permissions
- **Admin:** Full access to all sessions
- **Staff:** Access based on role (future)

---

## 9. Data Integrity Rules

### Constraints
- ✅ Session dates cannot overlap
- ✅ Active session must be valid (not expired if enforced)
- ✅ Cannot delete session with student/fee data
- ✅ Student must belong to exactly one session (admission)
- ✅ Fee transaction must belong to exactly one session

### Validations
- Session name must be unique
- Start date must be April 1st
- End date must be March 31st
- End date must be after start date

---

## 10. Migration Strategy

### Existing Data
All existing student admissions and fee transactions will be:
1. Assigned to default session: "APR 2024-MAR 2025"
2. Migrated automatically via database script
3. Verified post-migration

### Backwards Compatibility
- Old fee transactions without session → assigned to default
- Students without session → assigned to active session
- No data loss guaranteed

---

## Technical Requirements

### Performance
- Session switching must be instant (<200ms)
- Bulk promotion must handle 500+ students efficiently
- Fee structure updates must be atomic

### Security
- Session activation requires admin role
- Passout marking requires confirmation
- Audit log for all session changes

### Scalability
- Support 10+ years of historical sessions
- Handle 5000+ students per session
- Efficient queries with proper indexing

---

## Open Items

See **[QUESTIONS.md](./QUESTIONS.md)** for any remaining questions or decisions needed.

---

**Approval Signatures:**
- Product Owner: ✅ Approved
- Development Lead: 📝 Pending Review
- Database Admin: 📝 Pending Review

**Next Steps:**
1. Review database schema design
2. Create API specifications
3. Begin Phase 1 implementation
