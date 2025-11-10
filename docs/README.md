# Documentation

This directory contains comprehensive documentation for the School Management System.

## Sprint 2 - Students & Guardians Documentation

### Quick Links

- **[Sprint 2 Summary](SPRINT2_SUMMARY.md)** - Complete implementation overview
- **[API Documentation](API_STUDENTS_GUARDIANS.md)** - All API endpoints
- **[Admissions Guide](ADMISSIONS_PROCESS.md)** - Step-by-step admission process
- **[CSV Import Guide](STUDENT_IMPORT_GUIDE.md)** - Bulk import instructions

## Getting Started

### For Administrators

1. Start with the [Admissions Process Guide](ADMISSIONS_PROCESS.md) to understand the complete workflow
2. Review the [CSV Import Guide](STUDENT_IMPORT_GUIDE.md) if you need to import multiple students
3. Use the [API Documentation](API_STUDENTS_GUARDIANS.md) for technical integration

### For Developers

1. Read the [Sprint 2 Summary](SPRINT2_SUMMARY.md) for implementation details
2. Refer to [API Documentation](API_STUDENTS_GUARDIANS.md) for endpoint specifications
3. Check the source code for DTOs and service implementations

## Document Overview

### SPRINT2_SUMMARY.md
**Purpose:** Complete technical summary of Sprint 2 implementation

**Contents:**
- Implementation scope and status
- Technical details and architecture
- Files created and modified
- Testing status
- Known limitations
- Future enhancements
- Deployment notes
- Security summary

**Audience:** Developers, project managers, technical leads

---

### API_STUDENTS_GUARDIANS.md
**Purpose:** Technical API reference for Students and Guardians modules

**Contents:**
- Authentication requirements
- All API endpoints with examples
- Request/response formats
- Error codes and responses
- Custom fields usage
- Notes and best practices

**Audience:** Frontend developers, API consumers, integration developers

---

### ADMISSIONS_PROCESS.md
**Purpose:** Complete guide for admitting students into the system

**Contents:**
- Admission workflow
- Single student admission process
- Bulk admission via CSV
- Guardian management
- Section assignment
- Student ID card generation
- Status management
- Custom fields examples
- Admission checklist
- Best practices
- Troubleshooting

**Audience:** School administrators, admission officers, data entry staff

---

### STUDENT_IMPORT_GUIDE.md
**Purpose:** Detailed instructions for CSV bulk import

**Contents:**
- CSV file format specification
- Required and optional columns
- Example CSV data
- Step-by-step import process
- Error handling and troubleshooting
- Tips for large imports
- Data validation guidelines
- Post-import tasks
- Best practices

**Audience:** School administrators, data entry staff, IT support

## Common Tasks

### Import Students from CSV
1. Read the [CSV Import Guide](STUDENT_IMPORT_GUIDE.md)
2. Download the template from the import page
3. Fill in your data
4. Follow the import process

### Create Individual Student
1. See "Single Student Admission" in [Admissions Guide](ADMISSIONS_PROCESS.md)
2. Navigate to Students → Add Student
3. Fill in the form
4. Link guardians after creation

### Link Guardian to Student
1. Create the guardian first (if not exists)
2. Open student detail page
3. Click "Link Guardian"
4. Select guardian and relationship
5. Save

### Generate Student ID Card
1. Open student detail page
2. Click "ID Card" button
3. PDF will download automatically

### API Integration
1. Review [API Documentation](API_STUDENTS_GUARDIANS.md)
2. Get JWT token from authentication
3. Use token in Authorization header
4. Make API calls to endpoints

## Support

For additional help:

1. Check the relevant documentation above
2. Review code comments in source files
3. Contact system administrator
4. Submit support ticket

## Contributing to Documentation

When adding or updating documentation:

1. Use clear, concise language
2. Include examples where appropriate
3. Keep formatting consistent
4. Update this README if adding new docs
5. Test all code examples
6. Include troubleshooting sections

## Version History

- **v1.0** (November 2024) - Sprint 2 documentation
  - API Documentation
  - Admissions Process Guide
  - CSV Import Guide
  - Sprint Summary

## Related Documentation

- [Main README](../README.md) - Project overview and setup
- [Project Description](../Project%20Description.txt) - Full feature roadmap
- [Quick Start Guide](../QUICKSTART.md) - Getting started quickly
- [Deployment Guide](../DEPLOYMENT.md) - Production deployment
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute

## Feedback

We welcome feedback on our documentation:

- Submit issues for errors or unclear sections
- Suggest improvements via pull requests
- Share use cases that should be documented
- Report missing information

---

**Note:** This documentation reflects the state of Sprint 2 implementation. Features may evolve in future sprints.
