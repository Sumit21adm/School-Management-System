import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('💰 Starting Financial Integrity Check...');

    // 1. Fetch all bills with their relation to students
    const bills = await prisma.demandBill.findMany({
        include: {
            student: true
        }
    });

    let discrepancies = 0;

    console.log(`Checking ${bills.length} bills...`);

    for (const bill of bills) {
        let hasError = false;
        const errorMsg: string[] = [];

        // Check 1: Paid Amount Cap
        if (bill.paidAmount.toNumber() > bill.netAmount.toNumber()) {
            if (!errorMsg.includes('Paid amount exceeds Net Amount')) errorMsg.push('Paid amount exceeds Net Amount');
            hasError = true;
        }

        // Check 2: Status Logic
        const isFullyPaid = bill.paidAmount.toNumber() >= bill.netAmount.toNumber();
        const isPartiallyPaid = bill.paidAmount.toNumber() > 0 && bill.paidAmount.toNumber() < bill.netAmount.toNumber();

        if (isFullyPaid && bill.status !== 'PAID') {
            errorMsg.push(`Status mismatch: Amount is fully paid but status is ${bill.status}`);
            hasError = true;
        } else if (isPartiallyPaid && bill.status !== 'PARTIALLY_PAID') {
            errorMsg.push(`Status mismatch: Amount is partial but status is ${bill.status}`);
            hasError = true;
        } else if (bill.paidAmount.toNumber() === 0 && bill.status !== 'PENDING' && bill.status !== 'OVERDUE') {
            errorMsg.push(`Status mismatch: No payment but status is ${bill.status}`);
            hasError = true;
        }

        // Check 3: Transaction Sum matching Paid Amount (Need to fetch transactions)
        // We assume 'DemandBill' doesn't directly link to 'FeeTransaction' in schema yet (checked schema)
        // Schema connects Transactions to Student + Session. 
        // Usually a Bill is cleared by specific Transactions. 
        // Current Schema has: DemandBill (studentId, month) AND FeeTransaction (studentId, date).
        // There is no direct FK from Transaction -> Bill in the schema provided earlier.
        // So we verify simpler things for now.

        if (hasError) {
            console.error(`❌ Bill #${bill.billNo} (Student: ${bill.studentId}): ${errorMsg.join(', ')}`);
            discrepancies++;
        }
    }

    if (discrepancies === 0) {
        console.log('✅ Financial Integerity Check Passed: All bills have consistent statuses and amounts.');
    } else {
        console.error(`⚠️ Found ${discrepancies} bills with financial discrepancies.`);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
