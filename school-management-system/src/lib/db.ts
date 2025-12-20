import Dexie, { type Table } from 'dexie';

export interface Student {
  id?: number;
  studentId: string;
  name: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  className: string;
  section: string;
  admissionDate: string;
  address: string;
  phone: string;
  email: string;
  photoUrl?: string;
  status: 'active' | 'inactive';
  synced: boolean;
  lastModified: Date;
}

export interface FeeTransaction {
  id?: number;
  transactionId: string;
  studentId: string;
  amount: number;
  description: string;
  paymentMode: 'cash' | 'cheque' | 'online';
  receiptNo: string;
  date: string;
  yearId: number;
  synced: boolean;
  lastModified: Date;
}

export interface ExamResult {
  id?: number;
  studentId: string;
  examId: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  synced: boolean;
  lastModified: Date;
}

export interface Transport {
  id?: number;
  vehicleNo: string;
  routeName: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  synced: boolean;
  lastModified: Date;
}

export interface Hostel {
  id?: number;
  roomNo: string;
  capacity: number;
  occupied: number;
  floor: number;
  hostelType: 'boys' | 'girls';
  synced: boolean;
  lastModified: Date;
}



export interface SyncQueue {
  id?: number;
  tableName: string;
  operation: 'create' | 'update' | 'delete';
  recordId: string;
  data: any;
  timestamp: Date;
  retryCount: number;
}

class SchoolDatabase extends Dexie {
  students!: Table<Student>;
  feeTransactions!: Table<FeeTransaction>;
  examResults!: Table<ExamResult>;
  transports!: Table<Transport>;
  hostels!: Table<Hostel>;

  syncQueue!: Table<SyncQueue>;

  constructor() {
    super('SchoolManagementDB');
    this.version(1).stores({
      students: '++id, studentId, name, className, status, synced, lastModified',
      feeTransactions: '++id, transactionId, studentId, date, synced, lastModified',
      examResults: '++id, studentId, examId, synced, lastModified',
      transports: '++id, vehicleNo, routeName, synced, lastModified',
      hostels: '++id, roomNo, hostelType, synced, lastModified',

      syncQueue: '++id, tableName, operation, timestamp',
    });
  }
}

export const db = new SchoolDatabase();

// Sync functions for offline capability
export async function addToSyncQueue(
  tableName: string,
  operation: 'create' | 'update' | 'delete',
  recordId: string,
  data: any
) {
  await db.syncQueue.add({
    tableName,
    operation,
    recordId,
    data,
    timestamp: new Date(),
    retryCount: 0,
  });
}

export async function processSyncQueue() {
  const pendingSync = await db.syncQueue.toArray();

  for (const item of pendingSync) {
    try {
      // This will be implemented to sync with backend API
      console.log('Syncing:', item);
      await db.syncQueue.delete(item.id!);
    } catch (error) {
      // Increment retry count
      await db.syncQueue.update(item.id!, {
        retryCount: item.retryCount + 1,
      });
    }
  }
}
