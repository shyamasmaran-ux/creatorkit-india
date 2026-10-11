import React, { useState, useRef, useEffect } from 'react';
import {
  Clapperboard,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Star,
  Share2,
  Download,
  AlertCircle,
  Clock,
  Video,
} from 'lucide-react';
import { ReelScriptStyle, ReelScriptVariation } from '../../types';
import { fetchReelScripts } from '../../services/reelScriptService';
import {
  copyTextToClipboard,
  downloadTextAsFile,
  getWhatsAppShareUrl,
} from '../../utils/exportUtils';
import {
  toggleFavoriteItem,
  isContentFavorited,
  addHistoryItem,
} from '../../services/storageService';

interface Props {
  onShowToast: (msg: string) => void;
}

const PRESET_TOPICS = [
  '3 AI Tools Every College Student Should Know',
  'Ghar Par Café Jaisi Cold Coffee Kaise Banaye',
  'Why 90% Beginners Lose Money in Intraday Trading',
  'Best Budget Microphone for YouTube Under ₹1,500',
  'Solo Trip to Rishikesh Under ₹4,000',
];

export const ReelScriptGenerator: React.FC<Props> = ({ onShowToast }) => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<ReelScriptStyle>('educational');
  const [language, setLanguage] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [duration, setDuration] = useState<'30s' | '45s' | '60s'>('45s');
  const [scripts, setScripts] = useState<ReelScriptVariation[]>([]);
  const [isAiResult, setIsAiResult] = useState<boolean>(true);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, setStorageTick] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort(new DOMException('Component unmounted', 'AbortError'));
    };
  }, []);

  const formatFullScriptText = (item: ReelScriptVariation): string => {
    return [
      `🎬 ${item.angle} (${item.estimatedDuration})`,
      ``,
      `🪝 OPENING HOOK (0:00–0:03):`,
      `"${item.hook}"`,
      ``,
      `🎥 VISUAL / CAMERA CUE:`,
      `${item.visualCue}`,
      ``,
      `📝 SCRIPT OUTLINE (0:04–0:45):`,
      `${item.scriptBody}`,
      ``,
      `📣 CALL TO ACTION (Last 5s):`,
      `"${item.cta}"`,
    ].join('\n');
  };

  const handleGenerate = async (customTopic?: string, explicitForceRefresh = false) => {
    if (isGenerating) return;

    const targetTopic = (customTopic ?? topic).trim();
    if (!targetTopic) {
      setError('Please enter your Reel or YouTube Short topic.');
      return;
    }

    if (targetTopic.length < 3) {
      setError('Please enter a slightly more descriptive topic (at least 3 characters).');
      return;
    }

    const requestKey = `${targetTopic.toLowerCase()}|${style}|${language}|${duration}`;
    const shouldForceRefresh = explicitForceRefresh || lastRequestKeyRef.current === requestKey;

    abortControllerRef.current?.abort(new DOMException('Superseded', 'AbortError'));
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);
    setFallbackNotice(null);
    setIsGenerating(true);

    try {
      const result = await fetchReelScripts({
        topic: targetTopic,
        style,
        language,
        duration,
        forceRefresh: shouldForceRefresh,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      lastRequestKeyRef.current = requestKey;
      setScripts(result.scripts);
      setIsAiResult(result.isAi);
      setFallbackNotice(result.fallbackNotice || null);

      if (result.scripts.length > 0) {
        addHistoryItem({
          toolId: 'reel-script',
          toolName: 'Reel & Shorts Script',
          title: `${targetTopic} (${language.toUpperCase()})`,
          content: formatFullScriptText(result.scripts[0]),
        });
      }

      onShowToast(
        result.isAi
          ? `Generated ${result.scripts.length} AI Reel/Shorts scripts!`
          : `Showing ${result.scripts.length} structured template scripts (AI busy).`
      );
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) return;
      setError(err?.message || 'Unable to generate scripts right now. Please try again.');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsGenerating(false);
      }
    }
  };

  const handleCopy = async (id: string, text: string, label = 'Script') => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedId(id);
      onShowToast(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleToggleFavorite = (item: ReelScriptVariation) => {
    const fullText = formatFullScriptText(item);
    const res = toggleFavoriteItem({
      toolId: 'reel-script',
      toolName: 'Reel & Shorts Script',
      title: `${topic || 'Reel Script'} — ${item.angle}`,
      content: fullText,
    });
    setStorageTick((t) => t + 1);
    if (!res.storageAvailable) {
      onShowToast('Browser localStorage is unavailable.');
      return;
    }
    onShowToast(res.saved ? 'Saved script to Favorites!' : 'Removed from Favorites.');
  };

  const handleDownloadAll = () => {
    if (scripts.length === 0) return;
    const combined = scripts.map((s) => formatFullScriptText(s)).join('\n\n' + '='.repeat(40) + '\n\n');
    downloadTextAsFile(combined, `reel-scripts-${topic || 'creator'}`);
    onShowToast('Downloaded all scripts as .txt!');
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              Reel &amp; YouTube Shorts Hook / Script Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Generate 3 distinct 30–60 second short-form scripts with scroll-stopping 3-second hooks, camera visual cues, and CTAs in Hinglish, Hindi, or English.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="reel-topic"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              What is your Reel or YouTube Short about? <span className="text-purple-600">*</span>
            </label>
            <input
              id="reel-topic"
              type="text"
              disabled={isGenerating}
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              placeholder="e.g. 3 AI tools for students, How to make cold coffee at home, Best phone under ₹15,000"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="reel-style"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
              >
                Script Format / Niche
              </label>
              <select
                id="reel-style"
                disabled={isGenerating}
                value={style}
                onChange={(e) => setStyle(e.target.value as ReelScriptStyle)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="educational">🎓 Educational &amp; Facts</option>
                <option value="tutorial">🛠️ Step-by-Step Tutorial</option>
                <option value="tech-review">📱 Tech &amp; Gadget Review</option>
                <option value="storytelling">📖 Personal Vlogging &amp; Story</option>
                <option value="finance">📈 Finance &amp; Business</option>
                <option value="myth-busting">⚡ Myth-Busting &amp; Mistakes</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="reel-lang"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
              >
                Script Language
              </label>
              <select
                id="reel-lang"
                disabled={isGenerating}
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="hinglish">🇮🇳 Hinglish (Conversational Desi)</option>
                <option value="hindi">🇮🇳 Hindi (हिन्दी देवनागरी)</option>
                <option value="english">🇬🇧 English</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="reel-duration"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
              >
                Target Length
              </label>
              <select
                id="reel-duration"
                disabled={isGenerating}
                value={duration}
                onChange={(e) => setDuration(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="30s">⚡ 30 Seconds (Fast Punchy)</option>
                <option value="45s">🎯 45 Seconds (Ideal Retention)</option>
                <option value="60s">📚 60 Seconds (Deep Breakdown)</option>
              </select>
            </div>
          </div>

          {/* Sample Topics */}
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">
              Try sample topic:
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {PRESET_TOPICS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => {
                    setTopic(preset);
                    handleGenerate(preset);
                  }}
                  className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm flex items-center justify-between gap-3">
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60 min-h-[48px]"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Writing 3 Script Variations...' : 'Generate Hooks & Scripts'}</span>
            </button>

            {(topic || scripts.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setTopic('');
                  setScripts([]);
                  setFallbackNotice(null);
                  setError(null);
                  onShowToast('Cleared scripts.');
                }}
                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer min-h-[48px]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {scripts.length > 0 && (
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
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors cursor-pointer"
              >
                Retry AI Generation
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Generated Script Variations ({scripts.length})</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                · {isAiResult ? 'AI Generated' : 'Offline Structured Template'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerate(undefined, true)}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate Fresh</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All (.TXT)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {scripts.map((item, idx) => {
              const fullScript = formatFullScriptText(item);
              const isCopied = copiedId === item.id;
              const isHookCopied = copiedId === `hook-${item.id}`;
              const isFav = isContentFavorited(fullScript);

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                >
                  {/* Card Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                        {item.angle}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                        · <Clock className="w-3 h-3" /> {item.estimatedDuration}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(item)}
                        title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                          isFav
                            ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-500'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, fullScript, 'Full script')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[38px] ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied Script!' : 'Copy Full Script'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 0-3s Hook Box */}
                  <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block mb-1">
                        🪝 First 3 Seconds Hook (Spoken Line)
                      </span>
                      <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                        "{item.hook}"
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(`hook-${item.id}`, item.hook, 'Opening hook')}
                      className="self-start sm:self-center shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors cursor-pointer"
                    >
                      {isHookCopied ? 'Copied Hook!' : 'Copy Hook Only'}
                    </button>
                  </div>

                  {/* Visual Cue */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                    <strong className="text-slate-900 dark:text-white">🎥 Camera / Visual Cue:</strong>{' '}
                    {item.visualCue}
                  </div>

                  {/* Main Body */}
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      📝 Core Script Outline (0:04 – 0:45):
                    </span>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {item.scriptBody}
                    </div>
                  </div>

                  {/* CTA & Bottom Export Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <strong className="text-emerald-700 dark:text-emerald-400">📣 Final CTA:</strong>{' '}
                      "{item.cta}"
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={getWhatsAppShareUrl(fullScript)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          downloadTextAsFile(fullScript, `reel-script-${idx + 1}`);
                          onShowToast('Script downloaded as .txt!');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.TXT</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
