/**
 * End-to-End Email Card Test
 * Tests the complete flow: card creation -> approval -> execution
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zqhenxhgcjxslpfezybm.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaGVueGhnY2p4c2xwZmV6eWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2OTA4NjksImV4cCI6MjA1MDI2Njg2OX0.2vQa8YTzn_q2jBMqpqWTnVMPIEzfXJv0a_OamfJPCfs';

async function testEmailFlow() {
  console.log('\n=== E2E Email Card Test ===\n');
  
  // 1. Create card manually with TO field
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Get user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('❌ Auth error:', authError);
    return;
  }
  console.log('✅ Authenticated as:', user.email);
  
  // 2. Create email card with proper TO field
  console.log('\n📝 Creating email card...');
  const { data: card, error: createError } = await supabase
    .from('kanban_cards')
    .insert({
      org_id: user.id,
      type: 'send_email',
      title: 'E2E Test Email',
      rationale: 'End-to-end test email to verify complete flow from creation to execution',
      priority: 'medium',
      state: 'suggested',
      action_payload: {
        to: 'rod@myroihome.com',
        subject: 'E2E Test - Complete Flow Verification',
        body: '<p>This is an end-to-end test email.</p><p>If you receive this, the complete flow from creation to execution is working correctly.</p><p>Test completed at: ' + new Date().toISOString() + '</p>',
        replyTo: 'test@example.com',
      },
      created_by: user.id,
    })
    .select()
    .single();
    
  if (createError) {
    console.error('❌ Card creation failed:', createError);
    return;
  }
  console.log('✅ Card created:', card.id);
  console.log('   Title:', card.title);
  console.log('   To:', card.action_payload.to);
  console.log('   Subject:', card.action_payload.subject);
  
  // 3. Approve the card
  console.log('\n✓ Approving card...');
  const { error: approveError } = await supabase
    .from('kanban_cards')
    .update({ state: 'approved' })
    .eq('id', card.id);
    
  if (approveError) {
    console.error('❌ Approval failed:', approveError);
    return;
  }
  console.log('✅ Card approved');
  
  // 4. Execute the card via API
  console.log('\n⚡ Executing card...');
  const executeResponse = await fetch('http://localhost:9002/api/agent/execute-card', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`,
    },
    body: JSON.stringify({ cardId: card.id }),
  });
  
  const executeResult = await executeResponse.json();
  
  if (!executeResult.success) {
    console.error('❌ Execution failed:', executeResult);
    
    // Check the card state
    const { data: updatedCard } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('id', card.id)
      .single();
    console.log('\n📋 Card after execution attempt:');
    console.log('   State:', updatedCard.state);
    console.log('   Description:', updatedCard.description);
    return;
  }
  
  console.log('✅ Execution successful!');
  console.log('   Result:', JSON.stringify(executeResult, null, 2));
  
  // 5. Verify card is in done state
  const { data: finalCard } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('id', card.id)
    .single();
    
  console.log('\n📊 Final card state:');
  console.log('   State:', finalCard.state);
  console.log('   Executed at:', finalCard.executed_at);
  
  if (finalCard.state === 'done') {
    console.log('\n🎉 SUCCESS! Email card flow completed end-to-end!');
  } else {
    console.log('\n⚠️  Card not in done state:', finalCard.state);
  }
  
  console.log('\n=== Test Complete ===\n');
}

// Run the test
testEmailFlow().catch(console.error);

