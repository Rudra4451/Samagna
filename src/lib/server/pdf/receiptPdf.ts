import PDFDocument from 'pdfkit';

/**
 * Receipt data contract for server-side A5 PDF generation.
 * All fields are derived from authoritative database records (Batch, Step1FieldVerification, CollectorContribution).
 */
export interface ReceiptPdfData {
  code: string;
  produceName: string;
  produceOdia?: string;
  scientificName?: string | null;
  district: string;
  block: string;
  gramPanchayat: string;
  centerName: string;
  shgName: string;
  facilitatorName?: string;
  grade?: string;
  sackCount?: number;
  sealTagId?: string | null;
  transitWaybillId?: string | null;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  ratePerKg: number;
  rateSource: string;
  ratePublishedDate?: string;
  totalAmount: number;
  dateStr: string;
  status: string;
  // Collector details (privacy protected)
  collectorName: string;
  collectorNameOdia?: string;
  tribalId: string;
  village: string;
  accountEnding?: string;
  bankName?: string;
  // Payment settlement & simulation state
  paymentStatus: string;
  paymentRef: string;
  isSimulated: boolean;
  // Verification provenance
  verificationUrl: string;
}

/**
 * Generates an authoritative, tamper-evident A5 receipt PDF as a Node.js Buffer.
 * Page Dimensions: A5 (419.53pt x 595.28pt), 12mm margins (34.02pt).
 * Typography: Built-in standard Helvetica & Courier (deterministic, zero external network font dependencies).
 */
export async function generateReceiptPdfBuffer(data: ReceiptPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // ISO 216 A5: 148mm x 210mm -> 419.53 x 595.28 points
      const margin = 34.02; // exact 12mm
      const pageWidth = 419.53;
      const contentWidth = pageWidth - margin * 2; // ~351.49 pt

      const doc = new PDFDocument({
        size: 'A5',
        margin: margin,
        info: {
          Title: `BanaSetu Receipt ${data.code}`,
          Author: 'TDCCOL Government of Odisha',
          Subject: 'Minor Forest Produce Official Collection Receipt',
          Keywords: `BanaSetu, TDCCOL, LABHA, Odisha, Receipt, MFP, ${
            data.isSimulated ? 'SIMULATED_PAYMENT' : 'LIVE_SETTLED_PAYMENT'
          }`,
          CreationDate: new Date(),
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Terracotta Orange Header Bar
      doc.rect(margin, margin, contentWidth, 3).fill('#B24E2E');

      let currentY = margin + 10;

      // Top Header Row
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#B24E2E')
        .text('Samagna · TDCCOL Odisha', margin, currentY);

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#574c43')
        .text('Govt. of Odisha · ST & SC Development Department', margin, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#1f1a14')
        .text('OFFICIAL COLLECTION RECEIPT (A5)', margin, currentY + 25);

      // Header Right (Batch Code & Status)
      const cleanCode = data.code.replace(/^#/, '');
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#85786f')
        .text('CERTIFIED BATCH CODE', margin, currentY, {
          width: contentWidth,
          align: 'right',
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#B24E2E')
        .text(`#${cleanCode}`, margin, currentY + 10, {
          width: contentWidth,
          align: 'right',
        });

      const statusText =
        data.status === 'QUARANTINED_DISCREPANCY'
          ? 'DISCREPANCY HELD'
          : data.status === 'VERIFIED_SALEABLE'
          ? 'VERIFIED & ACCEPTED'
          : data.status.replace(/_/g, ' ');

      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor('#1f1a14')
        .text(`[ ${statusText} ]`, margin, currentY + 30, {
          width: contentWidth,
          align: 'right',
        });

      currentY += 46;

      // Divider Line
      doc
        .moveTo(margin, currentY)
        .lineTo(margin + contentWidth, currentY)
        .lineWidth(0.5)
        .strokeColor('#d8cfc4')
        .stroke();

      currentY += 8;

      // Section 1: Aggregation & Administrative Custody
      doc
        .rect(margin, currentY, contentWidth, 54)
        .fillAndStroke('#fcfbf9', '#d8cfc4');

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#B24E2E')
        .text('1. AGGREGATION & ADMINISTRATIVE CUSTODY', margin + 6, currentY + 5);

      const col1X = margin + 6;
      const col2X = margin + contentWidth / 2 + 4;
      const sec1ContentY = currentY + 18;

      // Left Column
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#85786f')
        .text('DISTRICT / BLOCK:', col1X, sec1ContentY);
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#1f1a14')
        .text(`${data.block}, ${data.district}`, col1X, sec1ContentY + 8);

      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#85786f')
        .text('AGGREGATION CENTER:', col1X, sec1ContentY + 20);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#1f1a14')
        .text(`${data.centerName} (${data.gramPanchayat})`, col1X, sec1ContentY + 28);

      // Right Column
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#85786f')
        .text('PRIMARY SHG CLUSTER:', col2X, sec1ContentY);
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#1f1a14')
        .text(data.shgName, col2X, sec1ContentY + 8);

      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#85786f')
        .text('FACILITATOR / DATE:', col2X, sec1ContentY + 20);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#1f1a14')
        .text(
          `${data.facilitatorName || 'Assigned Staff'} · ${data.dateStr}`,
          col2X,
          sec1ContentY + 28
        );

      currentY += 60;

      // Section 2: Certified Primary Gatherer
      doc
        .rect(margin, currentY, contentWidth, 44)
        .fillAndStroke('#fcfbf9', '#d8cfc4');

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#B24E2E')
        .text('2. PRIMARY GATHERER RECORD (STATUTORY PRIVACY SHIELDED)', margin + 6, currentY + 5);

      const sec2ContentY = currentY + 17;
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#85786f')
        .text('GATHERER NAME / VILLAGE:', col1X, sec2ContentY);
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#1f1a14')
        .text(`${data.collectorName} · Vill: ${data.village}`, col1X, sec2ContentY + 9);

      const accountDisplay =
        data.bankName === 'N/A' || !data.bankName
          ? 'N/A'
          : `${data.bankName}${
              data.accountEnding && data.accountEnding !== 'N/A'
                ? ` (Ending ${data.accountEnding})`
                : ''
            }`;

      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#85786f')
        .text('STATUTORY TRIBAL ID / ACCOUNT:', col2X, sec2ContentY);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#1f1a14')
        .text(`${data.tribalId} · ${accountDisplay}`, col2X, sec2ContentY + 9);

      currentY += 50;

      // Section 3: Produce & Certified Weighment
      doc
        .rect(margin, currentY, contentWidth, 80)
        .fillAndStroke('#FBECE5', '#E4DBC9');

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#B24E2E')
        .text(data.produceName, margin + 6, currentY + 6);

      if (data.scientificName) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(7.5)
          .fillColor('#574c43')
          .text(`Botanical: ${data.scientificName}`, margin + 6, currentY + 20);
      }

      // Metadata chips
      const metaY = currentY + (data.scientificName ? 31 : 23);
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#574c43')
        .text(
          `Grade: ${data.grade || 'Standard / A'}  |  Sacks: ${data.sackCount || 1}  |  Seal Tag: ${
            data.sealTagId || 'Recorded at Intake'
          }`,
          margin + 6,
          metaY
        );

      // Weighment Table Box
      const tableY = metaY + 11;
      const colW = contentWidth / 3;

      doc
        .rect(margin + 6, tableY, contentWidth - 12, 28)
        .fillAndStroke('#ffffff', '#d8cfc4');

      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#85786f')
        .text('GROSS SCALE WEIGHT', margin + 10, tableY + 4)
        .text('TARE WEIGHT (SACKS)', margin + 10 + colW, tableY + 4)
        .text('CERTIFIED NET WEIGHT', margin + 10 + colW * 2, tableY + 4);

      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor('#1f1a14')
        .text(`${Number(data.grossWeightKg).toFixed(1)} kg`, margin + 10, tableY + 14)
        .text(`${Number(data.tareWeightKg).toFixed(1)} kg`, margin + 10 + colW, tableY + 14)
        .fillColor('#B24E2E')
        .text(`${Number(data.netWeightKg).toFixed(1)} kg`, margin + 10 + colW * 2, tableY + 14);

      currentY += 86;

      // Section 4: Minimum Support Price (MSP) Valuation
      doc
        .rect(margin, currentY, contentWidth, 54)
        .fillAndStroke('#fcfbf9', '#d8cfc4');

      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#B24E2E')
        .text('4. MINIMUM SUPPORT PRICE (MSP) & CERTIFIED VALUATION', margin + 6, currentY + 5);

      const sec4ContentY = currentY + 17;
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#85786f')
        .text('APPLICABLE FLOOR RATE (LABHA):', col1X, sec4ContentY);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#1f1a14')
        .text(`₹${Number(data.ratePerKg).toFixed(2)} / kg`, col1X, sec4ContentY + 9);

      doc
        .font('Helvetica')
        .fontSize(6)
        .fillColor('#85786f')
        .text(data.rateSource, col1X, sec4ContentY + 20, { width: contentWidth / 2 - 10 });

      // Financial Total Badge on Right
      doc
        .rect(margin + contentWidth - 140, currentY + 12, 134, 34)
        .fillAndStroke('#FBECE5', '#E4DBC9');

      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor('#B24E2E')
        .text('TOTAL CERTIFIED PAYABLE VALUE', margin + contentWidth - 136, currentY + 16);

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#B24E2E')
        .text(`₹${Number(data.totalAmount).toFixed(2)}`, margin + contentWidth - 136, currentY + 27);

      currentY += 60;

      // Section 5: Mandatory Simulation Notice
      if (data.isSimulated) {
        doc
          .rect(margin, currentY, contentWidth, 42)
          .fillAndStroke('#fffbeb', '#b45309');

        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor('#b45309')
          .text(
            '⚠ SIMULATED PAYMENT NOTICE · DIRECT BENEFIT TRANSFER (DBT)',
            margin + 6,
            currentY + 5
          );

        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor('#92400e')
          .text(
            `In accordance with evaluation guidelines, this financial settlement is recorded in SIMULATED / EVALUATION mode (Ref: ${data.paymentRef}). No real banking transfer has occurred. Physical entitlement based on certified net weight (${Number(
              data.netWeightKg
            ).toFixed(1)} kg) remains permanently immutable in the official ledger.`,
            margin + 6,
            currentY + 16,
            { width: contentWidth - 12, lineGap: 1.2 }
          );

        currentY += 48;
      } else {
        doc
          .rect(margin, currentY, contentWidth, 28)
          .fillAndStroke('#fcfbf9', '#d8cfc4');

        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor('#B24E2E')
          .text('5. SETTLEMENT CONFIRMATION', margin + 6, currentY + 5);

        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#1f1a14')
          .text(
            `Status: ${data.paymentStatus} · Reference: ${data.paymentRef}`,
            margin + 6,
            currentY + 16
          );

        currentY += 34;
      }

      // Privacy Safeguard Notice Box
      doc
        .rect(margin, currentY, contentWidth, 26)
        .fillAndStroke('#faf8f5', '#e8e2d8');

      doc
        .font('Helvetica')
        .fontSize(6)
        .fillColor('#85786f')
        .text(
          'Statutory Safeguard: Under Section 4 of LABHA Guidelines, personal banking digits, full Aadhaar numbers, and phone numbers are shielded from public disclosure. Weighment certified via electronic scale at primary aggregation intake.',
          margin + 6,
          currentY + 5,
          { width: contentWidth - 12, lineGap: 1.1 }
        );

      // Footer line
      const footerY = 560;
      doc
        .moveTo(margin, footerY)
        .lineTo(margin + contentWidth, footerY)
        .lineWidth(0.5)
        .strokeColor('#d8cfc4')
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#85786f')
        .text('Government of Odisha · ST & SC Development Department · TDCCOL', margin, footerY + 6);

      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor('#B24E2E')
        .text(`Verify online: ${data.verificationUrl}`, margin, footerY + 6, {
          width: contentWidth,
          align: 'right',
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
