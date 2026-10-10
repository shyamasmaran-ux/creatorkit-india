import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, Sparkles, RefreshCw, AlertCircle, Video, ListFilter, Share2, Star, Download } from 'lucide-react';
import { fetchGeneratedTitles } from '../../services/titleService';
import { GeneratedTitle, TitleStyle } from '../../types';
import { toggleFavoriteItem, isContentFavorited, addHistoryItem } from '../../services/storageService';
import { downloadTextAsFile, getWhatsAppShareUrl } from '../../utils/exportUtils';

interface Props {
  onShowToast: (msg: string) => void;
}

const PRESET_TOPICS = [
  'Stock Market for Beginners',
  'iPhone 16 Long-Term Review',
  'Delhi Street Food Tour',
  'How to Study 10 Hours a Day',
  'Ghar par Banaye Halwai Jaise Samosa'
];

export const YouTubeTitleGenerator: React.FC<Props> = ({ onShowToast }) => {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<TitleStyle>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<'auto' | 'hindi' | 'hinglish' | 'english'>('auto');
  const [titles, setTitles] = useState<GeneratedTitle[]>([]);
  const [isAiResult, setIsAiResult] = useState<boolean>(true);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setStorageTick] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort(new DOMException('Component unmounted', 'AbortError'));
    };
  }, []);

  const handleGenerate = async (customTopic?: string, explicitForceRefresh = false) => {
    if (isGenerating) return; // Prevent duplicate clicks

    const targetTopic = (customTopic || topic).trim();
    if (!targetTopic) {
      setError('Please enter a video topic or select one of the suggested topics below.');
      return;
    }

    if (targetTopic.length < 3) {
      setError('Your topic seems a bit too short. Could you add a few more words to give better context?');
      return;
    }

    const requestKey = `${targetTopic.toLowerCase()}|${keywords.trim().toLowerCase()}|${selectedStyle}|${selectedLanguage}`;
    const shouldForceRefresh = explicitForceRefresh || lastRequestKeyRef.current === requestKey;

    abortControllerRef.current?.abort(new DOMException('Superseded by new request', 'AbortError'));
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);
    setFallbackNotice(null);
    setIsGenerating(true);

    try {
      const result = await fetchGeneratedTitles({
        topic: targetTopic,
        keywords: keywords.trim(),
        style: selectedStyle,
        language: selectedLanguage,
        forceRefresh: shouldForceRefresh,
        signal: controller.signal
      });

      if (controller.signal.aborted) return;

      lastRequestKeyRef.current = requestKey;
      setTitles(result.titles);
      setIsAiResult(result.isAi);
      setFallbackNotice(result.fallbackNotice || null);
      if (result.titles.length > 0) {
        addHistoryItem({
          toolId: 'youtube-title',
          toolName: 'YouTube Title Generator',
          title: `Titles for "${targetTopic}"`,
          content: result.titles.map((t, i) => `${i + 1}. ${t.title}`).join('\n'),
        });
      }
      onShowToast(
        result.isAi
          ? `Generated ${result.titles.length} AI YouTube titles!`
          : `Showing ${result.titles.length} offline template titles (AI busy).`
      );
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setError(err?.message || 'Unable to generate titles right now. Please check your connection and retry.');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsGenerating(false);
      }
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('Title copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleFavorite = (titleText: string, styleLabel: string) => {
    const res = toggleFavoriteItem({
      toolId: 'youtube-title',
      toolName: 'YouTube Title Generator',
      title: `${topic || 'Video Title'} (${styleLabel})`,
      content: titleText,
    });
    setStorageTick((t) => t + 1);
    if (!res.storageAvailable) {
      onShowToast('Browser localStorage is unavailable.');
      return;
    }
    onShowToast(res.saved ? 'Saved title to Favorites!' : 'Removed from Favorites.');
  };

  const handleCopyAll = () => {
    if (titles.length === 0) return;
    const allText = titles.map((t, idx) => `${idx + 1}. ${t.title}`).join('\n\n');
    navigator.clipboard.writeText(allText);
    onShowToast(`Copied all ${titles.length} titles to clipboard!`);
  };

  const handleDownloadTxt = () => {
    if (titles.length === 0) return;
    const allText = titles.map((t, idx) => `${idx + 1}. ${t.title} [${t.style}]`).join('\n\n');
    downloadTextAsFile(allText, `youtube-titles-${topic || 'list'}`);
    onShowToast('Downloaded titles as .txt file!');
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(new DOMException('Reset by user', 'AbortError'));
      abortControllerRef.current = null;
    }
    lastRequestKeyRef.current = null;
    setIsGenerating(false);
    setTopic('');
    setKeywords('');
    setTitles([]);
    setIsAiResult(true);
    setFallbackNotice(null);
    setError(null);
    setSelectedStyle('all');
    setSelectedLanguage('auto');
    onShowToast('Inputs and results cleared.');
  };

  const handlePresetClick = (preset: string) => {
    if (isGenerating) return;
    setTopic(preset);
    setError(null);
    handleGenerate(preset);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">YouTube Title Generator</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Generate 10 relevant, click-worthy video titles based on your actual topic. Supports Hindi, Hinglish, & English.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="yt-topic" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              What is your video about? <span className="text-purple-600 dark:text-purple-400">*</span>
            </label>
            <input
              id="yt-topic"
              type="text"
              disabled={isGenerating}
              placeholder="e.g. Budget travel in Goa, Python full course, Ghar par Banaye Samosa"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm md:text-base transition-all disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="yt-keywords" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Target Keywords <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(Optional)</span>
              </label>
              <input
                id="yt-keywords"
                type="text"
                disabled={isGenerating}
                placeholder="e.g. Beginners, Recipe, Delhi, 2025"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="yt-style" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Target Title Style
              </label>
              <select
                id="yt-style"
                disabled={isGenerating}
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as TitleStyle)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm transition-all disabled:opacity-60"
              >
                <option value="all">⚡ Balanced Variety</option>
                <option value="curiosity">👀 Curiosity & Intrigue</option>
                <option value="educational">🎓 Educational & How-To</option>
                <option value="entertaining">🔥 Vlog & Storytelling</option>
                <option value="listicle">🔢 Tips & Practical Hacks</option>
                <option value="comparison">⚖️ Honest Review & Comparison</option>
              </select>
            </div>

            <div>
              <label htmlFor="yt-lang" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Language
              </label>
              <select
                id="yt-lang"
                disabled={isGenerating}
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm transition-all disabled:opacity-60"
              >
                <option value="auto">🌐 Auto Match Input</option>
                <option value="hinglish">🇮🇳 Hinglish (Desi Hook)</option>
                <option value="hindi">🇮🇳 Hindi (हिन्दी)</option>
                <option value="english">🇬🇧 English</option>
              </select>
            </div>
          </div>

          {/* Quick presets pills */}
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">Try sample topic:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {PRESET_TOPICS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handlePresetClick(preset)}
                  className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {topic.trim().length >= 3 && (
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="shrink-0 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer min-h-[48px]"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isGenerating ? 'Generating Titles...' : 'Generate 10 Titles'}</span>
            </button>

            {(topic || titles.length > 0) && (
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

      {/* Generated Titles Section */}
      {titles.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
          {fallbackNotice && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{fallbackNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => handleGenerate(undefined, true)}
                disabled={isGenerating}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                Retry AI Generation
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Generated Titles ({titles.length})
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isAiResult
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {isAiResult ? '✨ AI Generated' : '📋 Offline Template Fallback'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pick any title below, copy all, or regenerate for fresh variations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerate(undefined, true)}
                disabled={isGenerating}
                className="flex items-center justify-center gap-1.5 bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate Fresh</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.TXT</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {titles.map((item, index) => {
              const isCopied = copiedId === item.id;
              const isFav = isContentFavorited(item.title);
              return (
                <div
                  key={item.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 break-words leading-snug">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                          {item.style}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(item.title, item.style)}
                      title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center ${
                        isFav
                          ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-500'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                    </button>

                    <a
                      href={getWhatsAppShareUrl(item.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Share on WhatsApp"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.title)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer min-h-[40px] ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-purple-600 group-hover:text-white text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
            <Share2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <p>
              <strong>Creator Tip:</strong> Keep your video title under 65 characters so it is fully visible on the YouTube mobile app without truncation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
