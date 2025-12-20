# 📅 Session Management Logic

The `AcademicSession` is the time-scope for almost all data in the system.

## The "Active Scope" Concept
The application UI always runs within the context of an **Active Session**.

- **Global Filter**: When a user logs in, the backend injects the `activeSessionId` into queries.
- **Switching**: The session switcher in the UI header changes this context.

## Data Scope Matrix

| Module | Scoped by Session? | Behavior |
|--------|--------------------|----------|
| **Students** | YES | Shows students enrolled *in that year*. |
| **Fees** | YES | Shows transactions & dues for that financial year. |
| **Exams** | YES | Exams are linked to specific sessions. |
| **Inventory** | NO | Stock is a continuous asset, not reset yearly. |
| **Users** | NO | Admin accounts exist across sessions. |

## New Session Creation
When creating a new session:
1. `FeeStructure` must be cloned or defined for the new year.
2. `Classes` and `Sections` carry over.
3. `Students` must be explicitly promoted (they don't auto-appear).
