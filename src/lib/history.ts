import { HistoryItem } from '@/types';

const HISTORY_KEY = 'promptforge_history';
const MAX_HISTORY_ITEMS = 50;

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToHistory(item: HistoryItem): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getHistory();
    // Add to beginning
    history.unshift(item);
    // Keep only the most recent items
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

export function updateHistoryItem(id: string, updates: Partial<HistoryItem>): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getHistory();
    const index = history.findIndex(item => item.id === id);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to update history:', error);
  }
}

export function removeFromHistory(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from history:', error);
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}
