/**
 * Cleaning service and shoe category type definitions.
 * Central source of truth for all service-related data structures.
 */

/** Available shoe categories */
export type ShoeCategoryId = 'leather' | 'other';

/** A shoe category definition */
export interface ShoeCategory {
  id: ShoeCategoryId;
  name: string;
  description: string;
  badge: string;
  icon: string;
  materialCareNote: string;
}

/** Available cleaning service tiers */
export type ServiceTier = 'sanitation' | 'disinfection' | 'deodorize';

/** A cleaning service option */
export interface CleaningService {
  id: ServiceTier;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  features: string[];
  icon: string;
  suitableCategories?: ShoeCategoryId[];
  careNote?: string;
}

/** An optional add-on to a cleaning service */
export interface ServiceAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}
