const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function calculateProductionData() {
  console.log('Fetching production data from database...\n');

  // Get date 12 months ago
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const twelveMonthsAgoISO = twelveMonthsAgo.toISOString();

  try {
    // Query orders/appraisals from the last 12 months
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', twelveMonthsAgoISO)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    console.log(`Found ${orders.length} orders in the last 12 months\n`);

    // Initialize category counters
    const categories = {
      singleFamily: { count: 0, revenue: 0, name: 'Single Family (1-4 Units)' },
      multiFamily: { count: 0, revenue: 0, name: 'Multi-Family (5+ Units)' },
      vacantLand: { count: 0, revenue: 0, name: 'Vacant Land' },
      newConstruction: { count: 0, revenue: 0, name: 'New Construction' },
      condo: { count: 0, revenue: 0, name: 'Condos/Townhomes' },
      commercial: { count: 0, revenue: 0, name: 'Commercial/Industrial' },
      farm: { count: 0, revenue: 0, name: 'Farm/Agricultural' },
      reo: { count: 0, revenue: 0, name: 'REO/Foreclosure' },
      relocation: { count: 0, revenue: 0, name: 'Relocation' },
      other: { count: 0, revenue: 0, name: 'Other' }
    };

    // Track highest value appraisals
    const highestValues = [];

    // Get client names for orders
    const clientIds = [...new Set(orders.map(o => o.client_id).filter(Boolean))];
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .in('id', clientIds);

    const clientMap = {};
    if (clients) {
      clients.forEach(c => {
        clientMap[c.id] = c.name;
      });
    }

    // Process each order
    orders.forEach(order => {
      const fee = parseFloat(order.fee_amount || order.total_amount) || 0;
      const propertyType = (order.property_type || '').toLowerCase().replace(/_/g, ' ');
      const orderType = (order.order_type || '').toLowerCase();
      const reportForm = order.report_form_type || '';

      // Add to highest values list - we don't have appraised_value in orders,
      // but we can track by fee for now
      highestValues.push({
        client: clientMap[order.client_id] || 'Unknown Client',
        value: fee, // Using fee as proxy since we don't store final appraised value
        description: `${propertyType} - ${order.scope_of_work || 'Interior'} Appraisal`,
        address: order.property_address || '',
        formType: reportForm
      });

      // Categorize the order based on property_type and flags
      if (order.is_new_construction) {
        categories.newConstruction.count++;
        categories.newConstruction.revenue += fee;
      } else if (propertyType === 'condo' || propertyType === 'townhome' || propertyType === 'condominium') {
        categories.condo.count++;
        categories.condo.revenue += fee;
      } else if (propertyType === 'land' || propertyType === 'vacant land' || propertyType === 'lot') {
        categories.vacantLand.count++;
        categories.vacantLand.revenue += fee;
      } else if (propertyType === 'commercial' || propertyType === 'industrial' || order.zoning_type === 'commercial') {
        categories.commercial.count++;
        categories.commercial.revenue += fee;
      } else if (propertyType === 'farm' || propertyType === 'agricultural' || propertyType === 'ranch') {
        categories.farm.count++;
        categories.farm.revenue += fee;
      } else if (orderType === 'reo' || orderType === 'foreclosure') {
        categories.reo.count++;
        categories.reo.revenue += fee;
      } else if (orderType === 'relocation') {
        categories.relocation.count++;
        categories.relocation.revenue += fee;
      } else if (propertyType === 'multi family' || propertyType === 'multifamily' || order.is_multiunit) {
        categories.multiFamily.count++;
        categories.multiFamily.revenue += fee;
      } else if (propertyType === 'single family' || propertyType === 'residential' || propertyType === 'sfr') {
        categories.singleFamily.count++;
        categories.singleFamily.revenue += fee;
      } else {
        // Default to other if we can't determine
        categories.other.count++;
        categories.other.revenue += fee;
      }
    });

    // Calculate totals
    let totalCount = 0;
    let totalRevenue = 0;

    console.log('PRODUCTION BY CATEGORY (Last 12 Months):\n');
    console.log('Category'.padEnd(30) + 'Count'.padEnd(10) + 'Revenue');
    console.log('-'.repeat(60));

    Object.entries(categories).forEach(([key, data]) => {
      totalCount += data.count;
      totalRevenue += data.revenue;
      console.log(
        data.name.padEnd(30) +
        data.count.toString().padEnd(10) +
        `$${data.revenue.toFixed(2)}`
      );
    });

    console.log('-'.repeat(60));
    console.log(
      'TOTAL'.padEnd(30) +
      totalCount.toString().padEnd(10) +
      `$${totalRevenue.toFixed(2)}`
    );

    // Show top 3 highest value appraisals
    console.log('\n\nTHREE HIGHEST VALUE APPRAISALS:\n');
    const top3 = highestValues
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    top3.forEach((appraisal, index) => {
      console.log(`${index + 1}. ${appraisal.client}`);
      console.log(`   Value: $${appraisal.value.toLocaleString()}`);
      console.log(`   Description: ${appraisal.description}`);
      console.log(`   Address: ${appraisal.address || 'N/A'}\n`);
    });

    // Calculate projections (10% growth)
    console.log('\nPROJECTED NEXT 12 MONTHS (10% growth):\n');
    console.log('Category'.padEnd(30) + 'Count'.padEnd(10) + 'Revenue');
    console.log('-'.repeat(60));

    let projectedTotalCount = 0;
    let projectedTotalRevenue = 0;

    Object.entries(categories).forEach(([key, data]) => {
      const projCount = Math.round(data.count * 1.1);
      const projRevenue = data.revenue * 1.1;
      projectedTotalCount += projCount;
      projectedTotalRevenue += projRevenue;
      console.log(
        data.name.padEnd(30) +
        projCount.toString().padEnd(10) +
        `$${projRevenue.toFixed(2)}`
      );
    });

    console.log('-'.repeat(60));
    console.log(
      'TOTAL'.padEnd(30) +
      projectedTotalCount.toString().padEnd(10) +
      `$${projectedTotalRevenue.toFixed(2)}`
    );

    // Return data for form filling
    return {
      categories,
      totalCount,
      totalRevenue,
      top3Appraisals: top3,
      projectedTotalCount,
      projectedTotalRevenue
    };

  } catch (error) {
    console.error('Error calculating production data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  calculateProductionData().then(() => {
    console.log('\nProduction data calculation complete!');
    process.exit(0);
  });
}

module.exports = { calculateProductionData };
