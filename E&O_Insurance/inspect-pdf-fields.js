const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function inspectPDFFields() {
  const pdfPath = '/Users/sherrardhaugabrooks/Documents/Salesmod/E&O_Insurance/EO_Renewal_Application_Fillable.pdf';
  const existingPdfBytes = fs.readFileSync(pdfPath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  const fields = form.getFields();

  console.log(`PDF has ${fields.length} form fields:\n`);

  fields.forEach((field, index) => {
    const name = field.getName();
    const type = field.constructor.name;
    console.log(`${index + 1}. Name: "${name}" | Type: ${type}`);
  });
}

inspectPDFFields().catch(console.error);
