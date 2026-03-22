/*
 * 🔧 STL Platform - Module Middleware
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

import { MODULES, type ModuleName } from './modules';

/**
 * Get list of enabled modules
 */
export function getEnabledModules(): ModuleName[] {
  return Object.entries(MODULES)
    .filter(([_, config]) => config.enabled)
    .map(([name]) => name as ModuleName);
}

/**
 * Check if a module is enabled
 */
export function isModuleEnabled(moduleName: ModuleName): boolean {
  return MODULES[moduleName]?.enabled ?? false;
}
