# 📈 Promotion Logic

The promotion process is a critical academic event that transitions students from one Session to another.

## Algorithm

1. **Source Selection**:
   - Admin selects `Current Session` (e.g., 2023-24).
   - Filters students by `Class` (e.g., Class 9) and `Section` (A).

2. **Target Definition**:
   - Admin defines `Target Session` (e.g., 2024-25).
   - Defines `Target Class` (e.g., Class 10) and `Target Section` (A).

3. **Status Assessment**:
   - **Promoted**: Moves to Target Class/Session.
   - **Retained/Detained**: Stays in Source Class but moving to New Session time-frame.
   - **Graduated**: Used for final year students (moved to Alumni).

## Data Operation
- The system does **NOT** just update the student record.
- It creates a **Snapshot** in `StudentAcademicHistory` for the old session.
- Then updates the `StudentDetails` (classId, sessionId) to reflect the new state.

## Constraints
- A student cannot be promoted if they have outstanding "Blocker Dues" (configurable).
- A student cannot explicitly belong to two active sessions simultaneously.
