require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1];

console.log('=== RUN THIS SQL IN SUPABASE DASHBOARD ===');
console.log('');
console.log(`URL: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.log('');
console.log('--- SQL ---');
console.log(`
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_activity_type_check;
ALTER TABLE public.activities ADD CONSTRAINT activities_activity_type_check CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'task', 'research'));
`);
console.log('-----------');
