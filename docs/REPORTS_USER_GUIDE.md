# Report Builder User Guide

This guide will help you understand how to use the Report Builder feature in the School Management System to generate and export various reports.

## Accessing the Report Builder

1. Log in to your dashboard
2. Click on the **Reports** menu item in the sidebar
3. You'll be taken to the Report Builder page

## Generating Reports

### Step 1: Select Report Type

Choose the type of report you want to generate:

- **Students Report**: Comprehensive list of all students with their details
- **Attendance Report**: Student attendance records with dates and status
- **Fees Report**: Invoice and payment details for students
- **Exams Report**: Exam results and marks for students
- **Staff Report**: List of all staff members with their details

Click on the card corresponding to the report type you need.

### Step 2: Choose Export Format

Select how you want to export your report:

- **CSV**: Best for importing into spreadsheet applications like Excel or Google Sheets
- **PDF**: Professional, printable document format ideal for sharing

### Step 3: Apply Filters (Optional)

Depending on the report type, you can apply various filters:

#### Date Range Filters
Available for: Attendance, Fees, and Exams reports

- **Start Date**: The beginning date of the report period
- **End Date**: The ending date of the report period

#### Status Filters
Available for: Students, Fees, and Staff reports

- **Students**: active, inactive, graduated, transferred
- **Fees**: all, pending, paid, partial, overdue
- **Staff**: active, inactive

### Step 4: Generate Report

Click the **Generate Report** button. The system will:

1. Process your request
2. Generate the report based on your selections
3. Automatically download the file to your device

## Report Examples

### Example 1: Active Students Report (CSV)

**Use Case**: Export all active students for importing into another system

**Steps**:
1. Select "Students Report"
2. Choose "CSV" format
3. Set Status filter to "active"
4. Click "Generate Report"
5. Open the downloaded CSV file in Excel or Google Sheets

### Example 2: Monthly Attendance Report (PDF)

**Use Case**: Print attendance records for the month

**Steps**:
1. Select "Attendance Report"
2. Choose "PDF" format
3. Set Start Date to the first day of the month
4. Set End Date to the last day of the month
5. Click "Generate Report"
6. Open and print the PDF file

### Example 3: Pending Fees Report (CSV)

**Use Case**: Send pending fees list to accounts department

**Steps**:
1. Select "Fees Report"
2. Choose "CSV" format
3. Set Status filter to "pending"
4. Click "Generate Report"
5. Share the downloaded CSV file with the accounts team

## Understanding Report Contents

### Students Report Columns

| Column | Description |
|--------|-------------|
| Admission No | Unique student identification number |
| First Name | Student's first name |
| Last Name | Student's last name |
| Email | Student's email address |
| Phone | Contact phone number |
| Class | Current class/grade |
| Section | Section within the class |
| Status | Current status (active, inactive, etc.) |
| Admission Date | Date of admission |
| Gender | Student's gender |
| Blood Group | Blood group information |

### Attendance Report Columns

| Column | Description |
|--------|-------------|
| Date | Attendance date |
| Class | Class name |
| Section | Section name |
| Student Name | Full name of the student |
| Admission No | Student's admission number |
| Status | P (Present), A (Absent), L (Leave), H (Holiday) |
| Note | Additional notes or remarks |

### Fees Report Columns

| Column | Description |
|--------|-------------|
| Invoice ID | Unique invoice identifier |
| Student Name | Full name of the student |
| Admission No | Student's admission number |
| Class | Class name |
| Section | Section name |
| Total | Total invoice amount |
| Paid | Amount already paid |
| Balance | Remaining balance |
| Status | Payment status |
| Due Date | Payment due date |
| Fee Heads | Types of fees included |

### Exams Report Columns

| Column | Description |
|--------|-------------|
| Exam Name | Name of the examination |
| Term | Academic term (mid-term, final, etc.) |
| Academic Year | Year of the examination |
| Subject | Subject name |
| Student Name | Full name of the student |
| Admission No | Student's admission number |
| Max Marks | Maximum marks for the subject |
| Obtained Marks | Marks obtained by the student |
| Grade | Letter grade assigned |
| Remarks | Additional comments |

### Staff Report Columns

| Column | Description |
|--------|-------------|
| Employee Code | Unique staff identification number |
| First Name | Staff member's first name |
| Last Name | Staff member's last name |
| Email | Email address |
| Phone | Contact phone number |
| Department | Department name |
| Designation | Job designation |
| Join Date | Date of joining |
| Status | Employment status |
| Salary | Salary information |

## Tips for Effective Report Generation

1. **Use Specific Filters**: Apply filters to get only the data you need
2. **Choose the Right Format**: 
   - Use CSV for data analysis and manipulation
   - Use PDF for presentation and printing
3. **Regular Exports**: Generate reports regularly to track trends
4. **Save Reports**: Keep copies of important reports for record-keeping
5. **Check Data Before Sharing**: Review the report contents before sharing with others

## Troubleshooting

### Report Not Generating

**Problem**: The report doesn't download after clicking "Generate Report"

**Solutions**:
- Check your internet connection
- Ensure pop-ups are not blocked in your browser
- Try refreshing the page and generating again
- Clear your browser cache

### Empty Report

**Problem**: The downloaded report has no data

**Solutions**:
- Verify that you have data in the system matching your filters
- Try removing some filters to broaden the search
- Check if you have permission to view the requested data

### Large Report Takes Long Time

**Problem**: Report generation is taking too long

**Solutions**:
- Apply more specific filters to reduce the data size
- Use date ranges to limit the time period
- Try generating during off-peak hours
- Consider breaking large reports into smaller chunks

## Best Practices

1. **Regular Backups**: Generate and save reports regularly as data backups
2. **Secure Storage**: Store sensitive reports in secure locations
3. **Data Privacy**: Be mindful of data privacy when sharing reports
4. **Verify Accuracy**: Cross-check report data with the system before making decisions
5. **Use Appropriate Format**: Choose CSV for data processing, PDF for sharing

## Getting Help

If you encounter any issues with the Report Builder:

1. Contact your system administrator
2. Check the API documentation for technical details
3. Submit a support ticket describing your issue
4. Include screenshots if possible to help diagnose the problem

## Future Features

We're constantly improving the Report Builder. Upcoming features include:

- Custom report templates
- Scheduled report generation
- Email delivery of reports
- Charts and visualizations
- Excel (XLSX) export format
- Report sharing and collaboration

---

**Need more help?** Contact support at support@schoolms.com
