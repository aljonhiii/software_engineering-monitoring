export type UserRole = 'superadmin' | 'buyer' | 'owner' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string | null;
  companyName?: string | null;
  role: UserRole;
  accountStatus?: string;
  assignedKioskIds?: string[] | null;
  onboardingCompleted?: boolean;
  createdAt?: string;
}

export interface ServiceAddon {
  id?: string;
  name: string;
  price: number;
}

export type PaymentMethodType = 'cash' | 'gcash' | 'maya';
export type PaymentStatusType = 'pending' | 'paid' | 'failed' | 'refunded';
export type CleaningStatusType = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  orderId: string;
  kioskId: string;
  kioskName?: string;
  kioskLocation?: string;
  shoeType: string;
  serviceTier: string;
  serviceName: string;
  addons: ServiceAddon[];
  basePrice: number;
  addonsPrice: number;
  totalAmount: number;
  paymentMethod: PaymentMethodType | string;
  paymentStatus: PaymentStatusType;
  paymentRef?: string | null;
  cleaningStatus: CleaningStatusType;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayTransactionsCount: number;
  todayPaidCount: number;
  allTimeRevenue: number;
  totalTransactionsCount: number;
  successfulPaymentsCount: number;
  pendingPaymentsCount: number;
  failedPaymentsCount: number;
  completedCleansCount: number;
  activeCleansCount: number;
  assignedKiosksCount?: number;
  primaryKioskId?: string | null;
  primaryKioskName?: string;
  machineStatus: 'online' | 'offline' | 'busy' | 'error' | 'maintenance';
  machineActivity: string;
  doorLocked: boolean;
  waterLevelPercent: number;
  soapLevelPercent: number;
  lastHeartbeat?: string | null;
  recentTransactions: Array<{
    id: string;
    orderId: string;
    kioskId?: string;
    shoeType: string;
    serviceName: string;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    cleaningStatus: string;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    time: string;
    kioskName?: string;
  }>;
}

export interface KioskMachine {
  id: string;
  name: string;
  address?: string;
  city?: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  operatingHours?: string;
  status: 'online' | 'offline' | 'busy' | 'error' | 'maintenance';
  doorLocked: boolean;
  waterLevelPercent: number;
  soapLevelPercent: number;
  currentOrderId?: string | null;
  currentActivity: string;
  lastHeartbeat?: string | null;
}

export interface KioskLocationRegistrationPayload {
  kioskId?: string;
  latitude: number;
  longitude: number;
  address: string;
  barangay?: string;
  city?: string;
  locationName?: string;
}

export interface PaymentsLedgerSummary {
  totalCollected: number;
  successfulCount: number;
  pendingCount: number;
  failedCount: number;
  methodsSummary: {
    cash: { count: number; amount: number };
    gcash: { count: number; amount: number };
    maya: { count: number; amount: number };
  };
}

export interface SalesReport {
  period: 'day' | 'week' | 'month';
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  chart: {
    labels: string[];
    datasets: Array<{ data: number[] }>;
  };
  breakdowns: {
    byShoeType: Record<string, number>;
    byService: Record<string, number>;
  };
}
