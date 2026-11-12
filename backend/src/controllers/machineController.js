import {
  getDbConnection,
  memoryStore,
  saveMemoryStore,
  getAuthorizedKioskIdsForUser,
} from '../config/db.js';
import { broadcastMachineStatus, broadcastAlert } from '../services/socket.js';
import { sendPushNotification } from '../services/notificationService.js';

export async function getMachineStatus(req, res) {
  try {
    const { kioskId } = req.query;
    const authorizedKioskIds = await getAuthorizedKioskIdsForUser(req.user);

    // If buyer requests a specific kioskId not assigned to them, reject with 403
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
    let kiosks = [];
    let machineStatuses = [];

    if (db) {
      const [rows] = await db.query('SELECT * FROM kiosks ORDER BY name ASC');
      kiosks = rows;
      const [msRows] = await db.query('SELECT * FROM machine_status');
      machineStatuses = msRows;
    } else {
      kiosks = memoryStore.kiosks;
      machineStatuses = memoryStore.machine_status;
    }

    // Scope to buyer's assigned kiosks
    if (authorizedKioskIds !== null) {
      kiosks = kiosks.filter((k) => authorizedKioskIds.includes(k.id));
    }
    if (kioskId) {
      kiosks = kiosks.filter((k) => k.id === String(kioskId));
    }

    const now = Date.now();
    const thresholdMs = (Number(process.env.HEARTBEAT_TIMEOUT_SECONDS) || 3600) * 1000;

    const formatted = kiosks.map((k) => {
      const ms = machineStatuses.find((m) => m.kiosk_id === k.id);
      const hb = ms?.last_heartbeat || k.last_heartbeat;
      const lastHbTime = hb ? new Date(hb).getTime() : 0;
      const isAlive = lastHbTime > 0 && now - lastHbTime <= thresholdMs;
      const rawStatus = ms?.status || k.status || 'online';
      const status =
        rawStatus === 'maintenance' || rawStatus === 'error'
          ? rawStatus
          : isAlive
          ? rawStatus === 'offline'
            ? 'online'
            : rawStatus
          : rawStatus;

      return {
        id: k.id,
        name: k.name,
        address: k.address || '',
        city: k.city || '',
        location: k.location,
        latitude: k.latitude !== null && k.latitude !== undefined ? Number(k.latitude) : null,
        longitude: k.longitude !== null && k.longitude !== undefined ? Number(k.longitude) : null,
        operatingHours: k.operating_hours || '8:00 AM - 10:00 PM Daily',
        status,
        doorLocked: Boolean(ms?.door_locked ?? k.door_locked),
        waterLevelPercent: ms?.water_level_pct ?? k.water_level_pct ?? 100,
        soapLevelPercent: ms?.soap_level_pct ?? k.soap_level_pct ?? 100,
        currentOrderId: ms?.current_order_id ?? k.current_order_id,
        currentActivity: ms?.current_activity || k.current_activity || 'Idle',
        lastHeartbeat: hb,
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

      await db.query(
        `INSERT INTO machine_status (kiosk_id, status, door_locked, water_level_pct, soap_level_pct, current_order_id, current_activity, error_code, last_heartbeat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           door_locked = VALUES(door_locked),
           water_level_pct = VALUES(water_level_pct),
           soap_level_pct = VALUES(soap_level_pct),
           current_order_id = VALUES(current_order_id),
           current_activity = VALUES(current_activity),
           error_code = VALUES(error_code),
           last_heartbeat = NOW()`,
        [kioskId, status, doorLocked, waterLevelPercent, soapLevelPercent, currentOrderId, currentActivity, errorCode]
      );

      // Log event
      if (errorCode || waterLevelPercent < 20 || soapLevelPercent < 20) {
        await db.query(
          'INSERT INTO machine_logs (kiosk_id, event_type, details) VALUES (?, ?, ?)',
          [kioskId, errorCode ? 'error' : 'refill_needed', JSON.stringify(req.body)]
        );
      }
    } else {
      const nowIso = new Date().toISOString();
      const k = memoryStore.kiosks.find((item) => item.id === kioskId);
      if (k) {
        k.status = status;
        k.door_locked = doorLocked ? 1 : 0;
        k.water_level_pct = waterLevelPercent;
        k.soap_level_pct = soapLevelPercent;
        k.current_order_id = currentOrderId;
        k.current_activity = currentActivity;
        k.last_heartbeat = nowIso;
        k.updated_at = nowIso;
      }

      const ms = memoryStore.machine_status.find((m) => m.kiosk_id === kioskId);
      if (ms) {
        ms.status = status;
        ms.door_locked = doorLocked ? 1 : 0;
        ms.water_level_pct = waterLevelPercent;
        ms.soap_level_pct = soapLevelPercent;
        ms.current_order_id = currentOrderId;
        ms.current_activity = currentActivity;
        ms.error_code = errorCode;
        ms.last_heartbeat = nowIso;
        ms.updated_at = nowIso;
      } else if (k) {
        memoryStore.machine_status.push({
          kiosk_id: kioskId,
          status,
          door_locked: doorLocked ? 1 : 0,
          water_level_pct: waterLevelPercent,
          soap_level_pct: soapLevelPercent,
          current_order_id: currentOrderId,
          current_activity: currentActivity,
          error_code: errorCode,
          last_heartbeat: nowIso,
          updated_at: nowIso,
        });
      }
      saveMemoryStore();
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

    // Real-time broadcast to connected apps
    broadcastMachineStatus(payload);

    // Consumable refill alerts
    if (waterLevelPercent <= 15) {
      sendPushNotification(
        '⚠️ Low Water Warning',
        `Kiosk ${kioskId} clean water reservoir is at ${waterLevelPercent}%!`,
        { kioskId, waterLevelPercent }
      );
    }
    if (soapLevelPercent <= 15) {
      sendPushNotification(
        '⚠️ Low Detergent Warning',
        `Kiosk ${kioskId} detergent soap is at ${soapLevelPercent}%!`,
        { kioskId, soapLevelPercent }
      );
    }
    if (errorCode) {
      broadcastAlert({
        type: 'error',
        message: `Hardware Error [${errorCode}] on ${kioskId}`,
        time: new Date().toISOString(),
      });
      sendPushNotification(
        '🚨 Machine Error Detected',
        `Hardware Error Code: ${errorCode} on Kiosk ${kioskId}`,
        { kioskId, errorCode }
      );
    }

    res.json({ success: true, message: 'Heartbeat recorded', kiosk: payload });
  } catch (err) {
    console.error('[Machine] Error recording heartbeat:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
