import { getDbConnection, memoryStore } from '../config/db.js';
import { broadcastMachineStatus, broadcastAlert } from '../services/socket.js';
import { sendPushNotification } from '../services/notificationService.js';

export async function getMachineStatus(req, res) {
  try {
    const db = await getDbConnection();
    let kiosks = [];

    if (db) {
      const [rows] = await db.query('SELECT * FROM kiosks ORDER BY name ASC');
      kiosks = rows;
    } else {
      kiosks = memoryStore.kiosks;
    }

    // Determine online/offline status based on last heartbeat
    const now = Date.now();
    const thresholdMs = (Number(process.env.HEARTBEAT_TIMEOUT_SECONDS) || 60) * 1000;

    const formatted = kiosks.map((k) => {
      const lastHbTime = k.last_heartbeat ? new Date(k.last_heartbeat).getTime() : 0;
      const isAlive = now - lastHbTime <= thresholdMs;
      const status = isAlive ? (k.status === 'offline' ? 'online' : k.status) : 'offline';

      return {
        id: k.id,
        name: k.name,
        location: k.location,
        status,
        doorLocked: Boolean(k.door_locked),
        waterLevelPercent: k.water_level_pct ?? 100,
        soapLevelPercent: k.soap_level_pct ?? 100,
        currentOrderId: k.current_order_id,
        currentActivity: k.current_activity || 'Idle',
        lastHeartbeat: k.last_heartbeat,
      };
    });

    res.json({ success: true, kiosks: formatted });
  } catch (err) {
    console.error('[Machine] Error fetching machine status:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Endpoint called by ESP32 microcontroller or Kiosk controller
export async function recordHeartbeat(req, res) {
  try {
    const {
      kioskId = 'KIOSK-01-MAIN',
      doorLocked = false,
      waterLevelPercent = 100,
      soapLevelPercent = 100,
      currentOrderId = null,
      currentActivity = 'Idle',
      status = 'online',
      errorCode = null,
    } = req.body;

    const db = await getDbConnection();

    if (db) {
      await db.query(
        `UPDATE kiosks 
         SET status = ?, door_locked = ?, water_level_pct = ?, soap_level_pct = ?, current_order_id = ?, current_activity = ?, last_heartbeat = NOW()
         WHERE id = ?`,
        [status, doorLocked, waterLevelPercent, soapLevelPercent, currentOrderId, currentActivity, kioskId]
      );

      // Log event
      if (errorCode || waterLevelPercent < 20 || soapLevelPercent < 20) {
        await db.query(
          'INSERT INTO machine_logs (kiosk_id, event_type, details) VALUES (?, ?, ?)',
          [kioskId, errorCode ? 'error' : 'refill_needed', JSON.stringify(req.body)]
        );
      }
    } else {
      let k = memoryStore.kiosks.find((k) => k.id === kioskId);
      if (k) {
        k.status = status;
        k.door_locked = doorLocked ? 1 : 0;
        k.water_level_pct = waterLevelPercent;
        k.soap_level_pct = soapLevelPercent;
        k.current_order_id = currentOrderId;
        k.current_activity = currentActivity;
        k.last_heartbeat = new Date().toISOString();
      }
    }

    const payload = {
      id: kioskId,
      status,
      doorLocked: Boolean(doorLocked),
      waterLevelPercent,
      soapLevelPercent,
      currentOrderId,
      currentActivity,
      lastHeartbeat: new Date().toISOString(),
    };

    // Real-time broadcast to all mobile apps
    broadcastMachineStatus(payload);

    // Consumable refill alerts
    if (waterLevelPercent <= 15) {
      sendPushNotification('⚠️ Low Water Warning', `Kiosk ${kioskId} clean water reservoir is at ${waterLevelPercent}%!`, { kioskId, waterLevelPercent });
    }
    if (soapLevelPercent <= 15) {
      sendPushNotification('⚠️ Low Detergent Warning', `Kiosk ${kioskId} detergent soap is at ${soapLevelPercent}%!`, { kioskId, soapLevelPercent });
    }
    if (errorCode) {
      broadcastAlert({ type: 'error', message: `Hardware Error [${errorCode}] on ${kioskId}`, time: new Date().toISOString() });
      sendPushNotification('🚨 Machine Error Detected', `Hardware Error Code: ${errorCode} on Kiosk ${kioskId}`, { kioskId, errorCode });
    }

    res.json({ success: true, message: 'Heartbeat recorded', kiosk: payload });
  } catch (err) {
    console.error('[Machine] Error recording heartbeat:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
