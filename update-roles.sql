-- Update all user roles to admin for campaign access
UPDATE profiles
SET role = 'admin'
WHERE role = 'user';

-- Verify the update
SELECT id, email, role
FROM profiles
ORDER BY created_at DESC;
