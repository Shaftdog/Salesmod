/**
 * Seed Production Task Templates from Screenshots
 *
 * This script creates the default production template with all tasks
 * and subtasks extracted from the task_templates screenshots.
 *
 * Run with: node scripts/seed-task-templates.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// TASK TEMPLATES DATA (extracted from screenshots)
// ============================================================================

const TASK_TEMPLATES = {
  // =========================================================================
  // INTAKE STAGE
  // =========================================================================
  INTAKE: [
    {
      title: 'INTAKE',
      description: 'Initial intake processing for new orders',
      default_role: 'admin',
      estimated_minutes: 60,
      is_required: true,
      subtasks: [
        // PRELOAD Section
        { title: 'PRELOAD', description: 'Section header', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Check if the order is in our coverage area. If not do we have data and if someone will do that inspection', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Make sure that the order price is within $50 of the Price Sheet. If not then make sure you have written permission to take this order and is attached here', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Print to PDF the order and engagement letter', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Check the client website and emails for all appropriate documentation needed for the assignment', default_role: 'admin', estimated_minutes: 10 },
        // CHECKLIST FOR QUESTIONNAIRE Section
        { title: 'CHECKLIST FOR QUESTIONNAIRE', description: 'Section header', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Aerial Map of the Subject', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Order', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Engagement Letter', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Pricing Model', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Zoning Code and Description', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Client Documents such as (Purchase Contract, etc.)', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Fill out the "NEW ORDER QUESTIONNAIRE" LINK ABOVE!', default_role: 'admin', estimated_minutes: 15 },
        // AFTER QUESTIONNAIRE Section
        { title: 'AFTER QUESTIONNAIRE', description: 'Section header', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Load Completed Questionnaire in the description of the New task created into "NEW ORDER BOT". LINK ABOVE!', default_role: 'admin', estimated_minutes: 10 },
        { title: 'Load the Cody recommended templates into the subtasks of the main file. USE YOUR OWN LOGIC TO MAKE SURE THEY ARE CORRECT AND REPORT BUGS', default_role: 'admin', estimated_minutes: 15 },
        { title: 'Mark the appraiser as the assignee for the main tasks. No due date', default_role: 'admin', estimated_minutes: 5 },
      ],
    },
    {
      title: 'SUPERVISOR ORDER REVIEW',
      description: 'Supervisor reviews order and assigns tasks',
      default_role: 'reviewer',
      estimated_minutes: 45,
      is_required: true,
      subtasks: [
        { title: 'Check to make sure bid request has been added to the main file', default_role: 'reviewer', estimated_minutes: 5 },
        { title: 'Review the order and documents to determine if everything is in the work file needed to do assignment. Assign tasks if needed', default_role: 'reviewer', estimated_minutes: 15 },
        { title: 'Delegate tasks, estimate hours and assign due dates in order to complete the appraisal assignments on time', default_role: 'reviewer', estimated_minutes: 15 },
        { title: 'Setup up client specific research and inspection tasks if any', default_role: 'reviewer', estimated_minutes: 10 },
        { title: 'Ensure that the order price is within $50 of the Price Sheet or have permission from Rod to proceed. If not launch a case', default_role: 'reviewer', estimated_minutes: 5 },
      ],
    },
    {
      title: 'NEW CONSTRUCTION CHECKLIST',
      description: 'For new construction orders - verify all required documents',
      default_role: 'admin',
      estimated_minutes: 30,
      is_required: false,
      subtasks: [
        { title: 'Plans current copy', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Budget current copy', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Finishes/Features', default_role: 'admin', estimated_minutes: 5 },
        { title: 'GLA verified', default_role: 'admin', estimated_minutes: 5 },
        { title: 'ARV, Reno/Build Budget, AIV (lot price/purchase), Loan (calculate 80% of ARV)', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Profit Analysis w/ARV (deal analyzer)', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'On Hold template (if unable to generate profit analysis)', default_role: 'admin', estimated_minutes: 5 },
        { title: 'On Hold template (if plans/budget or GLA not verified)', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Sketch required (if new construction or modified)', default_role: 'appraiser', estimated_minutes: 30 },
        { title: 'Reno/Build Budget Estimate (if budget is not available)', default_role: 'appraiser', estimated_minutes: 20 },
        { title: '1007/216 do not ask for lease', default_role: 'admin', estimated_minutes: 5 },
        { title: '1007/216 verify tenant or vacant', default_role: 'admin', estimated_minutes: 5 },
        { title: '1007/216 (AirBnb value)', default_role: 'appraiser', estimated_minutes: 15 },
        { title: '1007/216 (market value)', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'ARV template (delete if added)', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Vacant Lot (as is value) prior sale', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Prior Sale/Transfer of Subject', default_role: 'admin', estimated_minutes: 10 },
        { title: 'Prior Service', default_role: 'admin', estimated_minutes: 5 },
      ],
    },
    {
      title: 'ARV (EXISTING STRUCTURE) CHECKLIST',
      description: 'For ARV orders on existing structures',
      default_role: 'admin',
      estimated_minutes: 30,
      is_required: false,
      subtasks: [
        { title: 'Plans current copy', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Budget current copy', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Finishes/Features', default_role: 'admin', estimated_minutes: 5 },
        { title: 'GLA verified', default_role: 'admin', estimated_minutes: 5 },
        { title: 'ARV, Reno/Build Budget, AIV (lot price/purchase), Loan (calculate 80% of ARV)', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Profit Analysis w/ARV (deal analyzer)', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'On Hold template (if unable to generate profit analysis)', default_role: 'admin', estimated_minutes: 5 },
        { title: 'On Hold template (if plans/budget or GLA not verified)', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Sketch required (if new construction or modified)', default_role: 'appraiser', estimated_minutes: 30 },
        { title: 'Reno/Build Estimate (if budget is not available)', default_role: 'appraiser', estimated_minutes: 20 },
        { title: '1007/216 ask for a lease', default_role: 'admin', estimated_minutes: 5 },
        { title: '1007/216 verify tenant or vacant', default_role: 'admin', estimated_minutes: 5 },
        { title: '1007/216 (AirBnb value)', default_role: 'appraiser', estimated_minutes: 15 },
        { title: '1007/216 (market value)', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'New Construction template (delete if added)', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Land Value (develop land analysis)', default_role: 'appraiser', estimated_minutes: 20 },
        { title: 'Prior Sale/Transfer of Subject', default_role: 'admin', estimated_minutes: 10 },
        { title: 'Prior Service', default_role: 'admin', estimated_minutes: 5 },
      ],
    },
  ],

  // =========================================================================
  // SCHEDULING STAGE
  // =========================================================================
  SCHEDULING: [
    {
      title: 'SETUP REVIEW',
      description: 'Review setup and verify qualification for assignment',
      default_role: 'appraiser',
      estimated_minutes: 60,
      is_required: true,
      subtasks: [
        { title: 'Determine complexity and make sure you are qualified for the assignment', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Make sure boundaries are specific not just a radius or too broad', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Does the MCR, Neighborhood Section and Range Match?', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Check Charts interpretations to make page 1 is accurate. (NOTE: Stable for Mixed charts.)', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Check Neighborhood Comp CMA. Make sure it is within the range of Street and Subdivision Analysis', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Review Street and Subdivision Analysis. Determine Highs then report to Gut Check', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Verify Market Trends ( Increasing/Stable/Decreasing). Report to Gut Check', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Determine Exposure Time and Report to Gut Check and USPAP Addendum', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Assignment Type (Origination or Liquidation). Report to Gut Check', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Determine Property Type. Report to Gut Check', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Determine Condition and Quality based on Scheduling Notes. Report to Gut Check.', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Verify Location (Urban/Suburban/Rural) Report to Gut Check.', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Are the Land Use % reasonable', default_role: 'appraiser', estimated_minutes: 5 },
      ],
    },
    {
      title: 'SETUP AND MARKET ANALYSIS',
      description: 'Complete file setup and market analysis',
      default_role: 'appraiser',
      estimated_minutes: 180,
      is_required: true,
      subtasks: [
        // RESEARCH SUBJECT
        { title: 'RESEARCH SUBJECT', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Print MLS Printout', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Print MLS History', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Print MLS Market Condition Report', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Print Realist Report', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Print County Records', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Get a copy of the prior deed.', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Print Sketch from County', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Print Tax Statement Details', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Print Plat Map', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Print MLS Map', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Print Census Information(Ffiec.gov)', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Run Land Sales and Print to workfile', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Screen Shot Street View', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Pull Permit Information', default_role: 'appraiser', estimated_minutes: 10 },
        // FILE SETUP
        { title: 'FILE SETUP', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Setup Workfile in Dropbox', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Setup Total File', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Add client file number', default_role: 'appraiser', estimated_minutes: 2 },
        { title: 'Add FHA number (if applicable)', default_role: 'appraiser', estimated_minutes: 2 },
        { title: 'Add due date.', default_role: 'appraiser', estimated_minutes: 2 },
        { title: 'Move all subject files to Total Workfile', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Check to see if we have appraised this property before. If so merge the old file into the new file and put a comment on page 3 "Appraiser has performed work on the subject prior to the effective date of this report."', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Put Condition into Supplemental Addendum', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Add the Internal Order number to the address of the property which will be the Task Name', default_role: 'appraiser', estimated_minutes: 2 },
        { title: 'Add the Internal Order number to the Dropbox Workfile', default_role: 'appraiser', estimated_minutes: 2 },
        // REPORT DEVELOPMENT
        { title: 'REPORT DEVELOPMENT', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Load subject data from Datamaster', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Adjust Taxes and extract Special Assessment if Applicable', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Complete Site Section of Page 1', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Complete Subject section of Grid', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Add Area Map', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Add Plat Map', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Add County Records', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Add Appraiser\'s License and E & O Insurance to report', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Add Flood Map (if in Flood Zone)', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Draw Sketch(Plans and Specs if New Construction)', default_role: 'appraiser', estimated_minutes: 30 },
        // COST APPROACH
        { title: 'COST APPROACH', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Complete Cost approach', default_role: 'appraiser', estimated_minutes: 30 },
        { title: 'Snip a copy of the Data Entry Report to the workfile and Asana', default_role: 'appraiser', estimated_minutes: 5 },
        // BASIC MARKET ANALYSIS
        { title: 'BASIC MARKET ANALYSIS', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Review Client Instructions & requirements', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Create street analysis', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Create subdivision Analysis', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Create a market map', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Calculate land use %s', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Determine Location', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Input Highs and Lows on Page 1', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Generate Neighborhood Comps Report', default_role: 'appraiser', estimated_minutes: 10 },
        // DEVELOP MARKET CONDITION REPORT
        { title: 'DEVELOP MARKET CONDITION REPORT', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Generate MCR using Neighborhood Comps', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Load Graphs into Workfile', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Check Boxes for MCR', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Write Boundaries/Market Condition Comments', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Copy market condition from page 1 to the market condition addendum page', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Input Predominant Price in Report', default_role: 'appraiser', estimated_minutes: 5 },
        // NEW CONSTRUCTION (sub-section)
        { title: 'NEW CONSTRUCTION (if applicable)', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'LOAD ELEVATION PICTURES', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Draw Sketch from Plans', default_role: 'appraiser', estimated_minutes: 30 },
      ],
    },
    {
      title: 'SETUP INSPECTION ONLY',
      description: 'For inspection-only assignments',
      default_role: 'appraiser',
      estimated_minutes: 30,
      is_required: false,
      subtasks: [
        { title: 'Setup Total File', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Fill in Assignment Data', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Add client file number', default_role: 'appraiser', estimated_minutes: 2 },
        { title: 'Add the Internal Order number to the address of the property which will be the Task Name', default_role: 'appraiser', estimated_minutes: 2 },
        { title: 'Add FHA number (if applicable)', default_role: 'appraiser', estimated_minutes: 2 },
        { title: 'Setup Workfile in Dropbox', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Add the Internal Order number to the Dropbox Workfile', default_role: 'appraiser', estimated_minutes: 2 },
        { title: 'Check to see if we have appraised this property before. If so merge the old file into the new file and put a comment on page 3 "Appraiser has performed work on the subject prior to the effective date of this report."', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'The Sketch and subject data only needs to be merged', default_role: 'appraiser', estimated_minutes: 5 },
      ],
    },
  ],

  // =========================================================================
  // SCHEDULED STAGE (Inspection Day)
  // =========================================================================
  SCHEDULED: [
    {
      title: 'INSPECTION PREPARATION',
      description: 'Prepare for property inspection',
      default_role: 'appraiser',
      estimated_minutes: 30,
      is_required: true,
      subtasks: [
        { title: 'Review all order documents before inspection', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Confirm inspection appointment', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Print/prepare inspection checklist', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Gather equipment (camera, measuring tools, etc.)', default_role: 'appraiser', estimated_minutes: 10 },
      ],
    },
  ],

  // =========================================================================
  // INSPECTED STAGE
  // =========================================================================
  INSPECTED: [
    {
      title: 'PLAN REVIEW',
      description: 'Launch an Audit if: 1. If concessions exceed 5%, 2. If the cost approach is less than the cost to build, 3. If the builder sale price is less than the cost approach.',
      default_role: 'appraiser',
      estimated_minutes: 90,
      is_required: false,
      subtasks: [
        { title: 'Review and Insert Plans into Report', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Place Elevations into report', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Review Contract (Spec or Community Builder)', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Fill In Exterior Description', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Fill in Interior Description', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Fill in Features', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Location Map w/Geocoded coordinates', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Draw Sketch of Plans', default_role: 'appraiser', estimated_minutes: 30 },
      ],
    },
    {
      title: 'COMPARABLE SALES ANALYSIS',
      description: 'Select and analyze comparable sales',
      default_role: 'appraiser',
      estimated_minutes: 120,
      is_required: true,
      subtasks: [
        // COMPARABLE SELECTION
        { title: 'COMPARABLE SELECTION', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Select Comparables using the new selection process.', default_role: 'appraiser', estimated_minutes: 20 },
        { title: 'Print and Export "Sales and Listing Selection"', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Analyze Comps in Redstone', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Print Comp Selection Report from Redstone', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Snip Redstone Comp Selection', default_role: 'appraiser', estimated_minutes: 5 },
        // PUD ANALYSIS
        { title: 'PUD ANALYSIS', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'COPY THE PHOTOS OF THE AMENITIES FROM THE MLS FOR THE SUBJECT INTO THE REPORT AND LABEL IT (if available)', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'DO A PUD AMENITY ANALYSIS BETWEEN COMPS AND SUBJECT', default_role: 'appraiser', estimated_minutes: 20 },
        // REPORT DEVELOPMENT
        { title: 'REPORT DEVELOPMENT', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Load Datamaster with top 3 Comps and Top 2 Comps and load into Total Report', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Complete Comparables Sales Section', default_role: 'appraiser', estimated_minutes: 30 },
        { title: 'Supplement Report with additional comps to bracket every line item', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Analyze Prior Sales of all comparables', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Run Map', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Move lot size manually to Comp Analysis', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Fill out Subject Data in Comp Analysis', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Check Comparable Analysis *NO RED* Note: Explain any comparables in Red on the worksheet.', default_role: 'appraiser', estimated_minutes: 15 },
      ],
    },
    {
      title: 'REPORT DEVELOPMENT',
      description: 'Advanced analytics and report development',
      default_role: 'appraiser',
      estimated_minutes: 150,
      is_required: true,
      subtasks: [
        // ADVANCED ANALYTICS
        { title: 'ADVANCED ANALYTICS', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Generate Analytics Comps', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Generate Redstone Report', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Clip Distribution Graphs', default_role: 'appraiser', estimated_minutes: 10 },
        // REPORT DEVELOPMENT
        { title: 'REPORT DEVELOPMENT', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Download Comparable Data for each comp (Realist, Map and MLS(Broker Synopsis, Listing History, Photos)', default_role: 'appraiser', estimated_minutes: 20 },
        { title: 'Load Predominant Adjustments into the report and try to balance the for final value.', default_role: 'appraiser', estimated_minutes: 30 },
        { title: 'Extract any Qualitative adjustments from Regression and Analyze on Worksheet.', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Extract any Qualitative adjustments from Paired Sales using the Worksheet.', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Reconcile and weight', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Review Gut Check to insure analysis is reasonable', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Run E & O rules on Sales Comparison Approach', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Put the pages of the report in order', default_role: 'appraiser', estimated_minutes: 10 },
        // ADVANCED ANALYSIS
        { title: 'ADVANCED ANALYSIS', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Analyze & Report Contract on page 1', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Analyze Sales History', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Analyze PUD', default_role: 'appraiser', estimated_minutes: 15 },
        // REVIEW
        { title: 'REVIEW', description: 'Section header', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Go through checklist to make sure all components are there.', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Check reasonableness of your regression', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Check the reasonableness of Neighborhood Section', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Is the predominant price reasonable?', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Check the comparable analysis', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Does your price range make sense on top page 2', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Does the MCR, Neighborhood Section and Range Match?', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Combine all research documents into one pdf( less detailed comps) and upload it to Asana.', default_role: 'appraiser', estimated_minutes: 15 },
      ],
    },
  ],

  // =========================================================================
  // FINALIZATION STAGE
  // =========================================================================
  FINALIZATION: [
    {
      title: 'QUALITY REVIEW',
      description: 'Final quality review before delivery',
      default_role: 'reviewer',
      estimated_minutes: 60,
      is_required: true,
      subtasks: [
        { title: 'Review entire report for accuracy', default_role: 'reviewer', estimated_minutes: 20 },
        { title: 'Verify all calculations', default_role: 'reviewer', estimated_minutes: 15 },
        { title: 'Check for USPAP compliance', default_role: 'reviewer', estimated_minutes: 15 },
        { title: 'Review photos and exhibits', default_role: 'reviewer', estimated_minutes: 10 },
      ],
    },
    {
      title: 'INVOICE',
      description: 'Create and process invoice',
      default_role: 'admin',
      estimated_minutes: 15,
      is_required: true,
      subtasks: [
        { title: 'INVOICE ORDER', default_role: 'admin', estimated_minutes: 15 },
      ],
    },
  ],

  // =========================================================================
  // READY_FOR_DELIVERY STAGE
  // =========================================================================
  READY_FOR_DELIVERY: [
    {
      title: 'DELIVERY PREPARATION',
      description: 'Prepare report for delivery',
      default_role: 'admin',
      estimated_minutes: 30,
      is_required: true,
      subtasks: [
        { title: 'Generate final PDF', default_role: 'admin', estimated_minutes: 10 },
        { title: 'Verify all attachments included', default_role: 'admin', estimated_minutes: 10 },
        { title: 'Upload to client portal', default_role: 'admin', estimated_minutes: 10 },
      ],
    },
  ],

  // =========================================================================
  // DELIVERED STAGE
  // =========================================================================
  DELIVERED: [
    {
      title: 'Update Invoice Due Date and Price After Delivery',
      description: 'Recalculate the invoice to project the correct invoice and due date. Mark update Invoice task in main order complete.',
      default_role: 'admin',
      estimated_minutes: 15,
      is_required: true,
      subtasks: [
        { title: 'Recalculate the invoice to project the correct invoice and due date.', default_role: 'admin', estimated_minutes: 10 },
        { title: 'Recalculate the invoice to project the correct invoice and due date. Mark update Invoice task in main order complete.', default_role: 'admin', estimated_minutes: 5 },
      ],
    },
  ],

  // =========================================================================
  // CORRECTION STAGE
  // =========================================================================
  CORRECTION: [
    {
      title: 'CORRECTION REQUEST',
      description: 'Handle correction requests from client',
      default_role: 'appraiser',
      estimated_minutes: 60,
      is_required: true,
      subtasks: [
        { title: 'Review correction request', default_role: 'appraiser', estimated_minutes: 15 },
        { title: 'Make required corrections', default_role: 'appraiser', estimated_minutes: 30 },
        { title: 'Document changes made', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Resubmit for review', default_role: 'appraiser', estimated_minutes: 5 },
      ],
    },
  ],

  // =========================================================================
  // REVISION STAGE
  // =========================================================================
  REVISION: [
    {
      title: 'REVISION REQUEST',
      description: 'Handle major revision requests',
      default_role: 'appraiser',
      estimated_minutes: 120,
      is_required: true,
      subtasks: [
        { title: 'Review revision request', default_role: 'appraiser', estimated_minutes: 20 },
        { title: 'Analyze impact on value conclusion', default_role: 'appraiser', estimated_minutes: 30 },
        { title: 'Make required revisions', default_role: 'appraiser', estimated_minutes: 60 },
        { title: 'Resubmit for quality review', default_role: 'appraiser', estimated_minutes: 10 },
      ],
    },
  ],

  // =========================================================================
  // WORKFILE STAGE
  // =========================================================================
  WORKFILE: [
    {
      title: 'WORKFILE COMPLETION',
      description: 'Complete and archive workfile',
      default_role: 'admin',
      estimated_minutes: 30,
      is_required: true,
      subtasks: [
        { title: 'Verify all documents in workfile', default_role: 'admin', estimated_minutes: 10 },
        { title: 'Archive to permanent storage', default_role: 'admin', estimated_minutes: 10 },
        { title: 'Close order in system', default_role: 'admin', estimated_minutes: 10 },
      ],
    },
  ],
};

// ============================================================================
// SPECIAL TASK TEMPLATES (Property Type Specific)
// ============================================================================

const SPECIAL_TASKS = {
  INTAKE: [
    {
      title: 'CONDOS (1070 or 1073)',
      description: 'Condo-specific requirements',
      default_role: 'admin',
      estimated_minutes: 30,
      is_required: false,
      subtasks: [
        { title: 'Ask for a Condo Questionnaire from the client and POC for entry', default_role: 'admin', estimated_minutes: 10 },
        { title: 'Send a Condo Questionnaire to POC if One is Not Available', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Ask for the budget from the client and POC for entry', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Ask POC who is the Management Group in charge of HOA?', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Ask POC if the Developer is in Control of the HOA?', default_role: 'admin', estimated_minutes: 5 },
      ],
    },
    {
      title: 'HABU',
      description: 'PROPERTY ADDRESS:\n\nZONING:\nZONING DESCRIPTION:\nCLIENT REQUESTED FORM:\nCURRENT USE:\nPERMISSIBLE USES:\nGRANDFATHERED IN?:\nCAN THE STRUCTURE BE REBUILT IF DESTROYED?:\nPHYSICALLY POSSIBLE (LIST ALL THE POSSIBILITIES BELOW):\n\nCALL NOTES\n\nREPRESENTATIVE:\nPHONE:\nEMAIL:\n\nDetermine the initial highest and best use of the subject property.',
      default_role: 'appraiser',
      estimated_minutes: 45,
      is_required: false,
      subtasks: [
        { title: 'Determine Current Use', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Get Zoning Code', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Get Zoning Description', default_role: 'appraiser', estimated_minutes: 5 },
        { title: 'Determine Permissible Uses', default_role: 'appraiser', estimated_minutes: 10 },
        { title: '(IF NECESSARY)Grandfathered?', default_role: 'appraiser', estimated_minutes: 5 },
        { title: '(IF NECESSARY) Rebuild?', default_role: 'appraiser', estimated_minutes: 5 },
        { title: '(IF NECESSARY)Determine what permitted uses can fit on parcel.', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Log Details Below using HABU Template', default_role: 'appraiser', estimated_minutes: 10 },
        { title: 'Notify Compiler of any exceptions', default_role: 'appraiser', estimated_minutes: 5 },
      ],
    },
    {
      title: 'NEWLY CONSTRUCTED (REFINANCE)',
      description: 'Living Area sf:\nParking(Garage Doors, Carport, etc.):\nNo. of Bedrooms:\nNo. of Bath:\nPool Y or N:\nStories (1,2, etc.):\nIs there an Accessory Dwelling Unit?',
      default_role: 'admin',
      estimated_minutes: 15,
      is_required: false,
      subtasks: [
        { title: 'Ask Contact for Entry for Floor Plan or Living Area Square Footage, Parking(Garage Doors, Carport, etc.), Bedrooms, Bath, Pool Y or N, Stories (1,2,etc.), Accessory Dwelling Unit', default_role: 'admin', estimated_minutes: 15 },
      ],
    },
    {
      title: 'NEW CONSTRUCTION (COMMUNITYBUILDER)',
      description: 'We would like to request the following documents that are needed to complete the report:\n\n1. Request Floor Plan\n2. Community information(including who is in control of HOA)\n3. Sales/Comps\n4. The most recent contract',
      default_role: 'admin',
      estimated_minutes: 20,
      is_required: false,
      subtasks: [
        { title: 'Request Floor Plan', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Request community information (including who is in control of HOA)', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Request sales from property contact', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Request the most recent contract from the property contact', default_role: 'admin', estimated_minutes: 5 },
      ],
    },
    {
      title: 'NEW CONSTRUCTION (SPEC/CUSTOM)',
      description: 'Our main focus is to gather all essential information required to conduct a comprehensive appraisal of the subject property for our client. This includes collecting detailed construction plans and specifications, securing the most recent budget documents, and obtaining feasibility studies to evaluate the project\'s viability. Additionally, we aim to acquire records of recent properties built and sold by the builder to assess market trends and builder reliability. Collecting up-to-date purchase or builder contracts is also crucial to ensure all legal and financial conditions are met. These steps are vital to compiling a thorough and accurate appraisal report that will aid in making informed decisions regarding the property.\n\nTemplate to send to client:',
      default_role: 'admin',
      estimated_minutes: 45,
      is_required: false,
      subtasks: [
        { title: 'What is the anticipated sales price after construction?', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Request copy of plans and specs', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Request most recent budget', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Request Finishes Schedule', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Get a project feasibility document from reviewer or compiler', default_role: 'admin', estimated_minutes: 10 },
        { title: 'Request address of any recent homes the builder built and sold', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Request most recent purchase or builder contract (if applicable)', default_role: 'admin', estimated_minutes: 5 },
      ],
    },
    {
      title: 'Solar Panels: Determine How the Lender wants to handle',
      description: 'Notify the client of the following: "The subject property has solar panels. Per New Fannie Mae guidelines the appraiser must request from the lender if the solar panels needs to be included in the valuation of the subjection. Please let us know if the solar panels should be included in the the valuation?"',
      default_role: 'admin',
      estimated_minutes: 10,
      is_required: false,
      subtasks: [],
    },
    {
      title: 'NO PROPERTY DATA',
      description: '1. If possible printout from County Property Appraiser\n2. Owner Name(s) - Copy of Deed would be best\n3. Property Taxes - Copy of Tax Bill\n4. If possible Floor Plan\n5. If possible Survey',
      default_role: 'admin',
      estimated_minutes: 20,
      is_required: false,
      subtasks: [],
    },
    {
      title: '1007,216 OR 1025',
      description: 'NOTE: DO NOT PERFORM THIS TASK IF IT IS A VACANT LOT',
      default_role: 'admin',
      estimated_minutes: 20,
      is_required: false,
      subtasks: [
        { title: 'NOTE: DO NOT PERFORM THIS TASK IF IT IS A VACANT LOT', default_role: 'admin', estimated_minutes: 2 },
        { title: 'Request copies of the current leases.', default_role: 'admin', estimated_minutes: 5 },
        { title: '(216) Ask the owner who pays for the utility expenses', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Request Rental Questionnaire(coming soon)', default_role: 'admin', estimated_minutes: 5 },
      ],
    },
    {
      title: 'PURCHASE',
      description: 'For purchase transactions',
      default_role: 'admin',
      estimated_minutes: 20,
      is_required: false,
      subtasks: [
        { title: 'See if Property is on MLS', default_role: 'admin', estimated_minutes: 5 },
        { title: 'If on MLS schedule directly with the Listing Agent', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Request most recent contract with all Addenda (optional)', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Request comparables from the listing agent used to support the contract price. (optional) Only if they want them considered in our analysis.', default_role: 'admin', estimated_minutes: 5 },
      ],
    },
    {
      title: 'AFTER REPAIR VALUE',
      description: '1. Do you have a profit analysis of what you anticipate the Sales price and selling expenses will be?\n2. Do you have comparables to support your Anticipated Sales Price?\n3. Do you anticipate significantly changing the floor plan from its current configuration?\n4. Please provide me with the most recent scope of work and give me an idea of what kind of materials you will be using.',
      default_role: 'admin',
      estimated_minutes: 20,
      is_required: false,
      subtasks: [
        { title: 'Profit Analysis', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Supporting Comps', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Updated Scope of Work', default_role: 'admin', estimated_minutes: 5 },
        { title: 'New Floor Plan', default_role: 'admin', estimated_minutes: 5 },
      ],
    },
    {
      title: 'ON HOLD',
      description: 'Task for orders put on hold',
      default_role: 'admin',
      estimated_minutes: 60,
      is_required: false,
      subtasks: [
        { title: 'PUT ORDER ON HOLD', default_role: 'admin', estimated_minutes: 15 },
        { title: 'FOLLOW UP #1', default_role: 'admin', estimated_minutes: 15 },
        { title: 'FOLLOW UP #2', default_role: 'admin', estimated_minutes: 15 },
        { title: 'FOLLOW UP #3', default_role: 'admin', estimated_minutes: 15 },
      ],
    },
    {
      title: 'ORDER CANCELLATION',
      description: 'Cancellation protocol for orders that have been cancelled.',
      default_role: 'admin',
      estimated_minutes: 30,
      is_required: false,
      subtasks: [
        { title: 'Assign Dates Below', default_role: 'admin', estimated_minutes: 2 },
        { title: 'Unassign all production tasks and move to cancel inside production vertical', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Remove from calendar(if applicable).', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Mark Order Complete', default_role: 'admin', estimated_minutes: 2 },
        { title: 'Calculate Cancellation Fee', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Request Cancellation Fee from Client', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Receive Confirmation from Client on Fee', default_role: 'admin', estimated_minutes: 5 },
        { title: 'Adjust Invoice to new Cancellation Fee', default_role: 'admin', estimated_minutes: 5 },
      ],
    },
  ],
};

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedTaskTemplates() {
  console.log('Starting task template seed...\n');

  try {
    // Get the user ID (org_id) - we'll use service role to create for a specific org
    // For now, we'll create templates that can be copied to any org

    // First, check if default template already exists
    const { data: existingTemplate, error: checkError } = await supabase
      .from('production_templates')
      .select('id, name')
      .eq('name', 'Standard Appraisal Workflow')
      .single();

    let templateId;

    if (existingTemplate) {
      console.log(`Found existing template: ${existingTemplate.name} (${existingTemplate.id})`);
      templateId = existingTemplate.id;

      // Delete existing tasks and subtasks to recreate them
      console.log('Deleting existing tasks...');

      // First get all task IDs
      const { data: existingTasks } = await supabase
        .from('production_template_tasks')
        .select('id')
        .eq('template_id', templateId);

      if (existingTasks && existingTasks.length > 0) {
        const taskIds = existingTasks.map(t => t.id);

        // Delete subtasks first
        await supabase
          .from('production_template_subtasks')
          .delete()
          .in('parent_task_id', taskIds);

        // Then delete tasks
        await supabase
          .from('production_template_tasks')
          .delete()
          .eq('template_id', templateId);
      }

      console.log('Existing tasks deleted.\n');
    } else {
      // Get any user to use as org_id (for testing - in production this would be the actual org)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      if (!profiles) {
        console.error('No profiles found. Please create a user first.');
        process.exit(1);
      }

      const orgId = profiles.id;
      console.log(`Using org_id: ${orgId}\n`);

      // Create the default template
      const { data: newTemplate, error: templateError } = await supabase
        .from('production_templates')
        .insert({
          org_id: orgId,
          name: 'Standard Appraisal Workflow',
          description: 'Complete appraisal workflow template with all standard tasks for residential appraisals. Includes INTAKE through WORKFILE stages.',
          is_default: true,
          is_active: true,
          applicable_order_types: ['standard', 'rush', 'complex'],
          applicable_property_types: ['single_family', 'condo', 'multi_family', 'land'],
          created_by: orgId,
        })
        .select()
        .single();

      if (templateError) {
        console.error('Error creating template:', templateError);
        process.exit(1);
      }

      templateId = newTemplate.id;
      console.log(`Created template: ${newTemplate.name} (${templateId})\n`);
    }

    // Now create all tasks and subtasks
    let totalTasks = 0;
    let totalSubtasks = 0;

    // Process standard tasks for each stage
    for (const [stage, tasks] of Object.entries(TASK_TEMPLATES)) {
      console.log(`Processing stage: ${stage}`);

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        // Create the task
        const { data: createdTask, error: taskError } = await supabase
          .from('production_template_tasks')
          .insert({
            template_id: templateId,
            stage: stage,
            title: task.title,
            description: task.description || null,
            default_role: task.default_role,
            estimated_minutes: task.estimated_minutes,
            is_required: task.is_required,
            sort_order: i,
          })
          .select()
          .single();

        if (taskError) {
          console.error(`Error creating task "${task.title}":`, taskError);
          continue;
        }

        totalTasks++;
        console.log(`  - Created task: ${task.title}`);

        // Create subtasks
        if (task.subtasks && task.subtasks.length > 0) {
          for (let j = 0; j < task.subtasks.length; j++) {
            const subtask = task.subtasks[j];

            const { error: subtaskError } = await supabase
              .from('production_template_subtasks')
              .insert({
                parent_task_id: createdTask.id,
                title: subtask.title,
                description: subtask.description || null,
                default_role: subtask.default_role,
                estimated_minutes: subtask.estimated_minutes,
                is_required: subtask.is_required !== false,
                sort_order: j,
              });

            if (subtaskError) {
              console.error(`Error creating subtask "${subtask.title}":`, subtaskError);
              continue;
            }

            totalSubtasks++;
          }
          console.log(`    Created ${task.subtasks.length} subtasks`);
        }
      }
    }

    // Process special/property-type specific tasks
    console.log('\nProcessing special tasks...');
    for (const [stage, tasks] of Object.entries(SPECIAL_TASKS)) {
      console.log(`Processing special tasks for stage: ${stage}`);

      // Get current max sort_order for this stage
      const { data: existingTasks } = await supabase
        .from('production_template_tasks')
        .select('sort_order')
        .eq('template_id', templateId)
        .eq('stage', stage)
        .order('sort_order', { ascending: false })
        .limit(1);

      let sortOrder = existingTasks && existingTasks.length > 0 ? existingTasks[0].sort_order + 1 : 0;

      for (const task of tasks) {
        // Create the task
        const { data: createdTask, error: taskError } = await supabase
          .from('production_template_tasks')
          .insert({
            template_id: templateId,
            stage: stage,
            title: task.title,
            description: task.description || null,
            default_role: task.default_role,
            estimated_minutes: task.estimated_minutes,
            is_required: task.is_required,
            sort_order: sortOrder++,
          })
          .select()
          .single();

        if (taskError) {
          console.error(`Error creating special task "${task.title}":`, taskError);
          continue;
        }

        totalTasks++;
        console.log(`  - Created special task: ${task.title}`);

        // Create subtasks
        if (task.subtasks && task.subtasks.length > 0) {
          for (let j = 0; j < task.subtasks.length; j++) {
            const subtask = task.subtasks[j];

            const { error: subtaskError } = await supabase
              .from('production_template_subtasks')
              .insert({
                parent_task_id: createdTask.id,
                title: subtask.title,
                description: subtask.description || null,
                default_role: subtask.default_role,
                estimated_minutes: subtask.estimated_minutes,
                is_required: subtask.is_required !== false,
                sort_order: j,
              });

            if (subtaskError) {
              console.error(`Error creating subtask "${subtask.title}":`, subtaskError);
              continue;
            }

            totalSubtasks++;
          }
          console.log(`    Created ${task.subtasks.length} subtasks`);
        }
      }
    }

    console.log('\n========================================');
    console.log('Task template seed completed!');
    console.log(`Template ID: ${templateId}`);
    console.log(`Total tasks created: ${totalTasks}`);
    console.log(`Total subtasks created: ${totalSubtasks}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seedTaskTemplates();
