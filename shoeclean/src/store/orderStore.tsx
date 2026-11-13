/**
 * Order state management using React Context + useReducer.
 * Manages the entire customer flow state from shoe selection to completion.
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  ShoeCategory,
  CleaningService,
  ServiceAddon,
  PaymentMethod,
  PaymentStatus,
  MachineStatus,
} from '../types';
import { calculateTotal } from '../constants';
import { generateId } from '../utils';
import { getIdleStatus } from '../services';

// ─── State ──────────────────────────────────────────────────────────

interface OrderState {
  orderId: string;
  selectedShoeCategory: ShoeCategory | null;
  selectedService: CleaningService | null;
  selectedAddons: ServiceAddon[];
  totalPrice: number;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  transactionId: string | null;
  machineStatus: MachineStatus;
  isCleaningComplete: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orderId: generateId(),
  selectedShoeCategory: null,
  selectedService: null,
  selectedAddons: [],
  totalPrice: 0,
  paymentMethod: null,
  paymentStatus: 'pending',
  transactionId: null,
  machineStatus: getIdleStatus(),
  isCleaningComplete: false,
  error: null,
};

// ─── Actions ────────────────────────────────────────────────────────

type OrderAction =
  | { type: 'SELECT_SHOE_CATEGORY'; category: ShoeCategory }
  | { type: 'SELECT_SERVICE'; service: CleaningService }
  | { type: 'TOGGLE_ADDON'; addon: ServiceAddon }
  | { type: 'SET_PAYMENT_METHOD'; method: PaymentMethod }
  | { type: 'SET_PAYMENT_STATUS'; status: PaymentStatus; transactionId?: string }
  | { type: 'UPDATE_MACHINE_STATUS'; status: MachineStatus }
  | { type: 'SET_CLEANING_COMPLETE' }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_SESSION' };

// ─── Reducer ────────────────────────────────────────────────────────

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SELECT_SHOE_CATEGORY':
      return {
        ...state,
        selectedShoeCategory: action.category,
        error: null,
      };

    case 'SELECT_SERVICE': {
      const totalPrice = calculateTotal(action.service, state.selectedAddons);
      return { ...state, selectedService: action.service, totalPrice, error: null };
    }

    case 'TOGGLE_ADDON': {
      const exists = state.selectedAddons.some((a) => a.id === action.addon.id);
      const selectedAddons = exists
        ? state.selectedAddons.filter((a) => a.id !== action.addon.id)
        : [...state.selectedAddons, action.addon];
      const totalPrice = calculateTotal(state.selectedService, selectedAddons);
      return { ...state, selectedAddons, totalPrice };
    }

    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.method };

    case 'SET_PAYMENT_STATUS':
      return {
        ...state,
        paymentStatus: action.status,
        transactionId: action.transactionId ?? state.transactionId,
        error: action.status === 'failed' ? 'Payment failed. Please try again.' : null,
      };

    case 'UPDATE_MACHINE_STATUS':
      return { ...state, machineStatus: action.status };

    case 'SET_CLEANING_COMPLETE':
      return { ...state, isCleaningComplete: true };

    case 'SET_ERROR':
      return { ...state, error: action.message };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'RESET_SESSION':
      return { ...initialState, orderId: generateId() };

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────

interface OrderContextValue {
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
}

const OrderContext = createContext<OrderContextValue | null>(null);

/** Provider component — wrap the app with this */
export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  return (
    <OrderContext.Provider value={{ state, dispatch }}>
      {children}
    </OrderContext.Provider>
  );
}

/** Hook to access order state and dispatch */
export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
