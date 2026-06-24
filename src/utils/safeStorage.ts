const getSafeStorage = (): Storage => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const testKey = "__mabala_storage_test__";
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch (e) {
    console.warn("[Mabala Sandbox] Native localStorage is blocked, using fallback memory storage:", e);
  }

  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store.hasOwnProperty(key) ? store[key] : null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => {
      for (const k in store) {
        delete store[k];
      }
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; }
  } as Storage;
};

export const safeLocalStorage = getSafeStorage();
