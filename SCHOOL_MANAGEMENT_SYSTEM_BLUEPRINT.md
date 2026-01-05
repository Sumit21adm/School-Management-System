# School Management System - Complete Application Blueprint

> **Purpose**: This document serves as a comprehensive reference/prompt for building a similar School Management System from scratch. It covers architecture, modules, database design, and implementation details.

---

## 🎯 PROJECT OVERVIEW

A full-stack **School Management System** (ERP) designed for K-12 educational institutions to manage students, fees, examinations, academic sessions, and administrative tasks.

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **UI Library** | Material UI (MUI) v5/v6 |
| **State Management** | React Query (TanStack Query) |
| **Backend** | NestJS (Node.js + TypeScript) |
| **Database** | MySQL with Prisma ORM |
| **Authentication** | JWT (JSON Web Tokens) |
| **PDF Generation** | PDFKit |

---

## 📁 PROJECT STRUCTURE

```
school-management-system/
├── school-management-api/          # Backend (NestJS)
│   ├── src/
│   │   ├── admissions/             # Student admission module
│   │   ├── auth/                   # Authentication & JWT
│   │   ├── dashboard/              # Dashboard stats
│   │   ├── discounts/              # Student fee discounts
│   │   ├── examination/            # Exams & schedules
│   │   ├── fee-structure/          # Class-wise fee setup
│   │   ├── fee-types/              # Fee type definitions
│   │   ├── fees/                   # Fee collection & receipts
│   │   ├── modules/classes/        # Class management
│   │   ├── modules/subjects/       # Subject management
│   │   ├── print-settings/         # School branding
│   │   ├── promotions/             # Student year promotions
│   │   ├── sessions/               # Academic sessions
│   │   ├── users/                  # User management
│   │   └── prisma.service.ts       # Database service
│   └── prisma/
│       ├── schema.prisma           # Database schema
│       └── seed.ts                 # Initial data seeding
│
├── school-management-system/       # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/             # Reusable components
│   │   ├── contexts/               # React contexts
│   │   ├── lib/                    # API client & utilities
│   │   ├── pages/                  # Page components
│   │   │   ├── admissions/
│   │   │   ├── examination/
│   │   │   ├── fees/
│   │   │   ├── promotions/
│   │   │   ├── settings/
│   │   │   └── students/
│   │   ├── App.tsx                 # Main routing
│   │   └── theme.ts                # MUI theme config
│   └── vite.config.ts
```

---

## 🗄️ DATABASE SCHEMA (Prisma)

### Core Models

#### 1. Users & Authentication
```prisma
model User {
  id          Int       @id @default(autoincrement())
  username    String    @unique
  password    String                    // bcrypt hashed
  role        UserRole  @default(RECEPTIONIST)
  permissions String?   @db.Text        // JSON array
  name        String
  email       String?
  phone       String?
  active      Boolean   @default(true)
  lastLogin   DateTime?
}

enum UserRole {
  SUPER_ADMIN    // Full access
  ADMIN          // Administrative access
  ACCOUNTANT     // Fee management
  TEACHER        // Limited access
  COORDINATOR    // Student & exam management
  RECEPTIONIST   // Front desk
}
```

#### 2. Students
```prisma
model StudentDetails {
  id               Int       @id @default(autoincrement())
  studentId        String    @unique     // e.g., "2024001"
  name             String
  fatherName       String
  motherName       String
  dob              DateTime
  gender           String                // Male/Female/Other
  className        String                // Current class
  section          String                // A, B, C, etc.
  admissionDate    DateTime
  address          String
  phone            String
  email            String?
  photoUrl         String?
  status           String    @default("active")  // active/passout/left
  aadharCardNo     String?   @unique
  category         String    @default("NA")      // General/OBC/SC/ST
  religion         String?
  sessionId        Int?                  // Admission session
  
  // Parent details
  fatherOccupation  String?
  motherOccupation  String?
  fatherAadharNo    String?
  fatherPanNo       String?
  motherAadharNo    String?
  motherPanNo       String?
  
  // Guardian (if different from parents)
  guardianRelation  String?
  guardianName      String?
  guardianPhone     String?
  
  // Relations
  feeTransactions   FeeTransaction[]
  discounts         StudentFeeDiscount[]
  demandBills       DemandBill[]
  academicHistory   StudentAcademicHistory[]
}
```

#### 3. Academic Sessions
```prisma
model AcademicSession {
  id          Int      @id @default(autoincrement())
  name        String   @unique         // "APR 2024-MAR 2025"
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean  @default(false) // Only one active at a time
  isSetupMode Boolean  @default(false)
  
  // Relations
  students        StudentDetails[]
  feeStructures   FeeStructure[]
  feeTransactions FeeTransaction[]
  demandBills     DemandBill[]
  exams           Exam[]
}
```

#### 4. Fee Management
```prisma
model FeeType {
  id          Int      @id @default(autoincrement())
  name        String   @unique         // "Tuition Fee", "Computer Fee"
  description String?
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)
  isRecurring Boolean  @default(false)
  frequency   String?                  // Monthly/Yearly/One-time/Refundable
}

model FeeStructure {
  id          Int      @id @default(autoincrement())
  sessionId   Int
  className   String                   // Class this applies to
  feeItems    FeeStructureItem[]
  
  @@unique([sessionId, className])
}

model FeeStructureItem {
  id          Int      @id @default(autoincrement())
  structureId Int
  feeTypeId   Int
  amount      Decimal
  isOptional  Boolean  @default(false)
  frequency   String?                  // Monthly/Quarterly/Yearly
}

model FeeTransaction {
  id            Int      @id @default(autoincrement())
  transactionId String   @unique
  studentId     String
  sessionId     Int
  receiptNo     String   @unique
  amount        Decimal
  description   String
  paymentMode   String               // Cash/UPI/Card/Bank Transfer
  date          DateTime
  collectedBy   String?
  paymentDetails FeePaymentDetail[]
}

model DemandBill {
  id            Int        @id @default(autoincrement())
  billNo        String     @unique
  studentId     String
  sessionId     Int
  month         Int
  year          Int
  billDate      DateTime
  dueDate       DateTime
  totalAmount   Decimal
  previousDues  Decimal    @default(0)
  advanceUsed   Decimal    @default(0)
  lateFee       Decimal    @default(0)
  discount      Decimal    @default(0)
  netAmount     Decimal
  paidAmount    Decimal    @default(0)
  status        BillStatus @default(PENDING)
  billItems     DemandBillItem[]
}

enum BillStatus {
  PENDING
  SENT
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
}
```

#### 5. Examination
```prisma
model ExamType {
  id          Int      @id @default(autoincrement())
  name        String   @unique   // "Weekly Test", "Annual Exam"
  description String?
  isActive    Boolean  @default(true)
  exams       Exam[]
}

model Subject {
  id          Int      @id @default(autoincrement())
  name        String   @unique   // "Mathematics"
  code        String?  @unique   // "MATH"
  color       String?            // Hex color for UI
  isActive    Boolean  @default(true)
}

model Exam {
  id          Int      @id @default(autoincrement())
  name        String               // "Annual Examination 2024"
  examTypeId  Int
  sessionId   Int
  startDate   DateTime
  endDate     DateTime
  status      String   @default("UPCOMING")  // UPCOMING/ONGOING/COMPLETED
  schedules   ExamSchedule[]
}

model ExamSchedule {
  id          Int      @id @default(autoincrement())
  examId      Int
  subjectId   Int
  className   String
  date        DateTime
  startTime   DateTime
  endTime     DateTime
  roomNo      String?
}
```

#### 6. School Configuration
```prisma
model SchoolClass {
  id          Int      @id @default(autoincrement())
  name        String   @unique    // "1", "LKG"
  displayName String              // "Class 1", "LKG / Mount 2"
  order       Int      @default(0)
  capacity    Int?
  isActive    Boolean  @default(true)
}

model PrintSettings {
  id              Int      @id @default(autoincrement())
  schoolName      String
  schoolAddress   String
  phone           String?
  email           String?
  website         String?
  logoUrl         String?
  tagline         String?
  affiliationNo   String?
  affiliationNote String?          // "Affiliated to CBSE"
  demandBillNote  String?          // Footer note for bills
  feeReceiptNote  String?          // Footer note for receipts
}
```

---

## 🔌 API ENDPOINTS

### Authentication
```
POST   /auth/login           # Login with username/password
POST   /auth/logout          # Logout
GET    /auth/me              # Get current user
```

### Students/Admissions
```
GET    /admissions           # List students (with filters)
POST   /admissions           # Create student (multipart/form-data)
GET    /admissions/:id       # Get student details
PUT    /admissions/:id       # Update student
DELETE /admissions/:id       # Soft delete student
PATCH  /admissions/:id/restore  # Restore deleted student
GET    /admissions/export    # Export to Excel
POST   /admissions/import    # Import from Excel
GET    /admissions/template  # Download import template
GET    /admissions/dashboard-stats  # Admission statistics
GET    /admissions/sections/:className  # Available sections
```

### Fee Management
```
GET    /fee-types            # List fee types
POST   /fee-types            # Create fee type
PUT    /fee-types/:id        # Update fee type
DELETE /fee-types/:id        # Delete fee type

GET    /fee-structure/:sessionId/:className    # Get class fee structure
PUT    /fee-structure/:sessionId/:className    # Update fee structure
POST   /fee-structure/copy                      # Copy structure between classes

POST   /fees/collect         # Collect fee payment
GET    /fees/transactions    # List transactions
GET    /fees/receipt/:receiptNo      # Get receipt details
GET    /fees/receipt/:receiptNo/pdf  # Download receipt PDF
GET    /fees/dues/:studentId         # Get student dues
GET    /fees/fee-book/:studentId/session/:sessionId  # Fee book

POST   /fees/generate-demand-bills   # Generate demand bills
GET    /fees/demand-bills            # List demand bills
GET    /fees/demand-bill/:billNo/pdf # Download demand bill PDF
POST   /fees/demand-bills/batch-pdf  # Batch print demand bills
```

### Sessions
```
GET    /sessions             # List all sessions
GET    /sessions/active      # Get active session
POST   /sessions             # Create session
PUT    /sessions/:id         # Update session
POST   /sessions/:id/activate  # Set as active session
DELETE /sessions/:id         # Delete session
```

### Promotions
```
GET    /promotions/preview   # Preview students for promotion
POST   /promotions/execute   # Execute batch promotion
```

### Examinations
```
GET    /exam-types           # List exam types
POST   /exam-types           # Create exam type
PUT    /exam-types/:id       # Update exam type

GET    /subjects             # List subjects
POST   /subjects             # Create subject

GET    /exams                # List exams
POST   /exams                # Create exam
PUT    /exams/:id            # Update exam
POST   /exams/:id/schedule   # Add exam schedule
DELETE /exams/schedule/:scheduleId  # Delete schedule
```

### Users & Settings
```
GET    /users                # List users
POST   /users                # Create user
PUT    /users/:id            # Update user
PUT    /users/:id/password   # Change password
DELETE /users/:id            # Delete user

GET    /classes              # List classes
POST   /classes              # Create class
PUT    /classes/:id          # Update class
POST   /classes/reorder      # Reorder classes

GET    /print-settings       # Get school settings
PUT    /print-settings       # Update settings
POST   /print-settings/logo  # Upload logo

GET    /dashboard/stats      # Dashboard statistics
```

---

## 🎨 FRONTEND MODULES

### 1. Authentication
- Login page with gradient background
- JWT token stored in localStorage
- Auto-logout on 401 responses
- Role-based route protection

### 2. Dashboard
- Statistics cards (total students, fees collected, pending dues)
- Quick actions
- Recent activity
- Session-aware data

### 3. Admissions Module
- Student list with search, filters, pagination
- Detailed admission form with:
  - Personal details
  - Parent information
  - Guardian details (optional)
  - Photo upload with cropping
  - Document numbers (Aadhar, PAN)
- Bulk import from Excel
- Export functionality

### 4. Fee Management
**Fee Structure Setup:**
- Configure fees per class per session
- Fee types: Monthly, Yearly, One-time, Refundable
- Copy structure between classes

**Fee Collection:**
- Search student
- Show pending dues
- Multi-fee-type payment in single transaction
- Payment modes: Cash, UPI, Card, Bank Transfer
- Auto-apply discounts
- Generate and print receipt (PDF)

**Demand Bills:**
- Generate monthly demand bills
- Batch generation per class/section
- Track bill status (Pending → Paid)
- Batch PDF printing

**Reports:**
- Daily collection report
- Outstanding dues report
- Bill history
- Fee type analysis

### 5. Student Discounts
- Percentage or fixed amount discounts
- Per fee type, per student, per session
- Approval tracking

### 6. Promotions
- End-of-year class promotions
- Bulk promotion with preview
- Mark as passout option
- Academic history tracking

### 7. Examinations
- Exam types configuration
- Subject management with color coding
- Exam creation with schedules
- Date/time/room assignment per subject per class

### 8. Settings
- Academic sessions management
- Class management (reorderable)
- User management with role-based permissions
- School branding (logo, name, address, notes)

---

## 🔐 ROLE-BASED PERMISSIONS

```typescript
const ROLE_DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: ['*'],  // Full access
  ADMIN: [
    'dashboard_view', 'dashboard_stats',
    'admissions_view', 'admissions_create', 'admissions_edit', 'admissions_delete',
    'fees_view', 'fees_collect', 'fees_receipts', 'fees_refund',
    'demand_bills_view', 'demand_bills_generate', 'demand_bills_print',
    'fee_structure_view', 'fee_structure_edit',
    'exams_view', 'exams_create', 'exams_edit',
    'sessions_view', 'sessions_manage', 'school_settings',
  ],
  ACCOUNTANT: [
    'dashboard_view',
    'fees_view', 'fees_collect', 'fees_receipts',
    'demand_bills_view', 'demand_bills_generate',
    'fee_structure_view',
  ],
  TEACHER: [
    'dashboard_view',
    'admissions_view',
    'exams_view', 'exams_edit',
  ],
  RECEPTIONIST: [
    'dashboard_view',
    'admissions_view', 'admissions_create',
    'fees_view', 'fees_collect',
  ],
};
```

---

## 🔧 KEY IMPLEMENTATION PATTERNS

### 1. API Client Setup (Frontend)
```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 2. Session Context (Frontend)
```typescript
const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionService.getAll(true),
  });

  const allSessions = sessionsData?.sessions || [];
  const activeSession = allSessions.find(s => s.isActive);
  
  // Allow user to switch between sessions for historical data access
  const [selectedSession, setSelectedSession] = useState(activeSession);
  
  return (
    <SessionContext.Provider value={{ activeSession, selectedSession, switchSession }}>
      {children}
    </SessionContext.Provider>
  );
}
```

### 3. Protected Routes
```typescript
function App() {
  const [isAuthenticated] = useState(() => !!localStorage.getItem('authToken'));

  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? <Login /> : <Navigate to="/" />
      } />
      
      <Route element={
        isAuthenticated ? <Layout /> : <Navigate to="/login" />
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admissions" element={<AdmissionList />} />
        {/* ... other protected routes */}
      </Route>
    </Routes>
  );
}
```

### 4. Receipt/Bill PDF Generation (Backend)
```typescript
async generateReceiptPdf(receiptNo: string): Promise<Buffer> {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  // Fetch receipt and school settings
  const receipt = await this.getReceipt(receiptNo);
  const settings = await this.prisma.printSettings.findFirst();
  
  // Add logo
  if (settings?.logoUrl) {
    doc.image(logoPath, 50, 50, { width: 60 });
  }
  
  // School name and address
  doc.fontSize(16).font('Helvetica-Bold').text(settings.schoolName, { align: 'center' });
  doc.fontSize(10).text(settings.schoolAddress, { align: 'center' });
  
  // Receipt details table
  doc.fontSize(12).text('FEE RECEIPT', { align: 'center', underline: true });
  
  // Student info, fee breakdown, totals, etc.
  // ...
  
  return await this.getBuffer(doc);
}
```

---

## 🚀 SETUP & DEPLOYMENT

### Development Setup
```bash
# Backend
cd school-management-api
npm install
cp .env.example .env  # Configure DATABASE_URL
npx prisma migrate dev
npm run seed
npm run start:dev     # Runs on port 3001

# Frontend
cd school-management-system
npm install
cp .env.example .env  # Set VITE_API_URL
npm run dev           # Runs on port 5173
```

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL="mysql://user:password@localhost:3306/school_db"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="24h"
PORT=3001
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3001
```

### Default Credentials
```
Username: superadmin
Password: admin123
```

---

## 📋 FEATURE CHECKLIST FOR NEW BUILD

### Core
- [ ] User authentication (JWT)
- [ ] Role-based access control
- [ ] Academic session management
- [ ] Class/section management

### Students
- [ ] Student registration form
- [ ] Photo upload with cropping
- [ ] Search and filters
- [ ] Bulk import/export (Excel)
- [ ] Status tracking (active/passout/left)

### Fees
- [ ] Fee type configuration
- [ ] Class-wise fee structure setup
- [ ] Fee collection with receipts
- [ ] Demand bill generation
- [ ] PDF receipt/bill generation
- [ ] Payment tracking
- [ ] Discount management
- [ ] Outstanding dues reports

### Academics
- [ ] Subject management
- [ ] Exam type configuration
- [ ] Exam scheduling
- [ ] Student promotions

### Settings
- [ ] School branding (logo, name, address)
- [ ] Print settings (receipt notes, etc.)
- [ ] User management

### UI/UX
- [ ] Responsive design
- [ ] Dark/Light theme toggle
- [ ] Data tables with pagination
- [ ] Form validation
- [ ] Loading states
- [ ] Error boundaries

---

## 💡 PRO TIPS

1. **Use React Query** for server state - handles caching, refetching, and loading states automatically

2. **Session-scoped data** - Always filter data by `sessionId` to support multi-year data

3. **Soft deletes** - Use `status` field instead of hard deletes for students

4. **Unique IDs** - Generate human-readable IDs (e.g., `2024001`, `RCP-2024-0001`) alongside auto-increment IDs

5. **PDF generation** - Use PDFKit on backend; it's more reliable than client-side generation

6. **Form validation** - Validate on both frontend (UX) and backend (security)

7. **Offline support** - Consider IndexedDB for offline data caching in school environments with unreliable internet

---

*This blueprint was extracted from a production School Management System. Adapt as needed for your specific requirements.*
