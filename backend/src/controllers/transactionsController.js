import {
  getDbConnection,
  memoryStore,
  saveMemoryStore,
  normalizeShoeType,
  normalizeServiceTier,
  normalizeServiceName,
  normalizeAddons,
  getAuthorizedKioskIdsForUser,
} from '../config/db.js';
import { broadcastNewTransaction, broadcastTransactionUpdate } from '../services/socket.js';
import { sendPushNotification } from '../services/notificationService.js';

export async function getAllTransactions(req, res) {
  try {
    const {
      paymentStatus,
      cleaningStatus,
      kioskId,
      search,
      limit = 50,
      page = 1,
    } = req.query;

    const authorizedKioskIds = await getAuthorizedKioskIdsForUser(req.user);

    if (
      kioskId &&
      authorizedKioskIds !== null &&
      !authorizedKioskIds.includes(String(kioskId))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. You are not authorized to access transactions for this kiosk.',
      });
    }

    // If buyer has 0 assigned kiosks, immediately return empty
    if (authorizedKioskIds !== null && authorizedKioskIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        transactions: [],
      });
    }

    const db = await getDbConnection();
    let transactions = [];
    let kiosksMap = {};

    if (db) {
      const [kRows] = await db.query('SELECT id, name, location, city, address FROM kiosks');
      kRows.forEach((k) => {
        kiosksMap[k.id] = k;
      });

      let query = 'SELECT * FROM transactions WHERE 1=1';
      const params = [];

      if (authorizedKioskIds !== null) {
        query += ` AND kiosk_id IN (${authorizedKioskIds.map(() => '?').join(',')})`;
        params.push(...authorizedKioskIds);
      }

      if (kioskId) {
        query += ' AND kiosk_id = ?';
        params.push(String(kioskId));
      }

      if (paymentStatus && paymentStatus !== 'all') {
        query += ' AND payment_status = ?';
        params.push(paymentStatus.toLowerCase());
      }

      if (cleaningStatus && cleaningStatus !== 'all') {
        query += ' AND cleaning_status = ?';
        params.push(cleaningStatus.toLowerCase());
      }

      if (search && search.trim()) {
        query += ' AND (order_id LIKE ? OR shoe_type LIKE ? OR service_name LIKE ? OR payment_ref LIKE ?)';
        const term = `%${search.trim()}%`;
        params.push(term, term, term, term);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const numLimit = Number(limit);
      const offset = (Number(page) - 1) * numLimit;
      params.push(numLimit, offset);

      const [rows] = await db.query(query, params);
      transactions = rows;
    } else {
      memoryStore.kiosks.forEach((k) => {
        kiosksMap[k.id] = k;
      });
      transactions = [...memoryStore.transactions];

      if (authorizedKioskIds !== null) {
        transactions = transactions.filter((t) => authorizedKioskIds.includes(t.kiosk_id));
      }

      if (kioskId) {
        transactions = transactions.filter((t) => t.kiosk_id === String(kioskId));
      }

      if (paymentStatus && paymentStatus !== 'all') {
        transactions = transactions.filter(
          (t) => t.payment_status.toLowerCase() === paymentStatus.toLowerCase()
        );
      }

      if (cleaningStatus && cleaningStatus !== 'all') {
        transactions = transactions.filter(
          (t) => t.cleaning_status.toLowerCase() === cleaningStatus.toLowerCase()
        );
      }

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        transactions = transactions.filter(
          (t) =>
            t.order_id.toLowerCase().includes(term) ||
            t.shoe_type.toLowerCase().includes(term) ||
            t.service_name.toLowerCase().includes(term) ||
            (t.payment_ref && t.payment_ref.toLowerCase().includes(term))
        );
      }

      transactions.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      transactions = transactions.slice(
        (Number(page) - 1) * Number(limit),
        Number(page) * Number(limit)
      );
    }

    const formatted = transactions.map((t) => {
      const kInfo = kiosksMap[t.kiosk_id];
      return {
        id: t.id,
        orderId: t.order_id,
        kioskId: t.kiosk_id,
        kioskName: kInfo?.name || t.kiosk_id,
        kioskLocation: kInfo?.location || kInfo?.address || '',
        shoeType: normalizeShoeType(t.shoe_type),
        serviceTier: normalizeServiceTier(t.service_tier, t.service_name),
        serviceName: normalizeServiceName(t.service_name, t.service_tier),
        addons: normalizeAddons(t.addons),
        basePrice: Number(t.base_price),
        addonsPrice: Number(t.addons_price),
        totalAmount: Number(t.total_amount),
        paymentMethod: t.payment_method,
        paymentStatus: t.payment_status,
        paymentRef: t.payment_ref,
        cleaningStatus: t.cleaning_status,
        startedAt: t.started_at,
        completedAt: t.completed_at,
        createdAt: t.created_at,
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      transactions: formatted,
    });
  } catch (err) {
    console.error('[Transactions] Error fetching transactions:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getTransactionById(req, res) {
  try {
    const { id } = req.params;
    const authorizedKioskIds = await getAuthorizedKioskIdsForUser(req.user);
    const db = await getDbConnection();

    let transaction = null;

    if (db) {
      const [rows] = await db.query(
        'SELECT t.*, k.name as kiosk_name, k.location as kiosk_location FROM transactions t LEFT JOIN kiosks k ON t.kiosk_id = k.id WHERE t.id = ? OR t.order_id = ? LIMIT 1',
        [id, id]
      );
      if (rows.length > 0) transaction = rows[0];
    } else {
      transaction = memoryStore.transactions.find(
        (t) => t.id === id || t.order_id === id
      );
      if (transaction) {
        const k = memoryStore.kiosks.find((item) => item.id === transaction.kiosk_id);
        transaction = {
          ...transaction,
          kiosk_name: k?.name,
          kiosk_location: k?.location,
        };
      }
    }

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    // Enforce buyer-to-kiosk isolation
    if (
      authorizedKioskIds !== null &&
      !authorizedKioskIds.includes(transaction.kiosk_id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. This transaction belongs to a kiosk not assigned to your account.',
      });
    }

    const formatted = {
      id: transaction.id,
      orderId: transaction.order_id,
      kioskId: transaction.kiosk_id,
      kioskName: transaction.kiosk_name || transaction.kiosk_id,
      kioskLocation: transaction.kiosk_location || 'Ground Floor Lobby',
      shoeType: normalizeShoeType(transaction.shoe_type),
      serviceTier: normalizeServiceTier(transaction.service_tier, transaction.service_name),
      serviceName: normalizeServiceName(transaction.service_name, transaction.service_tier),
      addons: normalizeAddons(transaction.addons),
      basePrice: Number(transaction.base_price),
      addonsPrice: Number(transaction.addons_price),
      totalAmount: Number(transaction.total_amount),
      paymentMethod: transaction.payment_method,
      paymentStatus: transaction.payment_status,
      paymentRef: transaction.payment_ref,
      cleaningStatus: transaction.cleaning_status,
      startedAt: transaction.started_at,
      completedAt: transaction.completed_at,
      createdAt: transaction.created_at,
    };

    res.json({ success: true, transaction: formatted });
  } catch (err) {
    console.error('[Transactions] Error fetching transaction detail:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Endpoint called by Kiosk to record new transaction
export async function createTransaction(req, res) {
  try {
    const payload = req.body;
    const orderId = payload.orderId || payload.order_id;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const txId = payload.id || `TX-${Date.now()}`;
    const kioskId = payload.kioskId || payload.kiosk_id || 'KIOSK-01-MAIN';
    const shoeType = normalizeShoeType(payload.shoeType || payload.shoe_type || 'Other Shoes');
    const rawTier = payload.service?.id || payload.serviceTier || payload.service_tier || 'sanitation';
    const rawName = payload.service?.name || payload.serviceName || payload.service_name || 'Sanitation';
    const serviceTier = normalizeServiceTier(rawTier, rawName);
    const serviceName = normalizeServiceName(rawName, rawTier);
    const normalizedAddonsList = normalizeAddons(payload.addons || []);
    const addonsJson = JSON.stringify(normalizedAddonsList);
    const basePrice = Number(payload.service?.price || payload.basePrice || payload.totalAmount || 0);
    const addonsPrice = normalizedAddonsList.reduce((acc, a) => acc + Number(a.price || 0), 0);
    const totalAmount = Number(payload.totalAmount || payload.totalPrice || basePrice + addonsPrice);
    let paymentMethod = (payload.paymentMethod || 'cash').toLowerCase();
    if (paymentMethod === 'ewallet') {
      const ref = (payload.transactionId || payload.paymentRef || '').toLowerCase();
      paymentMethod = ref.includes('maya') ? 'maya' : 'gcash';
    }

    let paymentStatus = (payload.paymentStatus || 'paid').toLowerCase();
    if (paymentStatus === 'completed') paymentStatus = 'paid';

    const paymentRef = payload.transactionId || payload.paymentRef || null;
    const cleaningStatus = payload.cleaningStatus || 'pending';

    const db = await getDbConnection();

    const record = {
      id: txId,
      order_id: orderId,
      kiosk_id: kioskId,
      shoe_type: shoeType,
      service_tier: serviceTier,
      service_name: serviceName,
      addons: addonsJson,
      base_price: basePrice,
      addons_price: addonsPrice,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      payment_ref: paymentRef,
      cleaning_status: cleaningStatus,
      started_at: new Date().toISOString(),
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    if (db) {
      await db.query(
        `INSERT INTO transactions 
         (id, order_id, kiosk_id, shoe_type, service_tier, service_name, addons, base_price, addons_price, total_amount, payment_method, payment_status, payment_ref, cleaning_status, started_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE payment_status=VALUES(payment_status), cleaning_status=VALUES(cleaning_status)`,
        [
          txId,
          orderId,
          kioskId,
          shoeType,
          serviceTier,
          serviceName,
          addonsJson,
          basePrice,
          addonsPrice,
          totalAmount,
          paymentMethod,
          paymentStatus,
          paymentRef,
          cleaningStatus,
        ]
      );
    } else {
      const idx = memoryStore.transactions.findIndex((t) => t.order_id === orderId);
      if (idx >= 0) {
        memoryStore.transactions[idx] = { ...memoryStore.transactions[idx], ...record };
      } else {
        memoryStore.transactions.unshift(record);
      }
      saveMemoryStore();
    }

    console.log(`📥 [Transactions] New Order created: #${orderId} (₱${totalAmount}) on ${kioskId} via ${paymentMethod}`);

    broadcastNewTransaction(record);

    sendPushNotification(
      '💰 New Transaction Paid',
      `Order #${orderId} paid ₱${totalAmount.toFixed(2)} via ${paymentMethod.toUpperCase()}`,
      { orderId, totalAmount, kioskId }
    );

    res.status(201).json({ success: true, message: 'Transaction recorded', transaction: record });
  } catch (err) {
    console.error('[Transactions] Error creating transaction:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateTransactionStatus(req, res) {
  try {
    const { id } = req.params;
    const { paymentStatus, cleaningStatus } = req.body;

    const db = await getDbConnection();
    let updated = null;

    if (db) {
      let query = 'UPDATE transactions SET ';
      const updates = [];
      const params = [];

      if (paymentStatus) {
        const normStatus = paymentStatus === 'completed' ? 'paid' : paymentStatus;
        updates.push('payment_status = ?');
        params.push(normStatus);
      }
      if (cleaningStatus) {
        updates.push('cleaning_status = ?');
        params.push(cleaningStatus);
        if (cleaningStatus === 'completed') {
          updates.push('completed_at = NOW()');
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      query += updates.join(', ') + ' WHERE id = ? OR order_id = ?';
      params.push(id, id);

      await db.query(query, params);
      const [rows] = await db.query('SELECT * FROM transactions WHERE id = ? OR order_id = ? LIMIT 1', [id, id]);
      if (rows.length > 0) updated = rows[0];
    } else {
      const tx = memoryStore.transactions.find((t) => t.id === id || t.order_id === id);
      if (tx) {
        if (paymentStatus) tx.payment_status = paymentStatus === 'completed' ? 'paid' : paymentStatus;
        if (cleaningStatus) {
          tx.cleaning_status = cleaningStatus;
          if (cleaningStatus === 'completed') tx.completed_at = new Date().toISOString();
        }
        updated = tx;
        saveMemoryStore();
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    broadcastTransactionUpdate(updated);

    if (cleaningStatus === 'completed') {
      sendPushNotification(
        '✨ Wash Cycle Completed',
        `Chamber door unlocked for Order #${updated.order_id}`,
        { orderId: updated.order_id, kioskId: updated.kiosk_id }
      );
    }

    res.json({ success: true, message: 'Transaction updated', transaction: updated });
  } catch (err) {
    console.error('[Transactions] Error updating transaction:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
