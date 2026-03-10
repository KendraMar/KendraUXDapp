import { useState, useCallback, useEffect } from 'react';

export const useUndoRedo = (initialData) => {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize history when initialData becomes available
  useEffect(() => {
    if (initialData && history.length === 0) {
      setHistory([JSON.stringify(initialData)]);
      setHistoryIndex(0);
    }
  }, [initialData, history.length]);

  // Save to history for undo/redo
  const saveToHistory = useCallback((newData) => {
    const newState = JSON.stringify(newData);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    // Limit history size
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    return true; // Indicates changes were made
  }, [history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return JSON.parse(history[newIndex]);
    }
    return null;
  }, [historyIndex, history]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return JSON.parse(history[newIndex]);
    }
    return null;
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    history,
    historyIndex,
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  };
};
