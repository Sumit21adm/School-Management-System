
import pandas as pd
import os

def generate_test_data():
    # 1. Students Data
    # Columns as per code analysis (approximate indices, logic uses index)
    # We will populate up to column 30 just to be safe.
    # Student ID is Col 1 (index 0 in df if reading clean, but code uses 1-based index row.getCell(1))
    
    # Students Sheet
    # row.getCell(1) -> Student ID
    # row.getCell(2) -> Name
    # row.getCell(30) -> Session Name (optional)
    
    students_data = {
        'Student ID': ['TEST-STU-001'],
        'Name': ['Test Verification Student'],
        'Father Name': ['Father Test'],
        'Mother Name': ['Mother Test'],
        'DOB': ['01-01-2010'], # Col 5
        'Gender': ['Male'],
        'Class': ['X'], # Col 7
        'Section': ['A'],
        'Roll No': ['999'],
        'Admission Date': ['01-04-2024'],
        'Address': ['Test Address'],
        'Phone': ['9999999999'],
        'WhatsApp': [''],
        'Email': [''],
        'Status': ['active'],
        'Category': ['General'],
        'Religion': [''],
        'Aadhar': [''],
        'Apaar': [''],
        'F Occ': [''], 'F Aadhar': [''], 'F Pan': [''],
        'M Occ': [''], 'M Aadhar': [''], 'M Pan': [''],
        'G Rel': [''], 'G Name': [''], 'G Phone': [''], 'G Email': [''],
        'Session Name': [''] # Col 30
    }
    
    # Fill gaps to match column indices if needed. 
    # ExcelJS getCell(1) is first column. 
    # Pandas to_excel creates headers and data. 
    # We'll creating a dataframe with specific column ordering.
    
    # We need to ensure columns align with the code's getCell expectations.
    # Code:
    # 1: StudentId, 2: Name, 3: Father, 4: Mother, 5: DOB, 6: Gender, 7: Class, 8: Section, 9: Roll, 10: AdmDate
    # 11: Addr, 12: Phone, 13: WA, 14: Email, 15: Status, 16: Cat, 17: Rel, 18: Aadhar, 19: Apaar
    # 20: F Occ, 21: FAadhar, 22: FPan, 23: M Occ, 24: MAadhar, 25: MPan, 26: GRel, 27: GName, 28: GPhone, 29: GEmail
    # 30: Session / Route
    
    cols = [
        'Student ID', 'Name', 'Father Name', 'Mother Name', 'DOB', 'Gender', 'Class', 'Section', 'Roll No',
        'Admission Date', 'Address', 'Phone', 'WhatsApp', 'Email', 'Status', 'Category', 'Religion',
        'Aadhar', 'Apaar ID', 'Father Occ', 'Father Aadhar', 'Father Pan', 'Mother Occ', 
        'Mother Aadhar', 'Mother Pan', 'Guardian Rel', 'Guardian Name', 'Guardian Phone', 'Guardian Email',
        'Session Name'
    ]
    
    df_students = pd.DataFrame(columns=cols)
    df_students.loc[0] = [
        'TEST-STU-001', 'Test Verification Student', 'Father Test', 'Mother Test', '01-01-2010', 'Male', 'X', 'A', '999',
        '01-04-2024', 'Test Address', '9999999999', '', '', 'active', 'General', '', 
        '', '', '', '', '', '', 
        '', '', '', '', '', '', 
        '' # Default to active session
    ]
    
    with pd.ExcelWriter('test_students.xlsx', engine='openpyxl') as writer:
        df_students.to_excel(writer, sheet_name='Students', index=False, header=True)
        
    print("Created test_students.xlsx")

    # 2. Discounts Data
    # Fix: Discounts import looks for "Session Name" header.
    # Col 1: Student ID, Col 2: Fee Type, Col 3: Type, Col 4: Value, Col 5: Reason, Col 6: Approved By
    
    discounts_data = {
        'Student ID': ['TEST-STU-001'],
        'Fee Type Name': ['Tuition Fee'],
        'Discount Type': ['FIXED'],
        'Discount Value': [500],
        'Reason': ['Test Migration Fix'],
        'Approved By': ['Tester'],
        'Session Name': ['APR 2023 - MAR 2024'] # Testing the fix!
    }
    
    df_discounts = pd.DataFrame(discounts_data)
    
    with pd.ExcelWriter('test_discounts.xlsx', engine='openpyxl') as writer:
        df_discounts.to_excel(writer, sheet_name='Discounts', index=False)
        
    print("Created test_discounts.xlsx")

    # 3. Receipts Data
    # Fix: Auto-create fee types.
    # Code: Receipt No (2), Student ID (1), Date (3), Fee Type (4), Amount (5), Discount (6), Net (7), Mode (8)...
    # Session Name check: Dynamic column "Session Name".
    
    receipts_cols = ['Student ID', 'Receipt No', 'Receipt Date', 'Fee Type Name', 'Amount', 'Discount', 'Net Amount', 
                     'Payment Mode', 'Payment Ref', 'Collected By', 'Remarks', 'Session Name']
                     
    df_receipts = pd.DataFrame(columns=receipts_cols)
    
    # Row 1: Existing Fee Type (Tuition Fee)
    df_receipts.loc[0] = [
        'TEST-STU-001', 'REC-TEST-001', '01-04-2024', 'Tuition Fee', 1000, 0, 1000, 
        'cash', '', 'Admin', 'Test Normal', ''
    ]
    # Row 2: New Fee Type (Special Test Fee) - Should be auto-created
    df_receipts.loc[1] = [
        'TEST-STU-001', 'REC-TEST-002', '01-04-2024', 'Special Test Fee', 500, 0, 500, 
        'cash', '', 'Admin', 'Test Auto Create', ''
    ]
    
    with pd.ExcelWriter('test_receipts.xlsx', engine='openpyxl') as writer:
        df_receipts.to_excel(writer, sheet_name='Fee_Receipts', index=False)
        
    print("Created test_receipts.xlsx")

if __name__ == "__main__":
    generate_test_data()
