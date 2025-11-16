const { Client } = require('pg');

const connectionString = 'postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function mergeMoFinClients() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Step 1: Find the MoFin Lending clients
    console.log('Step 1: Finding MoFin Lending clients...');
    const findQuery = `
      SELECT
        id,
        company_name,
        email,
        domain,
        phone,
        created_at
      FROM public.clients
      WHERE company_name ILIKE '%MoFin%Lending%'
      ORDER BY created_at;
    `;

    const result = await client.query(findQuery);

    if (result.rows.length < 2) {
      console.log('❌ Could not find 2 MoFin Lending clients');
      console.log(`Found ${result.rows.length} client(s)`);
      return;
    }

    console.log(`✓ Found ${result.rows.length} MoFin Lending clients:\n`);
    result.rows.forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.company_name}`);
      console.log(`     ID: ${row.id}`);
      console.log(`     Email: ${row.email || 'N/A'}`);
      console.log(`     Created: ${row.created_at}`);
      console.log('');
    });

    // Step 2: Determine winner and loser
    // Winner = the one with the longer/more complete name (ISAOA/ATIMA)
    // Or the newer one if names are similar length
    let winner, loser;

    if (result.rows[0].company_name.length > result.rows[1].company_name.length) {
      winner = result.rows[0];
      loser = result.rows[1];
    } else {
      winner = result.rows[1];
      loser = result.rows[0];
    }

    console.log('Step 2: Merge decision:');
    console.log(`  ✓ WINNER (keep):   ${winner.company_name}`);
    console.log(`  ✗ LOSER (delete):  ${loser.company_name}\n`);

    // Step 3: Check for dependent records
    console.log('Step 3: Checking dependent records...');
    const depsQuery = `
      SELECT
        (SELECT COUNT(*) FROM contacts WHERE client_id = $1) as loser_contacts,
        (SELECT COUNT(*) FROM contacts WHERE client_id = $2) as winner_contacts,
        (SELECT COUNT(*) FROM orders WHERE client_id = $1) as loser_orders,
        (SELECT COUNT(*) FROM orders WHERE client_id = $2) as winner_orders;
    `;

    const deps = await client.query(depsQuery, [loser.id, winner.id]);
    const counts = deps.rows[0];

    console.log(`  Winner has: ${counts.winner_contacts} contacts, ${counts.winner_orders} orders`);
    console.log(`  Loser has:  ${counts.loser_contacts} contacts, ${counts.loser_orders} orders`);
    console.log(`  After merge: ${parseInt(counts.winner_contacts) + parseInt(counts.loser_contacts)} contacts, ${parseInt(counts.winner_orders) + parseInt(counts.loser_orders)} orders\n`);

    // Step 4: Perform the merge
    console.log('Step 4: Executing merge...');
    console.log('  Calling merge_clients function...');

    const mergeQuery = `SELECT public.merge_clients($1::uuid, $2::uuid) as result;`;
    const mergeResult = await client.query(mergeQuery, [winner.id, loser.id]);

    const result_data = mergeResult.rows[0].result;
    console.log('  ✓ Merge completed successfully!\n');

    console.log('Step 5: Merge results:');
    console.log(`  Winner ID: ${result_data.winner_id}`);
    console.log(`  Loser ID:  ${result_data.loser_id}`);
    console.log(`  Merged at: ${result_data.merged_at}`);
    console.log('\n  Records transferred:');

    const counts_data = result_data.counts;
    Object.keys(counts_data).forEach(key => {
      if (counts_data[key] > 0) {
        console.log(`    - ${key}: ${counts_data[key]}`);
      }
    });

    // Step 6: Verify the merge
    console.log('\nStep 6: Verifying merge...');
    const verifyQuery = `
      SELECT
        (SELECT COUNT(*) FROM clients WHERE id = $1) as winner_exists,
        (SELECT COUNT(*) FROM clients WHERE id = $2) as loser_exists,
        (SELECT COUNT(*) FROM merge_audit WHERE winner_id = $1 AND loser_id = $2 AND merge_type = 'client') as audit_exists;
    `;

    const verify = await client.query(verifyQuery, [winner.id, loser.id]);
    const v = verify.rows[0];

    if (v.winner_exists === '1' && v.loser_exists === '0' && v.audit_exists === '1') {
      console.log('  ✓ Winner still exists');
      console.log('  ✓ Loser deleted');
      console.log('  ✓ Audit record created');
      console.log('\n✅ Merge completed successfully!');
    } else {
      console.log('  ❌ Verification failed:');
      console.log(`     Winner exists: ${v.winner_exists === '1'}`);
      console.log(`     Loser deleted: ${v.loser_exists === '0'}`);
      console.log(`     Audit exists: ${v.audit_exists === '1'}`);
    }

  } catch (error) {
    console.error('\n❌ Error during merge:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ Disconnected from database');
  }
}

// Run the merge
mergeMoFinClients();
