import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  version: number = 1
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const versionedKey = `${key}_v${version}`;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(versionedKey);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${versionedKey}":`, error);
      return defaultValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(versionedKey, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${versionedKey}":`, error);
    }
  }, [versionedKey, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(versionedKey);
      setStoredValue(defaultValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${versionedKey}":`, error);
    }
  }, [versionedKey, defaultValue]);

  // Cleanup old versions
  useEffect(() => {
    for (let i = 1; i < version; i++) {
      const oldKey = `${key}_v${i}`;
      window.localStorage.removeItem(oldKey);
    }
  }, [key, version]);

  return [storedValue, setValue, removeValue];
}