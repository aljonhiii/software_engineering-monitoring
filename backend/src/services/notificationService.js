import { Expo } from 'expo-server-sdk';
import { getDbConnection, memoryStore } from '../config/db.js';

const expo = new Expo();

export async function sendPushNotification(title, body, data = {}) {
  try {
    let tokens = [];

    const db = await getDbConnection();
    if (db) {
      const [rows] = await db.query('SELECT expo_push_token FROM notification_tokens');
      tokens = rows.map((r) => r.expo_push_token);
    } else {
      tokens = memoryStore.tokens.map((t) => t.expo_push_token);
    }

    if (!tokens || tokens.length === 0) {
      console.log('ℹ️ [Push Notifications] No registered tokens found. Skipping delivery.');
      return;
    }

    // Filter valid tokens
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) return;

    const messages = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('📱 [Push Notifications] Tickets generated:', ticketChunk.length);
      } catch (error) {
        console.error('❌ [Push Notifications] Error sending chunk:', error);
      }
    }
  } catch (err) {
    console.error('❌ [Push Notifications] General notification error:', err.message);
  }
}
