# Student CSV Import Guide

## Overview

The Student CSV Import feature allows you to bulk import multiple students into the system at once. This guide will walk you through the process.

## CSV File Format

### Required Columns

The following columns are **required** in your CSV file:

- `admissionNo` - Unique admission number for the student
- `firstName` - Student's first name
- `lastName` - Student's last name
- `email` - Student's email address (must be unique)

### Optional Columns

These columns are optional but recommended:

- `phone` - Contact phone number
- `dob` - Date of birth (format: YYYY-MM-DD, e.g., 2010-05-15)
- `gender` - Gender (male, female, or other)
- `bloodGroup` - Blood group (A+, A-, B+, B-, O+, O-, AB+, AB-)
- `address` - Residential address
- `className` - Class name (e.g., "Grade 1", "Grade 2")
- `sectionName` - Section name (e.g., "A", "B", "C")

### Column Order

The column order doesn't matter as long as the header row correctly identifies each column.

## Example CSV File

```csv
admissionNo,firstName,lastName,email,phone,dob,gender,bloodGroup,address,className,sectionName
STU001,John,Doe,john.doe@example.com,1234567890,2010-05-15,male,A+,123 Main St,Grade 1,A
STU002,Jane,Smith,jane.smith@example.com,9876543210,2010-08-20,female,B+,456 Oak Ave,Grade 1,B
STU003,Michael,Johnson,michael.j@example.com,5551234567,2009-12-10,male,O+,789 Elm Rd,Grade 2,A
STU004,Emily,Williams,emily.w@example.com,,2011-03-25,female,,321 Pine Ln,Grade 1,C
STU005,David,Brown,david.brown@example.com,4447778888,2010-07-18,male,AB+,654 Maple Dr,,
```

## Import Process

### Step 1: Prepare Your CSV File

1. Download the template from the import page
2. Fill in your student data
3. Ensure all required fields are populated
4. Verify email addresses and admission numbers are unique
5. Save the file with a `.csv` extension

### Step 2: Access the Import Page

1. Navigate to Students → Import CSV
2. Or go directly to `/students/import`

### Step 3: Set Default Password

Before uploading, set a default password that will be assigned to all imported students. 

**Recommendations:**
- Use a strong, secure password
- Document this password securely
- Plan to force students to change their password on first login (if implementing this feature)

**Example passwords:**
- `Student@2024!`
- `Welcome123!`
- `TempPass2024`

### Step 4: Upload CSV File

1. Click "Choose File" and select your prepared CSV file
2. Review the default password
3. Click "Import Students"

### Step 5: Review Results

After import, you'll see a detailed report showing:

- **Successful imports** - Students that were created successfully
- **Failed imports** - Students that could not be imported, with error messages

Common error reasons:
- Duplicate email address
- Duplicate admission number
- Invalid email format
- Missing required fields
- Invalid class or section name

### Step 6: Handle Errors

For any failed imports:

1. Note the error message
2. Correct the data in your CSV file
3. Create a new CSV with only the failed rows
4. Re-import the corrected data

## Important Notes

### Email Addresses

- Must be unique across all students in your school
- Must be valid email format
- Will be used for student login

### Admission Numbers

- Must be unique across all students in your school
- Cannot be changed after creation
- Use a consistent numbering scheme

### Classes and Sections

- If `className` and `sectionName` are provided, the system will attempt to find a matching section
- If the section is not found, the student will be created without a section assigned
- Sections can be assigned later from the student detail page

### Password Security

- All imported students will have the same initial password
- Consider implementing a password change requirement on first login
- Store the default password securely
- Communicate login credentials to students/guardians securely

## Tips for Large Imports

### Import in Batches

For very large datasets (500+ students):

1. Split your CSV into batches of 100-200 students
2. Import one batch at a time
3. Review results after each batch
4. This makes it easier to identify and fix errors

### Data Validation

Before importing:

1. Check for duplicate values in Excel/Google Sheets
2. Verify email format using spreadsheet formulas
3. Ensure dates are in correct format (YYYY-MM-DD)
4. Trim extra spaces from all fields

### Backup First

Before a large import:

1. Create a database backup
2. Test with a small sample first (5-10 students)
3. Verify the test import worked correctly
4. Then proceed with the full import

## Troubleshooting

### Import Takes Too Long

- Split into smaller batches
- Check your internet connection
- Ensure server has adequate resources

### All Students Failing

- Verify CSV format is correct
- Check that header row matches expected columns
- Ensure file encoding is UTF-8
- Try with the provided template

### Some Students Fail

- Check error messages for each failed row
- Common issues:
  - Email already exists in system
  - Admission number already exists
  - Invalid date format
  - Class/section doesn't exist

### Successful Import But Students Can't Login

- Verify you remember the default password used
- Check that student status is "active"
- Verify email addresses are correct
- Check authentication settings

## Post-Import Tasks

After a successful import:

1. **Verify Student Records**
   - Spot-check several student records
   - Verify all data was imported correctly
   - Check that sections were assigned properly

2. **Assign Missing Sections**
   - Filter students with no section
   - Manually assign sections as needed

3. **Link Guardians**
   - Use the guardian linking feature
   - Associate students with their parents/guardians

4. **Generate ID Cards**
   - Bulk generate ID cards if needed
   - Download and print for distribution

5. **Communicate Credentials**
   - Securely share login information with students/guardians
   - Include instructions for first-time login

6. **Monitor First Logins**
   - Track which students have logged in
   - Follow up with those who haven't

## Example: Complete Import Workflow

1. **Preparation**
   ```
   - Export student data from previous system
   - Clean and format data in Excel
   - Map fields to required columns
   - Save as CSV
   ```

2. **Test Import**
   ```
   - Create test CSV with 5 students
   - Import test data
   - Verify all fields correct
   - Delete test students
   ```

3. **Production Import**
   ```
   - Upload full CSV file
   - Set password: "Welcome2024!"
   - Click Import
   - Review results
   ```

4. **Error Handling**
   ```
   - 3 failures due to duplicate emails
   - Update email addresses
   - Re-import failed students
   - All successful
   ```

5. **Post-Import**
   ```
   - Assign sections to 5 students without sections
   - Link guardians for 50 students
   - Generate ID cards for all
   - Email credentials to guardians
   ```

## Support

If you encounter issues during import:

1. Review this guide thoroughly
2. Check the error messages carefully
3. Verify your CSV format matches the template
4. Contact system administrator if needed

## Best Practices

- **Plan Ahead**: Prepare and validate data before importing
- **Test First**: Always test with a small sample
- **Backup**: Create backups before large imports
- **Document**: Keep records of import dates and default passwords
- **Communicate**: Inform stakeholders about the import process
- **Follow Up**: Monitor system after import for issues
