// Lightweight indirection to avoid circular import when non-React modules need the store
let _store = null;
export function setAppStore(s) {
    _store = s;
}
export function getAppStore() {
    return _store;
}
