# 📄 PDF Generation Logic

The system uses `pdfkit` on the backend to generate high-quality, print-ready documents.

## Supported Documents
1. **Fee Receipt**: A6 size, standardized layout.
2. **Demand Bill**: A5/A4 list of dues.
3. **Student Profile**: Full details with photo.
4. **Report Card**: Exam results table.

## Technical Implementation
- **Service**: Dedicated `PdfService` in NestJS.
- **Fonts**: Embeds custom fonts (Noto Sans) for currency symbol support (₹).
- **Layout**:
  - **Header**: School logo, Name, Address (Dynamic from Settings).
  - **Body**: Tables and Grids.
  - **Footer**: QR placeholders, Notes, Signatures.

## Customization
Admins can modify the PDF header content via `School Settings`.
- School Name
- Address
- Affiliation Number
- Logo
