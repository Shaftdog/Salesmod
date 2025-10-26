-- ==============================================
-- CREATE HISTORICAL CLIENTS
-- 144 unique clients from 2023-2025 orders
-- ==============================================

-- Allstate Appraisal (18 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Allstate Appraisal',
  'Allstate Appraisal',
  'allstateappraisal@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Allstate Appraisal');

-- AmeriMac Appraisal Management (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'AmeriMac Appraisal Management',
  'AmeriMac Appraisal Management',
  'amerimacappraisalmanagement@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'AmeriMac Appraisal Management');

-- I Fund Cities (106 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'I Fund Cities',
  'I Fund Cities',
  'ifundcities@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'I Fund Cities');

-- Consolidated Analytics (74 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Consolidated Analytics',
  'Consolidated Analytics',
  'consolidatedanalytics@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Consolidated Analytics');

-- Peoples Mortgage Company (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Peoples Mortgage Company',
  'Peoples Mortgage Company',
  'peoplesmortgagecompany@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Peoples Mortgage Company');

-- AppraiserVendor.com, LLC (24 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'AppraiserVendor.com, LLC',
  'AppraiserVendor.com, LLC',
  'appraiservendor.com,llc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'AppraiserVendor.com, LLC');

-- VISION (328 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'VISION',
  'VISION',
  'vision@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'VISION');

-- Mike Koury (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Mike Koury',
  'Mike Koury',
  'mikekoury@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Mike Koury');

-- E STREET APPRAISAL MANAGEMENT LLC (EVO) (24 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'E STREET APPRAISAL MANAGEMENT LLC (EVO)',
  'E STREET APPRAISAL MANAGEMENT LLC (EVO)',
  'estreetappraisalmanagementllc(evo)@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'E STREET APPRAISAL MANAGEMENT LLC (EVO)');

-- Amo Services (29 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Amo Services',
  'Amo Services',
  'amoservices@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Amo Services');

-- Nels Lund (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Nels Lund',
  'Nels Lund',
  'nelslund@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Nels Lund');

-- MoFin Lending Corporation, ISAOA/ATIMA (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'MoFin Lending Corporation, ISAOA/ATIMA',
  'MoFin Lending Corporation, ISAOA/ATIMA',
  'mofinlendingcorporation,isaoa/atima@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'MoFin Lending Corporation, ISAOA/ATIMA');

-- Accurate Group (5 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Accurate Group',
  'Accurate Group',
  'accurategroup@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Accurate Group');

-- The Appraisal HUB (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'The Appraisal HUB',
  'The Appraisal HUB',
  'theappraisalhub@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'The Appraisal HUB');

-- MountainSeed Appraisal Management (9 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'MountainSeed Appraisal Management',
  'MountainSeed Appraisal Management',
  'mountainseedappraisalmanagement@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'MountainSeed Appraisal Management');

-- Great SouthBay Appraisal Management Company (55 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Great SouthBay Appraisal Management Company',
  'Great SouthBay Appraisal Management Company',
  'greatsouthbayappraisalmanagementcompany@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Great SouthBay Appraisal Management Company');

-- VOXTUR VALUATION, LLC (7 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'VOXTUR VALUATION, LLC',
  'VOXTUR VALUATION, LLC',
  'voxturvaluation,llc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'VOXTUR VALUATION, LLC');

-- Plains Commerce Bank (21 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Plains Commerce Bank',
  'Plains Commerce Bank',
  'plainscommercebank@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Plains Commerce Bank');

-- iFund Cities (90 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'iFund Cities',
  'iFund Cities',
  'ifundcities@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'iFund Cities');

-- Atlas VMS (3 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Atlas VMS',
  'Atlas VMS',
  'atlasvms@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Atlas VMS');

-- Settlement one (7 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Settlement one',
  'Settlement one',
  'settlementone@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Settlement one');

-- Marcus Ellington (3 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Marcus Ellington',
  'Marcus Ellington',
  'marcusellington@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Marcus Ellington');

-- Bluebird Valuation (32 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Bluebird Valuation',
  'Bluebird Valuation',
  'bluebirdvaluation@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Bluebird Valuation');

-- Logical ACI (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Logical ACI',
  'Logical ACI',
  'logicalaci@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Logical ACI');

-- Home Base Appraisal Management (28 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Home Base Appraisal Management',
  'Home Base Appraisal Management',
  'homebaseappraisalmanagement@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Home Base Appraisal Management');

-- AMC (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'AMC',
  'AMC',
  'amc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'AMC');

-- APPRAISAL LINKS INC (7 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'APPRAISAL LINKS INC',
  'APPRAISAL LINKS INC',
  'appraisallinksinc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'APPRAISAL LINKS INC');

-- NVS (12 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'NVS',
  'NVS',
  'nvs@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'NVS');

-- 1st Signature Lending LLC (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  '1st Signature Lending LLC',
  '1st Signature Lending LLC',
  '1stsignaturelendingllc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = '1st Signature Lending LLC');

-- Exactus AMC (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Exactus AMC',
  'Exactus AMC',
  'exactusamc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Exactus AMC');

-- Mary Lee Smith (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Mary Lee Smith',
  'Mary Lee Smith',
  'maryleesmith@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Mary Lee Smith');

-- ProRestore (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'ProRestore',
  'ProRestore',
  'prorestore@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'ProRestore');

-- LendingOne, LLC (3 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'LendingOne, LLC',
  'LendingOne, LLC',
  'lendingone,llc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'LendingOne, LLC');

-- Reggora (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Reggora',
  'Reggora',
  'reggora@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Reggora');

-- Integration 4.0 (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Integration 4.0',
  'Integration 4.0',
  'integration4.0@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Integration 4.0');

-- n/a (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'n/a',
  'n/a',
  'n/a@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'n/a');

-- Christopher Robin Graeve (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Christopher Robin Graeve',
  'Christopher Robin Graeve',
  'christopherrobingraeve@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Christopher Robin Graeve');

-- i Fund Cities (7 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'i Fund Cities',
  'i Fund Cities',
  'ifundcities@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'i Fund Cities');

-- STEWART VALUATION INTELLIGENCE, LLC (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'STEWART VALUATION INTELLIGENCE, LLC',
  'STEWART VALUATION INTELLIGENCE, LLC',
  'stewartvaluationintelligence,llc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'STEWART VALUATION INTELLIGENCE, LLC');

-- SWBC LENDING SOLUTIONS LLC (4 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'SWBC LENDING SOLUTIONS LLC',
  'SWBC LENDING SOLUTIONS LLC',
  'swbclendingsolutionsllc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'SWBC LENDING SOLUTIONS LLC');

-- Jeder Valuation Consultants Inc. (Mercury Network) (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Jeder Valuation Consultants Inc. (Mercury Network)',
  'Jeder Valuation Consultants Inc. (Mercury Network)',
  'jedervaluationconsultantsinc.(mercurynetwork)@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Jeder Valuation Consultants Inc. (Mercury Network)');

-- BAAR Realty Advisors (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'BAAR Realty Advisors',
  'BAAR Realty Advisors',
  'baarrealtyadvisors@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'BAAR Realty Advisors');

-- JLD Capital, LLC ISAOA (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'JLD Capital, LLC ISAOA',
  'JLD Capital, LLC ISAOA',
  'jldcapital,llcisaoa@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'JLD Capital, LLC ISAOA');

-- Optimal Offers, LLC (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Optimal Offers, LLC',
  'Optimal Offers, LLC',
  'optimaloffers,llc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Optimal Offers, LLC');

-- Darrin Mccoy (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Darrin Mccoy',
  'Darrin Mccoy',
  'darrinmccoy@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Darrin Mccoy');

-- Jose Dorelus and Raymond Dorelus. (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Jose Dorelus and Raymond Dorelus.',
  'Jose Dorelus and Raymond Dorelus.',
  'josedorelusandraymonddorelus.@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Jose Dorelus and Raymond Dorelus.');

-- Patrick Traylor (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Patrick Traylor',
  'Patrick Traylor',
  'patricktraylor@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Patrick Traylor');

-- ifund Cities (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'ifund Cities',
  'ifund Cities',
  'ifundcities@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'ifund Cities');

-- Ifund Cities (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Ifund Cities',
  'Ifund Cities',
  'ifundcities@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Ifund Cities');

-- NA (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'NA',
  'NA',
  'na@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'NA');

-- Plains Commerce Bank  (Mercury Network) (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Plains Commerce Bank  (Mercury Network)',
  'Plains Commerce Bank  (Mercury Network)',
  'plainscommercebank(mercurynetwork)@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Plains Commerce Bank  (Mercury Network)');

-- Plains Commerce Bank (Mercury Network) (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Plains Commerce Bank (Mercury Network)',
  'Plains Commerce Bank (Mercury Network)',
  'plainscommercebank(mercurynetwork)@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Plains Commerce Bank (Mercury Network)');

-- 5908 Edgewater Terrace, Sebring, FL 33876 (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  '5908 Edgewater Terrace, Sebring, FL 33876',
  '5908 Edgewater Terrace, Sebring, FL 33876',
  '5908edgewaterterrace,sebring,fl33876@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = '5908 Edgewater Terrace, Sebring, FL 33876');

-- Ready Mortgage Lender (mercury Network) (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Ready Mortgage Lender (mercury Network)',
  'Ready Mortgage Lender (mercury Network)',
  'readymortgagelender(mercurynetwork)@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Ready Mortgage Lender (mercury Network)');

-- iFundC  Cities (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'iFundC  Cities',
  'iFundC  Cities',
  'ifundccities@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'iFundC  Cities');

-- Flagstar Bank (8 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Flagstar Bank',
  'Flagstar Bank',
  'flagstarbank@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Flagstar Bank');

-- Plain Commerce Bank (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Plain Commerce Bank',
  'Plain Commerce Bank',
  'plaincommercebank@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Plain Commerce Bank');

-- Elite Valuations (3 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Elite Valuations',
  'Elite Valuations',
  'elitevaluations@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Elite Valuations');

-- Yolande Bain (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Yolande Bain',
  'Yolande Bain',
  'yolandebain@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Yolande Bain');

-- James Waters (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'James Waters',
  'James Waters',
  'jameswaters@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'James Waters');

-- Rapid Appraisal Management System (3 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Rapid Appraisal Management System',
  'Rapid Appraisal Management System',
  'rapidappraisalmanagementsystem@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Rapid Appraisal Management System');

-- Lima One Capital (60 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Lima One Capital',
  'Lima One Capital',
  'limaonecapital@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Lima One Capital');

-- Lori Aikman (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Lori Aikman',
  'Lori Aikman',
  'loriaikman@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Lori Aikman');

-- United Wholesale Mortgage (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'United Wholesale Mortgage',
  'United Wholesale Mortgage',
  'unitedwholesalemortgage@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'United Wholesale Mortgage');

-- 1st Source Bank (4 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  '1st Source Bank',
  '1st Source Bank',
  '1stsourcebank@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = '1st Source Bank');

-- Class Valuation (26 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Class Valuation',
  'Class Valuation',
  'classvaluation@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Class Valuation');

-- Rebutt Lender Appraisal (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Rebutt Lender Appraisal',
  'Rebutt Lender Appraisal',
  'rebuttlenderappraisal@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Rebutt Lender Appraisal');

-- Nora Moreb (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Nora Moreb',
  'Nora Moreb',
  'noramoreb@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Nora Moreb');

-- ROI Capital Management (3 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'ROI Capital Management',
  'ROI Capital Management',
  'roicapitalmanagement@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'ROI Capital Management');

-- Milo Lending Inc. (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Milo Lending Inc.',
  'Milo Lending Inc.',
  'milolendinginc.@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Milo Lending Inc.');

-- Corporate Settlement Solutions (4 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Corporate Settlement Solutions',
  'Corporate Settlement Solutions',
  'corporatesettlementsolutions@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Corporate Settlement Solutions');

-- RBI Private Lending (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'RBI Private Lending',
  'RBI Private Lending',
  'rbiprivatelending@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'RBI Private Lending');

-- Appraisal Shield (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Appraisal Shield',
  'Appraisal Shield',
  'appraisalshield@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Appraisal Shield');

-- Appraisal Nation (19 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Appraisal Nation',
  'Appraisal Nation',
  'appraisalnation@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Appraisal Nation');

-- Property Rate (8 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Property Rate',
  'Property Rate',
  'propertyrate@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Property Rate');

-- BlueBird Valuation (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'BlueBird Valuation',
  'BlueBird Valuation',
  'bluebirdvaluation@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'BlueBird Valuation');

-- Lima One (5 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Lima One',
  'Lima One',
  'limaone@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Lima One');

-- Scott Eason (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Scott Eason',
  'Scott Eason',
  'scotteason@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Scott Eason');

-- OCMBC, Inc. (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'OCMBC, Inc.',
  'OCMBC, Inc.',
  'ocmbc,inc.@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'OCMBC, Inc.');

-- Dahl Family Law Group (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Dahl Family Law Group',
  'Dahl Family Law Group',
  'dahlfamilylawgroup@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Dahl Family Law Group');

-- BLuebird Valuation (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'BLuebird Valuation',
  'BLuebird Valuation',
  'bluebirdvaluation@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'BLuebird Valuation');

-- I Fund Cities LLC (I (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'I Fund Cities LLC (I',
  'I Fund Cities LLC (I',
  'ifundcitiesllc(i@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'I Fund Cities LLC (I');

-- Marcus Morriss (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Marcus Morriss',
  'Marcus Morriss',
  'marcusmorriss@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Marcus Morriss');

-- NDA Valuations, LLC (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'NDA Valuations, LLC',
  'NDA Valuations, LLC',
  'ndavaluations,llc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'NDA Valuations, LLC');

-- Beverly Hicks (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Beverly Hicks',
  'Beverly Hicks',
  'beverlyhicks@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Beverly Hicks');

-- New Silver Lending LLC (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'New Silver Lending LLC',
  'New Silver Lending LLC',
  'newsilverlendingllc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'New Silver Lending LLC');

-- Juan (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Juan',
  'Juan',
  'juan@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Juan');

-- AMROCK (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'AMROCK',
  'AMROCK',
  'amrock@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'AMROCK');

-- I fund Cities (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'I fund Cities',
  'I fund Cities',
  'ifundcities@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'I fund Cities');

-- Jay (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Jay',
  'Jay',
  'jay@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Jay');

-- Land Home Financial Services, Inc. (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Land Home Financial Services, Inc.',
  'Land Home Financial Services, Inc.',
  'landhomefinancialservices,inc.@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Land Home Financial Services, Inc.');

-- Tamarisk (19 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Tamarisk',
  'Tamarisk',
  'tamarisk@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Tamarisk');

-- ValueQuest AMC (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'ValueQuest AMC',
  'ValueQuest AMC',
  'valuequestamc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'ValueQuest AMC');

-- AppraisalPort - LimaOne (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'AppraisalPort - LimaOne',
  'AppraisalPort - LimaOne',
  'appraisalport-limaone@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'AppraisalPort - LimaOne');

-- Applied Valuation Services (3 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Applied Valuation Services',
  'Applied Valuation Services',
  'appliedvaluationservices@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Applied Valuation Services');

-- I Funds (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'I Funds',
  'I Funds',
  'ifunds@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'I Funds');

-- Dozell (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Dozell',
  'Dozell',
  'dozell@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Dozell');

-- I Funds LLC (22 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'I Funds LLC',
  'I Funds LLC',
  'ifundsllc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'I Funds LLC');

-- LimaOne (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'LimaOne',
  'LimaOne',
  'limaone@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'LimaOne');

-- IFund Citites (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'IFund Citites',
  'IFund Citites',
  'ifundcitites@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'IFund Citites');

-- Darrin Listing (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Darrin Listing',
  'Darrin Listing',
  'darrinlisting@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Darrin Listing');

-- David Dey (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'David Dey',
  'David Dey',
  'daviddey@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'David Dey');

-- Gershman Investment Corp. (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Gershman Investment Corp.',
  'Gershman Investment Corp.',
  'gershmaninvestmentcorp.@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Gershman Investment Corp.');

-- Atlas (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Atlas',
  'Atlas',
  'atlas@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Atlas');

-- Arivs (5 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Arivs',
  'Arivs',
  'arivs@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Arivs');

-- Eddie Urich (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Eddie Urich',
  'Eddie Urich',
  'eddieurich@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Eddie Urich');

-- IfundCities (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'IfundCities',
  'IfundCities',
  'ifundcities@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'IfundCities');

-- Lincoln  Appraisal and Settlement Services (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Lincoln  Appraisal and Settlement Services',
  'Lincoln  Appraisal and Settlement Services',
  'lincolnappraisalandsettlementservices@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Lincoln  Appraisal and Settlement Services');

-- Kim Fales (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Kim Fales',
  'Kim Fales',
  'kimfales@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Kim Fales');

-- Equity Solutions (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Equity Solutions',
  'Equity Solutions',
  'equitysolutions@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Equity Solutions');

-- Mortgage Investors Group (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Mortgage Investors Group',
  'Mortgage Investors Group',
  'mortgageinvestorsgroup@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Mortgage Investors Group');

-- Lending One (mercury) (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Lending One (mercury)',
  'Lending One (mercury)',
  'lendingone(mercury)@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Lending One (mercury)');

-- Appraisal Management Solutions (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Appraisal Management Solutions',
  'Appraisal Management Solutions',
  'appraisalmanagementsolutions@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Appraisal Management Solutions');

-- LRES Corporation (15 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'LRES Corporation',
  'LRES Corporation',
  'lrescorporation@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'LRES Corporation');

-- Core Valuation Management (15 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Core Valuation Management',
  'Core Valuation Management',
  'corevaluationmanagement@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Core Valuation Management');

-- Gateway Mortgage (Mercury Network) (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Gateway Mortgage (Mercury Network)',
  'Gateway Mortgage (Mercury Network)',
  'gatewaymortgage(mercurynetwork)@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Gateway Mortgage (Mercury Network)');

-- Ifundcities (4 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Ifundcities',
  'Ifundcities',
  'ifundcities@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Ifundcities');

-- Nationwide Appraisal Network (17 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Nationwide Appraisal Network',
  'Nationwide Appraisal Network',
  'nationwideappraisalnetwork@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Nationwide Appraisal Network');

-- Nations Valuation Services Inc (7 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Nations Valuation Services Inc',
  'Nations Valuation Services Inc',
  'nationsvaluationservicesinc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Nations Valuation Services Inc');

-- MTS GROUP LLC (33 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'MTS GROUP LLC',
  'MTS GROUP LLC',
  'mtsgroupllc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'MTS GROUP LLC');

-- Interra CU Appraisal Desk (Mercury Network) (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Interra CU Appraisal Desk (Mercury Network)',
  'Interra CU Appraisal Desk (Mercury Network)',
  'interracuappraisaldesk(mercurynetwork)@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Interra CU Appraisal Desk (Mercury Network)');

-- Ifund cities (6 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Ifund cities',
  'Ifund cities',
  'ifundcities@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Ifund cities');

-- Appraisals 2U, LLC (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Appraisals 2U, LLC',
  'Appraisals 2U, LLC',
  'appraisals2u,llc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Appraisals 2U, LLC');

-- Accelerated Appraisal Management Company (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Accelerated Appraisal Management Company',
  'Accelerated Appraisal Management Company',
  'acceleratedappraisalmanagementcompany@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Accelerated Appraisal Management Company');

-- AMSA (3 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'AMSA',
  'AMSA',
  'amsa@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'AMSA');

-- Absolute management (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Absolute management',
  'Absolute management',
  'absolutemanagement@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Absolute management');

-- Prosperity Home Mortgage, LLC (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Prosperity Home Mortgage, LLC',
  'Prosperity Home Mortgage, LLC',
  'prosperityhomemortgage,llc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Prosperity Home Mortgage, LLC');

-- Absolute Value Management (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Absolute Value Management',
  'Absolute Value Management',
  'absolutevaluemanagement@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Absolute Value Management');

-- A1 AMC INC (2 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'A1 AMC INC',
  'A1 AMC INC',
  'a1amcinc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'A1 AMC INC');

-- Property Science (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Property Science',
  'Property Science',
  'propertyscience@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Property Science');

-- I fund cities (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'I fund cities',
  'I fund cities',
  'ifundcities@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'I fund cities');

-- Equity Solution (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Equity Solution',
  'Equity Solution',
  'equitysolution@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Equity Solution');

-- SUNTENDER VALUATIONS INC (3 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'SUNTENDER VALUATIONS INC',
  'SUNTENDER VALUATIONS INC',
  'suntendervaluationsinc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'SUNTENDER VALUATIONS INC');

-- Equity (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Equity',
  'Equity',
  'equity@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Equity');

-- TruDocs Mortgage Services (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'TruDocs Mortgage Services',
  'TruDocs Mortgage Services',
  'trudocsmortgageservices@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'TruDocs Mortgage Services');

-- Home trust (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Home trust',
  'Home trust',
  'hometrust@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'individual'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Home trust');

-- TruDocs Mortgage Services (Mercury Network) (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'TruDocs Mortgage Services (Mercury Network)',
  'TruDocs Mortgage Services (Mercury Network)',
  'trudocsmortgageservices(mercurynetwork)@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'TruDocs Mortgage Services (Mercury Network)');

-- AppraisalTek (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'AppraisalTek',
  'AppraisalTek',
  'appraisaltek@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'AppraisalTek');

-- Lending one (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Lending one',
  'Lending one',
  'lendingone@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Lending one');

-- Valutrust Solutions LLC. (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Valutrust Solutions LLC.',
  'Valutrust Solutions LLC.',
  'valutrustsolutionsllc.@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Valutrust Solutions LLC.');

-- Donald and Sandra MacDougall (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Donald and Sandra MacDougall',
  'Donald and Sandra MacDougall',
  'donaldandsandramacdougall@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Donald and Sandra MacDougall');

-- Service 1 LLC (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'Service 1 LLC',
  'Service 1 LLC',
  'service1llc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'Service 1 LLC');

-- First Community Mortgage, INC (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'First Community Mortgage, INC',
  'First Community Mortgage, INC',
  'firstcommunitymortgage,inc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'First Community Mortgage, INC');

-- ALL PRO APPRAISAL MANAGEMENT INC (1 orders)
INSERT INTO clients (
  company_name, primary_contact, email, phone, address, billing_address, client_type
) SELECT
  'ALL PRO APPRAISAL MANAGEMENT INC',
  'ALL PRO APPRAISAL MANAGEMENT INC',
  'allproappraisalmanagementinc@imported.local',
  '000-000-0000',
  'TBD - Update with actual address',
  'TBD - Update with actual address',
  'company'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE company_name = 'ALL PRO APPRAISAL MANAGEMENT INC');


-- Verify client creation
SELECT client_type, COUNT(*) as count FROM clients GROUP BY client_type;