# Report Builder API Documentation

The Report Builder API provides endpoints for generating and exporting reports in various formats (CSV, PDF).

## Base URL

```
http://localhost:3001/api/v1/reports
```

## Authentication

All report endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Generate Report

Generate and download a report in the specified format.

**Endpoint:** `POST /reports/generate`

**Request Body:**

```json
{
  "type": "students",
  "format": "csv",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "classId": "class-id",
  "sectionId": "section-id",
  "status": "active"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Report type: `students`, `attendance`, `fees`, `exams`, or `staff` |
| `format` | string | Yes | Export format: `csv` or `pdf` |
| `startDate` | string (ISO 8601) | No | Start date for filtering (for attendance, fees, exams) |
| `endDate` | string (ISO 8601) | No | End date for filtering (for attendance, fees, exams) |
| `classId` | string | No | Filter by class ID |
| `sectionId` | string | No | Filter by section ID |
| `status` | string | No | Filter by status (active, inactive, pending, paid, etc.) |

**Response:**

The API returns a file download with appropriate headers:

- `Content-Type`: `text/csv` or `application/pdf`
- `Content-Disposition`: `attachment; filename="report-name.ext"`

**Example cURL:**

```bash
curl -X POST http://localhost:3001/api/v1/reports/generate \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "students",
    "format": "csv",
    "status": "active"
  }' \
  --output students-report.csv
```

### 2. Get Report Types

Get a list of all available report types.

**Endpoint:** `GET /reports/types`

**Response:**

```json
[
  "students",
  "attendance",
  "fees",
  "exams",
  "staff"
]
```

**Example cURL:**

```bash
curl -X GET http://localhost:3001/api/v1/reports/types \
  -H "Authorization: Bearer your-jwt-token"
```

## Report Types

### Students Report

Lists all students with their details.

**Fields:**
- Admission Number
- First Name
- Last Name
- Email
- Phone
- Class
- Section
- Status
- Admission Date
- Gender
- Blood Group

**Filters:**
- `sectionId`: Filter by section
- `status`: Filter by status (active, inactive, graduated, transferred)

### Attendance Report

Lists attendance records with student details.

**Fields:**
- Date
- Class
- Section
- Student Name
- Admission Number
- Status (P/A/L/H)
- Note

**Filters:**
- `startDate`: Filter from date
- `endDate`: Filter to date
- `sectionId`: Filter by section

### Fees Report

Lists invoices with payment details.

**Fields:**
- Invoice ID
- Student Name
- Admission Number
- Class
- Section
- Total Amount
- Paid Amount
- Balance
- Status
- Due Date
- Fee Heads

**Filters:**
- `startDate`: Filter from date
- `endDate`: Filter to date
- `status`: Filter by status (pending, paid, partial, overdue, cancelled)

### Exams Report

Lists exam marks with student details.

**Fields:**
- Exam Name
- Term
- Academic Year
- Subject
- Student Name
- Admission Number
- Max Marks
- Obtained Marks
- Grade
- Remarks

**Filters:**
- `startDate`: Filter from date
- `endDate`: Filter to date
- `classId`: Filter by class

### Staff Report

Lists all staff members with their details.

**Fields:**
- Employee Code
- First Name
- Last Name
- Email
- Phone
- Department
- Designation
- Join Date
- Status
- Salary

**Filters:**
- `status`: Filter by status (active, inactive)

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Report generated successfully
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Server error during report generation

**Error Response Format:**

```json
{
  "statusCode": 400,
  "message": "Invalid report type",
  "error": "Bad Request"
}
```

## Rate Limiting

Report generation can be resource-intensive. Consider implementing rate limiting in production:

- Maximum 10 report requests per minute per user
- Maximum 100 report requests per hour per tenant

## Best Practices

1. **Use CSV for large datasets**: CSV files are more efficient for large amounts of data
2. **Apply filters**: Use date ranges and status filters to limit the data returned
3. **Schedule reports**: For regular reports, consider scheduling them during off-peak hours
4. **Cache results**: For frequently requested reports with the same parameters, consider caching the results

## Examples

### Generate Student Report (CSV)

```javascript
const response = await fetch('http://localhost:3001/api/v1/reports/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'students',
    format: 'csv',
    status: 'active'
  })
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'students-report.csv';
a.click();
```

### Generate Attendance Report (PDF)

```javascript
const response = await fetch('http://localhost:3001/api/v1/reports/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'attendance',
    format: 'pdf',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    sectionId: 'section-123'
  })
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
window.open(url);
```

## Security Considerations

1. **Tenant Isolation**: All reports are automatically filtered by the user's tenant ID
2. **Permission Checks**: Ensure users have appropriate permissions to generate reports
3. **Data Sanitization**: All user inputs are validated and sanitized
4. **Audit Logging**: Consider logging all report generation requests for audit purposes

## Future Enhancements

- [ ] Custom report builder with field selection
- [ ] Report scheduling and email delivery
- [ ] Excel (XLSX) export format
- [ ] Charts and graphs in PDF reports
- [ ] Report templates and branding customization
- [ ] Bulk report generation via API
