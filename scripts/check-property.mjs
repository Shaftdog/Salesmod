import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProperty() {
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', '5fd00f2b-45a4-44df-8795-9a8935e32274')
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Full property record:');
  console.log(JSON.stringify(property, null, 2));
}

checkProperty();
