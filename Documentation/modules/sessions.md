# 📅 Academic Sessions Module

Manages the school year cycle and active term data.

## Features

### 1. Session Management
- **Active Session**: Only one session can be active at a time (e.g., "2024-2025").
- **Global Context**: The entire application (Admissions, Fees, Exams) filters data based on the currently selected active session.
- **Dates**: Start and End dates define the financial/academic year boundaries.

### 2. Switching Sessions
- Users can switch between sessions via the dropdown in the top navigation bar.
- Useful for viewing historical data from previous years or preparing for the upcoming year.

## Database Schema
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary Key |
| `name` | String | Display Name (e.g., "2024-2025") |
| `startDate` | DateTime | Session start |
| `endDate` | DateTime | Session end |
| `isActive` | Boolean | Flags the default current session |
