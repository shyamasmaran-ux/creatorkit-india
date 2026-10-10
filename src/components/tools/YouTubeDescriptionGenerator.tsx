import React, { useState, useRef, useEffect } from 'react';
import { FileText, Copy, Check, Sparkles, RefreshCw, AlertCircle, Edit3, Tag, Star, Share2, Download } from 'lucide-react';
import { fetchGeneratedDescription } from '../../services/descriptionService';
import { addHistoryItem, isItemSaved, toggleSavedItem } from '../../services/storageService';
import { copyTextToClipboard, downloadTextAsFile, getWhatsAppShareUrl } from '../../utils/exportUtils';

interface Props {
  onShowToast: (msg: string) => void;
}

const PRESET_TOPICS = [
  'Best Credit Cards in India 2025',
  'Old Delhi Street Food Vlog',
  'Python Full Course for Absolute Beginners',
  'Manali Solo Trip on a Student Budget',
  'How to Start Investing in Mutual Funds'
];

export const YouTubeDescriptionGenerator: React.FC<Props> = ({ onShowToast }) => {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [channelName, setChannelName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeDisclaimer, setIncludeDisclaimer] = useState(true);
  const [generatedText, setGeneratedText] = useState('');
  const [isAiResult, setIsAiResult] = useState<boolean>(true);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
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
    if (isGenerating) return;

    const targetTopic = (customTopic || topic).trim();
    if (!targetTopic) {
      setError('Please provide your video topic to generate an SEO description.');
      return;
    }

    if (targetTopic.length < 3) {
      setError('Your video topic is very short. Adding a few words will help produce a rich, relevant description.');
      return;
    }

    const requestKey = `${targetTopic.toLowerCase()}|${keywords.trim().toLowerCase()}|${channelName.trim().toLowerCase()}|${instagram}|${telegram}|${includeTimestamps}|${includeDisclaimer}`;
    const shouldForceRefresh = explicitForceRefresh || lastRequestKeyRef.current === requestKey;

    abortControllerRef.current?.abort(new DOMException('Superseded by new request', 'AbortError'));
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);
    setFallbackNotice(null);
    setIsGenerating(true);

    try {
      const result = await fetchGeneratedDescription({
        topic: targetTopic,
        keywords: keywords.trim(),
        channelName: channelName.trim(),
        socials: {
          instagram: instagram ? (instagram.startsWith('@') ? `https://instagram.com/${instagram.slice(1)}` : instagram) : undefined,
          telegram: telegram || undefined
        },
        includeTimestamps,
        includeDisclaimer,
        forceRefresh: shouldForceRefresh,
        signal: controller.signal
      });

      if (controller.signal.aborted) return;

      lastRequestKeyRef.current = requestKey;
      setGeneratedText(result.description);
      setIsAiResult(result.isAi);
      setFallbackNotice(result.fallbackNotice || null);
      if (result.description) {
        addHistoryItem({
          toolId: 'youtube-description',
          toolName: 'YouTube Description Generator',
          title: targetTopic,
          content: result.description,
        });
      }
      onShowToast(
        result.isAi
          ? 'AI YouTube description generated!'
          : 'Showing offline template description (AI busy).'
      );
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setError(err?.message || 'Unable to generate description right now. Please retry in a few moments.');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsGenerating(false);
      }
    }
  };

  const handleCopy = async () => {
    if (!generatedText) return;
    const ok = await copyTextToClipboard(generatedText);
    if (ok) {
      setIsCopied(true);
      onShowToast('Complete description copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleToggleFavorite = () => {
    if (!generatedText) return;
    const res = toggleSavedItem({
      toolId: 'youtube-description',
      toolName: 'YouTube Description Generator',
      title: topic || 'YouTube Description',
      content: generatedText,
    });
    setStorageTick((t) => t + 1);
    onShowToast(res.saved ? 'Description saved to Favorites!' : 'Removed from Favorites');
  };

  const handleCopyHashtagsOnly = () => {
    if (!generatedText) return;
    const match = generatedText.match(/(#[a-zA-Z0-9_\u0900-\u097F]+[\s\n]*)+$/);
    if (match) {
      navigator.clipboard.writeText(match[0].trim());
      onShowToast('Hashtags copied to clipboard!');
    } else {
      onShowToast('No trailing hashtags found.');
    }
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
    setChannelName('');
    setInstagram('');
    setTelegram('');
    setGeneratedText('');
    setIsAiResult(true);
    setFallbackNotice(null);
    setError(null);
    onShowToast('Description inputs cleared.');
  };

  const handlePresetClick = (preset: string) => {
    if (isGenerating) return;
    setTopic(preset);
    setError(null);
    handleGenerate(preset);
  };

  const wordCount = generatedText.trim() ? generatedText.trim().split(/\s+/).length : 0;
  const charCount = generatedText.length;

  return (
    <div className="space-y-6">
      {/* Header and Input Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">YouTube Description Generator</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Generate useful, natural video descriptions that accurately explain your actual video topic with natural keywords and hashtags.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="desc-topic" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Video Topic / Main Subject <span className="text-indigo-600 dark:text-indigo-400">*</span>
              </label>
              <input
                id="desc-topic"
                type="text"
                disabled={isGenerating}
                placeholder="e.g. Best Credit Cards in India 2025, Old Delhi Food Tour"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="desc-keywords" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Key Search Terms / Focus Keywords <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(Optional)</span>
              </label>
              <input
                id="desc-keywords"
                type="text"
                disabled={isGenerating}
                placeholder="e.g. Cashback cards, HDFC, SBI, zero annual fee"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="desc-channel" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Channel Name
              </label>
              <input
                id="desc-channel"
                type="text"
                disabled={isGenerating}
                placeholder="e.g. Tech Talk India"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="desc-ig" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Instagram Handle / URL
              </label>
              <input
                id="desc-ig"
                type="text"
                disabled={isGenerating}
                placeholder="@myhandle or profile URL"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="desc-tg" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Telegram Link / Community
              </label>
              <input
                id="desc-tg"
                type="text"
                disabled={isGenerating}
                placeholder="https://t.me/yourgroup"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all disabled:opacity-60"
              />
            </div>
          </div>

          {/* Section Options */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                disabled={isGenerating}
                checked={includeTimestamps}
                onChange={(e) => setIncludeTimestamps(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer disabled:opacity-60"
              />
              <span>Include Chapter Timestamps</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                disabled={isGenerating}
                checked={includeDisclaimer}
                onChange={(e) => setIncludeDisclaimer(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer disabled:opacity-60"
              />
              <span>Include Standard Creator Disclaimer</span>
            </label>
          </div>

          {/* Presets */}
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">Try sample topic:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {PRESET_TOPICS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handlePresetClick(preset)}
                  className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

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

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer min-h-[48px]"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isGenerating ? 'Generating Description...' : 'Generate Description'}</span>
            </button>

            {(topic || generatedText) && (
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

      {/* Output Display Card */}
      {generatedText && (
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
                  <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Generated YouTube Description
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
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} characters (Max 5,000 on YouTube)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isItemSaved('youtube-description', generatedText)
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:text-amber-500'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isItemSaved('youtube-description', generatedText) ? 'fill-amber-400 text-amber-500' : ''}`} />
                <span>{isItemSaved('youtube-description', generatedText) ? 'Saved' : 'Save'}</span>
              </button>

              <a
                href={getWhatsAppShareUrl(generatedText)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  downloadTextAsFile(generatedText, `youtube-description-${topic || 'export'}.txt`);
                  onShowToast('Downloaded description as .txt!');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.TXT</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerate(undefined, true)}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate Fresh</span>
              </button>

              <button
                type="button"
                onClick={handleCopyHashtagsOnly}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Copy Hashtags Only</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied Full!' : 'Copy Full Description'}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              rows={16}
              value={generatedText}
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/70 text-slate-800 dark:text-slate-100 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          </div>
        </div>
      )}
    </div>
  );
};
