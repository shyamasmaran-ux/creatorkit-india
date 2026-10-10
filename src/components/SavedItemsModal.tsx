import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Clock,
  Copy,
  Check,
  Trash2,
  Download,
  Share2,
  ArrowRight,
  Bookmark,
} from 'lucide-react';
import { PageTab, SavedCreatorItem } from '../types';
import {
  getSavedFavorites,
  getHistoryItems,
  removeSavedItem,
  clearStorageList,
  isLocalStorageAvailable,
} from '../services/storageService';
import {
  copyTextToClipboard,
  downloadTextAsFile,
  getWhatsAppShareUrl,
} from '../utils/exportUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: PageTab) => void;
  onShowToast: (msg: string) => void;
}

export const SavedItemsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigate,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'favorites' | 'history'>('favorites');
  const [favorites, setFavorites] = useState<SavedCreatorItem[]>([]);
  const [history, setHistory] = useState<SavedCreatorItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const storageSupported = isLocalStorageAvailable();

  const refreshLists = () => {
    setFavorites(getSavedFavorites());
    setHistory(getHistoryItems());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLists();
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = () => refreshLists();
    window.addEventListener('creatorkit-storage-updated', handler);
    return () => window.removeEventListener('creatorkit-storage-updated', handler);
  }, []);

  if (!isOpen) return null;

  const activeItems = activeSubTab === 'favorites' ? favorites : history;

  const handleCopy = async (item: SavedCreatorItem) => {
    const ok = await copyTextToClipboard(item.content);
    if (ok) {
      setCopiedId(item.id);
      onShowToast('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      onShowToast('Unable to copy automatically.');
    }
  };

  const handleDownloadTxt = (item: SavedCreatorItem) => {
    const ok = downloadTextAsFile(item.content, `${item.toolId}-${item.title}`);
    if (ok) {
      onShowToast('Downloaded as .txt file!');
    }
  };

  const handleRemove = (id: string) => {
    removeSavedItem(id, activeSubTab === 'favorites');
    refreshLists();
    onShowToast('Item removed.');
  };

  const handleClearAll = () => {
    clearStorageList(activeSubTab === 'favorites');
    refreshLists();
    onShowToast(
      activeSubTab === 'favorites'
        ? 'Cleared all saved favorites.'
        : 'Cleared recent generation history.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Saved Favorites &amp; Recent History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stored locally in your browser on this device
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close saved items modal"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('favorites')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'favorites'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Saved Favorites ({favorites.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Recent History ({history.length})</span>
            </button>
          </div>

          {activeItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!storageSupported && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
              Browser localStorage is blocked or unavailable in your current privacy mode, so items cannot be saved across reloads.
            </div>
          )}

          {activeItems.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                {activeSubTab === 'favorites' ? (
                  <Star className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {activeSubTab === 'favorites'
                  ? 'No saved favorites yet'
                  : 'No recent generation history yet'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {activeSubTab === 'favorites'
                  ? 'Tap the Star / Save button on any generated title, caption, script, bio, or description to keep it here.'
                  : 'When you generate titles, captions, scripts, or descriptions, your recent outputs will appear here automatically.'}
              </p>
            </div>
          ) : (
            activeItems.map((item) => {
              const isCopied = copiedId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate(item.toolId);
                            onClose();
                          }}
                          className="font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{item.toolName}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <span>·</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {item.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      title="Remove item"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line break-words bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 max-h-40 overflow-y-auto leading-relaxed">
                    {item.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <a
                      href={getWhatsAppShareUrl(item.content)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDownloadTxt(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.TXT</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
