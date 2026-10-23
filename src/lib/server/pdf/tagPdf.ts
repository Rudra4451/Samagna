import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/**
 * Data contract for server-side A6 tag PDF generation.
 * Applicable to both physical collection lot tags and product lot specification tags.
 * All fields are derived from verified database records and configured species catalogue.
 */
export interface TagPdfData {
  code: string;
  produceName: string;
  produceOdia?: string;
  scientificName?: string | null;
  category?: string | null;
  district: string;
  block: string;
  gramPanchayat?: string;
  centerName: string;
  destinationDepot?: string | null;
  status: string;
  netWeightKg?: number | null;
  grossWeightKg?: number | null;
  tareWeightKg?: number | null;
  sackCount?: number | null;
  sealTagId?: string | null;
  transitWaybillId?: string | null;
  qualityGrade?: string | null;
  dateStr: string;
  verificationUrl: string;
  // Authoritative catalogue product guidance (when configured)
  standardPackaging?: string;
  maxMoisturePercent?: number;
  shrinkageTolerancePercent?: number;
  harvestSeason?: string;
  storageGuidelines?: string;
}

export type TagType = 'collection' | 'product';

/**
 * Generates an authoritative, print-ready A6 tag PDF buffer.
 *
 * Design Specifications:
 * - Page Format: ISO 216 A6 (297.64 pt x 419.53 pt, 105mm x 148mm)
 * - Margins: 18 pt (~6.35 mm)
 * - Color Space: High-contrast black and white for dot-matrix and thermal printing
 * - Anti-Tamper: Embeds machine-readable QR code pointing to public verification URL
 * - Privacy: Zero personal collector identity, Aadhaar, bank, or DBT references exposed
 */
export async function generateTagPdfBuffer(
  data: TagPdfData,
  tagType: TagType = 'collection'
): Promise<Buffer> {
  // Generate machine-readable QR code PNG buffer
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
      const pageWidth = 297.64;
      const pageHeight = 419.53;
      const margin = 18;
      const contentWidth = pageWidth - margin * 2; // 261.64 pt
      const contentHeight = pageHeight - margin * 2; // 383.53 pt

      const isProductTag = tagType === 'product';

      const doc = new PDFDocument({
        size: 'A6',
        margin: margin,
        info: {
          Title: `BanaSetu ${isProductTag ? 'Product Tag' : 'Collection Tag'} ${data.code}`,
          Author: 'TDCCOL Government of Odisha',
          Subject: isProductTag
            ? 'Minor Forest Produce Lot Specification Tag'
            : 'Minor Forest Produce Collection Batch Sack Tag',
          Keywords: `BanaSetu, TDCCOL, Odisha, ${tagType}, MFP, Traceability, ${data.code}, ${
            isProductTag
              ? `PRODUCE_LOT_SPECIFICATION_TAG, ${data.category || ''}, NON_INVENTION_DISCLAIMER`
              : 'OFFICIAL_BATCH_SACK_TAG'
          }`,
          CreationDate: new Date(),
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // ----------------------------------------------------------------------
      // 1. Double Outer Security Border (Crisp Black & White)
      // ----------------------------------------------------------------------
      doc.lineWidth(1.2).rect(margin, margin, contentWidth, contentHeight).stroke('#000000');
      doc.lineWidth(0.5).rect(margin + 2.5, margin + 2.5, contentWidth - 5, contentHeight - 5).stroke('#000000');

      // ----------------------------------------------------------------------
      // 2. Header Banner
      // ----------------------------------------------------------------------
      const bannerHeight = 22;
      doc.rect(margin + 2.5, margin + 2.5, contentWidth - 5, bannerHeight).fill('#000000');
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#FFFFFF')
        .text(
          isProductTag
            ? 'BANASATU · PRODUCE LOT SPECIFICATION TAG'
            : 'BANASATU · OFFICIAL BATCH SACK TAG',
          margin,
          margin + 7.5,
          { width: contentWidth, align: 'center' }
        );

      let currentY = margin + bannerHeight + 6;

      // ----------------------------------------------------------------------
      // 3. Top Section: Identifier & QR Code
      // ----------------------------------------------------------------------
      const qrSize = 64;
      const qrX = margin + contentWidth - qrSize - 5;
      const infoWidth = qrX - margin - 10;

      // Top-Left Batch / Lot ID
      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor('#000000')
        .text(isProductTag ? 'PRODUCE LOT IDENTIFIER' : 'OFFICIAL BATCH IDENTIFIER', margin + 6, currentY);

      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#000000')
        .text(data.code.startsWith('#') ? data.code : `#${data.code}`, margin + 6, currentY + 9);

      // Status Badge or Category
      const subBadgeY = currentY + 34;
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#000000')
        .text(
          isProductTag
            ? `CATEGORY: ${data.category || 'Forest Botanical'}`
            : `STATUS: [ ${data.status.replace(/_/g, ' ')} ]`,
          margin + 6,
          subBadgeY
        );

      // Top-Right QR Code
      doc.image(qrPngBuffer, qrX, currentY - 1, { width: qrSize, height: qrSize });
      doc
        .font('Helvetica')
        .fontSize(5.5)
        .fillColor('#000000')
        .text('Scan to Verify Provenance', qrX - 4, currentY + qrSize + 1, {
          width: qrSize + 8,
          align: 'center',
        });

      currentY = currentY + qrSize + 11;

      // Divider Line 1
      doc.lineWidth(0.75).moveTo(margin + 2.5, currentY).lineTo(margin + contentWidth - 2.5, currentY).stroke('#000000');
      currentY += 6;

      // ----------------------------------------------------------------------
      // 4. Section: Produce Specifications & Botanical Classification
      // ----------------------------------------------------------------------
      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor('#000000')
        .text('BOTANICAL SPECIES & PRODUCE CLASSIFICATION', margin + 6, currentY);

      currentY += 9;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#000000')
        .text(data.produceName, margin + 6, currentY, { width: contentWidth - 12 });

      currentY += 15;
      const botLine = [
        data.scientificName ? `Sci: ${data.scientificName}` : null,
        data.produceOdia ? `Local: ${data.produceOdia}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

      if (botLine) {
        doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#000000').text(botLine, margin + 6, currentY);
        currentY += 11;
      }

      // Divider Line 2
      doc.lineWidth(0.5).moveTo(margin + 2.5, currentY).lineTo(margin + contentWidth - 2.5, currentY).stroke('#000000');
      currentY += 6;

      // ----------------------------------------------------------------------
      // 5. Distinct Body Sections based on Tag Type
      // ----------------------------------------------------------------------
      if (isProductTag) {
        // --- PRODUCT TAG SPECIFICATIONS ---
        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor('#000000')
          .text('LOT INTAKE PROVENANCE & HARVEST', margin + 6, currentY);

        currentY += 10;
        const colW = (contentWidth - 16) / 2;

        // Column 1: Intake Center & District
        doc.font('Helvetica').fontSize(6).text('AGGREGATION CENTER:', margin + 6, currentY);
        doc.font('Helvetica-Bold').fontSize(7.5).text(data.centerName, margin + 6, currentY + 8, { width: colW });

        doc.font('Helvetica').fontSize(6).text('DISTRICT / BLOCK:', margin + 6, currentY + 28);
        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .text(`${data.block}, ${data.district}`, margin + 6, currentY + 36, { width: colW });

        // Column 2: Date & Season
        const col2X = margin + 8 + colW;
        doc.font('Helvetica').fontSize(6).text('COLLECTION DATE:', col2X, currentY);
        doc.font('Helvetica-Bold').fontSize(7.5).text(data.dateStr, col2X, currentY + 8);

        doc.font('Helvetica').fontSize(6).text('PRIMARY HARVEST SEASON:', col2X, currentY + 28);
        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .text(data.harvestSeason || 'Active Forest Season', col2X, currentY + 36);

        currentY += 52;
        // Divider Line 3
        doc.lineWidth(0.5).moveTo(margin + 2.5, currentY).lineTo(margin + contentWidth - 2.5, currentY).stroke('#000000');
        currentY += 6;

        // Section: Handling & Preservation Guidelines (Backed by configured guidance)
        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor('#000000')
          .text('PRESERVATION & STORAGE GUIDELINES', margin + 6, currentY);

        currentY += 10;
        doc.font('Helvetica').fontSize(6.5).fillColor('#000000').text(
          `Standard Packaging: ${data.standardPackaging || 'Jute Gunny Bag'}\n` +
          `Baseline Moisture Threshold: ${data.maxMoisturePercent ? `Max ${data.maxMoisturePercent}%` : 'Standard Field Moisture'}\n` +
          `Transit Evaporation Benchmark: ${data.shrinkageTolerancePercent ? `${data.shrinkageTolerancePercent}% natural allowance` : 'Natural Evaporation'}\n` +
          `Storage Advisory: ${data.storageGuidelines || 'Store in dry covered warehouse on raised wooden dunnage.'}`,
          margin + 6,
          currentY,
          { width: contentWidth - 12, lineGap: 1.5 }
        );

        currentY += 46;
        // Divider Line 4
        doc.lineWidth(0.5).moveTo(margin + 2.5, currentY).lineTo(margin + contentWidth - 2.5, currentY).stroke('#000000');
        currentY += 5;

        // Statutory Non-Invention Disclaimer
        doc.font('Helvetica').fontSize(5.5).fillColor('#000000').text(
          'OFFICIAL NOTICE: Storage parameters based on configured TDCCOL species profile. Never invent unverified organic, export, or lab certifications.',
          margin + 6,
          currentY,
          { width: contentWidth - 12, lineGap: 1 }
        );
      } else {
        // --- COLLECTION / BATCH SACK TAG SPECIFICATIONS ---
        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor('#000000')
          .text('SCALE WEIGHMENT & SACK CONTAINMENT', margin + 6, currentY);

        currentY += 9;
        const colW = (contentWidth - 16) / 2;

        // Column 1: Net Weight (Large)
        doc.font('Helvetica').fontSize(6).text('CERTIFIED NET WEIGHT:', margin + 6, currentY);
        const weightText =
          data.netWeightKg !== null && data.netWeightKg !== undefined
            ? `${Number(data.netWeightKg).toFixed(1)} kg`
            : 'PENDING CALIBRATION';

        doc.font('Helvetica-Bold').fontSize(16).text(weightText, margin + 6, currentY + 8);

        if (data.grossWeightKg !== null && data.grossWeightKg !== undefined) {
          doc
            .font('Helvetica')
            .fontSize(6)
            .text(
              `Gross: ${data.grossWeightKg.toFixed(1)} kg · Tare: ${(data.tareWeightKg || 0).toFixed(1)} kg`,
              margin + 6,
              currentY + 29
            );
        }

        // Column 2: Sack Details & Quality Grade
        const col2X = margin + 8 + colW;
        doc.font('Helvetica').fontSize(6).text('SACK / BUNDLE COUNT:', col2X, currentY);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(`${data.sackCount || 1} Standard Sack(s)`, col2X, currentY + 8);

        doc.font('Helvetica').fontSize(6).text('FIELD QUALITY GRADE:', col2X, currentY + 20);
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(data.qualityGrade || 'Standard Forest Intake', col2X, currentY + 28);

        currentY += 40;
        // Divider Line 3
        doc.lineWidth(0.5).moveTo(margin + 2.5, currentY).lineTo(margin + contentWidth - 2.5, currentY).stroke('#000000');
        currentY += 5;

        // Section: Logistics, Custody & Routing
        doc
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor('#000000')
          .text('CHAIN OF CUSTODY & TRANSIT ROUTING', margin + 6, currentY);

        currentY += 9;
        const metaLine1 = `Intake Center: ${data.centerName}`;
        const metaLine2 = `Jurisdiction: ${data.gramPanchayat ? data.gramPanchayat + ', ' : ''}${data.block}, ${data.district}`;
        const metaLine3 = `Destination Depôt: ${data.destinationDepot || 'Assigned District Depôt'}`;
        const metaLine4 = `Date: ${data.dateStr}${data.sealTagId ? ` · Seal Tag: ${data.sealTagId}` : ''}${data.transitWaybillId ? ` · Waybill: ${data.transitWaybillId}` : ''}`;

        doc
          .font('Helvetica')
          .fontSize(6.5)
          .text(`${metaLine1}\n${metaLine2}\n${metaLine3}\n${metaLine4}`, margin + 6, currentY, {
            width: contentWidth - 12,
            lineGap: 1.5,
          });

        currentY += 40;
        // Divider Line 4
        doc.lineWidth(0.5).moveTo(margin + 2.5, currentY).lineTo(margin + contentWidth - 2.5, currentY).stroke('#000000');
        currentY += 5;

        // Statutory Privacy Notice
        doc.font('Helvetica').fontSize(5.5).fillColor('#000000').text(
          'STATUTORY PRIVACY NOTICE: Gatherer personal identity, tribal registration numbers, and bank account details are strictly shielded on physical transport tags in compliance with Odisha MFP welfare privacy policy.',
          margin + 6,
          currentY,
          { width: contentWidth - 12, lineGap: 1 }
        );
      }

      // ----------------------------------------------------------------------
      // 6. Footer Row (Bottom Rule)
      // ----------------------------------------------------------------------
      const footerY = margin + contentHeight - 16;
      doc.lineWidth(0.5).moveTo(margin + 2.5, footerY).lineTo(margin + contentWidth - 2.5, footerY).stroke('#000000');

      doc
        .font('Helvetica')
        .fontSize(6)
        .fillColor('#000000')
        .text('BanaSetu · TDCCOL Odisha', margin + 6, footerY + 4);

      doc
        .font('Helvetica-Bold')
        .fontSize(6)
        .fillColor('#000000')
        .text('ISO 216 A6', margin, footerY + 4, { width: contentWidth, align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(6)
        .fillColor('#000000')
        .text('Helpline: 1800-345-6789', margin, footerY + 4, {
          width: contentWidth - 6,
          align: 'right',
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
