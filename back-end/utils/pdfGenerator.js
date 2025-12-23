const PDFDocument = require('pdfkit');
const { convert } = require('html-to-text');

/**
 * Generate PDF from template-based CV data
 * @param {Object} cv - CV object with template_data
 * @param {Array} sections - Array of section data with positions
 * @returns {PDFDocument} PDF document stream
 */
function generateCVPDF(cv, sections) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    }
  });

  // Title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text(cv.title, { align: 'center' })
     .moveDown(1);

  // Add sections
  if (sections && sections.length > 0) {
    sections.forEach((sectionData, index) => {
      if (!sectionData.is_visible) return;
      
      const data = sectionData.data || {};
      const hasData = Object.keys(data).length > 0;
      
      if (!hasData) return;

      // Section header
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#2563eb')
         .text(sectionData.section_name || `Section ${index + 1}`, { underline: true })
         .moveDown(0.5);

      // Section content
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#000000');

      // Process each field in the section
      Object.entries(data).forEach(([fieldId, value]) => {
        if (!value || value === '<p><br></p>') return;

        // Convert HTML to plain text
        const plainText = convert(value, {
          wordwrap: 80,
          selectors: [
            { selector: 'ul', options: { itemPrefix: '  • ' } },
            { selector: 'ol', options: { itemPrefix: '  ' } },
            { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } }
          ]
        });

        if (plainText.trim()) {
          doc.text(plainText.trim(), {
            align: 'left',
            lineGap: 2
          });
          doc.moveDown(0.3);
        }
      });

      doc.moveDown(1);
    });
  } else {
    // Fallback if no sections
    doc.fontSize(12)
       .font('Helvetica')
       .text('Nội dung CV đang được cập nhật...', { align: 'center' });
  }

  // Footer
  doc.fontSize(8)
     .fillColor('#666666')
     .text(`Được tạo từ hệ thống Job-CV`, 50, doc.page.height - 50, {
       align: 'center'
     });

  return doc;
}

module.exports = { generateCVPDF };
