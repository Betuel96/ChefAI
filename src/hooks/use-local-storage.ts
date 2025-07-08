'use client';

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize state with the initialValue.
  // This ensures the server and the initial client render match, preventing a hydration error.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // This effect will run only on the client, after the component has mounted.
  // It safely reads the value from localStorage and updates the state.
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      // If a value exists in localStorage, parse it and update the state.
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
    }
  }, [key]);

  // A wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function (like in the standard useState API).
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state.
      setStoredValue(valueToStore);
      // Save to local storage.
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  return [storedValue, setValue];
}
