import { PageTab, SavedCreatorItem } from '../types';

const SAVED_KEY = 'creatorkit-saved-items';
const HISTORY_KEY = 'creatorkit-history-items';
const MAX_SAVED_ITEMS = 100;
const MAX_HISTORY_ITEMS = 40;

export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__ck_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function notifyStorageChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('creatorkit-storage-updated'));
  }
}

export function getSavedFavorites(): SavedCreatorItem[] {
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getHistoryItems(): SavedCreatorItem[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isContentFavorited(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  const saved = getSavedFavorites();
  return saved.some((item) => item.content.trim() === trimmed);
}

export function toggleFavoriteItem(params: {
  toolId: PageTab;
  toolName: string;
  title: string;
  content: string;
}): { saved: boolean; storageAvailable: boolean } {
  if (!isLocalStorageAvailable()) {
    return { saved: false, storageAvailable: false };
  }

  const cleanContent = params.content.trim();
  if (!cleanContent) {
    return { saved: false, storageAvailable: true };
  }

  try {
    const current = getSavedFavorites();
    const existingIndex = current.findIndex((i) => i.content.trim() === cleanContent);

    if (existingIndex >= 0) {
      current.splice(existingIndex, 1);
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(current));
      notifyStorageChanged();
      return { saved: false, storageAvailable: true };
    }

    const newItem: SavedCreatorItem = {
      id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      toolId: params.toolId,
      toolName: params.toolName,
      title: params.title.trim() || params.toolName,
      content: cleanContent,
      createdAt: Date.now(),
      isFavorite: true,
    };

    const updated = [newItem, ...current].slice(0, MAX_SAVED_ITEMS);
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    notifyStorageChanged();
    return { saved: true, storageAvailable: true };
  } catch {
    return { saved: false, storageAvailable: false };
  }
}

export function addHistoryItem(params: {
  toolId: PageTab;
  toolName: string;
  title: string;
  content: string;
}): void {
  if (!isLocalStorageAvailable()) return;
  const cleanContent = params.content.trim();
  if (!cleanContent) return;

  try {
    const current = getHistoryItems().filter((i) => i.content.trim() !== cleanContent);
    const newItem: SavedCreatorItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      toolId: params.toolId,
      toolName: params.toolName,
      title: params.title.trim() || params.toolName,
      content: cleanContent,
      createdAt: Date.now(),
      isFavorite: false,
    };

    const updated = [newItem, ...current].slice(0, MAX_HISTORY_ITEMS);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    notifyStorageChanged();
  } catch {
    // Ignore storage quota errors silently for background history
  }
}

export function removeSavedItem(id: string, fromFavorites: boolean): void {
  try {
    const key = fromFavorites ? SAVED_KEY : HISTORY_KEY;
    const current = fromFavorites ? getSavedFavorites() : getHistoryItems();
    const updated = current.filter((item) => item.id !== id);
    window.localStorage.setItem(key, JSON.stringify(updated));
    notifyStorageChanged();
  } catch {
    // Ignore errors
  }
}

export function clearStorageList(favorites: boolean): void {
  try {
    window.localStorage.removeItem(favorites ? SAVED_KEY : HISTORY_KEY);
    notifyStorageChanged();
  } catch {
    // Ignore errors
  }
}

export const getSavedItems = getSavedFavorites;

export function isItemSaved(_toolId: PageTab, content: string): boolean {
  return isContentFavorited(content);
}

export const toggleSavedItem = toggleFavoriteItem;
