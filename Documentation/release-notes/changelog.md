# 📝 Changelog

All notable changes to the School Management System will be documented in this file.

## [v2.1.0] - Simplified Setup & UX Improvements (December 2024)
- **New**: Hybrid run scripts (`run-mac.sh`, `run-linux.sh`, `run-windows.bat`)
  - MySQL runs in Docker, app runs with npm/node
  - No system MySQL installation required
- **New**: Session name auto-generation from selected dates
- **Removed**: Old Docker-only and make-based scripts
- **Removed**: Unused Turborepo configuration
- **Improved**: Simplified project structure and documentation

## [v2.0.0] - Enhanced Fee Management (Current Release)
- **New Feature**: Multi-head fee collection (Tuition + Transport + Others in one receipt).
- **New Feature**: Demand Bill Generation (Monthly/Batch).
- **New Feature**: Fee Dashboard merged into Student Details.
- **Improved**: Receipt layout standardized (A6 size).
- **Fixed**: Floating label issues in Settings forms.

## [v1.0.0] - Pilot Release
- **Modules**: Admissions, Fees (Basic), Exams, Inventory.
- **Core**: Offline-first architecture with Dexie.js.
- **UI**: Material UI implementation with Responsive Design.
- **Backend**: NestJS + Prisma setup with MySQL.
