-- Temporary update to allow testing of invoice edit functionality
-- This changes INV-00021 from 'overdue' to 'draft' status

UPDATE invoices
SET status = 'draft'
WHERE invoice_number = 'INV-00021';

-- Verify the update
SELECT invoice_number, status, total_amount, order_id
FROM invoices
WHERE invoice_number = 'INV-00021';
