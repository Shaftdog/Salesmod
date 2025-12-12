const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeActualDates() {
  console.log('Analyzing actual order dates...\n');

  try {
    // Get all orders without date filter
    const { data: allOrders, error } = await supabase
      .from('orders')
      .select('created_at, ordered_date, completed_date, status, fee_amount, total_amount')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Total orders in database: ${allOrders.length}\n`);

    // Analyze date ranges
    if (allOrders.length > 0) {
      const firstOrder = allOrders[0];
      const lastOrder = allOrders[allOrders.length - 1];

      console.log('Date Range (created_at):');
      console.log(`  First order: ${new Date(firstOrder.created_at).toLocaleDateString()}`);
      console.log(`  Last order: ${new Date(lastOrder.created_at).toLocaleDateString()}`);
      console.log(`  Span: ${Math.round((new Date(lastOrder.created_at) - new Date(firstOrder.created_at)) / (1000 * 60 * 60 * 24))} days\n`);
    }

    // Count orders by month
    const monthCounts = {};
    const completedByMonth = {};
    const revenueByMonth = {};

    allOrders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;

      if (order.status === 'completed') {
        completedByMonth[monthKey] = (completedByMonth[monthKey] || 0) + 1;
      }

      const fee = parseFloat(order.fee_amount || order.total_amount || 0);
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + fee;
    });

    console.log('Orders by Month:');
    console.log('Month'.padEnd(15) + 'Total'.padEnd(10) + 'Completed'.padEnd(12) + 'Revenue');
    console.log('-'.repeat(60));

    Object.keys(monthCounts).sort().forEach(month => {
      console.log(
        month.padEnd(15) +
        monthCounts[month].toString().padEnd(10) +
        (completedByMonth[month] || 0).toString().padEnd(12) +
        `$${(revenueByMonth[month] || 0).toFixed(2)}`
      );
    });

    // Calculate realistic production for E&O
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    console.log(`\n\nAnalyzing for TRUE last 12 months:`);
    console.log(`From: ${oneYearAgo.toLocaleDateString()}`);
    console.log(`To: ${now.toLocaleDateString()}\n`);

    const last12MonthOrders = allOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= oneYearAgo && orderDate <= now;
    });

    const completed12Month = last12MonthOrders.filter(o => o.status === 'completed');
    let total12MonthRevenue = 0;

    last12MonthOrders.forEach(order => {
      const fee = parseFloat(order.fee_amount || order.total_amount || 0);
      total12MonthRevenue += fee;
    });

    console.log(`Total orders: ${last12MonthOrders.length}`);
    console.log(`Completed orders: ${completed12Month.length}`);
    console.log(`Total revenue: $${total12MonthRevenue.toFixed(2)}`);
    console.log(`Average fee: $${(total12MonthRevenue / last12MonthOrders.length).toFixed(2)}`);

    // Check if this looks like test/synthetic data
    console.log('\n\n⚠️  DATA QUALITY CHECK:');
    const dateSpanDays = Math.round((new Date(allOrders[allOrders.length - 1].created_at) - new Date(allOrders[0].created_at)) / (1000 * 60 * 60 * 24));

    if (dateSpanDays < 90) {
      console.log(`❌ WARNING: All data is within ${dateSpanDays} days`);
      console.log('   This appears to be test/demo data, not real production history');
    } else {
      console.log(`✓ Data spans ${dateSpanDays} days - appears to be real production data`);
    }

    // What should be reported on E&O application?
    console.log('\n\n📋 RECOMMENDATION FOR E&O APPLICATION:');
    console.log('━'.repeat(60));

    if (dateSpanDays < 90) {
      console.log('⚠️  The database contains mostly recent/test data.');
      console.log('');
      console.log('OPTIONS:');
      console.log('1. Use your ACTUAL production records from the last 12 months');
      console.log('2. Check if you have older data in another system');
      console.log('3. Use data from your previous E&O application if < 1 year old');
      console.log('4. Estimate based on your known monthly average × 12');
    } else {
      console.log('✓ Use the calculated numbers from database');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeActualDates().then(() => {
  process.exit(0);
});
