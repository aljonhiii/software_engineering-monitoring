import {
  getDbConnection,
  memoryStore,
  normalizeShoeType,
  normalizeServiceName,
  getAuthorizedKioskIdsForUser,
} from '../config/db.js';

export async function getDashboardStats(req, res) {
  try {
    const { kioskId } = req.query;
    const authorizedKioskIds = await getAuthorizedKioskIdsForUser(req.user);

    if (
      kioskId &&
      authorizedKioskIds !== null &&
      !authorizedKioskIds.includes(String(kioskId))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. You are not authorized to access this kiosk.',
      });
    }

    const db = await getDbConnection();

    let allTransactions = [];
    let kiosks = [];

    if (db) {
      const [txRows] = await db.query('SELECT * FROM transactions ORDER BY created_at DESC');
      allTransactions = txRows;

      const [kioskRows] = await db.query('SELECT * FROM kiosks ORDER BY name ASC');
      kiosks = kioskRows;
    } else {
      allTransactions = [...memoryStore.transactions];
      kiosks = [...memoryStore.kiosks];
    }

    // Scope kiosks and transactions to buyer's assigned kiosks
    if (authorizedKioskIds !== null) {
      kiosks = kiosks.filter((k) => authorizedKioskIds.includes(k.id));
      allTransactions = allTransactions.filter((t) => authorizedKioskIds.includes(t.kiosk_id));
    }

    if (kioskId) {
      kiosks = kiosks.filter((k) => k.id === String(kioskId));
      allTransactions = allTransactions.filter((t) => t.kiosk_id === String(kioskId));
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

    // Recent transactions
    const recentTransactions = allTransactions.slice(0, 6).map((t) => ({
      id: t.id,
      orderId: t.order_id,
      kioskId: t.kiosk_id,
      shoeType: normalizeShoeType(t.shoe_type),
      serviceName: normalizeServiceName(t.service_name, t.service_tier),
      totalAmount: Number(t.total_amount),
      paymentMethod: t.payment_method,
      paymentStatus: t.payment_status,
      cleaningStatus: t.cleaning_status,
      createdAt: t.created_at,
    }));

    // Primary kiosk state (or null/offline placeholder if buyer has 0 assigned kiosks)
    const primaryKiosk = kiosks[0] || null;

    const activities = allTransactions.slice(0, 10).map((t) => {
      const matchedKiosk = kiosks.find((k) => k.id === t.kiosk_id);
      return {
        id: `act-${t.id}`,
        type: t.cleaning_status === 'completed' ? 'cleaning_completed' : 'payment_received',
        title:
          t.cleaning_status === 'completed'
            ? `Cycle Completed: Order #${t.order_id}`
            : `Payment Received (₱${Number(t.total_amount).toFixed(2)}) via ${t.payment_method.toUpperCase()}`,
        time: t.completed_at || t.created_at,
        kioskName: matchedKiosk?.name || t.kiosk_id,
      };
    });

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
        assignedKiosksCount: kiosks.length,
        primaryKioskId: primaryKiosk ? primaryKiosk.id : null,
        primaryKioskName: primaryKiosk ? primaryKiosk.name : 'No Kiosk Assigned',
        machineStatus: primaryKiosk ? primaryKiosk.status : 'offline',
        machineActivity: primaryKiosk ? primaryKiosk.current_activity : 'No assigned kiosk',
        doorLocked: primaryKiosk ? Boolean(primaryKiosk.door_locked) : false,
        waterLevelPercent: primaryKiosk ? primaryKiosk.water_level_pct : 0,
        soapLevelPercent: primaryKiosk ? primaryKiosk.soap_level_pct : 0,
        lastHeartbeat: primaryKiosk ? primaryKiosk.last_heartbeat : null,
        recentTransactions,
        activities: activities.slice(0, 6),
      },
    });
  } catch (err) {
    console.error('[Dashboard] Error fetching stats:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
