-- ==============================================
-- ADD MISSING SALES CAMPAIGN VALUES
-- ==============================================

-- Drop the old constraint
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_sales_campaign_check;

-- Add new constraint with additional values
ALTER TABLE public.orders
  ADD CONSTRAINT orders_sales_campaign_check CHECK (sales_campaign IN (
    'client_selection', 'bid_request', 'case_management', 'collections',
    'client_maintenance', 'feedback', 'client_recognition', 'education',
    'networking', 'new_client', 'partnership', 'market_expansion',
    'product_expansion', 'prospecting', 'suspecting', 'update_profile',
    'contact_attempts', 'administration', 'admin_support', 'scheduling',
    'training', 'meeting',
    -- NEW: Additional values found in historical data
    'additional_service', 'quote_follow_up'
  ));

SELECT 'Constraint updated' as status;
