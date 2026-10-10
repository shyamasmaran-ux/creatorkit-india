import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, Sparkles, RefreshCw, AlertCircle, Instagram, Layers, Tag, Star, Share2, Download } from 'lucide-react';
import { fetchGeneratedCaptions } from '../../services/captionService';
import { CaptionTone, GeneratedCaption, PostType } from '../../types';
import { addHistoryItem, isItemSaved, toggleSavedItem } from '../../services/storageService';
import { copyTextToClipboard, downloadTextAsFile, getWhatsAppShareUrl } from '../../utils/exportUtils';

interface Props {
  onShowToast: (msg: string) => void;
}

const PRESET_TOPICS = [
  'Morning Routine & Productivity',
  'Authentic Mumbai Street Food Trail',
  '3 Mistakes Every Engineering Student Makes',
  'Solo Camping in Himachal Pradesh',
  'Handloom Saree Festive Collection Launch'
];

export const InstagramCaptionGenerator: React.FC<Props> = ({ onShowToast }) => {
  const [topic, setTopic] = useState('');
  const [postType, setPostType] = useState<PostType>('reel');
  const [tone, setTone] = useState<CaptionTone>('friendly');
  const [extraContext, setExtraContext] = useState('');
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
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
    if (isGenerating) return;

    const targetTopic = (customTopic || topic).trim();
    if (!targetTopic) {
      setError('Please enter what your Instagram post is about.');
      return;
    }

    if (targetTopic.length < 3) {
      setError('Your post description is very short. Adding a couple of specific details will help produce much better captions!');
      return;
    }

    const requestKey = `${targetTopic.toLowerCase()}|${postType}|${tone}|${extraContext.trim().toLowerCase()}`;
    const shouldForceRefresh = explicitForceRefresh || lastRequestKeyRef.current === requestKey;

    abortControllerRef.current?.abort(new DOMException('Superseded by new request', 'AbortError'));
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);
    setFallbackNotice(null);
    setIsGenerating(true);

    try {
      const result = await fetchGeneratedCaptions({
        topic: targetTopic,
        postType,
        tone,
        extraContext,
        forceRefresh: shouldForceRefresh,
        signal: controller.signal
      });

      if (controller.signal.aborted) return;

      lastRequestKeyRef.current = requestKey;
      setCaptions(result.captions);
      setIsAiResult(result.isAi);
      setFallbackNotice(result.fallbackNotice || null);
      if (result.captions.length > 0) {
        addHistoryItem({
          toolId: 'instagram-caption',
          toolName: 'Instagram Caption Generator',
          title: `${targetTopic} (${result.captions.length} Captions)`,
          content: result.captions.map((c, idx) => `--- Option ${idx + 1} ---\n${c.fullCaption}`).join('\n\n'),
        });
      }
      onShowToast(
        result.isAi
          ? `Generated ${result.captions.length} AI Instagram captions!`
          : `Showing ${result.captions.length} offline template captions (AI busy).`
      );
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setError(err?.message || 'Unable to generate captions right now. Please check your network and try again.');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsGenerating(false);
      }
    }
  };

  const handleCopy = async (id: string, text: string, label = 'Full caption') => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedId(id);
      onShowToast(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      onShowToast('Failed to copy text.');
    }
  };

  const handleToggleFavorite = (item: GeneratedCaption, idx: number) => {
    const res = toggleSavedItem({
      toolId: 'instagram-caption',
      toolName: 'Instagram Caption Generator',
      title: `${topic || 'Instagram Post'} — Option ${idx + 1}`,
      content: item.fullCaption,
    });
    setStorageTick((t) => t + 1);
    onShowToast(res.saved ? 'Caption saved to Favorites!' : 'Removed from Favorites');
  };

  const handleDownloadAllTxt = () => {
    if (captions.length === 0) return;
    const text = captions.map((c, idx) => `=== OPTION ${idx + 1} ===\n${c.fullCaption}`).join('\n\n');
    downloadTextAsFile(text, `instagram-captions-${topic || 'export'}.txt`);
    onShowToast('Downloaded captions as .txt!');
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(new DOMException('Reset by user', 'AbortError'));
      abortControllerRef.current = null;
    }
    lastRequestKeyRef.current = null;
    setIsGenerating(false);
    setTopic('');
    setExtraContext('');
    setCaptions([]);
    setIsAiResult(true);
    setFallbackNotice(null);
    setError(null);
    onShowToast('Caption inputs cleared.');
  };

  const handlePresetClick = (preset: string) => {
    if (isGenerating) return;
    setTopic(preset);
    setError(null);
    handleGenerate(preset);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/70 text-pink-600 dark:text-pink-400 flex items-center justify-center">
            <Instagram className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Instagram Caption Generator</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create 5 distinct, high-retention captions formatted with hooks, line breaks, natural emojis, and separate hashtags.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="ig-topic" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Post Topic or Visual Subject <span className="text-pink-600 dark:text-pink-400">*</span>
            </label>
            <input
              id="ig-topic"
              type="text"
              disabled={isGenerating}
              placeholder="e.g. 5 study hacks for college, handloom saree collection, street food in Lucknow"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm md:text-base transition-all disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ig-type" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Format / Post Type
              </label>
              <select
                id="ig-type"
                disabled={isGenerating}
                value={postType}
                onChange={(e) => setPostType(e.target.value as PostType)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm transition-all disabled:opacity-60"
              >
                <option value="reel">🎬 Instagram Reel (Short & Punchy)</option>
                <option value="carousel">📚 Carousel / Slide Guide</option>
                <option value="photo">📸 Single Photo / Portrait</option>
                <option value="announcement">📢 Announcement / Story</option>
                <option value="product">🛍️ Product / Small Business Launch</option>
              </select>
            </div>

            <div>
              <label htmlFor="ig-tone" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Tone of Voice
              </label>
              <select
                id="ig-tone"
                disabled={isGenerating}
                value={tone}
                onChange={(e) => setTone(e.target.value as CaptionTone)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm transition-all disabled:opacity-60"
              >
                <option value="friendly">🤝 Friendly & Relatable</option>
                <option value="funny">😂 Funny & Conversational</option>
                <option value="storytelling">📖 Personal Storytelling</option>
                <option value="professional">💼 Professional & Informative</option>
                <option value="inspirational">🔥 Motivational & Inspiring</option>
                <option value="minimal">✨ Minimalist & Punchy</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ig-context" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Specific Detail or Context <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(Optional)</span>
            </label>
            <input
              id="ig-context"
              type="text"
              disabled={isGenerating}
              placeholder="e.g. shot at Marine Drive, 100% pure silk, discounted till Sunday"
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all disabled:opacity-60"
            />
          </div>

          {/* Quick Preset Topics */}
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">Try sample ideas:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {PRESET_TOPICS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handlePresetClick(preset)}
                  className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/60 hover:text-pink-700 dark:hover:text-pink-300 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer min-h-[48px]"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isGenerating ? 'Generating Captions...' : 'Generate 5 Captions'}</span>
            </button>

            {(topic || captions.length > 0) && (
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

      {/* Generated Captions List */}
      {captions.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {fallbackNotice && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                Generated Captions ({captions.length})
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadAllTxt}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .TXT</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerate(undefined, true)}
                disabled={isGenerating}
                className="flex items-center gap-1.5 bg-pink-50 dark:bg-pink-950/70 hover:bg-pink-100 dark:hover:bg-pink-900 text-pink-700 dark:text-pink-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-pink-200 dark:border-pink-800 transition-colors cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate Fresh</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {captions.map((item, index) => {
              const isFullCopied = copiedId === `full-${item.id}`;
              const isTagsCopied = copiedId === `tags-${item.id}`;
              const saved = isItemSaved('instagram-caption', item.fullCaption);

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-700 transition-all space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="px-2.5 py-1 rounded-md bg-pink-50 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 text-xs font-semibold">
                      Option {index + 1}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(item, index)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          saved
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-amber-500'
                        }`}
                        title={saved ? 'Remove from Favorites' : 'Save to Favorites'}
                      >
                        <Star className={`w-3.5 h-3.5 ${saved ? 'fill-amber-400 text-amber-500' : ''}`} />
                        <span>{saved ? 'Saved' : 'Save'}</span>
                      </button>

                      <a
                        href={getWhatsAppShareUrl(item.fullCaption)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                        title="Share caption on WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          downloadTextAsFile(item.fullCaption, `instagram-caption-${index + 1}.txt`);
                          onShowToast('Downloaded caption as .txt!');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Download as .txt"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.TXT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(`full-${item.id}`, item.fullCaption, 'Full caption')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isFullCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-pink-600 hover:text-white text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isFullCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isFullCopied ? 'Copied Full!' : 'Copy Full Caption'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Hook */}
                  <div className="p-3 bg-pink-50/50 dark:bg-pink-950/30 rounded-xl border border-pink-100 dark:border-pink-900/60">
                    <span className="text-[11px] font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider block mb-1">
                      🪝 Hook (Opening Line)
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">{item.hook}</p>
                  </div>

                  {/* Body Context */}
                  <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {item.body}
                  </div>

                  {/* CTA */}
                  {item.cta && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-100 dark:border-slate-700/80 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">💬 Call to Action:</span>
                      {item.cta}
                    </div>
                  )}

                  {/* Hashtags Footer */}
                  {item.hashtags && item.hashtags.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5 text-xs text-pink-600 dark:text-pink-400 font-medium">
                        {item.hashtags.map((tag, tIdx) => (
                          <span key={tIdx} className="bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(`tags-${item.id}`, item.hashtags.join(' '), 'Hashtags')}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{isTagsCopied ? 'Copied Tags!' : 'Copy Tags Only'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
