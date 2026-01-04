# 📈 Student Promotions Module

Handles the movement of students from one academic session to the next.

## Core Logic

### 1. Criteria
Promotions typically happen at the end of an academic session.
- **Pass/Fail**: Based on exam results (optional criteria).
- **Manual Selection**: Administrators select students eligible for the next class.

### 2. Promotion Workflow
**Route:** `/students/promotions`

1. **Select Source and Target**:
   - Source Session: "2023-2024" | Class: "9" | Section: "A"
   - Target Session: "2024-2025" | Class: "10" | Section: "A"

2. **Select Students**:
   - Checkbox list of all students in the source class.

3. **Promote**:
   - System updates the `classId`, `sectionId` for selected students.
   - **Important**: This is usually a destructive update or a new record creation depending on implementation. In this system, it updates the current student record reference.

### 3. Alumni Management
Students graduating from the final class (e.g., Class 12) are moved to the **Alumni** status instead of a higher class.
