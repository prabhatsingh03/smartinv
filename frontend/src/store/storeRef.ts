import type { store as storeType } from './index';
import type { ConfigureStoreOptions } from '@reduxjs/toolkit';

// Lightweight indirection to avoid circular import when non-React modules need the store
let _store: any | null = null;

export function setAppStore(s: any) {
  _store = s;
}

export function getAppStore() {
  return _store;
}


