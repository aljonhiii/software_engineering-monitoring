/**
 * Service definitions, shoe categories, and pricing.
 * Central configuration — single source of truth for all customer offerings.
 */

import { CleaningService, ServiceAddon, ShoeCategory, ShoeCategoryId } from '../types';

export const SHOE_CATEGORIES: ShoeCategory[] = [
  {
    id: 'leather',
    name: 'Leather Shoes',
    description:
      'Formal dress shoes, leather boots, loafers, and smooth or grained genuine leather footwear.',
    badge: 'Conditioning Care',
    icon: 'shield-checkmark',
    materialCareNote:
      'Low-moisture conditioning foam with soft buffing to preserve natural leather oils and shine.',
  },
  {
    id: 'other',
    name: 'Other Shoes',
    description:
      'All non-leather footwear: school shoes, sneakers, sports & running shoes, canvas, casual, and other compatible footwear.',
    badge: 'All Non-Leather',
    icon: 'footsteps',
    materialCareNote:
      'Adaptive multi-material wash cycle with gentle foam, sole scrub, and warm air drying.',
  },
];

export const CLEANING_SERVICES: CleaningService[] = [
  {
    id: 'sanitation',
    name: 'Sanitation',
    description: 'Quickly cleans light dirt and dust from your shoes.',
    price: 30,
    durationMinutes: 3,
    features: [
      'Cleans surface dirt and dust',
      'Wipes outer sole edges',
      'Lightly refreshes the inside',
    ],
    icon: 'none',
  },
  {
    id: 'disinfection',
    name: 'Disinfection',
    description: 'Kills germs, bacteria, and fungi inside and out.',
    price: 50,
    durationMinutes: 5,
    features: [
      'Kills bacteria and germs',
      'Treats inside lining and insoles',
      'Helps prevent foot fungus',
    ],
    icon: 'none',
  },
  {
    id: 'deodorize',
    name: 'Deodorize',
    description: 'Removes bad smells and sweat odor from your shoes.',
    price: 40,
    durationMinutes: 4,
    features: [
      'Removes trapped sweat and odor',
      'Leaves a clean, fresh scent',
      'Airs out the inside of the shoe',
    ],
    icon: 'none',
  },
];

export const SERVICE_ADDONS: ServiceAddon[] = [
  {
    id: 'uv-bacterial',
    name: 'UV Light Bacterial Removal',
    description: 'Uses UV light to kill remaining bacteria inside your shoes.',
    price: 25,
    icon: 'none',
  },
  {
    id: 'dryer',
    name: 'Dryer',
    description: 'Dries damp or sweaty shoes with warm air.',
    price: 20,
    icon: 'none',
  },
];

/** Currency symbol used throughout the app */
export const CURRENCY_SYMBOL = '₱';

/** Calculate total price for a service + addons */
export function calculateTotal(
  service: CleaningService | null,
  addons: ServiceAddon[]
): number {
  const servicePrice = service?.price ?? 0;
  const addonsPrice = addons.reduce((sum, addon) => sum + addon.price, 0);
  return servicePrice + addonsPrice;
}

/** Get recommended services or customized notes based on shoe category */
export function getCategoryCareHint(categoryId?: ShoeCategoryId): string {
  switch (categoryId) {
    case 'leather':
      return 'Leather Mode: Uses gentle conditioning foam and soft brush rotations.';
    case 'other':
    default:
      return 'Non-Leather Mode: Balanced multi-material cleaning and warm air drying for school, sports, canvas, and casual shoes.';
  }
}
