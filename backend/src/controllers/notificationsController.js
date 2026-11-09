import { getDbConnection, memoryStore } from '../config/db.js';

export async function registerPushToken(req, res) {
  try {
    const userId = req.user.id;
    const { expoPushToken, deviceName } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({ success: false, message: 'expoPushToken is required' });
    }

    const db = await getDbConnection();

    if (db) {
      await db.query(
        `INSERT INTO notification_tokens (user_id, expo_push_token, device_name)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE device_name = VALUES(device_name)`,
        [userId, expoPushToken, deviceName || 'Android Device']
      );
    } else {
      const idx = memoryStore.tokens.findIndex((t) => t.expo_push_token === expoPushToken);
      if (idx >= 0) {
        memoryStore.tokens[idx] = { user_id: userId, expo_push_token: expoPushToken, device_name: deviceName };
      } else {
        memoryStore.tokens.push({ user_id: userId, expo_push_token: expoPushToken, device_name: deviceName });
      }
    }

    console.log(`📱 [Notifications] Device token registered for user ${req.user.username}`);
    res.json({ success: true, message: 'Push token successfully registered' });
  } catch (err) {
    console.error('[Notifications] Error registering push token:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
