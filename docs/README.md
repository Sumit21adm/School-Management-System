# Documentation Index

Welcome to the School Management System documentation!

## Quick Links

### Getting Started
- **[Project Status & Roadmap](./PROJECT_STATUS.md)** - Current features, planned features, and project timeline
- **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Setup, architecture, and development guidelines

### Implementation Guides
- **[Phase 2: Timetable Management](./PHASE_2_GUIDE.md)** - Detailed guide for implementing timetable features

## Documentation Structure

```
docs/
├── README.md                  # This file
├── PROJECT_STATUS.md          # Current status and roadmap
├── DEVELOPMENT_GUIDE.md       # Development setup and guidelines
└── PHASE_2_GUIDE.md          # Phase 2 implementation guide
```

## Key Information

### Current Version
**v1.0.0 - Pilot Release**
- Status: Ready for testing
- Last Updated: December 23, 2024

### Quick Access

**Application URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Prisma Studio: http://localhost:5555

**Default Login:**
- Username: `superadmin`
- Password: `admin123`

**Run Application:**
```bash
./run-mac.sh
```

### What's Completed

✅ Student Management
✅ Fee Management (Complete workflow)
✅ Subject Management (CRUD operations)
✅ Class Management (Read-only)
✅ Academic Sessions
✅ User Roles & Permissions
✅ Basic Examination Module

### What's Next

🚧 Phase 2: Timetable & Scheduling
- Class-subject assignments
- Teacher-subject assignments
- Class timetable builder
- Teacher routine auto-generation

## For New Developers

1. Read [PROJECT_STATUS.md](./PROJECT_STATUS.md) to understand current state
2. Follow [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for setup
3. Check [PHASE_2_GUIDE.md](./PHASE_2_GUIDE.md) for next features

## For Returning to Project

1. Check [PROJECT_STATUS.md](./PROJECT_STATUS.md) for latest updates
2. Review "Next Steps" section
3. Follow implementation guides for planned features

## Support

### Common Tasks
- **Reset Database:** See DEVELOPMENT_GUIDE.md → Database Changes
- **Add New Module:** See DEVELOPMENT_GUIDE.md → Adding a New Module
- **Debug Issues:** See DEVELOPMENT_GUIDE.md → Troubleshooting

### Resources
- NestJS: https://docs.nestjs.com/
- Prisma: https://www.prisma.io/docs
- React Query: https://tanstack.com/query/latest
- Material-UI: https://mui.com/

---

**Questions?** Check the relevant guide or create an issue in the repository.
