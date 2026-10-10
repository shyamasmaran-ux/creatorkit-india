import React, { useState } from 'react';
import { Hash, Copy, Check, Sparkles, RefreshCw, AlertCircle, Bookmark, Layers, TrendingUp, Star, Share2, Download } from 'lucide-react';
import { generateHashtags } from '../../data/templates';
import { HashtagGroup } from '../../types';
import { addHistoryItem, isItemSaved, toggleSavedItem } from '../../services/storageService';
import { copyTextToClipboard, downloadTextAsFile, getWhatsAppShareUrl } from '../../utils/exportUtils';

interface Props {
  onShowToast: (msg: string) => void;
}

const POPULAR_NICHES = [
  'Tech & AI',
  'Stock Market & Finance',
  'Street Food & Recipes',
  'Gym & Fitness',
  'UPSC & Study Motivation',
  'D2C & Small Business',
  'Travel India',
  'Fashion & Styling',
  'Gaming & Esports',
  'Daily Vlog'
];

export const HashtagGenerator: React.FC<Props> = ({ onShowToast }) => {
  const [topic, setTopic] = useState('');
  const [groups, setGroups] = useState<HashtagGroup[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setStorageTick] = useState(0);

  const handleGenerate = (customTopic?: string) => {
    const target = (customTopic || topic).trim();
    if (!target) {
      setError('Please enter a niche or keyword (e.g. food, fitness, tech, study).');
      return;
    }

    setError(null);
    const res = generateHashtags(target);
    setGroups(res.groups);
    setAllTags(res.allTagsList);
    // Pre-select all
    setSelectedTags(new Set(res.allTagsList));
    setIsGenerating(false);
    if (res.allTagsList.length > 0) {
      addHistoryItem({
        toolId: 'hashtag-generator',
        toolName: 'Hashtag Generator',
        title: `${target} (${res.totalCount} Hashtags)`,
        content: res.allTagsList.join(' '),
      });
    }
    onShowToast(`Found ${res.totalCount} curated creator hashtags!`);
  };

  const handleCopyText = async (text: string, id: string, label = 'Hashtags') => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedGroup(id);
      onShowToast(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedGroup(null), 2000);
    }
  };

  const handleToggleFavorite = () => {
    const text = Array.from(selectedTags).join(' ');
    if (!text) return;
    const res = toggleSavedItem({
      toolId: 'hashtag-generator',
      toolName: 'Hashtag Generator',
      title: `${topic || 'Hashtags'} (${selectedTags.size} tags)`,
      content: text,
    });
    setStorageTick((t) => t + 1);
    onShowToast(res.saved ? 'Hashtag set saved to Favorites!' : 'Removed from Favorites');
  };

  const handleCopyTopN = (count: number) => {
    if (allTags.length === 0) return;
    const subset = allTags.slice(0, count).join(' ');
    handleCopyText(subset, `top-${count}`, `Top ${count} hashtags`);
  };

  const toggleTag = (tag: string) => {
    const updated = new Set(selectedTags);
    if (updated.has(tag)) {
      updated.delete(tag);
    } else {
      updated.add(tag);
    }
    setSelectedTags(updated);
  };

  const handleCopySelected = () => {
    if (selectedTags.size === 0) {
      onShowToast('No hashtags selected.');
      return;
    }
    const text = Array.from(selectedTags).join(' ');
    handleCopyText(text, 'selected', `${selectedTags.size} selected hashtags`);
  };

  const handleClear = () => {
    setTopic('');
    setGroups([]);
    setAllTags([]);
    setSelectedTags(new Set());
    setError(null);
    onShowToast('Hashtags cleared.');
  };

  const handleNicheClick = (niche: string) => {
    setTopic(niche);
    setError(null);
    handleGenerate(niche);
  };

  return (
    <div className="space-y-6">
      {/* Header and input card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Hashtag Generator for India</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Discover categorized high-reach & targeted community tags for Reels, Shorts, and Instagram.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="hashtag-query" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Enter Topic or Niche <span className="text-blue-600 dark:text-blue-400">*</span>
            </label>
            <input
              id="hashtag-query"
              type="text"
              placeholder="e.g. Fitness, Street Food, Stock Market, UPSC, Handmade jewelry"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm md:text-base transition-all"
            />
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Popular Indian Creator Niches:</span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_NICHES.map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => handleNicheClick(niche)}
                  className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-700 dark:hover:text-blue-300 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  #{niche}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer min-h-[48px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Finding Hashtags...' : 'Generate Hashtags'}</span>
            </button>

            {(topic || allTags.length > 0) && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer min-h-[48px]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hashtag Results Display */}
      {allTags.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in duration-300">
          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Suggested Hashtags ({allTags.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any tag to toggle selection, or use the 1-click batch copy buttons.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`text-xs font-semibold px-3 py-2 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isItemSaved('hashtag-generator', Array.from(selectedTags).join(' '))
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:text-amber-500'
                }`}
              >
                <Star className={`w-3 h-3 ${isItemSaved('hashtag-generator', Array.from(selectedTags).join(' ')) ? 'fill-amber-400 text-amber-500' : ''}`} />
                <span>{isItemSaved('hashtag-generator', Array.from(selectedTags).join(' ')) ? 'Saved' : 'Save Set'}</span>
              </button>
              <a
                href={getWhatsAppShareUrl(Array.from(selectedTags).join(' '))}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
              >
                <Share2 className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  downloadTextAsFile(Array.from(selectedTags).join(' '), `hashtags-${topic || 'export'}.txt`);
                  onShowToast('Downloaded hashtags as .txt!');
                }}
                className="text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>.TXT</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyTopN(15)}
                className="text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-700 dark:hover:text-blue-300 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Top 15 (Reels Best)</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyTopN(30)}
                className="text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-700 dark:hover:text-blue-300 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Top 30</span>
              </button>
              <button
                type="button"
                onClick={handleCopySelected}
                className="text-xs font-semibold px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Bookmark className="w-3 h-3" />
                <span>Copy Selected ({selectedTags.size})</span>
              </button>
            </div>
          </div>

          {/* Grouped Tiers */}
          <div className="space-y-6">
            {groups.map((group, gIdx) => {
              const groupText = group.tags.join(' ');
              const isCopied = copiedGroup === `group-${gIdx}`;

              return (
                <div key={group.category} className="p-4 md:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                        {group.category}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                        {group.reachLevel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyText(groupText, `group-${gIdx}`, group.category)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-900 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied Tier' : 'Copy This Set'}</span>
                    </button>
                  </div>

                  {/* Individual Tags */}
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag) => {
                      const isSelected = selectedTags.has(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-400 border border-slate-200 dark:border-slate-700 line-through opacity-60'
                          }`}
                          title="Click to toggle selection"
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strategy Tip */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/70 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Hashtag Ladder Strategy for Indian Accounts:</p>
              <p>
                Use a balanced mix of 3-5 High Volume tags (for broad categorization), 5-8 Medium Niche tags (where you can realistically rank in Top Posts), and 3-5 Community tags. This helps Instagram's AI identify your target Indian audience faster.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
