# Fees & Payments Module - Sprint 4

This module implements a complete fees and payments management system for the School Management System, including invoice generation, payment processing, and reporting.

## Features

### Backend API

#### 1. Fee Heads Management
- **Endpoint**: `/api/v1/fee-heads`
- **Operations**: CRUD (Create, Read, Update, Delete)
- **Purpose**: Define fee categories (e.g., Tuition Fee, Transport Fee, Library Fee)

**Example Request:**
```bash
# Create Fee Head
POST /api/v1/fee-heads
{
  "name": "Tuition Fee",
  "description": "Monthly tuition fee"
}

# Get All Fee Heads
GET /api/v1/fee-heads

# Get Single Fee Head
GET /api/v1/fee-heads/:id

# Update Fee Head
PATCH /api/v1/fee-heads/:id
{
  "name": "Updated Fee Name"
}

# Delete Fee Head
DELETE /api/v1/fee-heads/:id
```

#### 2. Fee Plans Management
- **Endpoint**: `/api/v1/fee-plans`
- **Operations**: CRUD with fee plan items
- **Purpose**: Create fee structures for specific classes and academic years

**Example Request:**
```bash
# Create Fee Plan
POST /api/v1/fee-plans
{
  "name": "Grade 10 Annual Fee Plan",
  "classId": "class_id_here",
  "academicYearId": "academic_year_id_here",
  "items": [
    {
      "feeHeadId": "fee_head_id_1",
      "amount": "5000.00",
      "dueDate": "2025-04-01"
    },
    {
      "feeHeadId": "fee_head_id_2",
      "amount": "2000.00",
      "dueDate": "2025-04-01"
    }
  ]
}

# Get Fee Plans with Filters
GET /api/v1/fee-plans?classId=xxx&academicYearId=yyy
```

#### 3. Invoices Management
- **Endpoint**: `/api/v1/invoices`
- **Operations**: CRUD, bulk generation, status updates, stats
- **Purpose**: Generate and manage student invoices

**Example Requests:**
```bash
# Create Single Invoice
POST /api/v1/invoices
{
  "studentId": "student_id_here",
  "dueDate": "2025-05-01",
  "items": [
    {
      "feeHeadId": "fee_head_id_1",
      "amount": "5000.00"
    }
  ]
}

# Bulk Generate Invoices
POST /api/v1/invoices/bulk-generate
{
  "feePlanId": "fee_plan_id_here",
  "classId": "class_id_here"  // Or sectionId or studentIds[]
}

# Get Invoices with Filters
GET /api/v1/invoices?status=pending&studentId=xxx

# Update Invoice Status
PATCH /api/v1/invoices/:id/status
{
  "status": "paid"
}

# Get Invoice Statistics
GET /api/v1/invoices/stats
```

**Response (Stats):**
```json
{
  "total": 150,
  "pending": 45,
  "paid": 95,
  "overdue": 10,
  "totalAmount": "750000.00",
  "paidAmount": "475000.00"
}
```

#### 4. Payments Management
- **Endpoint**: `/api/v1/payments`
- **Operations**: Create payment, initiate online payment, webhook processing
- **Purpose**: Record and process payments for invoices

**Example Requests:**
```bash
# Create Direct Payment (Cash/Card)
POST /api/v1/payments
{
  "invoiceId": "invoice_id_here",
  "amount": "5000.00",
  "method": "cash",
  "txnRef": "CASH-2025-001"
}

# Initiate Online Payment
POST /api/v1/payments/initiate/:invoiceId
# Returns checkout URL and transaction reference

# Process Payment Webhook (No auth required)
POST /api/v1/payments/webhook
{
  "txnRef": "TXN-1234567890",
  "invoiceId": "invoice_id_here",
  "status": "success",
  "amount": "5000.00"
}

# Get Payments
GET /api/v1/payments?invoiceId=xxx&status=success

# Get Payment Statistics
GET /api/v1/payments/stats
```

### Frontend UI

#### 1. Fee Heads Management
- **Route**: `/fees` → Fee Heads Tab
- **Features**:
  - List all fee heads in a table
  - Create new fee head with modal dialog
  - Edit existing fee heads
  - Delete fee heads
  - Search and filter

#### 2. Invoices Management
- **Route**: `/fees` → Invoices Tab
- **Features**:
  - Dashboard with statistics cards (Total, Pending, Paid, Overdue)
  - Filter invoices by status
  - View invoice details
  - Bulk invoice generation
  - Payment initiation
  - Status badges with color coding

#### 3. Main Fees Page
- **Route**: `/fees`
- **Features**:
  - Tabbed interface for different fee management sections
  - Responsive design with Tailwind CSS
  - Real-time data updates
  - Loading states and error handling

### Architecture

#### Backend Structure
```
apps/api/src/
├── fee-heads/
│   ├── dto/
│   │   ├── create-fee-head.dto.ts
│   │   └── update-fee-head.dto.ts
│   ├── fee-heads.controller.ts
│   ├── fee-heads.service.ts
│   └── fee-heads.module.ts
├── fee-plans/
│   ├── dto/
│   │   ├── create-fee-plan.dto.ts
│   │   └── update-fee-plan.dto.ts
│   ├── fee-plans.controller.ts
│   ├── fee-plans.service.ts
│   └── fee-plans.module.ts
├── invoices/
│   ├── dto/
│   │   ├── create-invoice.dto.ts
│   │   └── bulk-generate-invoice.dto.ts
│   ├── invoices.controller.ts
│   ├── invoices.service.ts
│   └── invoices.module.ts
└── payments/
    ├── dto/
    │   ├── create-payment.dto.ts
    │   └── webhook-payload.dto.ts
    ├── payments.controller.ts
    ├── payments.service.ts
    └── payments.module.ts
```

#### Frontend Structure
```
apps/web/src/
├── lib/
│   └── api/
│       └── client.ts              # Axios client with auth
├── services/
│   └── fees.service.ts            # API service layer
└── pages/
    └── fees/
        ├── FeesPage.tsx           # Main fees page with tabs
        ├── FeeHeadsPage.tsx       # Fee heads management
        └── InvoicesPage.tsx       # Invoices dashboard
```

### Database Schema

The module uses the following Prisma models:

- `FeeHead`: Fee categories
- `FeePlan`: Fee structures per class/year
- `FeePlanItem`: Individual items in a fee plan
- `Invoice`: Student invoices
- `InvoiceItem`: Line items in an invoice
- `Payment`: Payment records

All models include:
- Multi-tenancy support (`tenantId`)
- Timestamps (`createdAt`, `updatedAt`)
- Proper relationships and indexes

### Security

1. **Authentication**: All endpoints (except webhook) require JWT authentication
2. **Authorization**: Tenant isolation - users can only access their tenant's data
3. **Validation**: Input validation using class-validator DTOs
4. **Error Handling**: Proper error messages and HTTP status codes

### Payment Gateway Integration (Stub)

The payment module includes a stub implementation for payment gateway integration:

1. **Initiate Payment**: Returns a mock checkout URL
2. **Webhook Endpoint**: Processes payment status updates
3. **Transaction Reference**: Unique reference for each payment

To integrate with real payment gateways (Razorpay/Stripe):
- Update `initiatePayment` method in `payments.service.ts`
- Add gateway SDK dependencies
- Configure API keys in environment variables
- Implement signature verification for webhooks

### API Authentication

All API requests require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

The token should be obtained from the `/api/v1/auth/login` endpoint.

### Environment Variables

```env
# Backend (apps/api/.env)
DATABASE_URL="mysql://username:password@localhost:3306/school_management"
JWT_SECRET="change-this-to-a-secure-secret-key"
JWT_EXPIRATION="7d"
PORT=3001

# Frontend (apps/web/.env)
VITE_API_URL="http://localhost:3001/api/v1"
```

**Security Note**: Never commit actual secrets to version control. Use a secure secret management system in production.

### Testing

#### Manual Testing with cURL

```bash
# 1. Login to get token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'

# 2. Create Fee Head
curl -X POST http://localhost:3001/api/v1/fee-heads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name":"Tuition Fee","description":"Monthly tuition"}'

# 3. Get All Fee Heads
curl -X GET http://localhost:3001/api/v1/fee-heads \
  -H "Authorization: Bearer <your-token>"
```

### Future Enhancements

- [ ] Receipt PDF generation
- [ ] Email notifications for invoices
- [ ] Payment reminders
- [ ] Late fee calculation
- [ ] Discount/scholarship management
- [ ] Payment plans (installments)
- [ ] Accounting journal integration
- [ ] Advanced reporting and analytics
- [ ] Export to Excel/CSV
- [ ] Payment reconciliation

### Troubleshooting

#### Common Issues

1. **CORS errors**: Ensure the API allows requests from your frontend origin
2. **401 Unauthorized**: Check if JWT token is valid and not expired
3. **404 Not Found**: Verify the API URL and endpoint paths
4. **Validation errors**: Check that all required fields are provided

### Contributing

When adding new features to this module:

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include validation in DTOs
4. Update this documentation
5. Test all endpoints manually
6. Ensure proper error handling

### Support

For issues or questions about this module, refer to:
- Project README: `/README.md`
- API Documentation: `http://localhost:{PORT}/api/v1/docs` (when available, where PORT is from your .env)
- Database Schema: `/apps/api/prisma/schema.prisma`
