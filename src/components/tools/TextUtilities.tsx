import React, { useState } from 'react';
import { Type, Copy, Check, RefreshCw, Clock, ArrowDownUp, Scissors, Sparkles, FileText, CheckCircle, Star, Share2, Download } from 'lucide-react';
import { isItemSaved, toggleSavedItem } from '../../services/storageService';
import { copyTextToClipboard, downloadTextAsFile, getWhatsAppShareUrl } from '../../utils/exportUtils';

interface Props {
  onShowToast: (msg: string) => void;
}

export const TextUtilities: React.FC<Props> = ({ onShowToast }) => {
  const [text, setText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [, setStorageTick] = useState(0);

  // Statistics calculation in real-time
  const charCount = text.length;
  const charNoSpaces = text.replace(/\s/g, '').length;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const lineCount = text === '' ? 0 : text.split(/\r\n|\r|\n/).length;
  const sentenceCount = text.trim() === '' ? 0 : (text.match(/[^.!?]+[.!?]+(\s|$)/g) || []).length;
  
  // Reading time (avg 200 words per minute) & speaking time (avg 130 words per minute)
  const readingTimeMinutes = Math.max(0.1, +(wordCount / 200).toFixed(1));
  const speakingTimeMinutes = Math.max(0.1, +(wordCount / 130).toFixed(1));

  const handleAction = (type: string, transformFn: (val: string) => string, actionLabel: string) => {
    if (!text) {
      onShowToast('Please enter or paste some text first.');
      return;
    }
    const updated = transformFn(text);
    setText(updated);
    setLastAction(actionLabel);
    onShowToast(`${actionLabel} applied!`);
    setTimeout(() => setLastAction(null), 2500);
  };

  // Transformations
  const toUpperCase = () => handleAction('upper', (s) => s.toUpperCase(), 'UPPERCASE');
  const toLowerCase = () => handleAction('lower', (s) => s.toLowerCase(), 'lowercase');
  
  const toTitleCase = () => handleAction('title', (s) => {
    return s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  }, 'Title Case');

  const toSentenceCase = () => handleAction('sentence', (s) => {
    return s.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
  }, 'Sentence case');

  const removeExtraSpaces = () => handleAction('spaces', (s) => {
    return s.replace(/[ \t]+/g, ' ').trim();
  }, 'Removed Extra Spaces');

  const removeLineBreaks = () => handleAction('breaks', (s) => {
    return s.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
  }, 'Removed Line Breaks');

  const removeDuplicateLines = () => handleAction('dupes', (s) => {
    const lines = s.split(/\r?\n/);
    const seen = new Set();
    const unique: string[] = [];
    for (const line of lines) {
      if (!seen.has(line)) {
        seen.add(line);
        unique.push(line);
      }
    }
    return unique.join('\n');
  }, 'Removed Duplicate Lines');

  const handleCopy = async () => {
    if (!text) {
      onShowToast('Nothing to copy.');
      return;
    }
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setIsCopied(true);
      onShowToast('Text copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleToggleFavorite = () => {
    if (!text.trim()) {
      onShowToast('Enter text before saving.');
      return;
    }
    const res = toggleSavedItem({
      toolId: 'text-utilities',
      toolName: 'Creator Text Utilities',
      title: `${text.trim().slice(0, 40)} (${wordCount} words)`,
      content: text,
    });
    setStorageTick((t) => t + 1);
    onShowToast(res.saved ? 'Saved to Favorites!' : 'Removed from Favorites');
  };

  const handleClear = () => {
    setText('');
    onShowToast('Text area cleared.');
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Creator Text Utilities</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Word counter, case converter, and spacing formatter. Works 100% locally in your browser.
            </p>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="block text-2xl font-bold text-slate-900 dark:text-white font-mono">{wordCount}</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Words</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="block text-2xl font-bold text-slate-900 dark:text-white font-mono">{charCount}</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Characters</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="block text-2xl font-bold text-slate-900 dark:text-white font-mono">{charNoSpaces}</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Without Spaces</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="block text-2xl font-bold text-slate-900 dark:text-white font-mono">{sentenceCount}</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sentences</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="block text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {wordCount === 0 ? '0s' : `${readingTimeMinutes}m`}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Reading Time</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
            <span className="block text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {wordCount === 0 ? '0s' : `${speakingTimeMinutes}m`}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Speaking Time</span>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your script, caption, tweet, or article here to analyze and transform..."
              rows={8}
              className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-600 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm md:text-base leading-relaxed transition-all"
            />
          </div>

          {/* Quick action bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Case Conversions:</span>
              <button
                type="button"
                onClick={toUpperCase}
                className="text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/60 hover:text-violet-700 dark:hover:text-violet-300 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                UPPERCASE
              </button>
              <button
                type="button"
                onClick={toLowerCase}
                className="text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/60 hover:text-violet-700 dark:hover:text-violet-300 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                lowercase
              </button>
              <button
                type="button"
                onClick={toTitleCase}
                className="text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/60 hover:text-violet-700 dark:hover:text-violet-300 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Title Case
              </button>
              <button
                type="button"
                onClick={toSentenceCase}
                className="text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/60 hover:text-violet-700 dark:hover:text-violet-300 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Sentence case
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {text && (
                <>
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isItemSaved('text-utilities', text)
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:text-amber-500'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isItemSaved('text-utilities', text) ? 'fill-amber-400 text-amber-500' : ''}`} />
                    <span>{isItemSaved('text-utilities', text) ? 'Saved' : 'Save'}</span>
                  </button>

                  <a
                    href={getWhatsAppShareUrl(text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      downloadTextAsFile(text, 'creator-text-notes.txt');
                      onShowToast('Downloaded text as .txt!');
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.TXT</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleCopy}
                disabled={!text}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[40px] disabled:opacity-50 ${
                  isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white shadow-xs'
                }`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
          </div>

          {/* Cleaners row */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Clean & Format:</span>
            <button
              type="button"
              onClick={removeExtraSpaces}
              className="text-xs font-medium px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Scissors className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span>Remove Extra Spaces</span>
            </button>
            <button
              type="button"
              onClick={removeLineBreaks}
              className="text-xs font-medium px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowDownUp className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span>Remove Line Breaks</span>
            </button>
            <button
              type="button"
              onClick={removeDuplicateLines}
              className="text-xs font-medium px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              <span>Remove Duplicate Lines</span>
            </button>
          </div>
        </div>
      </div>

      {/* Creator Utility Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm mb-1.5">
            <Clock className="w-4 h-4" />
            <span>Speaking Time for Shorts/Reels</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            A 60-second Instagram Reel or YouTube Short typically accommodates <strong>130 to 150 spoken words</strong>. Check your word count before recording to avoid speaking too fast.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm mb-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>Title Case for CTR</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Converting titles to <strong>Title Case</strong> increases YouTube click-through rate by making words stand out clearly on smaller mobile phone screens.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-sm mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Clean Caption Spacing</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Instagram often collapses strange spacing. Use our <strong>Remove Extra Spaces</strong> tool before publishing to ensure clean paragraph breaks on all devices.
          </p>
        </div>
      </div>
    </div>
  );
};
