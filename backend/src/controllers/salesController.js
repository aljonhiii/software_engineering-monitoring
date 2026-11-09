import { getDbConnection, memoryStore } from '../config/db.js';

export async function getSalesReports(req, res) {
  try {
    const { period = 'week' } = req.query; // 'day', 'week', 'month'
    const db = await getDbConnection();

    let allTransactions = [];

    if (db) {
      const [rows] = await db.query(
        "SELECT * FROM transactions WHERE payment_status IN ('paid', 'completed') ORDER BY created_at ASC"
      );
      allTransactions = rows;
    } else {
      allTransactions = memoryStore.transactions.filter(
        (t) => t.payment_status === 'paid' || t.payment_status === 'completed'
      );
    }

    // 1. Chart series data (past 7 days by default)
    const daysMap = {};
    const daysCount = period === 'month' ? 30 : period === 'day' ? 1 : 7;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      daysMap[key] = { label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }), revenue: 0, orders: 0 };
    }

    allTransactions.forEach((t) => {
      const dateKey = new Date(t.created_at).toISOString().split('T')[0];
      if (daysMap[dateKey]) {
        daysMap[dateKey].revenue += Number(t.total_amount);
        daysMap[dateKey].orders += 1;
      }
    });

    const chartLabels = Object.values(daysMap).map((d) => d.label);
    const chartData = Object.values(daysMap).map((d) => d.revenue);

    // 2. Shoe type breakdown
    const shoeTypeStats = {};
    allTransactions.forEach((t) => {
      const type = t.shoe_type || 'Other';
      shoeTypeStats[type] = (shoeTypeStats[type] || 0) + 1;
    });

    // 3. Service breakdown
    const serviceStats = {};
    allTransactions.forEach((t) => {
      const service = t.service_name || 'Standard';
      serviceStats[service] = (serviceStats[service] || 0) + 1;
    });

    // 4. Key totals
    const totalRevenue = allTransactions.reduce((acc, t) => acc + Number(t.total_amount), 0);
    const totalOrders = allTransactions.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      success: true,
      period,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      },
      chart: {
        labels: chartLabels,
        datasets: [{ data: chartData }],
      },
      breakdowns: {
        byShoeType: shoeTypeStats,
        byService: serviceStats,
      },
    });
  } catch (err) {
    console.error('[Sales] Error generating sales reports:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
