# Development Guide - School Management System

## Development Environment Setup

### Prerequisites
- Node.js 20.x or higher
- Docker Desktop
- Git
- Code editor (VS Code recommended)

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd School-Management-System

# Install dependencies (automatic via run script)
./run-mac.sh
```

## Project Architecture

### Backend (NestJS)

#### Module Structure
Each feature follows NestJS module pattern:
```
src/
├── module-name/
│   ├── module-name.module.ts      # Module definition
│   ├── module-name.controller.ts  # HTTP endpoints
│   ├── module-name.service.ts     # Business logic
│   └── dto/                        # Data Transfer Objects
│       ├── create-*.dto.ts
│       └── update-*.dto.ts
```

#### Adding a New Module
```bash
cd school-management-api
nest g module module-name
nest g controller module-name
nest g service module-name
```

#### Database Changes
```bash
# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name description_of_change

# 3. Generate Prisma client
npx prisma generate

# 4. Update seed.ts if needed
# 5. Re-seed database
npx prisma db seed
```

### Frontend (React + TypeScript)

#### Component Structure
```
src/
├── pages/                  # Page components
│   └── module/
│       └── PageName.tsx
├── components/            # Reusable components
│   └── module/
│       └── ComponentName.tsx
├── lib/
│   └── api.ts            # API client
└── contexts/             # React contexts
```

#### Adding a New Page
1. Create component in `src/pages/module/`
2. Add route in router configuration
3. Add API service in `src/lib/api.ts`
4. Use React Query for data fetching

#### API Integration Pattern
```typescript
// In api.ts
export const moduleService = {
  getAll: async () => {
    const { data } = await apiClient.get('/endpoint');
    return data;
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post('/endpoint', payload);
    return data;
  },
};

// In component
const { data, isLoading } = useQuery({
  queryKey: ['module'],
  queryFn: moduleService.getAll,
});

const mutation = useMutation({
  mutationFn: moduleService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['module'] });
  },
});
```

## Database Schema Guidelines

### Naming Conventions
- **Tables:** snake_case (e.g., `school_classes`, `fee_types`)
- **Columns:** camelCase in Prisma, snake_case in DB
- **Relations:** Descriptive names (e.g., `classSubjects`)

### Common Patterns
```prisma
model Example {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(100)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("examples")
}
```

### Relationships
- Use `@relation` for foreign keys
- Add `onDelete: Cascade` for dependent data
- Use `onDelete: SetNull` for optional references

## Code Style & Standards

### TypeScript
- Use strict type checking
- Avoid `any` type when possible
- Define interfaces for complex objects
- Use enums for fixed values

### React Components
- Functional components with hooks
- Use TypeScript for props
- Extract reusable logic into custom hooks
- Keep components focused (single responsibility)

### API Endpoints
- RESTful conventions
- Use proper HTTP methods (GET, POST, PATCH, DELETE)
- Return consistent response formats
- Handle errors gracefully

## Testing Strategy

### Manual Testing Checklist
- [ ] Create operation works
- [ ] Read/List operation works
- [ ] Update operation works
- [ ] Delete operation works
- [ ] Validation works (required fields, formats)
- [ ] Error handling works
- [ ] UI is responsive
- [ ] Data persists after refresh

### Database Testing
```bash
# View data in Prisma Studio
npx prisma studio

# Check database directly
docker exec -it school-mysql mysql -u school_user -p
# Password: school_pass
USE school_management;
SHOW TABLES;
SELECT * FROM table_name;
```

## Common Development Tasks

### Adding a New Subject-Related Feature

**Example: Class-Subject Assignment**

1. **Database Schema** (already done)
```prisma
model ClassSubject {
  id            Int      @id @default(autoincrement())
  classId       Int
  subjectId     Int
  isCompulsory  Boolean  @default(true)
  weeklyPeriods Int      @default(0)
  // ... relations
}
```

2. **Backend API**
```bash
cd school-management-api/src
# Create DTOs
# Create service methods
# Create controller endpoints
# Register in module
```

3. **Frontend UI**
```bash
cd school-management-system/src
# Add API service
# Create component
# Add to page
# Test functionality
```

### Debugging Tips

#### Backend Issues
```bash
# Check API logs
tail -f logs/api.log

# Test endpoint directly
curl http://localhost:3001/endpoint

# Check database state
npx prisma studio
```

#### Frontend Issues
- Open browser DevTools (F12)
- Check Console for errors
- Check Network tab for API calls
- Use React DevTools extension

### Performance Optimization

#### Database
- Add indexes for frequently queried fields
- Use `select` to limit returned fields
- Use `include` wisely (avoid N+1 queries)
- Batch operations when possible

#### Frontend
- Use React Query caching
- Implement pagination for large lists
- Lazy load components
- Optimize re-renders with `useMemo`/`useCallback`

## Deployment Considerations

### Environment Variables
```env
# Backend (.env)
DATABASE_URL="mysql://user:pass@localhost:3306/db"
JWT_SECRET="your-secret-key"
PORT=3001

# Frontend (.env)
VITE_API_URL=http://localhost:3001
```

### Production Checklist
- [ ] Update environment variables
- [ ] Build frontend (`npm run build`)
- [ ] Run database migrations
- [ ] Seed initial data
- [ ] Configure CORS properly
- [ ] Set up SSL/HTTPS
- [ ] Configure backup strategy
- [ ] Set up monitoring/logging

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check MySQL container
docker ps
docker start school-mysql

# Verify connection
npx prisma db push
```

**Port Already in Use**
```bash
# Find process using port
lsof -i :3001  # or :5173

# Kill process
kill -9 <PID>
```

**Prisma Client Out of Sync**
```bash
npx prisma generate
```

**Dependencies Issues**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Resources

### Documentation
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Material-UI Docs](https://mui.com/)

### Tools
- [Prisma Studio](http://localhost:5555) - Database GUI
- [Postman](https://www.postman.com/) - API testing
- [React DevTools](https://react.dev/learn/react-developer-tools)

---

**Need Help?** Check the [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current features and roadmap.
