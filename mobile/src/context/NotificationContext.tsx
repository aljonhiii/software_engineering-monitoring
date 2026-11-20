import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useSocket } from './SocketContext';
import { NotificationItem, NotificationsModal } from '../components/common/NotificationsModal';

const NOTIFS_STORAGE_KEY = 'kixcleen_notifications_v1';
const PREFS_STORAGE_KEY = 'kixcleen_notif_prefs_v1';

export interface NotificationPrefs {
  notifyOrders: boolean;
  notifyMachineAlerts: boolean;
  notifyRefills: boolean;
}

export interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isNotificationsOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  handleNotificationPress: (item: NotificationItem) => void;
  addNotification: (item: {
    title: string;
    message: string;
    type: 'order' | 'telemetry' | 'system';
  }) => void;
  notifyOrders: boolean;
  setNotifyOrders: (val: boolean) => void;
  notifyMachineAlerts: boolean;
  setNotifyMachineAlerts: (val: boolean) => void;
  notifyRefills: boolean;
  setNotifyRefills: (val: boolean) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-seed-1',
    title: 'Order Paid & Verified',
    message: 'Order #KIX-20261109-1001 paid ₱150.00 via GCASH for Deep Clean.',
    timestamp: '15m ago',
    type: 'order',
    isRead: false,
  },
  {
    id: 'notif-seed-2',
    title: 'Water Tank Check',
    message: 'Kiosk 01 clean water level is at 78%. Operating normally.',
    timestamp: '1h ago',
    type: 'telemetry',
    isRead: false,
  },
  {
    id: 'notif-seed-3',
    title: 'System Online & Synced',
    message: 'ESP32 controller heartbeat verified. Cloud telemetry stream nominal.',
    timestamp: '3h ago',
    type: 'system',
    isRead: true,
  },
];

async function loadFromStorage<T>(key: string): Promise<T | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
      return null;
    }
    const item = await SecureStore.getItemAsync(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

async function saveToStorage<T>(key: string, data: T): Promise<void> {
  try {
    const json = JSON.stringify(data);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, json);
      }
      return;
    }
    await SecureStore.setItemAsync(key, json);
  } catch {
    // Non-blocking storage error
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<NotificationItem[]>(SEED_NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Preference filters
  const [notifyOrders, setNotifyOrdersState] = useState<boolean>(true);
  const [notifyMachineAlerts, setNotifyMachineAlertsState] = useState<boolean>(true);
  const [notifyRefills, setNotifyRefillsState] = useState<boolean>(true);

  // Refs for real-time socket callbacks to avoid re-binding
  const notifyOrdersRef = useRef<boolean>(true);
  const notifyMachineAlertsRef = useRef<boolean>(true);
  const notifyRefillsRef = useRef<boolean>(true);

  // Load persisted preferences and notifications on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const storedNotifs = await loadFromStorage<NotificationItem[]>(NOTIFS_STORAGE_KEY);
      if (isMounted && storedNotifs && Array.isArray(storedNotifs) && storedNotifs.length > 0) {
        setNotifications(storedNotifs);
      }

      const storedPrefs = await loadFromStorage<NotificationPrefs>(PREFS_STORAGE_KEY);
      if (isMounted && storedPrefs) {
        if (typeof storedPrefs.notifyOrders === 'boolean') {
          setNotifyOrdersState(storedPrefs.notifyOrders);
          notifyOrdersRef.current = storedPrefs.notifyOrders;
        }
        if (typeof storedPrefs.notifyMachineAlerts === 'boolean') {
          setNotifyMachineAlertsState(storedPrefs.notifyMachineAlerts);
          notifyMachineAlertsRef.current = storedPrefs.notifyMachineAlerts;
        }
        if (typeof storedPrefs.notifyRefills === 'boolean') {
          setNotifyRefillsState(storedPrefs.notifyRefills);
          notifyRefillsRef.current = storedPrefs.notifyRefills;
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const setNotifyOrders = (val: boolean) => {
    setNotifyOrdersState(val);
    notifyOrdersRef.current = val;
    saveToStorage(PREFS_STORAGE_KEY, {
      notifyOrders: val,
      notifyMachineAlerts: notifyMachineAlertsRef.current,
      notifyRefills: notifyRefillsRef.current,
    });
  };

  const setNotifyMachineAlerts = (val: boolean) => {
    setNotifyMachineAlertsState(val);
    notifyMachineAlertsRef.current = val;
    saveToStorage(PREFS_STORAGE_KEY, {
      notifyOrders: notifyOrdersRef.current,
      notifyMachineAlerts: val,
      notifyRefills: notifyRefillsRef.current,
    });
  };

  const setNotifyRefills = (val: boolean) => {
    setNotifyRefillsState(val);
    notifyRefillsRef.current = val;
    saveToStorage(PREFS_STORAGE_KEY, {
      notifyOrders: notifyOrdersRef.current,
      notifyMachineAlerts: notifyMachineAlertsRef.current,
      notifyRefills: val,
    });
  };

  const openNotifications = useCallback(() => {
    setIsNotificationsOpen(true);
  }, []);

  const closeNotifications = useCallback(() => {
    setIsNotificationsOpen(false);
  }, []);

  const addNotification = useCallback(
    (item: { title: string; message: string; type: 'order' | 'telemetry' | 'system' }) => {
      setNotifications((prev) => {
        // Prevent duplicate spam within recent items
        const isDupe = prev.slice(0, 5).some(
          (n) => n.title === item.title && n.message === item.message
        );
        if (isDupe) return prev;

        const newItem: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: item.title,
          message: item.message,
          type: item.type,
          timestamp: 'Just now',
          isRead: false,
        };

        const updated = [newItem, ...prev.slice(0, 49)];
        saveToStorage(NOTIFS_STORAGE_KEY, updated);
        return updated;
      });
    },
    []
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      saveToStorage(NOTIFS_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveToStorage(NOTIFS_STORAGE_KEY, []);
  }, []);

  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n));
        saveToStorage(NOTIFS_STORAGE_KEY, updated);
        return updated;
      });
      setIsNotificationsOpen(false);

      if (item.type === 'order') {
        router.push('/(tabs)/transactions');
      } else if (item.type === 'telemetry') {
        router.push('/(tabs)/machine');
      } else if (item.type === 'system') {
        router.push('/(tabs)/settings');
      }
    },
    [router]
  );

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewTransaction = (tx: any) => {
      if (!notifyOrdersRef.current) return;
      const orderId = tx.order_id || tx.orderId || 'NEW';
      const amount = tx.total_amount || tx.totalAmount || 0;
      const method = (tx.payment_method || tx.paymentMethod || 'CASH').toUpperCase();
      const kioskName = tx.kiosk_name || tx.kioskName || tx.kiosk_id || tx.kioskId;
      const kioskText = kioskName ? ` at ${kioskName}` : '';

      addNotification({
        title: 'New Verified Order',
        message: `Order #${orderId} paid ₱${amount} via ${method}${kioskText}.`,
        type: 'order',
      });
    };

    const handleTransactionUpdate = (tx: any) => {
      if (!notifyOrdersRef.current) return;
      const orderId = tx.order_id || tx.orderId || 'ORDER';
      const status = (tx.payment_status || tx.paymentStatus || tx.status || 'updated').toUpperCase();
      const kioskName = tx.kiosk_name || tx.kioskName || tx.kiosk_id || tx.kioskId;
      const kioskText = kioskName ? ` • ${kioskName}` : '';

      addNotification({
        title: 'Order Status Updated',
        message: `Order #${orderId} is now ${status}${kioskText}.`,
        type: 'order',
      });
    };

    const handleMachineStatus = (data: any) => {
      const kiosk = data.kiosk || data;
      if (!kiosk) return;
      const name = kiosk.name || kiosk.id || 'Kiosk';
      const water = kiosk.water_level ?? kiosk.waterLevel;
      const soap = kiosk.soap_level ?? kiosk.soapLevel;

      if (notifyRefillsRef.current && typeof water === 'number' && water <= 20) {
        addNotification({
          title: 'Water Tank Low Alert',
          message: `${name} clean water level is at ${water}%. Refill recommended soon.`,
          type: 'telemetry',
        });
      }

      if (notifyRefillsRef.current && typeof soap === 'number' && soap <= 20) {
        addNotification({
          title: 'Soap Level Low Alert',
          message: `${name} detergent level is at ${soap}%. Refill recommended soon.`,
          type: 'telemetry',
        });
      }

      if (
        notifyMachineAlertsRef.current &&
        (kiosk.status === 'error' || kiosk.status === 'offline' || kiosk.status === 'maintenance')
      ) {
        addNotification({
          title: 'Machine Alert',
          message: `${name} status changed to ${kiosk.status.toUpperCase()}.`,
          type: 'telemetry',
        });
      }
    };

    const handleSystemAlert = (alert: any) => {
      if (!notifyMachineAlertsRef.current) return;
      addNotification({
        title: alert.title || 'System Alert',
        message: alert.message || alert.body || 'Alert reported by machine.',
        type: 'system',
      });
    };

    socket.on('transaction:new', handleNewTransaction);
    socket.on('transaction:updated', handleTransactionUpdate);
    socket.on('machine:status', handleMachineStatus);
    socket.on('system:alert', handleSystemAlert);

    return () => {
      socket.off('transaction:new', handleNewTransaction);
      socket.off('transaction:updated', handleTransactionUpdate);
      socket.off('machine:status', handleMachineStatus);
      socket.off('system:alert', handleSystemAlert);
    };
  }, [socket, addNotification]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isNotificationsOpen,
    openNotifications,
    closeNotifications,
    markAllAsRead,
    clearAll,
    handleNotificationPress,
    addNotification,
    notifyOrders,
    setNotifyOrders,
    notifyMachineAlerts,
    setNotifyMachineAlerts,
    notifyRefills,
    setNotifyRefills,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Central Interactive Notifications Modal: Renders smoothly over any active screen */}
      <NotificationsModal
        visible={isNotificationsOpen}
        onClose={closeNotifications}
        notifications={notifications}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearAll}
        onNotificationPress={handleNotificationPress}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
