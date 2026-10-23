import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface AuditPdfEventItem {
  id: string;
  timestamp: string;
  actionType: string;
  title: string;
  actorName: string;
  actorRole: string;
  description: string;
  isSimulated: boolean;
  eventHash?: string | null;
  previousHash?: string | null;
  safeDetailsSummary?: string | null;
}

export interface AuditPdfDiscrepancyItem {
  id: string;
  status: string;
  dispatchedNetKg: number;
  arrivalNetKg: number;
  shrinkageAllowedKg: number;
  unexplainedVarianceKg: number;
  currentActionTaken: string;
  assignedSupervisor: string;
  resolutionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface AuditPdfData {
  entityId: string;
  entityType: string; // 'batch' | 'discrepancy'
  produceName: string;
  produceOdia?: string;
  scientificName?: string | null;
  status: string;
  district: string;
  block: string;
  gramPanchayat?: string;
  centerName: string;
  shgName?: string;
  destinationDepot?: string;
  step1?: {
    grossWeightKg: number;
    tareWeightKg: number;
    netAcceptedKg: number;
    grade?: string | null;
    sackCount?: number | null;
    sealTagId?: string | null;
    transitWaybillId?: string | null;
    vehicleNumber?: string | null;
    driverName?: string | null;
    tarpaulinConfirmed: boolean;
    observedMoisturePercent?: number | null;
    verifiedBy: string;
    verifiedByRole: string;
    verifiedAt: string;
  } | null;
  step2?: {
    arrivalGrossWeightKg: number;
    arrivalTareWeightKg: number;
    arrivalNetWeightKg: number;
    storageZone: string;
    receivingDepot?: string;
    shrinkagePercentAllowed: number;
    shrinkageKgAllowed: number;
    unexplainedVarianceKg: number;
    discrepancyTriggered: boolean;
    verifiedBy: string;
    verifiedByRole: string;
    verifiedAt: string;
  } | null;
  discrepancies: AuditPdfDiscrepancyItem[];
  events: AuditPdfEventItem[];
  generatedAt: string;
  generatedBy: {
    userId: string;
    name: string;
    role: string;
    district: string;
  };
  verificationUrl: string;
}

/**
 * Generates an authoritative, print-ready ISO 216 A4 Audit Trail & Chain-of-Custody Dossier.
 *
 * Specifications:
 * - Page Format: ISO 216 A4 (595.28 pt x 841.89 pt, 210mm x 297mm)
 * - Margins: 34.02 pt (12 mm standard per prompt spec)
 * - Multi-page pagination: uses doc.bufferedPages with "Page X of Y" running footer
 * - Black-and-white / high-contrast vector lines for official archiving
 * - Distinguishes simulated prototype events from stored records
 * - Never invents signatures, forensic legal certificates, or private gatherer credentials
 */
export async function generateAuditPdfBuffer(data: AuditPdfData): Promise<Buffer> {
  // Generate public verification QR code PNG buffer
  const qrPngBuffer = await QRCode.toBuffer(data.verificationUrl, {
    width: 140,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  return new Promise((resolve, reject) => {
    try {
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 34.02; // 12 mm
      const contentWidth = pageWidth - margin * 2; // ~527.24 pt

      const doc = new PDFDocument({
        size: 'A4',
        margin: margin,
        bufferPages: true,
        info: {
          Title: `BanaSetu Chain-of-Custody Audit Dossier ${data.entityId}`,
          Author: 'TDCCOL Government of Odisha',
          Subject: 'Minor Forest Produce Chain-of-Custody & Discrepancy Audit Dossier',
          Keywords: `BanaSetu, TDCCOL, Odisha, Audit, ChainOfCustody, Discrepancy, ${data.entityId}, OFFICIAL_AUDIT_DOSSIER, ${
            data.events.some((e) => e.isSimulated) ? 'CONTAINS_SIMULATED_EVENTS' : 'RECORDED_EVENTS'
          }, ${data.events.length === 0 ? 'NO_AUDIT_EVENTS_RECORDED' : 'HAS_AUDIT_EVENTS'}, ${
            data.discrepancies.length === 0 ? 'NO_DISCREPANCY_FLAGGED' : 'DISCREPANCY_QUARANTINED'
          }`,
          CreationDate: new Date(),
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        try {
          // Finalize running footers across all buffered pages
          const range = doc.bufferedPageRange();
          for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            const footerY = pageHeight - margin + 6;
            doc.lineWidth(0.5).moveTo(margin, footerY - 4).lineTo(margin + contentWidth, footerY - 4).stroke('#574c43');
            doc
              .font('Helvetica')
              .fontSize(6.5)
              .fillColor('#574c43')
              .text(
                'GOVT. OF ODISHA · TDCCOL BANASETU LEDGER · OFFICIAL AUDIT RECORD · CONFIDENTIAL & STATUTORY',
                margin,
                footerY
              );
            doc
              .font('Helvetica-Bold')
              .fontSize(6.5)
              .fillColor('#1f1a14')
              .text(`Page ${i + 1} of ${range.count}`, margin, footerY, {
                width: contentWidth,
                align: 'right',
              });
          }
        } catch (paginationErr) {
          console.error('Error adding running footer to audit PDF:', paginationErr);
        }
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', (err: Error) => reject(err));

      // ----------------------------------------------------------------------
      // Page 1: Header & Institutional Identification
      // ----------------------------------------------------------------------
      doc.rect(margin, margin, contentWidth, 3).fill('#1f2a22');
      let currentY = margin + 10;

      // Header row
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#1f2a22')
        .text('GOVERNMENT OF ODISHA · ST & SC DEVELOPMENT DEPARTMENT', margin, currentY);

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#574c43')
        .text('Tribal Development Co-operative Corporation of Odisha (TDCCOL) · LABHA Scheme', margin, currentY + 14);

      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#000000')
        .text('CHAIN-OF-CUSTODY AUDIT TRAIL & DISCREPANCY DOSSIER', margin, currentY + 27);

      // Top right QR code and badge
      const qrSize = 58;
      const qrX = margin + contentWidth - qrSize;
      doc.image(qrPngBuffer, qrX, currentY - 2, { width: qrSize, height: qrSize });
      doc
        .font('Helvetica')
        .fontSize(5.5)
        .fillColor('#000000')
        .text('Scan for Public Registry', qrX - 4, currentY + qrSize - 1, {
          width: qrSize + 8,
          align: 'center',
        });

      currentY += 46;
      doc.lineWidth(0.75).moveTo(margin, currentY).lineTo(qrX - 10, currentY).stroke('#1f2a22');
      currentY += 8;

      // ----------------------------------------------------------------------
      // Section 1: Entity Metadata & Officer Request Context
      // ----------------------------------------------------------------------
      const colW = (contentWidth - 12) / 3;

      // Box 1: Target Entity
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#574c43').text('TARGET ENTITY IDENTIFIER', margin, currentY);
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#000000')
        .text(data.entityId.startsWith('#') ? data.entityId : `#${data.entityId}`, margin, currentY + 9);
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#1f1a14')
        .text(`Status: [ ${data.status.replace(/_/g, ' ')} ]`, margin, currentY + 25);

      // Box 2: Produce & Botanical Taxonomy
      const col2X = margin + colW + 6;
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#574c43').text('COMMODITY / TAXONOMY', col2X, currentY);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000').text(data.produceName, col2X, currentY + 9);
      const taxLine = [
        data.scientificName ? `Sci: ${data.scientificName}` : null,
        data.produceOdia ? `Local: ${data.produceOdia}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      doc.font('Helvetica-Oblique').fontSize(7).fillColor('#574c43').text(taxLine || 'Standard Forest Produce', col2X, currentY + 22);

      // Box 3: Audit Requester & District Scoping
      const col3X = margin + colW * 2 + 12;
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#574c43').text('REPORT ISSUED TO', col3X, currentY);
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#000000')
        .text(`${data.generatedBy.name} (${data.generatedBy.role})`, col3X, currentY + 9);
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#574c43')
        .text(`District: ${data.generatedBy.district} · Generated: ${data.generatedAt}`, col3X, currentY + 22);

      currentY += 40;
      doc.lineWidth(0.5).moveTo(margin, currentY).lineTo(margin + contentWidth, currentY).stroke('#cccccc');
      currentY += 8;

      // ----------------------------------------------------------------------
      // Section 2: Step 1 Field Aggregation Intake & Transit Dispatch
      // ----------------------------------------------------------------------
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1f2a22').text('1. STAGE 1 — FIELD AGGREGATION & VEHICLE DISPATCH RECORD', margin, currentY);
      currentY += 12;

      if (data.step1) {
        const s1 = data.step1;
        const boxW = (contentWidth - 10) / 2;

        // Weighment card
        doc.rect(margin, currentY, boxW, 56).fillAndStroke('#faf6ee', '#d4cebe');
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#574c43').text('CERTIFIED FIELD SCALE WEIGHMENT', margin + 8, currentY + 6);
        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor('#000000')
          .text(`${s1.netAcceptedKg.toFixed(1)} kg NET`, margin + 8, currentY + 16);
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#1f1a14')
          .text(
            `Gross: ${s1.grossWeightKg.toFixed(1)} kg · Tare: ${s1.tareWeightKg.toFixed(1)} kg · ${s1.sackCount || 1} Bag(s)`,
            margin + 8,
            currentY + 33
          );
        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor('#574c43')
          .text(`Grade: ${s1.grade || 'Standard Intake'} · Seal Tag: ${s1.sealTagId || 'N/A'}`, margin + 8, currentY + 44);

        // Logistics card
        const logX = margin + boxW + 10;
        doc.rect(logX, currentY, boxW, 56).fillAndStroke('#faf6ee', '#d4cebe');
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#574c43').text('TRANSIT ROUTING & DISPATCH CUSTODY', logX + 8, currentY + 6);
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#1f1a14')
          .text(`Intake Center: ${data.centerName}`, logX + 8, currentY + 16);
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#1f1a14')
          .text(`Waybill ID: ${s1.transitWaybillId || 'PENDING'} · Vehicle: ${s1.vehicleNumber || 'Unassigned'}`, logX + 8, currentY + 26);
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#1f1a14')
          .text(
            `Driver: ${s1.driverName || 'Authorized Carrier'} · Tarpaulin: ${s1.tarpaulinConfirmed ? 'Confirmed' : 'Unconfirmed'}`,
            logX + 8,
            currentY + 36
          );
        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor('#574c43')
          .text(`Certified By: ${s1.verifiedBy} (${s1.verifiedByRole}) on ${s1.verifiedAt}`, logX + 8, currentY + 46);

        currentY += 64;
      } else {
        doc.rect(margin, currentY, contentWidth, 24).fillAndStroke('#f7f7f7', '#e0e0e0');
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#737373')
          .text('Stage 1 verification pending: No field collection intake record committed yet.', margin + 10, currentY + 8);
        currentY += 32;
      }

      // ----------------------------------------------------------------------
      // Section 3: Step 2 Central Depôt Arrival & Tolerance Analysis
      // ----------------------------------------------------------------------
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1f2a22').text('2. STAGE 2 — CENTRAL DEPÔT ARRIVAL & NATURAL SHRINKAGE TOLERANCE', margin, currentY);
      currentY += 12;

      if (data.step2) {
        const s2 = data.step2;
        const boxW = (contentWidth - 10) / 2;

        // Arrival reweighment
        doc.rect(margin, currentY, boxW, 56).fillAndStroke('#faf6ee', '#d4cebe');
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#574c43').text('CENTRAL DEPÔT PLATFORM SCALE REWEIGHMENT', margin + 8, currentY + 6);
        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor('#000000')
          .text(`${s2.arrivalNetWeightKg.toFixed(1)} kg ARRIVAL NET`, margin + 8, currentY + 16);
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#1f1a14')
          .text(
            `Arrival Gross: ${s2.arrivalGrossWeightKg.toFixed(1)} kg · Arrival Tare: ${s2.arrivalTareWeightKg.toFixed(1)} kg`,
            margin + 8,
            currentY + 33
          );
        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor('#574c43')
          .text(`Storage Zone: ${s2.storageZone} · Depôt: ${s2.receivingDepot || data.destinationDepot || 'Central Depôt'}`, margin + 8, currentY + 44);

        // Shrinkage math card
        const mathX = margin + boxW + 10;
        const varianceBg = s2.discrepancyTriggered ? '#fef3f2' : '#f0fdf4';
        const varianceBorder = s2.discrepancyTriggered ? '#fecdca' : '#bbf7d0';
        doc.rect(mathX, currentY, boxW, 56).fillAndStroke(varianceBg, varianceBorder);
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#574c43').text('SHRINKAGE & VARIANCE TOLERANCE AUDIT', mathX + 8, currentY + 6);
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#1f1a14')
          .text(
            `Configured Tolerance: ${s2.shrinkagePercentAllowed.toFixed(1)}% · Allowable Loss: ${s2.shrinkageKgAllowed.toFixed(2)} kg`,
            mathX + 8,
            currentY + 16
          );
        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor(s2.discrepancyTriggered ? '#b42318' : '#15803d')
          .text(
            `Unexplained Variance: ${s2.unexplainedVarianceKg > 0 ? '+' : ''}${s2.unexplainedVarianceKg.toFixed(2)} kg [${
              s2.discrepancyTriggered ? 'QUARANTINE DISCREPANCY FLAGGED' : 'WITHIN TOLERANCE'
            }]`,
            mathX + 8,
            currentY + 28
          );
        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor('#574c43')
          .text(`Depôt Verification Officer: ${s2.verifiedBy} (${s2.verifiedByRole}) on ${s2.verifiedAt}`, mathX + 8, currentY + 44);

        currentY += 64;
      } else {
        doc.rect(margin, currentY, contentWidth, 24).fillAndStroke('#f7f7f7', '#e0e0e0');
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#737373')
          .text('Stage 2 verification pending: Batch in transit or awaiting platform scale arrival reweighment.', margin + 10, currentY + 8);
        currentY += 32;
      }

      // ----------------------------------------------------------------------
      // Section 4: Discrepancy & Dispute Review (Conditional)
      // ----------------------------------------------------------------------
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1f2a22').text('3. STAGE 3 — ADMINISTRATIVE DISCREPANCY & SUPERVISOR ARBITRATION', margin, currentY);
      currentY += 12;

      if (data.discrepancies.length > 0) {
        for (const disc of data.discrepancies) {
          doc.rect(margin, currentY, contentWidth, 54).fillAndStroke('#fffbfa', '#fecdca');
          doc
            .font('Helvetica-Bold')
            .fontSize(7.5)
            .fillColor('#b42318')
            .text(`DISCREPANCY CASE: #${disc.id} · STATUS: [ ${disc.status.replace(/_/g, ' ')} ]`, margin + 8, currentY + 6);
          doc
            .font('Helvetica')
            .fontSize(7)
            .fillColor('#1f1a14')
            .text(
              `Dispatched Net: ${disc.dispatchedNetKg.toFixed(1)} kg · Arrival Net: ${disc.arrivalNetKg.toFixed(1)} kg · Unexplained Loss: ${disc.unexplainedVarianceKg.toFixed(2)} kg`,
              margin + 8,
              currentY + 17
            );
          doc
            .font('Helvetica')
            .fontSize(7)
            .fillColor('#1f1a14')
            .text(
              `Assigned Supervisor: ${disc.assignedSupervisor} · Action Taken: ${disc.currentActionTaken}`,
              margin + 8,
              currentY + 28
            );
          doc
            .font('Helvetica-Bold')
            .fontSize(6.5)
            .fillColor('#574c43')
            .text(
              `Supervisor Rationale / Note: ${disc.resolutionReason || disc.notes || 'Under active administrative review'}${
                disc.resolvedAt ? ` (Resolved: ${disc.resolvedAt})` : ''
              }`,
              margin + 8,
              currentY + 40,
              { width: contentWidth - 16 }
            );
          currentY += 60;
        }
      } else {
        doc.rect(margin, currentY, contentWidth, 22).fillAndStroke('#f0fdf4', '#bbf7d0');
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#15803d')
          .text(
            'STATUS: WITHIN NATURAL SHRINKAGE TOLERANCE — Zero discrepancy disputes or administrative quarantines filed for this entity.',
            margin + 10,
            currentY + 7
          );
        currentY += 28;
      }

      // Check remaining vertical budget before table header
      if (currentY > pageHeight - margin - 140) {
        doc.addPage();
        currentY = margin + 15;
      }

      // ----------------------------------------------------------------------
      // Section 5: Append-Only Chronological Audit Event Ledger Table
      // ----------------------------------------------------------------------
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1f2a22').text('4. APPEND-ONLY MONOTONIC AUDIT TRAIL LOG', margin, currentY);
      currentY += 12;

      // Table Header Row
      const colTimestamp = 90;
      const colActor = 100;
      const colAction = 90;
      const colDetails = contentWidth - (colTimestamp + colActor + colAction);

      const drawTableHeader = (y: number) => {
        doc.rect(margin, y, contentWidth, 14).fill('#1f2a22');
        doc.font('Helvetica-Bold').fontSize(6).fillColor('#ffffff');
        doc.text('TIMESTAMP', margin + 4, y + 4, { width: colTimestamp });
        doc.text('ACTOR (ROLE)', margin + colTimestamp + 4, y + 4, { width: colActor });
        doc.text('ACTION / TYPE', margin + colTimestamp + colActor + 4, y + 4, { width: colAction });
        doc.text('EVENT SUMMARY & SECURITY HASH', margin + colTimestamp + colActor + colAction + 4, y + 4, { width: colDetails });
      };

      drawTableHeader(currentY);
      currentY += 14;

      if (data.events.length > 0) {
        for (let idx = 0; idx < data.events.length; idx++) {
          const ev = data.events[idx];

          // Check for page break inside table loop
          const estimatedRowHeight = 24;
          if (currentY + estimatedRowHeight > pageHeight - margin - 45) {
            doc.addPage();
            currentY = margin + 15;
            drawTableHeader(currentY);
            currentY += 14;
          }

          const isEven = idx % 2 === 0;
          doc.rect(margin, currentY, contentWidth, 22).fill(isEven ? '#ffffff' : '#faf8f5');
          doc.lineWidth(0.25).rect(margin, currentY, contentWidth, 22).stroke('#e5e5e5');

          // Timestamp
          doc.font('Helvetica').fontSize(6).fillColor('#1f1a14').text(ev.timestamp, margin + 4, currentY + 3, { width: colTimestamp - 8 });

          // Actor & Role
          doc
            .font('Helvetica-Bold')
            .fontSize(6)
            .fillColor('#000000')
            .text(ev.actorName, margin + colTimestamp + 4, currentY + 3, { width: colActor - 8 });
          doc
            .font('Helvetica')
            .fontSize(5.5)
            .fillColor('#574c43')
            .text(ev.actorRole, margin + colTimestamp + 4, currentY + 11, { width: colActor - 8 });

          // Action Type & Simulation Label
          doc
            .font('Helvetica-Bold')
            .fontSize(6)
            .fillColor('#1f1a14')
            .text(ev.actionType, margin + colTimestamp + colActor + 4, currentY + 3, { width: colAction - 8 });
          doc
            .font('Helvetica-Bold')
            .fontSize(5)
            .fillColor(ev.isSimulated ? '#b42318' : '#15803d')
            .text(
              ev.isSimulated ? '[SIMULATED PROTOTYPE]' : '[RECORDED TRANSACTION]',
              margin + colTimestamp + colActor + 4,
              currentY + 11,
              { width: colAction - 8 }
            );

          // Summary & Hash Details
          const detailX = margin + colTimestamp + colActor + colAction + 4;
          doc
            .font('Helvetica-Bold')
            .fontSize(6)
            .fillColor('#000000')
            .text(ev.title || ev.description, detailX, currentY + 3, { width: colDetails - 8 });
          
          const hashString = ev.eventHash ? `Checksum: ${ev.eventHash.substring(0, 16)}...` : `ID: ${ev.id}`;
          doc
            .font('Helvetica')
            .fontSize(5)
            .fillColor('#574c43')
            .text(`${hashString}${ev.safeDetailsSummary ? ` · ${ev.safeDetailsSummary}` : ''}`, detailX, currentY + 11, {
              width: colDetails - 8,
            });

          currentY += 22;
        }
      } else {
        doc.rect(margin, currentY, contentWidth, 20).fill('#f9f9f9');
        doc
          .font('Helvetica')
          .fontSize(6.5)
          .fillColor('#737373')
          .text('No chronological audit events recorded in ledger for this entity.', margin + 8, currentY + 7);
        currentY += 24;
      }

      currentY += 8;

      // ----------------------------------------------------------------------
      // Section 6: Statutory Safeguards & Non-Invention Notice
      // ----------------------------------------------------------------------
      if (currentY > pageHeight - margin - 50) {
        doc.addPage();
        currentY = margin + 15;
      }

      doc.rect(margin, currentY, contentWidth, 34).fillAndStroke('#fcfbf7', '#e5dfd3');
      doc.font('Helvetica-Bold').fontSize(6).fillColor('#1f2a22').text('STATUTORY AUDIT & DATA PRIVACY DECLARATION:', margin + 6, currentY + 5);
      doc.font('Helvetica').fontSize(5.5).fillColor('#574c43').text(
        '1. Individual tribal gatherer Aadhaar numbers, masked registration IDs, bank accounts, and DBT payment details are strictly excluded from this administrative custody dossier in compliance with Odisha tribal welfare privacy policy.\n' +
        '2. All records herein reflect committed field weighments and supervisory decisions logged in the BanaSetu ledger. No official forensic certificates, lab assays, or judicial approvals are invented.\n' +
        '3. Events marked [SIMULATED PROTOTYPE] represent prototype test transactions and must be reconciled with central databases prior to legal filings.',
        margin + 6,
        currentY + 13,
        { width: contentWidth - 12, lineGap: 1 }
      );

      // Finish document
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
