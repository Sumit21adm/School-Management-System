# Open Questions & Decisions

Track open questions and pending decisions for Session Management feature.

---

## Open Questions

### None Currently
All specifications have been finalized as of 2025-12-04.

---

## Recently Resolved

### Q1: Session Format
**Question:** What format should academic sessions use?  
**Resolved:** 2025-12-04  
**Decision:** "APR YYYY-MAR YYYY" format (e.g., "APR 2024-MAR 2025")  
**Rationale:** Aligns with Indian academic calendar (April to March)

### Q2: Session Overlap
**Question:** Can admin set up next session while current is active?  
**Resolved:** 2025-12-04  
**Decision:** Yes, allowed with "Setup Mode" flag  
**Rationale:** Enables advance planning without disrupting current operations

### Q3: Promotion Timing
**Question:** When should student promotions occur?  
**Resolved:** 2025-12-04  
**Decision:** Available during FEB, MAR, APR  
**Rationale:** Aligns with typical academic year-end processes

### Q4: Fee Auto-application
**Question:** Should fee collection auto-use active session's structure?  
**Resolved:** 2025-12-04  
**Decision:** Yes, automatically uses active session  
**Rationale:** Simplifies fee collection, reduces manual selection

### Q5: Discount Migration
**Question:** What happens to student discounts during promotion?  
**Resolved:** 2025-12-04  
**Decision:** Auto-carry forward to next session with new class structure  
**Rationale:** Maintains student benefits across academic years

### Q6: Passout Students
**Question:** How to handle Class 12 students after promotion?  
**Resolved:** 2025-12-04  
**Decision:** 
- Available for Class 10 & 12 only
- Marks as "Passed" + "Inactive"
- Cannot be promoted once marked
**Rationale:** Prevents accidental re-entry, maintains data integrity

### Q7: Mid-Year Admissions
**Question:** Which session for students joining mid-year?  
**Resolved:** 2025-12-04  
**Decision:** Session selector in admission form (defaults to active)  
**Rationale:** Flexibility for late/transfer admissions

### Q8: Fee Customization
**Question:** How customizable should fee structures be?  
**Resolved:** 2025-12-04  
**Decision:** Fully customizable - all amounts, all fee types  
**Rationale:** Different schools have different needs

---

## Future Considerations

### For Phase 2+
- **Multi-school support:** Different sessions per school?
- **Fee installments:** Multiple payments per session?
- **Auto-promotion rules:** Criteria-based auto-promotion?
- **Session templates:** Copy entire session setup?

---

## How to Use This File

1. **New Question:** Add to "Open Questions" section
2. **Discussion:** Add notes/options under question
3. **Decision Made:** Move to "Recently Resolved" with date
4. **Implementation:** Reference decision in code/docs

---

**Last Updated:** 2025-12-04
