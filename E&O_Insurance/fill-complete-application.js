const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function fillCompleteApplication() {
  console.log('Loading PDF...\n');

  const pdfPath = '/Users/sherrardhaugabrooks/Documents/Salesmod/E&O_Insurance/EO_Renewal_Application_Fillable.pdf';
  const existingPdfBytes = fs.readFileSync(pdfPath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  console.log('Filling form fields...\n');

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
    // Note: Using fee amounts as proxy since we don't store final appraised values
    form.getTextField('high_client_1').setText('(To be determined from records)');
    form.getTextField('high_value_1').setText('$2,500');
    form.getTextField('high_desc_1').setText('Single Family - Interior Appraisal');

    form.getTextField('high_client_2').setText('(To be determined from records)');
    form.getTextField('high_value_2').setText('$2,450');
    form.getTextField('high_desc_2').setText('Single Family - Interior Appraisal');

    form.getTextField('high_client_3').setText('(To be determined from records)');
    form.getTextField('high_value_3').setText('$2,250');
    form.getTextField('high_desc_3').setText('Single Family - Interior Appraisal');

    // Production by Category - Last 12 Months
    form.getTextField('prod_sf_count').setText('1000');
    form.getTextField('prod_sf_rev').setText('$383,831');
    form.getTextField('prod_sf_proj').setText('1100 / $422,214');

    form.getTextField('prod_mf_count').setText('0');
    form.getTextField('prod_mf_rev').setText('$0');
    form.getTextField('prod_mf_proj').setText('0 / $0');

    form.getTextField('prod_land_count').setText('0');
    form.getTextField('prod_land_rev').setText('$0');
    form.getTextField('prod_land_proj').setText('0 / $0');

    form.getTextField('prod_new_const_count').setText('0');
    form.getTextField('prod_new_const_rev').setText('$0');
    form.getTextField('prod_new_const_proj').setText('0 / $0');

    form.getTextField('prod_condo_count').setText('0');
    form.getTextField('prod_condo_rev').setText('$0');
    form.getTextField('prod_condo_proj').setText('0 / $0');

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

    form.getTextField('prod_other_count').setText('0');
    form.getTextField('prod_other_rev').setText('$0');
    form.getTextField('prod_other_proj').setText('0 / $0');

    // Totals
    form.getTextField('prod_total_count').setText('1000');
    form.getTextField('prod_total_rev').setText('$383,831');
    form.getTextField('prod_total_proj').setText('1100 / $422,214');

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

    console.log('✓ All fields filled successfully\n');

    // Save the filled PDF
    const pdfBytes = await pdfDoc.save();
    const outputPath = '/Users/sherrardhaugabrooks/Documents/Salesmod/E&O_Insurance/EO_Renewal_Application_FILLED.pdf';
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`✓ Filled PDF saved to:`);
    console.log(`  ${outputPath}\n`);

    console.log('Summary of data filled:');
    console.log('━'.repeat(60));
    console.log('Applicant: ROI Home Services, Inc');
    console.log('Address: 522 S Hunt Club Blvd Ste 166, Apopka, FL 32703');
    console.log('Staff: 1 Licensed Appraiser + 1 Admin');
    console.log('Production (Last 12 Mo): 1,000 appraisals, $383,831 revenue');
    console.log('Projected (Next 12 Mo): 1,100 appraisals, $422,214 revenue');
    console.log('Coverage Requested: $1M / $1M with $10K deductible');
    console.log('License: RD4854 (Florida)');
    console.log('━'.repeat(60));

    console.log('\nNext steps:');
    console.log('1. Review the filled PDF');
    console.log('2. Add actual appraised VALUES for the 3 highest value appraisals');
    console.log('3. Add client names for those 3 appraisals');
    console.log('4. Add license expiration date');
    console.log('5. Sign the document (may need to print and sign manually)');
    console.log('6. Attach required documents:');
    console.log('   - Previous carrier loss history (Great American)');
    console.log('   - Expiring declaration page');
    console.log('7. Submit to Norman-Spencer Agency');

  } catch (error) {
    console.error('Error filling form:', error);
    throw error;
  }
}

fillCompleteApplication()
  .then(() => {
    console.log('\n✓ Application filling complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  });
