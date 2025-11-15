# Properties System Documentation

## Overview

The Properties System provides canonical building-level property management with USPAP compliance for appraisal orders. It implements a two-phase import process (Property → Order) with complete Asana field mappings, unit extraction, and USPAP 3-year lookback functionality.

## Architecture

### Building-Level Design

Properties are stored at the **building level** (no unit in identity hash), allowing multiple units at the same address to share one property record. This design:

- Prevents duplicate properties for the same building
- Enables USPAP compliance across all units
- Supports unit-specific order tracking via `order.props.unit`

### Key Components

1. **Properties Table**: Canonical property records with USPAP fields
2. **Address Normalization**: Building-level deduplication via `addr_hash`
3. **Unit Extraction**: Separates building address from unit number
4. **USPAP Compliance**: 3-year lookback with cached + dynamic counts
5. **Two-Phase Importer**: Property upsert → Order creation with linking

## Database Schema

### Properties Table

```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,                    -- Per-org scoping
  address_line1 TEXT NOT NULL,            -- Building address (no unit)
  address_line2 TEXT,                     -- Address line 2
  city TEXT NOT NULL,
  state TEXT NOT NULL,                     -- 2-letter uppercase
  postal_code TEXT NOT NULL,              -- 5 or 9 digits
  country TEXT NOT NULL DEFAULT 'US',
  property_type TEXT NOT NULL DEFAULT 'single_family',
  apn TEXT,                               -- Assessor parcel number
  latitude NUMERIC(9,6),                  -- GPS coordinates
  longitude NUMERIC(9,6),
  gla NUMERIC,                            -- Gross living area
  lot_size NUMERIC,                       -- Lot size in sq ft
  year_built INT,                         -- Year built
  addr_hash TEXT NOT NULL,                -- Normalized key: STREET|CITY|STATE|ZIP5
  props JSONB DEFAULT '{}'::jsonb,        -- Flexible storage
  search TSVECTOR,                        -- Full-text search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Unique Constraints

- `(org_id, addr_hash)` - One property per normalized address per org
- State format: `^[A-Z]{2}$`
- Postal code format: `^[0-9]{5}(-[0-9]{4})?$`
- Latitude: -90 to 90, Longitude: -180 to 180

### Orders Linkage

```sql
ALTER TABLE orders ADD COLUMN property_id UUID REFERENCES properties(id);
```

## Address Normalization

### Building-Level Hash

The `addr_hash` field uses the format: `STREET|CITY|STATE|ZIP5` (no unit)

```typescript
function normalizeAddressKey(line1, city, state, zip): string {
  // Clean and normalize address components
  // Remove unit information
  // Return: "123 MAIN ST|SAN FRANCISCO|CA|94103"
}
```

### Unit Extraction

Units are extracted from street addresses and stored in `order.props.unit`:

```typescript
function extractUnit(line1: string): { street: string; unit?: string } {
  // "123 Main St Apt 2B" → { street: "123 Main St", unit: "2B" }
  // "456 Oak Ave #305" → { street: "456 Oak Ave", unit: "305" }
  // "789 Elm St" → { street: "789 Elm St" }
}
```

## USPAP Compliance

### 3-Year Lookback

USPAP requires tracking prior work on the same property within 3 years:

```sql
-- Dynamic view for USPAP compliance
CREATE VIEW property_prior_work_3y AS
SELECT p.id as property_id, o.id as order_id, o.completed_date, o.status
FROM properties p
JOIN orders o ON o.property_id = p.id
WHERE o.completed_date IS NOT NULL
  AND o.completed_date >= (NOW() - INTERVAL '3 years');

-- Function for counting prior work
CREATE FUNCTION property_prior_work_count(_property_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*) FROM orders
  WHERE property_id = _property_id
    AND completed_date IS NOT NULL
    AND completed_date >= (NOW() - INTERVAL '3 years');
$$;
```

### Cached + Dynamic Approach

- **Cached**: Stored in `orders.props.uspap` for fast UI display
- **Dynamic**: Computed via RPC function for accuracy
- **Refreshable**: "Recheck" button updates cache on demand

```typescript
// Cached format
order.props.uspap = {
  prior_work_3y: 2,
  as_of: "2025-01-18T10:30:00Z"
}
```

## Asana Import Mappings

### Complete Field Mappings

The system supports all 30+ Asana fields with intelligent mapping:

#### Core Identity & Dates
- `Task ID` → `orders.external_id` + `orders.source = 'asana'`
- `Created At` → `orders.ordered_date`
- `Due Date` → `orders.due_date`
- `Completed At` → `orders.completed_date`
- `Inspection Date` → `props.inspection_date`

#### Address Processing (Two-Phase)
1. `splitUSAddress(original)` → `{ street, city, state, zip }`
2. `extractUnit(street)` → `{ streetNoUnit, unit }`
3. **Property upsert**: `upsertPropertyForOrder(orgId, { street: streetNoUnit, ... })`
4. **Order snapshot**: Keep building address + store unit in `props.unit`

#### Money Fields
- `Appraisal Fee` → `orders.fee_amount`
- `Inspection Fee` → `orders.tech_fee`
- `Amount` → `orders.total_amount`

#### Derived Status Logic
```typescript
if (completedAt) return 'completed';
else if (inspectionDate < now) return 'in_progress';
else if (inspectionDate >= now) return 'scheduled';
else if (dueDate) return 'assigned';
else return 'new';
```

#### Client Resolution (Priority Order)
1. `Client Name` field
2. `AMC CLIENT` field  
3. `Lender Client` field
4. Fallback to "Unassigned Orders" client

#### Props Fields (No Native Columns)
All additional Asana fields map to `orders.props.*`:
- `AMC CLIENT` → `props.amc_client`
- `AREA` → `props.area`
- `GLA` → `props.gla`
- `Notes` → `props.notes`
- And 20+ more fields...

## API Endpoints

### Properties Management

- `GET /api/properties` - List with search, filters, pagination
- `GET /api/properties/[id]` - Property detail with related orders
- `POST /api/properties` - Upsert property (manual creation)
- `PUT /api/properties/[id]` - Update property
- `DELETE /api/properties/[id]` - Delete property (if no linked orders)

### Backfill Operations

- `POST /api/admin/properties/backfill` - Link existing orders to properties
- `GET /api/admin/properties/backfill` - Get backfill statistics

### Parameters

```typescript
// Backfill request
{
  orgId?: string,        // Default: current user's org
  pageSize?: number,     // Default: 1000
  start?: number,        // Default: 0
  dryRun?: boolean       // Default: false
}

// Backfill response
{
  scanned: number,
  propertiesCreated: number,
  ordersLinked: number,
  skipped: number,
  warnings: Array<{
    type: string,
    message: string,
    data?: any
  }>
}
```

## UI Components

### Properties Index (`/properties`)

- **Search**: Full-text search across address fields
- **Filters**: City, state, ZIP, property type
- **Table**: Address, type, prior work count, APN
- **Statistics**: Total properties, linked orders, backfill status
- **Actions**: View details, backfill properties

### Property Detail (`/properties/[id]`)

- **Header**: Full address, property type, APN
- **USPAP Badge**: Prior work count with "Recheck" button
- **Timeline Tab**: Related orders with status, dates, fees, units
- **Details Tab**: All property fields, coordinates, custom props

### Order Integration

- **Property Chip**: Shows linked property with unit and prior work
- **Order Cards**: Property chip in card description
- **Order Detail**: Property card with full details and link

## React Hooks

### Data Fetching

```typescript
// List properties with filters
const { data } = useProperties({
  search: "123 Main",
  city: "San Francisco",
  page: 1,
  limit: 50
});

// Single property with orders
const { data } = useProperty(propertyId);

// Dynamic USPAP count
const { data: priorWork } = usePropertyPriorWork(propertyId);
```

### Mutations

```typescript
// Backfill properties
const backfill = useBackfillProperties();
await backfill.mutateAsync({
  pageSize: 1000,
  dryRun: false
});

// Refresh USPAP cache
const refresh = useRefreshUSPAPCache();
await refresh.mutateAsync(propertyId);
```

## Testing & Validation

### Import Testing

1. **Unit Extraction**: Verify "123 Main St Apt 2B" → property: "123 Main St", unit: "2B"
2. **Building Deduplication**: Multiple units at same address → same property_id
3. **Field Mapping**: All 30+ Asana fields mapped correctly
4. **USPAP Cache**: `orders.props.uspap.prior_work_3y` set correctly
5. **Warnings**: Missing data captured (client_unresolved, address_parse_failed)

### Backfill Testing

1. **Linking Rate**: >95% of eligible orders linked
2. **Idempotency**: Re-run shows 0 new properties created
3. **USPAP Cache**: Updated for all backfilled orders
4. **Unit Extraction**: Units stored in `order.props.unit`

### UI Testing

1. **Search Performance**: Results <300ms
2. **Navigation**: Property chips link to detail pages
3. **USPAP Refresh**: "Recheck" button updates counts
4. **Responsive**: Works on mobile and desktop

### USPAP Validation

Compare cached vs dynamic counts:
```sql
-- Sample validation query
SELECT 
  o.id,
  o.props->'uspap'->>'prior_work_3y' as cached_count,
  property_prior_work_count(o.property_id) as dynamic_count
FROM orders o 
WHERE o.property_id IS NOT NULL 
LIMIT 10;
```

## Security & Performance

### Row Level Security (RLS)

```sql
-- Properties scoped by org_id
CREATE POLICY "Users can view properties for their org"
  ON properties FOR SELECT
  USING (org_id = auth.uid());
```

### Indexes

- `(org_id, addr_hash)` - Unique constraint
- `(city, state, postal_code)` - Location searches
- `search` (GIN) - Full-text search
- `property_id` on orders - Fast joins

### Performance Optimizations

- **Cached USPAP**: Avoids expensive joins for UI display
- **Batch Processing**: 1000 orders per backfill batch
- **React Query**: Client-side caching and invalidation
- **Debounced Search**: 300ms delay on search input

## Migration & Deployment

### Database Migration

Run the migration file:
```bash
# Apply properties migration
supabase db push
```

### Backfill Existing Data

```bash
# API endpoint (recommended)
curl -X POST /api/admin/properties/backfill \
  -H "Content-Type: application/json" \
  -d '{"pageSize": 1000, "dryRun": false}'

# Or SQL script (emergency only)
# See migration file comments for SQL backfill script
```

### Verification

1. Check properties table has data
2. Verify orders have `property_id` set
3. Test USPAP counts match dynamic function
4. Validate UI navigation works
5. Confirm search and filters function

## Troubleshooting

### Common Issues

1. **Address Parsing Failures**: Check `splitUSAddress` function
2. **Unit Extraction**: Verify regex patterns in `extractUnit`
3. **USPAP Cache Mismatch**: Run "Recheck" button or backfill
4. **RLS Errors**: Ensure user has correct `org_id`
5. **Performance**: Check indexes and query plans

### Debug Queries

```sql
-- Check property counts
SELECT org_id, COUNT(*) FROM properties GROUP BY org_id;

-- Verify USPAP function
SELECT property_prior_work_count('property-uuid-here');

-- Check order linking
SELECT COUNT(*) FROM orders WHERE property_id IS NOT NULL;

-- Find unlinked orders
SELECT COUNT(*) FROM orders 
WHERE property_id IS NULL 
  AND property_address IS NOT NULL;
```

## Future Enhancements

1. **Geocoding**: Automatic lat/lng from addresses
2. **Property Photos**: Image upload and management
3. **Market Data**: Zillow/Redfin integration
4. **Advanced Search**: Map-based property search
5. **Bulk Operations**: Mass property updates
6. **Audit Trail**: Property change history
7. **API Webhooks**: Real-time property updates

