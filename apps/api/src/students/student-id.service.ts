import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

@Injectable()
export class StudentIdService {
  async generateStudentIdCard(student: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: [252, 396], margin: 10 }); // ID card size (CR80: 3.375" x 2.125")
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Generate QR code as data URL
        const qrData = JSON.stringify({
          id: student.id,
          admissionNo: student.admissionNo,
          name: `${student.user.firstName} ${student.user.lastName}`,
        });
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 80 });
        const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

        // Card background and border
        doc.rect(0, 0, 252, 396).fillAndStroke('#f5f5f5', '#333');

        // Header
        doc.fillColor('#2563eb')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('STUDENT ID CARD', 10, 15, { align: 'center', width: 232 });

        // School name (placeholder)
        doc.fillColor('#333')
           .fontSize(10)
           .font('Helvetica')
           .text('Demo School', 10, 40, { align: 'center', width: 232 });

        // Divider line
        doc.moveTo(10, 60).lineTo(242, 60).stroke('#2563eb');

        // Student photo placeholder
        doc.rect(86, 70, 80, 100).fillAndStroke('#e5e7eb', '#d1d5db');
        doc.fillColor('#9ca3af')
           .fontSize(8)
           .text('Photo', 86, 115, { align: 'center', width: 80 });

        // Student details
        const detailsY = 180;
        doc.fillColor('#333')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(`${student.user.firstName} ${student.user.lastName}`, 10, detailsY, {
             align: 'center',
             width: 232,
           });

        doc.fontSize(9)
           .font('Helvetica')
           .text(`Admission No: ${student.admissionNo}`, 10, detailsY + 20, {
             align: 'center',
             width: 232,
           });

        if (student.section) {
          doc.text(
            `Class: ${student.section.class.name} - ${student.section.name}`,
            10,
            detailsY + 35,
            { align: 'center', width: 232 }
          );
        }

        if (student.bloodGroup) {
          doc.text(`Blood Group: ${student.bloodGroup}`, 10, detailsY + 50, {
            align: 'center',
            width: 232,
          });
        }

        // QR Code
        doc.image(qrBuffer, 86, 280, { width: 80, height: 80 });

        doc.fontSize(7)
           .fillColor('#666')
           .text('Scan for verification', 10, 365, { align: 'center', width: 232 });

        // Footer
        doc.fontSize(6)
           .fillColor('#999')
           .text(`Issued: ${new Date().toLocaleDateString()}`, 10, 380, {
             align: 'center',
             width: 232,
           });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
