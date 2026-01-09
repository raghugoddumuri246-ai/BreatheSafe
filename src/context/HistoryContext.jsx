import { createContext, useContext, useState, useEffect } from 'react';

// Create the HistoryContext
const HistoryContext = createContext();

// Custom hook to consume the HistoryContext
export const useHistory = () => {
  const context = useContext(HistoryContext);
  // Throw an error if the hook is used outside of a HistoryProvider
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};

// HistoryProvider component to wrap the application and provide history state
export const HistoryProvider = ({ children }) => {
  // Initialize history state by attempting to load from localStorage.
  // If parsing fails or no data exists, it defaults to an empty array.
  const [history, setHistory] = useState(() => {
    try {
      const storedHistory = localStorage.getItem('aqiHistory');
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      // Log an error if localStorage parsing fails, but don't break the app.
      console.error("Failed to parse history from local storage, starting with an empty history:", error);
      return [];
    }
  });

  // useEffect hook to persist the history state to localStorage
  // whenever the 'history' state array changes.
  useEffect(() => {
    try {
      localStorage.setItem('aqiHistory', JSON.stringify(history));
    } catch (error) {
      // Log an error if saving to localStorage fails.
      console.error("Failed to save history to local storage:", error);
    }
  }, [history]); // Dependency array: this effect runs whenever 'history' state changes

  /**
   * Adds a new entry to the history.
   * Each successful call will add a new record, identified by a unique ID.
   * @param {object} entry - The history entry to add.
   * @param {string} entry.city - The city name.
   * @param {number} entry.aqi - The AQI value.
   * @param {string} entry.status - The AQI status (e.g., "Good", "Moderate").
   * @param {string} [entry.date] - Optional date string (YYYY-MM-DD). Defaults to current date.
   * @param {number} [entry.id] - Optional unique ID. Defaults to Date.now().
   */
  const addHistoryEntry = (entry) => {
    setHistory(prevHistory => {
      // Construct the new entry, ensuring it has a unique ID and a date.
      // Date.now() provides a unique timestamp for each call, making each entry distinct.
      const newEntryWithId = {
        id: entry.id || Date.now(), // Use existing ID or generate a new unique one
        date: entry.date || new Date().toISOString().split('T')[0], // Ensure date is present (YYYY-MM-DD)
        city: entry.city,
        aqi: entry.aqi,
        status: entry.status
      };

      // Removed the 'city' and 'date' based duplicate check.
      // Now, every call to addHistoryEntry with a new ID will add a record.
      // This allows multiple searches for the same city on the same day to be recorded.

      // Add the new entry to the beginning of the history array
      // (using spread operator for immutability) and return the new state.
      return [newEntryWithId, ...prevHistory];
    });
  };

  /**
   * Deletes a history entry by its unique ID.
   * @param {number} id - The unique ID of the history entry to delete.
   */
  const deleteHistoryEntry = (id) => {
    setHistory(prev => prev.filter(record => record.id !== id));
  };

  // Provide the history state and functions to its children components
  return (
    <HistoryContext.Provider value={{ history, addHistoryEntry, deleteHistoryEntry }}>
      {children}
    </HistoryContext.Provider>
  );
};
