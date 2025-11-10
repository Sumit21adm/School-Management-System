# Student Admissions Process Guide

## Overview

This guide outlines the complete process for admitting new students into the School Management System, from initial registration to generating student ID cards.

## Admission Workflow

### 1. Pre-Admission Planning

Before admitting students:

- [ ] Define admission criteria
- [ ] Set up academic year
- [ ] Create classes and sections
- [ ] Determine section capacity
- [ ] Prepare admission numbers scheme
- [ ] Define required documents
- [ ] Set up fee structure

### 2. Single Student Admission

For admitting individual students:

#### Step 2.1: Navigate to Add Student

1. Log in to the system
2. Go to **Students** → **Add Student**
3. Or use the "+" button on the students page

#### Step 2.2: Fill Student Information

**Basic Information:**
- First Name (required)
- Last Name (required)
- Email (required, unique)
- Password (required, minimum 6 characters)
- Phone number (optional)

**Academic Information:**
- Admission Number (required, unique)
- Admission Date (defaults to today)
- Class/Section (optional, can assign later)

**Personal Information:**
- Date of Birth (recommended)
- Gender
- Blood Group
- Address

**Custom Fields:**
- Additional information as needed
- Previous school
- Medical conditions
- Special needs
- Emergency contacts

#### Step 2.3: Review and Submit

1. Review all entered information
2. Click "Create Student"
3. System will validate and create the student record
4. User account is automatically created

#### Step 2.4: Assign to Section

If section wasn't assigned during creation:

1. Go to student detail page
2. Click "Edit"
3. Select appropriate section
4. Save changes

#### Step 2.5: Link Guardians

1. From student detail page
2. Click "Link Guardian"
3. Either:
   - Select existing guardian, OR
   - Create new guardian first
4. Specify relationship (father/mother/guardian)
5. Mark as primary guardian if applicable
6. Save the link

### 3. Bulk Student Admission (CSV Import)

For admitting multiple students at once:

#### Step 3.1: Prepare Student Data

1. Download CSV template
2. Fill in student information
3. Ensure all required fields are complete
4. Validate data quality

Required fields:
- admissionNo
- firstName
- lastName
- email

Refer to the [Student Import Guide](STUDENT_IMPORT_GUIDE.md) for detailed instructions.

#### Step 3.2: Import Students

1. Navigate to **Students** → **Import CSV**
2. Set default password for all students
3. Upload prepared CSV file
4. Click "Import Students"
5. Wait for processing

#### Step 3.3: Review Import Results

- Check successful imports
- Review any failed imports
- Note error messages
- Fix errors and re-import if needed

#### Step 3.4: Post-Import Tasks

1. Assign sections to students without sections
2. Link guardians to students
3. Update any missing information
4. Generate student ID cards

## Guardian Management

### Creating Guardians

#### Individual Guardian Creation

1. Navigate to **Guardians** → **Add Guardian**
2. Fill in guardian information:
   - First Name (required)
   - Last Name (required)
   - Email (required, unique)
   - Password (required)
   - Phone
   - Occupation
   - Address
3. Click "Create Guardian"

#### During Student Admission

Guardians can be created while admitting a student by:
1. Creating the guardian first
2. Then linking during or after student creation

### Linking Guardians to Students

#### From Student Detail Page

1. Open student detail page
2. Click "Link Guardian"
3. Select guardian from list
4. Choose relationship type:
   - Father
   - Mother
   - Guardian
   - Other
5. Mark as primary if this is the main contact
6. Save

#### Primary Guardian

- Each student should have one primary guardian
- Primary guardian is the main point of contact
- Used for communications and emergency situations
- System automatically unsets other primary guardians when a new one is marked

### Managing Multiple Children

One guardian can be linked to multiple students:

1. Create guardian once
2. Link to first student
3. Link same guardian to other students
4. Each link can have different relationship type
5. Primary status is per student

## Student ID Card Generation

### Individual ID Card

1. Open student detail page
2. Click "ID Card" button (download icon)
3. PDF will be automatically downloaded
4. Print and laminate as needed

### ID Card Features

- Student photo placeholder
- Full name
- Admission number
- Class and section
- Blood group
- QR code for verification
- Issue date

### QR Code

The QR code contains:
- Student ID
- Admission number
- Student name

Can be scanned for:
- Quick student lookup
- Attendance marking
- Library access
- Gate entry/exit tracking

## Admission Status Management

### Student Status Types

- **Active**: Currently enrolled, attending classes
- **Inactive**: Temporarily not attending (medical leave, suspension)
- **Graduated**: Completed all requirements, moved on
- **Transferred**: Moved to another institution

### Changing Status

1. Open student detail page
2. Click "Edit"
3. Update status field
4. Save changes

### Status Implications

**Active Students:**
- Appear in class lists
- Can mark attendance
- Can enroll in exams
- Generate fees

**Inactive Students:**
- Hidden from active lists
- Cannot mark attendance
- Retained in system
- Can be reactivated

**Graduated Students:**
- Moved to alumni records
- No longer in active class
- Data preserved for records

**Transferred Students:**
- Marked as left institution
- Records preserved
- Can note destination school in custom fields

## Section Assignment

### Initial Assignment

Can be done:
- During student creation
- After creation via edit
- During CSV import

### Reassignment

To move student to different section:

1. Open student detail page
2. Click "Edit"
3. Change section selection
4. Save
5. System updates records automatically

### Section Capacity

- Each section has a capacity limit
- System tracks current enrollment
- Warnings shown when approaching capacity
- Can be overridden if necessary

## Custom Fields Usage

Custom fields allow storing additional information:

### Example Use Cases

**Previous Education:**
```json
{
  "previousSchool": "ABC Elementary",
  "previousGrade": "Grade 5",
  "transferDate": "2024-01-15",
  "reasonForTransfer": "Family relocation"
}
```

**Medical Information:**
```json
{
  "medicalConditions": "Asthma",
  "allergies": "Peanuts, dairy",
  "medications": "Inhaler as needed",
  "emergencyContact": "+9876543210",
  "doctorName": "Dr. Smith",
  "doctorPhone": "+1234567890"
}
```

**Special Requirements:**
```json
{
  "specialNeeds": "Hearing impairment",
  "accommodations": "Front row seating",
  "transportRequired": true,
  "busRoute": "Route 5",
  "pickupTime": "07:30 AM"
}
```

**Additional Contacts:**
```json
{
  "emergencyContact1": "Grandparent - +1111111111",
  "emergencyContact2": "Aunt - +2222222222",
  "pickupAuthorized": ["John Doe", "Jane Doe", "Mary Smith"]
}
```

## Admission Checklist

Use this checklist for each new student:

- [ ] Student information collected and verified
- [ ] Admission number assigned
- [ ] Student record created in system
- [ ] Section assigned
- [ ] Guardian(s) created and linked
- [ ] Primary guardian designated
- [ ] Emergency contacts recorded
- [ ] Medical information documented
- [ ] Special requirements noted
- [ ] Fee plan assigned
- [ ] Student ID card generated
- [ ] Login credentials provided to guardian
- [ ] Welcome packet sent
- [ ] Orientation scheduled

## Best Practices

### Data Quality

- Verify all information before entry
- Use consistent naming conventions
- Ensure email addresses are valid and accessible
- Double-check admission numbers for uniqueness
- Validate phone numbers format

### Communication

- Inform guardians about system access
- Provide login credentials securely
- Send orientation materials
- Explain platform features
- Share important dates and schedules

### Security

- Use strong passwords
- Don't share credentials via insecure channels
- Require password change on first login (if implemented)
- Regularly review access logs
- Maintain data privacy

### Documentation

- Keep physical copies of admission documents
- Link digital documents if possible
- Maintain audit trail
- Document any special arrangements
- Record communication with guardians

### Follow-up

- Verify guardian first login
- Check student attendance in first week
- Confirm section assignment appropriate
- Ensure all required information collected
- Address any issues promptly

## Reporting

### Admission Reports

Track admissions using:

1. **Dashboard Stats** - Overall numbers
2. **Student List** - Filter by admission date
3. **Section Reports** - Enrollment by section
4. **Custom Reports** - As needed

### Key Metrics

- Total students admitted
- Admissions by date
- Admissions by class/section
- Pending admissions
- Incomplete records

## Troubleshooting

### Common Issues

**Cannot Create Student:**
- Email already exists → Use different email
- Admission number duplicate → Assign unique number
- Validation error → Check all required fields

**Section Assignment Failed:**
- Section doesn't exist → Create section first
- Section at capacity → Override or choose different section
- Invalid class/section → Verify correct academic year

**Guardian Linking Failed:**
- Guardian doesn't exist → Create guardian first
- Already linked → Cannot link same guardian twice
- Invalid relationship → Use valid relationship type

**ID Card Not Generating:**
- Student data incomplete → Fill required fields
- Server error → Contact administrator
- PDF download blocked → Check browser settings

## Support

For assistance with admissions:

1. Refer to this guide
2. Check [Student Import Guide](STUDENT_IMPORT_GUIDE.md)
3. Review [API Documentation](API_STUDENTS_GUARDIANS.md)
4. Contact system administrator
5. Submit support ticket if needed
