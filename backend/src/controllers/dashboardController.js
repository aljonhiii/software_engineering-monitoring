import { getDbConnection, memoryStore } from '../config/db.js';

export async function getDashboardStats(req, res) {
  try {
    const db = await getDbConnection();

    let allTransactions = [];
    let kiosks = [];

    if (db) {
      const [txRows] = await db.query('SELECT * FROM transactions ORDER BY created_at DESC');
      allTransactions = txRows;

      const [kioskRows] = await db.query('SELECT * FROM kiosks');
      kiosks = kioskRows;
    } else {
      allTransactions = [...memoryStore.transactions];
      kiosks = [...memoryStore.kiosks];
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's transactions
    const todayTransactions = allTransactions.filter((t) => {
      const createdDate = new Date(t.created_at).toISOString().split('T')[0];
      return createdDate === todayStr;
    });

    const isPaid = (status) => status === 'paid' || status === 'completed';

    const todayPaidTransactions = todayTransactions.filter((t) => isPaid(t.payment_status));
    const todayRevenue = todayPaidTransactions.reduce((acc, t) => acc + Number(t.total_amount || 0), 0);

    // All-time totals
    const paidTransactions = allTransactions.filter((t) => isPaid(t.payment_status));
    const pendingTransactions = allTransactions.filter((t) => t.payment_status === 'pending');
    const failedTransactions = allTransactions.filter((t) => t.payment_status === 'failed');
    const allTimeRevenue = paidTransactions.reduce((acc, t) => acc + Number(t.total_amount || 0), 0);

    const completedCleaning = allTransactions.filter((t) => t.cleaning_status === 'completed').length;
    const activeCleaning = allTransactions.filter((t) => t.cleaning_status === 'in_progress').length;

    // Recent 5 transactions
    const recentTransactions = allTransactions.slice(0, 5).map((t) => ({
      id: t.id,
      orderId: t.order_id,
      shoeType: t.shoe_type,
      serviceName: t.service_name,
      totalAmount: Number(t.total_amount),
      paymentMethod: t.payment_method,
      paymentStatus: t.payment_status,
      cleaningStatus: t.cleaning_status,
      createdAt: t.created_at,
    }));

    // Primary kiosk state
    const primaryKiosk = kiosks[0] || {
      id: 'KIOSK-01-MAIN',
      name: 'KixCleen Vendo #1',
      status: 'online',
      door_locked: false,
      water_level_pct: 90,
      soap_level_pct: 95,
      current_activity: 'Idle',
      last_heartbeat: new Date().toISOString(),
    };

    // System activity stream
    const activities = [
      ...allTransactions.slice(0, 10).map((t) => ({
        id: `act-${t.id}`,
        type: t.cleaning_status === 'completed' ? 'cleaning_completed' : 'payment_received',
        title:
          t.cleaning_status === 'completed'
            ? `Cycle Completed: Order #${t.order_id}`
            : `Payment Received (₱${Number(t.total_amount).toFixed(2)}) via ${t.payment_method.toUpperCase()}`,
        time: t.completed_at || t.created_at,
        kioskName: primaryKiosk.name,
      })),
    ];

    res.json({
      success: true,
      stats: {
        todayRevenue,
        todayTransactionsCount: todayTransactions.length,
        todayPaidCount: todayPaidTransactions.length,
        allTimeRevenue,
        totalTransactionsCount: allTransactions.length,
        successfulPaymentsCount: paidTransactions.length,
        pendingPaymentsCount: pendingTransactions.length,
        failedPaymentsCount: failedTransactions.length,
        completedCleansCount: completedCleaning,
        activeCleansCount: activeCleaning,
        machineStatus: primaryKiosk.status,
        machineActivity: primaryKiosk.current_activity,
        doorLocked: Boolean(primaryKiosk.door_locked),
        waterLevelPercent: primaryKiosk.water_level_pct,
        soapLevelPercent: primaryKiosk.soap_level_pct,
        lastHeartbeat: primaryKiosk.last_heartbeat,
        recentTransactions,
        activities: activities.slice(0, 6),
      },
    });
  } catch (err) {
    console.error('[Dashboard] Error fetching stats:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
