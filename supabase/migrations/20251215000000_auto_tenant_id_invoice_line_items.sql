-- =============================================
-- Auto-populate tenant_id on invoice_line_items
--
-- This trigger ensures tenant_id is ALWAYS set from the parent invoice
-- if not explicitly provided during INSERT. This prevents RLS issues
-- where line items are invisible due to NULL tenant_id.
-- =============================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.auto_populate_invoice_line_item_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If tenant_id is not provided, get it from the parent invoice
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id
    FROM public.invoices
    WHERE id = NEW.invoice_id;

    -- If parent invoice also has no tenant_id, raise an error
    IF NEW.tenant_id IS NULL THEN
      RAISE WARNING 'Invoice line item created with NULL tenant_id (parent invoice % also has NULL tenant_id)', NEW.invoice_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.auto_populate_invoice_line_item_tenant_id IS
  'Auto-populates tenant_id from parent invoice if not provided during INSERT';

-- Create the trigger
DROP TRIGGER IF EXISTS auto_populate_invoice_line_item_tenant_id_trigger ON public.invoice_line_items;

CREATE TRIGGER auto_populate_invoice_line_item_tenant_id_trigger
  BEFORE INSERT ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_invoice_line_item_tenant_id();

-- =============================================
-- Also run a one-time fix for any existing records with NULL tenant_id
-- =============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Backfill any remaining NULL tenant_ids from parent invoice
  UPDATE public.invoice_line_items ili
  SET tenant_id = i.tenant_id
  FROM public.invoices i
  WHERE ili.invoice_id = i.id
    AND ili.tenant_id IS NULL
    AND i.tenant_id IS NOT NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count > 0 THEN
    RAISE NOTICE 'Fixed % invoice_line_items with NULL tenant_id', v_updated_count;
  ELSE
    RAISE NOTICE 'All invoice_line_items already have tenant_id set ✓';
  END IF;

  -- Check if any still have NULL
  SELECT COUNT(*) INTO v_updated_count
  FROM public.invoice_line_items
  WHERE tenant_id IS NULL;

  IF v_updated_count > 0 THEN
    RAISE WARNING 'Still have % invoice_line_items with NULL tenant_id (parent invoice may also be NULL)', v_updated_count;
  END IF;
END $$;

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

/*
To rollback this migration:

DROP TRIGGER IF EXISTS auto_populate_invoice_line_item_tenant_id_trigger ON public.invoice_line_items;
DROP FUNCTION IF EXISTS public.auto_populate_invoice_line_item_tenant_id();
*/
