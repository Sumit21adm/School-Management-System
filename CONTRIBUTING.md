# Contributing to School Management System

First off, thank you for considering contributing to the School Management System! It's people like you that make this project better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or pnpm
- Git
- MySQL 8+ (via Docker or local installation)
- Basic knowledge of TypeScript, React, and NestJS

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/School-Management-System.git
   cd School-Management-System
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd apps/web && npm install
   cd ../api && npm install
   ```

3. **Setup Database**
   ```bash
   # Using Docker (recommended)
   docker-compose up -d
   
   # Generate Prisma Client
   cd apps/api
   npx prisma generate
   npx prisma db push
   npm run prisma:seed
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd apps/api
   npm run start:dev
   
   # Terminal 2 - Frontend
   cd apps/web
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in your feature branch
2. Test your changes thoroughly
3. Update documentation if needed
4. Commit your changes following our commit guidelines
5. Push to your fork
6. Create a Pull Request

## Project Structure

```
School-Management-System/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/           # Authentication module
│   │   │   ├── students/       # Students module
│   │   │   ├── classes/        # Classes module
│   │   │   ├── prisma/         # Prisma service
│   │   │   └── common/         # Shared code
│   │   └── prisma/
│   │       └── schema.prisma   # Database schema
│   │
│   └── web/                    # React Frontend
│       ├── src/
│       │   ├── pages/          # Page components
│       │   ├── components/     # Reusable components
│       │   ├── services/       # API services
│       │   └── hooks/          # Custom hooks
│       └── public/
│
└── packages/                   # Shared packages
```

### Adding a New Feature Module

#### Backend (NestJS)

1. **Generate Module**
   ```bash
   cd apps/api
   nest g module moduleName
   nest g service moduleName
   nest g controller moduleName
   ```

2. **Update Database Schema**
   Edit `apps/api/prisma/schema.prisma`:
   ```prisma
   model YourModel {
     id        String   @id @default(cuid())
     tenantId  String
     // ... fields
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   
     @@index([tenantId])
     @@map("your_table_name")
   }
   ```

3. **Push Schema Changes**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Implement Service**
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { PrismaService } from '../prisma/prisma.service';
   
   @Injectable()
   export class YourService {
     constructor(private prisma: PrismaService) {}
     
     async findAll(tenantId: string) {
       return this.prisma.yourModel.findMany({
         where: { tenantId },
       });
     }
   }
   ```

5. **Implement Controller**
   ```typescript
   import { Controller, Get, UseGuards, Request } from '@nestjs/common';
   import { AuthGuard } from '@nestjs/passport';
   
   @Controller('your-route')
   @UseGuards(AuthGuard('jwt'))
   export class YourController {
     constructor(private service: YourService) {}
     
     @Get()
     findAll(@Request() req: any) {
       return this.service.findAll(req.user.tenantId);
     }
   }
   ```

#### Frontend (React)

1. **Create Page Component**
   ```typescript
   // apps/web/src/pages/YourPage.tsx
   export default function YourPage() {
     return (
       <div className="container mx-auto p-6">
         <h1 className="text-2xl font-bold">Your Page</h1>
       </div>
     );
   }
   ```

2. **Add Route**
   ```typescript
   // apps/web/src/App.tsx
   <Route path="/your-route" element={<YourPage />} />
   ```

3. **Create API Service**
   ```typescript
   // apps/web/src/services/yourService.ts
   import axios from 'axios';
   
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
   
   export const yourService = {
     getAll: async (token: string) => {
       const response = await axios.get(`${API_URL}/your-route`, {
         headers: { Authorization: `Bearer ${token}` }
       });
       return response.data;
     },
   };
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for data structures
- Avoid `any` type when possible (use specific types)
- Use meaningful variable and function names

### React

- Use functional components with hooks
- Keep components small and focused
- Use custom hooks for reusable logic
- Follow the Single Responsibility Principle

### NestJS

- Use dependency injection
- Keep controllers thin (business logic in services)
- Use DTOs for request/response validation
- Apply guards for authentication/authorization

### Styling

- Use Tailwind CSS utility classes
- Follow the existing design system
- Ensure responsive design (mobile-first)
- Test on different screen sizes

### Code Formatting

We use Prettier and ESLint:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix lint issues
npm run lint -- --fix
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(students): add bulk student import feature

Implemented CSV import functionality for students with validation
and error handling.

Closes #123
```

```bash
fix(auth): resolve JWT token expiration issue

Fixed token refresh logic to prevent premature expiration.

Fixes #456
```

## Pull Request Process

### Before Submitting

1. **Update your branch** with the latest develop branch
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-feature-branch
   git rebase develop
   ```

2. **Run all tests**
   ```bash
   npm run test
   ```

3. **Lint and format your code**
   ```bash
   npm run lint
   npm run format
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

### PR Guidelines

1. **Clear Title**: Use a descriptive title following commit convention
2. **Description**: Explain what and why, not how
3. **Screenshots**: Include screenshots for UI changes
4. **Tests**: Add tests for new features
5. **Documentation**: Update relevant documentation
6. **Breaking Changes**: Clearly mark any breaking changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review performed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

1. At least one maintainer approval required
2. All CI checks must pass
3. No unresolved conversations
4. Squash commits before merge (if needed)

## Testing

### Backend Tests

```bash
cd apps/api

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Tests

```bash
cd apps/web

# Unit tests
npm run test

# Component tests
npm run test:watch
```

### Writing Tests

#### Backend Example

```typescript
describe('StudentsService', () => {
  let service: StudentsService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [StudentsService, PrismaService],
    }).compile();
    
    service = module.get<StudentsService>(StudentsService);
  });
  
  it('should find all students', async () => {
    const result = await service.findAll('tenant-id');
    expect(result).toBeDefined();
  });
});
```

#### Frontend Example

```typescript
import { render, screen } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Explain complex logic with inline comments
- Keep comments up-to-date with code changes

### README Updates

When adding significant features:
1. Update main README.md
2. Add feature documentation if needed
3. Update API documentation

### API Documentation

Document new endpoints:

```typescript
/**
 * Get all students
 * @route GET /api/v1/students
 * @access Private
 * @param {string} tenantId - Tenant identifier
 * @param {object} filters - Optional filters
 * @returns {Promise<Student[]>} List of students
 */
```

## Questions?

- Open an issue for bugs
- Start a discussion for questions
- Join our community chat (coming soon)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project website (coming soon)

Thank you for contributing! 🎉
