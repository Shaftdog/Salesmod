const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function fillWithCorrectData() {
  console.log('Loading PDF and filling with ACTUAL production data...\n');

  const pdfPath = '/Users/sherrardhaugabrooks/Documents/Salesmod/E&O_Insurance/EO_Renewal_Application_Fillable.pdf';
  const existingPdfBytes = fs.readFileSync(pdfPath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  try {
    // SECTION A: APPLICANT INFORMATION
    form.getTextField('firm_name').setText('ROI Home Services, Inc');
    form.getTextField('dba_name').setText('');
    form.getTextField('street').setText('522 S Hunt Club Blvd Ste 166');
    form.getTextField('city').setText('Apopka');
    form.getTextField('state').setText('FL');
    form.getTextField('zip').setText('32703');
    form.getTextField('phone').setText('407-720-9288');
    form.getTextField('email').setText('admin@roiappraise.com');
    form.getTextField('website').setText('');

    // Entity type - Corporation
    form.getCheckBox('type_corp').check();

    // No ownership changes
    form.getCheckBox('ownership_no').check();

    // SECTION B: PERSONNEL & STAFF COUNT
    form.getTextField('staff_appraisers').setText('1');
    form.getTextField('staff_sub_no_eo').setText('0');
    form.getTextField('staff_sub_with_eo').setText('0');
    form.getTextField('staff_trainees').setText('0');
    form.getTextField('staff_admin').setText('1');

    // PRODUCTION DATA - Three Highest Value Appraisals
    form.getTextField('high_client_1').setText('Vision');
    form.getTextField('high_value_1').setText('$4,000,000');
    form.getTextField('high_desc_1').setText('Interior Appraisal');

    form.getTextField('high_client_2').setText('Consolidated Analytics');
    form.getTextField('high_value_2').setText('$1,538,000');
    form.getTextField('high_desc_2').setText('Interior Appraisal');

    form.getTextField('high_client_3').setText('I Fund Cites');
    form.getTextField('high_value_3').setText('$3,450,000');
    form.getTextField('high_desc_3').setText('Interior Appraisal');

    // Production by Category - ACTUAL DATA FROM PREVIOUS APPLICATION
    // Last 12 Months
    form.getTextField('prod_sf_count').setText('257');
    form.getTextField('prod_sf_rev').setText('$125,839');
    form.getTextField('prod_sf_proj').setText('270 / $132,000');

    form.getTextField('prod_mf_count').setText('23');
    form.getTextField('prod_mf_rev').setText('$14,895');
    form.getTextField('prod_mf_proj').setText('25 / $16,000');

    form.getTextField('prod_land_count').setText('4');
    form.getTextField('prod_land_rev').setText('$1,850');
    form.getTextField('prod_land_proj').setText('5 / $2,000');

    form.getTextField('prod_new_const_count').setText('22');
    form.getTextField('prod_new_const_rev').setText('$10,995');
    form.getTextField('prod_new_const_proj').setText('25 / $12,000');

    form.getTextField('prod_condo_count').setText('9');
    form.getTextField('prod_condo_rev').setText('$3,845');
    form.getTextField('prod_condo_proj').setText('12 / $4,500');

    form.getTextField('prod_commercial_count').setText('0');
    form.getTextField('prod_commercial_rev').setText('$0');
    form.getTextField('prod_commercial_proj').setText('0 / $0');

    form.getTextField('prod_farm_count').setText('0');
    form.getTextField('prod_farm_rev').setText('$0');
    form.getTextField('prod_farm_proj').setText('0 / $0');

    form.getTextField('prod_reo_count').setText('0');
    form.getTextField('prod_reo_rev').setText('$0');
    form.getTextField('prod_reo_proj').setText('0 / $0');

    form.getTextField('prod_relo_count').setText('0');
    form.getTextField('prod_relo_rev').setText('$0');
    form.getTextField('prod_relo_proj').setText('0 / $0');

    form.getTextField('prod_other_count').setText('53');
    form.getTextField('prod_other_rev').setText('$7,595');
    form.getTextField('prod_other_proj').setText('55 / $8,000');

    // Totals
    form.getTextField('prod_total_count').setText('368');
    form.getTextField('prod_total_rev').setText('$165,019');
    form.getTextField('prod_total_proj').setText('392 / $174,500');

    // SECTION C: CLAIMS & DISCIPLINARY HISTORY
    form.getCheckBox('claims_no').check();
    form.getCheckBox('incident_no').check();
    form.getCheckBox('discipline_no').check();

    // SECTION D: ADDITIONAL QUESTIONS
    form.getCheckBox('ownership_int_no').check();
    form.getCheckBox('family_no').check();
    form.getCheckBox('firewall_yes').check();
    form.getCheckBox('encrypt_yes').check();
    form.getCheckBox('backup_yes').check();

    // SECTION E: COVERAGE SELECTION
    form.getCheckBox('limit_1m').check();
    form.getCheckBox('ded_10000').check();

    form.getTextField('license_states').setText('Florida');
    form.getTextField('license_number').setText('RD4854');
    form.getTextField('license_exp').setText('(To be determined)');

    // SIGNATURE
    form.getTextField('sig_date').setText('December 1, 2025');
    form.getTextField('sig_name').setText('Sherrard Haugabrooks');
    form.getTextField('sig_title').setText('Owner/Appraiser');

    console.log('✓ All fields filled with CORRECT data\n');

    // Save the filled PDF
    const pdfBytes = await pdfDoc.save();
    const outputPath = '/Users/sherrardhaugabrooks/Documents/Salesmod/E&O_Insurance/EO_Renewal_Application_FILLED_CORRECTED.pdf';
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`✓ Corrected PDF saved to:`);
    console.log(`  ${outputPath}\n`);

    console.log('Summary of ACTUAL data filled:');
    console.log('━'.repeat(60));
    console.log('Applicant: ROI Home Services, Inc');
    console.log('Address: 522 S Hunt Club Blvd Ste 166, Apopka, FL 32703');
    console.log('Staff: 1 Licensed Appraiser + 1 Admin');
    console.log('');
    console.log('ACTUAL Production (Last 12 Mo): 368 appraisals, $165,019 revenue');
    console.log('  - Single Family: 257 ($125,839)');
    console.log('  - Multi-Family: 23 ($14,895)');
    console.log('  - New Construction: 22 ($10,995)');
    console.log('  - Condos: 9 ($3,845)');
    console.log('  - Vacant Land: 4 ($1,850)');
    console.log('  - Other: 53 ($7,595)');
    console.log('');
    console.log('Projected (Next 12 Mo): 392 appraisals, $174,500 revenue');
    console.log('Average Fee: $448.42');
    console.log('Coverage Requested: $1M / $1M with $10K deductible');
    console.log('━'.repeat(60));

    console.log('\n⚠️  NOTE: This uses your ACTUAL production data from previous');
    console.log('    application, NOT the test data from the database.');

  } catch (error) {
    console.error('Error filling form:', error);
    throw error;
  }
}

fillWithCorrectData()
  .then(() => {
    console.log('\n✓ Application filling complete with CORRECT data!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  });
