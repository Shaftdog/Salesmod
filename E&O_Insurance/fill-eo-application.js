const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function fillEOApplication() {
  // Load the blank PDF
  const pdfPath = '/Users/sherrardhaugabrooks/Documents/Salesmod/E&O_Insurance/EO_Renewal_Application_Fillable.pdf';
  const existingPdfBytes = fs.readFileSync(pdfPath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  // Get all form fields to see their names
  const fields = form.getFields();
  console.log('Available form fields:');
  fields.forEach(field => {
    const name = field.getName();
    const type = field.constructor.name;
    console.log(`${name} (${type})`);
  });

  // Fill out the form (we'll fill this in after seeing field names)
  try {
    // SECTION A: APPLICANT INFORMATION
    const firmNameField = form.getTextField('firmName');
    if (firmNameField) firmNameField.setText('ROI Home Services, Inc');

    const dbaField = form.getTextField('dba');
    if (dbaField) dbaField.setText('');

    const streetField = form.getTextField('street');
    if (streetField) streetField.setText('522 S Hunt Club Blvd Ste 166');

    const cityField = form.getTextField('city');
    if (cityField) cityField.setText('Apopka');

    const stateField = form.getTextField('state');
    if (stateField) stateField.setText('FL');

    const zipField = form.getTextField('zip');
    if (zipField) zipField.setText('32703');

    const phoneField = form.getTextField('phone');
    if (phoneField) phoneField.setText('407-720-9288');

    const emailField = form.getTextField('email');
    if (emailField) emailField.setText('admin@roiappraise.com');

    const websiteField = form.getTextField('website');
    if (websiteField) websiteField.setText('');

    // Entity type - Corporation checkbox
    const entityCorp = form.getCheckBox('entityCorporation');
    if (entityCorp) entityCorp.check();

    // No ownership changes
    const ownershipNo = form.getCheckBox('ownershipChangesNo');
    if (ownershipNo) ownershipNo.check();

    // SECTION B: PERSONNEL & STAFF COUNT
    const licensedAppraisers = form.getTextField('licensedAppraisers');
    if (licensedAppraisers) licensedAppraisers.setText('1');

    const subcontractorsWithout = form.getTextField('subcontractorsWithoutEO');
    if (subcontractorsWithout) subcontractorsWithout.setText('0');

    const contractorsWith = form.getTextField('contractorsWithEO');
    if (contractorsWith) contractorsWith.setText('0');

    const trainees = form.getTextField('trainees');
    if (trainees) trainees.setText('0');

    const officeSupport = form.getTextField('officeSupport');
    if (officeSupport) officeSupport.setText('1');

    // PRODUCTION DATA
    // Three highest value appraisals
    const client1 = form.getTextField('client1');
    if (client1) client1.setText('Vision');

    const value1 = form.getTextField('value1');
    if (value1) value1.setText('$4,000,000');

    const desc1 = form.getTextField('description1');
    if (desc1) desc1.setText('Interior Appraisal');

    const client2 = form.getTextField('client2');
    if (client2) client2.setText('Consolidated Analytics');

    const value2 = form.getTextField('value2');
    if (value2) value2.setText('$1,538,000');

    const desc2 = form.getTextField('description2');
    if (desc2) desc2.setText('Interior Appraisal');

    const client3 = form.getTextField('client3');
    if (client3) client3.setText('I Fund Cites');

    const value3 = form.getTextField('value3');
    if (value3) value3.setText('$3,450,000');

    const desc3 = form.getTextField('description3');
    if (desc3) desc3.setText('Interior Appraisal');

    // Production by category - Last 12 months
    const sfCount = form.getTextField('sfCount12');
    if (sfCount) sfCount.setText('257');

    const sfRevenue = form.getTextField('sfRevenue12');
    if (sfRevenue) sfRevenue.setText('$125,839');

    const mfCount = form.getTextField('mfCount12');
    if (mfCount) mfCount.setText('23');

    const mfRevenue = form.getTextField('mfRevenue12');
    if (mfRevenue) mfRevenue.setText('$14,895');

    const landCount = form.getTextField('landCount12');
    if (landCount) landCount.setText('4');

    const landRevenue = form.getTextField('landRevenue12');
    if (landRevenue) landRevenue.setText('$1,850');

    const newConstCount = form.getTextField('newConstCount12');
    if (newConstCount) newConstCount.setText('22');

    const newConstRevenue = form.getTextField('newConstRevenue12');
    if (newConstRevenue) newConstRevenue.setText('$10,995');

    const condoCount = form.getTextField('condoCount12');
    if (condoCount) condoCount.setText('9');

    const condoRevenue = form.getTextField('condoRevenue12');
    if (condoRevenue) condoRevenue.setText('$3,845');

    const otherCount = form.getTextField('otherCount12');
    if (otherCount) otherCount.setText('53');

    const otherRevenue = form.getTextField('otherRevenue12');
    if (otherRevenue) otherRevenue.setText('$7,595');

    const totalCount = form.getTextField('totalCount12');
    if (totalCount) totalCount.setText('368');

    const totalRevenue = form.getTextField('totalRevenue12');
    if (totalRevenue) totalRevenue.setText('$165,019');

    // Projected next 12 months
    const sfCountProj = form.getTextField('sfCountProj');
    if (sfCountProj) sfCountProj.setText('270');

    const sfRevenueProj = form.getTextField('sfRevenueProj');
    if (sfRevenueProj) sfRevenueProj.setText('$132,000');

    // ... continue for all projected fields

    // SECTION C: CLAIMS & DISCIPLINARY HISTORY
    const claims8No = form.getCheckBox('claims8No');
    if (claims8No) claims8No.check();

    const claims9No = form.getCheckBox('claims9No');
    if (claims9No) claims9No.check();

    const claims10No = form.getCheckBox('claims10No');
    if (claims10No) claims10No.check();

    // SECTION D: ADDITIONAL QUESTIONS
    const q11No = form.getCheckBox('q11No');
    if (q11No) q11No.check();

    const q12No = form.getCheckBox('q12No');
    if (q12No) q12No.check();

    const q13Yes = form.getCheckBox('q13Yes');
    if (q13Yes) q13Yes.check();

    const q14Yes = form.getCheckBox('q14Yes');
    if (q14Yes) q14Yes.check();

    const q15Yes = form.getCheckBox('q15Yes');
    if (q15Yes) q15Yes.check();

    // SECTION E: COVERAGE SELECTION
    const limit1M = form.getCheckBox('limit1000000');
    if (limit1M) limit1M.check();

    const deduct10k = form.getCheckBox('deduct10000');
    if (deduct10k) deduct10k.check();

    const states = form.getTextField('licensedStates');
    if (states) states.setText('Florida');

    const licenseNum = form.getTextField('primaryLicense');
    if (licenseNum) licenseNum.setText('RD4854');

    // Save the filled PDF
    const pdfBytes = await pdfDoc.save();
    const outputPath = '/Users/sherrardhaugabrooks/Documents/Salesmod/E&O_Insurance/EO_Renewal_Application_FILLED.pdf';
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`\nFilled PDF saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error filling form:', error.message);
    console.log('\nNote: Field names may not match. Showing available fields above for reference.');
  }
}

fillEOApplication().catch(console.error);
