# School Management System - Regression Test Plan

## Document Information
| Item | Details |
|------|---------|
| **Version** | 1.0 |
| **Release Type** | Pilot Release |
| **Date** | December 2024 |
| **Prepared By** | Development Team |

---

## 1. Introduction

### 1.1 Purpose
This document outlines the comprehensive regression test plan for the School Management System pilot release. It covers all modules, features, and functionalities to ensure system stability and correctness.

### 1.2 Scope
- **In Scope**: All implemented features across all modules
- **Out of Scope**: Performance testing, Security penetration testing, Load testing

### 1.3 Test Approach
- **Type**: Manual Regression Testing
- **Environment**: Local/Staging
- **Browsers**: Chrome (Latest), Firefox (Latest), Safari (Latest)

---

## 2. Modules Overview

| Module | Priority | Status |
|--------|----------|--------|
| Authentication | Critical | Ready for Testing |
| Dashboard | High | Ready for Testing |
| Admissions/Student Management | Critical | Ready for Testing |
| Fee Management | Critical | Ready for Testing |
| Examination Management | High | Ready for Testing |
| Academic Sessions | High | Ready for Testing |
| Promotions | Medium | Ready for Testing |
| Print Settings | Medium | Ready for Testing |

---

## 3. Test Cases by Module

### 3.1 Authentication Module

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| AUTH-001 | Login with valid credentials | 1. Navigate to login page<br>2. Enter valid username/password<br>3. Click Login | User is logged in and redirected to Dashboard | Critical |
| AUTH-002 | Login with invalid credentials | 1. Enter invalid credentials<br>2. Click Login | Error message displayed, user stays on login page | Critical |
| AUTH-003 | Login with empty fields | 1. Leave fields empty<br>2. Click Login | Validation error shown | High |
| AUTH-004 | Logout functionality | 1. Click logout button | User is logged out and redirected to login | Critical |
| AUTH-005 | Session persistence | 1. Login<br>2. Close browser<br>3. Reopen | Session maintained (if configured) | Medium |

### 3.2 Dashboard Module

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| DASH-001 | Dashboard loads correctly | 1. Login<br>2. Navigate to Dashboard | All stats cards load with correct data | High |
| DASH-002 | Fee collection summary | Check fee collection widget | Displays correct total collections | High |
| DASH-003 | Student statistics | Check student count widgets | Shows accurate active/alumni/archived counts | High |
| DASH-004 | Session selector | Change academic session | Dashboard data updates accordingly | High |
| DASH-005 | Quick navigation links | Click each navigation link | Redirects to correct page | Medium |

### 3.3 Admissions Module

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| ADM-001 | View student list | Navigate to Admissions | Student list displays with pagination | Critical |
| ADM-002 | Search student by name | Enter name in search box | Filtered results shown | High |
| ADM-003 | Search student by ID | Enter student ID | Matching student displayed | High |
| ADM-004 | Filter by class | Select class from dropdown | Only students of that class shown | High |
| ADM-005 | Filter by section | Select section | Filtered by section | High |
| ADM-006 | Filter by status (Active) | Select "Active" status | Only active students shown | High |
| ADM-007 | Filter by status (Alumni) | Select "Alumni" status | Only alumni shown | High |
| ADM-008 | Filter by status (Archived) | Select "Archived" status | Only archived shown | High |
| ADM-009 | Create new admission | Fill form and submit | Student created, appears in list | Critical |
| ADM-010 | Create admission - validation | Submit empty form | Validation errors shown | High |
| ADM-011 | Edit student details | Click edit, modify, save | Changes saved successfully | Critical |
| ADM-012 | View student details | Click view icon | Student details dialog opens | High |
| ADM-013 | Delete student | Click delete, confirm | Student removed from list | Critical |
| ADM-014 | Delete student - cancel | Click delete, cancel | Student remains | Medium |
| ADM-015 | Move to Alumni | Click alumni icon, confirm | Student status changes to Alumni | Critical |
| ADM-016 | Restore from Alumni | On alumni, click restore | Student status changes to Active | Critical |
| ADM-017 | Import students (CSV) | Upload valid CSV | Students imported successfully | High |
| ADM-018 | Import students - invalid | Upload invalid CSV | Error message with details | High |
| ADM-019 | Export students | Click export | CSV downloaded with correct data | High |
| ADM-020 | Dashboard stats display | Check stats cards | Shows Active, Alumni, Archived, Birthday counts | High |
| ADM-021 | Birthday dialog | Click birthday card | Dialog shows students with today's birthday | High |
| ADM-022 | Photo upload | Upload student photo | Photo displayed in student record | Medium |

### 3.4 Fee Management Module

#### 3.4.1 Fee Structure

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| FEE-001 | View fee structures | Navigate to Fee Structure | List of fee structures displayed | High |
| FEE-002 | Create fee structure | Fill form, submit | New structure created | Critical |
| FEE-003 | Edit fee structure | Modify and save | Changes saved | High |
| FEE-004 | Delete fee structure | Delete with confirmation | Structure removed | High |
| FEE-005 | Assign to class | Assign structure to a class | Assignment successful | Critical |

#### 3.4.2 Fee Collection

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| FEE-010 | Search student for payment | Enter student ID/name | Student found with pending fees | Critical |
| FEE-011 | View pending fees | Select student | Pending fee items displayed | Critical |
| FEE-012 | Collect full payment | Pay all pending fees | Payment recorded, receipt generated | Critical |
| FEE-013 | Collect partial payment | Pay partial amount | Partial payment recorded | High |
| FEE-014 | Payment modes | Select Cash/UPI/Card/Bank | Payment mode recorded correctly | High |
| FEE-015 | Receipt generation | After payment | PDF receipt generated | Critical |
| FEE-016 | Receipt print | Click print button | Receipt prints correctly | High |
| FEE-017 | Recent collections | Check recent collections list | Shows latest payments with timestamp | High |
| FEE-018 | Collection summary | Check daily collection total | Accurate total displayed | High |

#### 3.4.3 Demand Bills

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| FEE-020 | Generate demand bill | Select student, generate | Bill generated for pending fees | High |
| FEE-021 | Bulk demand bills | Select multiple students | Bills generated for all | High |
| FEE-022 | Print demand bill | Click print | Bill prints correctly | Medium |

#### 3.4.4 Fee Receipt

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| FEE-030 | Search receipts | Search by receipt number | Receipt found | High |
| FEE-031 | View receipt history | View student's receipt history | All receipts listed | High |
| FEE-032 | Reprint receipt | Click reprint | Receipt regenerated | Medium |
| FEE-033 | Date range filter | Filter by date range | Receipts in range shown | Medium |

### 3.5 Examination Module

#### 3.5.1 Configuration

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| EXAM-001 | View exam types | Navigate to Configuration | Exam types listed | High |
| EXAM-002 | Create exam type | Add new type (e.g., "Unit Test") | Type created | High |
| EXAM-003 | Edit exam type | Modify name | Changes saved | Medium |
| EXAM-004 | Delete exam type | Delete with confirmation | Type removed | Medium |
| EXAM-005 | View subjects | Switch to Subjects tab | Subjects listed | High |
| EXAM-006 | Create subject | Add new subject | Subject created | High |
| EXAM-007 | Edit subject | Modify name | Changes saved | Medium |
| EXAM-008 | Delete subject | Delete with confirmation | Subject removed | Medium |

#### 3.5.2 Exams

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| EXAM-010 | View exams | Navigate to Exams | Exam list displayed | High |
| EXAM-011 | Create exam | Fill form, create | New exam created | Critical |
| EXAM-012 | View exam details | Click Details | Exam details page opens | High |
| EXAM-013 | Add schedule | Add scheduled paper | Schedule added to exam | Critical |
| EXAM-014 | Delete schedule | Remove a schedule item | Schedule removed | High |
| EXAM-015 | Delete exam | Delete exam | Exam and schedules removed | High |
| EXAM-016 | Filter by session | Change academic session | Exams filtered | Medium |

### 3.6 Academic Sessions

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| SESS-001 | View sessions | Navigate to Sessions | Sessions listed | High |
| SESS-002 | Create session | Add new session | Session created | Critical |
| SESS-003 | Edit session | Modify dates | Changes saved | High |
| SESS-004 | Delete session | Delete (if no data linked) | Session removed | Medium |
| SESS-005 | Set active session | Mark as active | Session becomes default | Critical |
| SESS-006 | Session in header | Check global header | Current session displayed | High |
| SESS-007 | Switch session | Change session in header | All data refreshes for new session | Critical |

### 3.7 Promotions

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| PROM-001 | View promotion screen | Navigate to Promotions | Promotion interface loads | High |
| PROM-002 | Select source class | Choose class to promote from | Students of that class shown | High |
| PROM-003 | Select target class | Choose destination class | Target class set | High |
| PROM-004 | Select students | Select individual students | Students checked | High |
| PROM-005 | Promote students | Click Promote | Students moved to new class | Critical |
| PROM-006 | Bulk promotion | Select all, promote | All students promoted | High |

### 3.8 Print Settings

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| PRINT-001 | View print settings | Navigate to Print Settings | Settings page loads | Medium |
| PRINT-002 | Update school logo | Upload new logo | Logo updated on receipts | Medium |
| PRINT-003 | Update school name | Change name | Name appears on prints | Medium |
| PRINT-004 | Update address | Change address | Address appears on prints | Medium |
| PRINT-005 | Preview receipt | Preview a sample | Shows updated settings | Medium |

---

## 4. Cross-Functional Test Cases

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| CROSS-001 | Session change across modules | Change session, visit each module | All modules show session-specific data | Critical |
| CROSS-002 | Student fee linkage | Create student, check fee pending | New student has assigned fee structure | Critical |
| CROSS-003 | Alumni cannot pay fees | Move to alumni, try fee payment | Fee collection disabled for alumni | High |
| CROSS-004 | Responsive design - Mobile | Access on mobile viewport | UI adapts correctly | High |
| CROSS-005 | Responsive design - Tablet | Access on tablet viewport | UI adapts correctly | Medium |
| CROSS-006 | Browser compatibility - Chrome | Run all tests on Chrome | All features work | Critical |
| CROSS-007 | Browser compatibility - Firefox | Run all tests on Firefox | All features work | High |
| CROSS-008 | Browser compatibility - Safari | Run all tests on Safari | All features work | High |

---

## 5. Execution Schedule

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | Day 1-2 | Authentication, Dashboard, Core Admissions |
| Phase 2 | Day 3-4 | Complete Admissions, Fee Structure |
| Phase 3 | Day 5-6 | Fee Collection, Demand Bills, Receipts |
| Phase 4 | Day 7 | Examination Module |
| Phase 5 | Day 8 | Sessions, Promotions, Print Settings |
| Phase 6 | Day 9-10 | Cross-functional, Regression, Bug Verification |

---

## 6. Test Completion Criteria

- [ ] All Critical test cases pass
- [ ] 95% of High priority test cases pass
- [ ] 90% of Medium priority test cases pass
- [ ] No open Critical or High severity bugs
- [ ] All modules functional end-to-end

---

## 7. Defect Classification

| Severity | Description |
|----------|-------------|
| **Critical** | System crash, data loss, complete feature failure |
| **High** | Major feature partially broken, workaround exists |
| **Medium** | Minor feature issue, cosmetic issues |
| **Low** | Typos, minor UI improvements |

---

## 8. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Lead | | | |
| Development Lead | | | |
| Project Manager | | | |
