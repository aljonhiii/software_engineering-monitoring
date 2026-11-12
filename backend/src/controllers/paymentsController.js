import {
  getDbConnection,
  memoryStore,
  getAuthorizedKioskIdsForUser,
} from '../config/db.js';

export async function getPaymentsLedger(req, res) {
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
        message: 'Permission denied. You are not authorized to access payments for this kiosk.',
      });
    }

    const db = await getDbConnection();
    let allTransactions = [];

    if (db) {
      const [rows] = await db.query(
        'SELECT id, order_id, kiosk_id, total_amount, payment_method, payment_status, payment_ref, created_at FROM transactions ORDER BY created_at DESC'
      );
      allTransactions = rows;
    } else {
      allTransactions = [...memoryStore.transactions];
    }

    if (authorizedKioskIds !== null) {
      allTransactions = allTransactions.filter((t) => authorizedKioskIds.includes(t.kiosk_id));
    }
    if (kioskId) {
      allTransactions = allTransactions.filter((t) => t.kiosk_id === String(kioskId));
    }

    // Method breakdown
    const methodsSummary = {
      cash: { count: 0, amount: 0 },
      gcash: { count: 0, amount: 0 },
      maya: { count: 0, amount: 0 },
    };

    let totalCollected = 0;
    let successfulCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    const payments = allTransactions.map((t) => {
      const amount = Number(t.total_amount);
      const rawMethod = (t.payment_method || 'cash').toLowerCase();
      let method = rawMethod;
      if (rawMethod === 'coins' || rawMethod === 'bills') {
        method = 'cash';
      } else if (rawMethod === 'ewallet') {
        const ref = (t.payment_ref || '').toLowerCase();
        method = ref.includes('maya') ? 'maya' : 'gcash';
      }

      const isPaid = t.payment_status === 'paid' || t.payment_status === 'completed';
      if (isPaid) {
        totalCollected += amount;
        successfulCount++;
        if (methodsSummary[method]) {
          methodsSummary[method].count++;
          methodsSummary[method].amount += amount;
        } else {
          methodsSummary.cash.count++;
          methodsSummary.cash.amount += amount;
        }
      } else if (t.payment_status === 'pending') {
        pendingCount++;
      } else {
        failedCount++;
      }

      return {
        id: t.id,
        orderId: t.order_id,
        kioskId: t.kiosk_id,
        amount,
        paymentMethod: method,
        paymentStatus: t.payment_status,
        paymentRef: t.payment_ref,
        createdAt: t.created_at,
      };
    });

    res.json({
      success: true,
      summary: {
        totalCollected,
        successfulCount,
        pendingCount,
        failedCount,
        methodsSummary,
      },
      payments,
    });
  } catch (err) {
    console.error('[Payments] Error fetching payments ledger:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
