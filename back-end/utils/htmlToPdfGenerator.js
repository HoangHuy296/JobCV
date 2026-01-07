const puppeteer = require('puppeteer');

/**
 * Generate PDF from HTML with template background
 * @param {Object} cv - CV object
 * @param {Array} sections - Array of section data
 * @param {string} templateThumbnail - Template background image URL
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateCVPDFFromHTML(cv, sections, templateThumbnail) {
  let browser;
  console.log(templateThumbnail)
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Build HTML content
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
            margin: 0;
            padding: 0;
          }
          .container {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            background: white;
            position: relative;
          }
          .template-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.15;
            pointer-events: none;
            z-index: 0;
          }
          .template-bg img {
            width: 100%;
            height: auto;
            display: block;
          }
          .content {
            position: relative;
            z-index: 1;
          }
          .section {
            position: absolute;
            padding: 10px;
          }
          .section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #2563eb;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            color: #1f2937;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .field {
            margin-bottom: 8px;
          }
          .field-label {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .field-value {
            font-size: 12px;
            line-height: 1.6;
            color: #1f2937;
            word-break: break-word;
          }
          .field-image {
            width: 120px;
            height: 120px;
            object-fit: cover;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
          }
          @page {
            size: A4;
            margin: 0;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .container { page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${templateThumbnail ? `<div class="template-bg"><img src="${templateThumbnail}" alt="Template Background" /></div>` : ''}
          <div class="content">
    `;
    
    // Add sections
    if (sections && sections.length > 0) {
      sections.forEach((section) => {
        if (!section.is_visible) return;
        
        const data = section.data || {};
        const hasData = Object.keys(data).length > 0;
        if (!hasData) return;
        
        const pos = section.position || { x: 0, y: 0, width: 100, height: 20 };
        
        html += `
          <div class="section" style="left: ${pos.x}%; top: ${pos.y}%; width: ${pos.width}%; min-height: ${pos.height}%;">
            <div class="section-header">
              <div class="section-title">${section.section_name || section.name || 'Section'}</div>
            </div>
        `;
        
        // Add fields
        Object.entries(data).forEach(([fieldId, value]) => {
          if (!value || value === '<p><br></p>') return;
          
          // Check if it's an image URL
          const isImage = typeof value === 'string' && (
            value.startsWith('http') && 
            (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png') || value.includes('.webp'))
          );
          
          if (isImage) {
            html += `
              <div class="field">
                <img src="${value}" alt="Image" class="field-image" />
              </div>
            `;
          } else {
            html += `
              <div class="field">
                <div class="field-value">${value}</div>
              </div>
            `;
          }
        });
        
        html += `</div>`;
      });
    }
    
    html += `
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Set content and generate PDF
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait for all images to load
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
          }))
      );
    });
    
    // Add a small delay to ensure rendering is complete
    await page.waitForTimeout(500);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { generateCVPDFFromHTML };
