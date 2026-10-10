import React, { useState } from 'react';
import {
  AtSign,
  Copy,
  Check,
  Star,
  Share2,
  Download,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
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

interface FontTransform {
  id: string;
  name: string;
  note: string;
  transform: (input: string) => string;
}

function mapAsciiRanges(
  text: string,
  upperStart: number,
  lowerStart: number,
  digitStart?: number,
  overrides?: Record<string, string>
): string {
  let result = '';
  for (const ch of text) {
    if (overrides && overrides[ch]) {
      result += overrides[ch];
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      result += String.fromCodePoint(upperStart + (code - 65));
    } else if (code >= 97 && code <= 122) {
      result += String.fromCodePoint(lowerStart + (code - 97));
    } else if (digitStart !== undefined && code >= 48 && code <= 57) {
      result += String.fromCodePoint(digitStart + (code - 48));
    } else {
      // Preserve line breaks (\n), emojis, Devanagari, punctuation, spaces
      result += ch;
    }
  }
  return result;
}

const SMALL_CAPS_MAP: Record<string, string> = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
  j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
  s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
};

const UNICODE_FONT_STYLES: FontTransform[] = [
  {
    id: 'sans-bold',
    name: 'Bold Sans (Clean Bio Header)',
    note: 'High legibility on Android & iOS',
    transform: (s) => mapAsciiRanges(s, 0x1d5d4, 0x1d5ee, 0x1d7ec),
  },
  {
    id: 'sans-italic',
    name: 'Italic Sans',
    note: 'Modern slant for taglines',
    transform: (s) => mapAsciiRanges(s, 0x1d608, 0x1d622),
  },
  {
    id: 'sans-bold-italic',
    name: 'Bold Italic Sans',
    note: 'Strong emphasis for callouts',
    transform: (s) => mapAsciiRanges(s, 0x1d63c, 0x1d656, 0x1d7ec),
  },
  {
    id: 'serif-bold',
    name: 'Editorial Bold Serif',
    note: 'Classic magazine & creator look',
    transform: (s) => mapAsciiRanges(s, 0x1d400, 0x1d41a, 0x1d7ce),
  },
  {
    id: 'serif-italic',
    name: 'Editorial Italic Serif',
    note: 'Aesthetic quote & poetry style',
    transform: (s) => mapAsciiRanges(s, 0x1d434, 0x1d44e, undefined, { h: 'ℎ' }),
  },
  {
    id: 'script-bold',
    name: 'Bold Cursive Script',
    note: 'Decorative name & lifestyle header',
    transform: (s) => mapAsciiRanges(s, 0x1d4d0, 0x1d4ea),
  },
  {
    id: 'small-caps',
    name: 'Minimal Small Caps',
    note: 'Clean aesthetic for category labels',
    transform: (s) =>
      Array.from(s)
        .map((c) => SMALL_CAPS_MAP[c] || c)
        .join(''),
  },
  {
    id: 'monospace',
    name: 'Typewriter Monospace',
    note: 'Tech, coding, & minimalist bios',
    transform: (s) => mapAsciiRanges(s, 0x1d670, 0x1d68a, 0x1d7f6),
  },
  {
    id: 'double-struck',
    name: 'Double-Struck Outline',
    note: 'Distinctive display style',
    transform: (s) =>
      mapAsciiRanges(s, 0x1d538, 0x1d552, 0x1d7d8, {
        C: 'ℂ',
        H: 'ℍ',
        N: 'ℕ',
        P: 'ℙ',
        Q: 'ℚ',
        R: 'ℝ',
        Z: 'ℤ',
      }),
  },
  {
    id: 'circled',
    name: 'Circled Bubble Text',
    note: 'Playful badge lettering',
    transform: (s) => mapAsciiRanges(s, 0x24b6, 0x24d0),
  },
];

const BIO_TEMPLATES = [
  {
    label: 'Tech & Gadget Creator',
    text: `Tech Explorer | Honest Gadget Reviews 🇮🇳\n🎥 New Videos Every Tue & Fri\n📍 Bengaluru | Collab: DM or Email\n👇 Watch Latest Smartphone Comparison`,
  },
  {
    label: 'Small Business / D2C Store',
    text: `Handcrafted Indian Ethnic Wear ✨\n🚚 Pan-India Shipping | COD Available\n💬 Order on WhatsApp via link below\n📍 Jaipur, Rajasthan`,
  },
  {
    label: 'Educator / Student Guide',
    text: `Helping Students Crack Coding & Placements 💻\n📚 Free Roadmaps & Study Notes\n🎯 100K+ Learners Community\n👇 Download Free Prep Checklist`,
  },
  {
    label: 'Food & Travel Vlogger',
    text: `Exploring Street Food & Hidden Gems Across India 🍛✈️\n📍 Currently in: Mumbai\n📩 Business & Collabs: DM Open`,
  },
];

const QUICK_SYMBOLS = ['•', '✦', '➜', '📍', '📩', '🎥', '🇮🇳', '👇', '✨', '⚡', '｜'];

export const InstagramBioGenerator: React.FC<Props> = ({ onShowToast }) => {
  const [inputText, setInputText] = useState<string>(
    `Digital Creator | Tech & Lifestyle 🇮🇳\n🎥 Helping you grow on YouTube & IG\n📍 Mumbai | Collab: DM Open\n👇 Free Creator Toolkit Below`
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, setStorageTick] = useState(0);

  const IG_BIO_LIMIT = 150;
  // Count Unicode code points accurately
  const charCount = Array.from(inputText).length;
  const lineCount = inputText ? inputText.split(/\r\n|\r|\n/).length : 0;
  const isOverLimit = charCount > IG_BIO_LIMIT;

  const handleCopy = async (id: string, text: string, styleName: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedId(id);
      addHistoryItem({
        toolId: 'instagram-bio',
        toolName: 'IG Bio & Fonts',
        title: `${styleName} Bio`,
        content: text,
      });
      onShowToast(`${styleName} copied with line breaks preserved!`);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      onShowToast('Unable to copy automatically.');
    }
  };

  const handleToggleFavorite = (styleName: string, text: string) => {
    const res = toggleFavoriteItem({
      toolId: 'instagram-bio',
      toolName: 'IG Bio & Fonts',
      title: `${styleName} Bio`,
      content: text,
    });
    setStorageTick((t) => t + 1);
    if (!res.storageAvailable) {
      onShowToast('Browser storage is unavailable in this mode.');
      return;
    }
    onShowToast(res.saved ? 'Saved to Favorites!' : 'Removed from Favorites.');
  };

  const insertSymbol = (sym: string) => {
    setInputText((prev) => `${prev}${sym}`);
  };

  return (
    <div className="space-y-6">
      {/* Input & Live 150-Character Bio Editor */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/70 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
            <AtSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              Instagram Bio &amp; Fancy Font Formatter
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Format multi-line Instagram bios with a live 150-character counter and convert English letters into stylish Unicode fonts locally in your browser.
            </p>
          </div>
        </div>

        {/* Preset Bio Templates */}
        <div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
            Load Starter Bio Template:
          </span>
          <div className="flex flex-wrap gap-2">
            {BIO_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => setInputText(tpl.text)}
                className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/60 hover:text-pink-700 dark:hover:text-pink-300 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bio Textarea + Character Limit Bar */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="ig-bio-input"
              className="text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Enter Your Bio or Text (Line breaks are preserved)
            </label>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">{lineCount} lines</span>
              <span
                className={`px-2.5 py-0.5 rounded-md font-bold ${
                  isOverLimit
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                    : charCount > 130
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {charCount} / {IG_BIO_LIMIT} chars
              </span>
            </div>
          </div>

          <textarea
            id="ig-bio-input"
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your Instagram bio, headline, or name here..."
            className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-pink-500"
          />

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                isOverLimit
                  ? 'bg-rose-600'
                  : charCount > 130
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (charCount / IG_BIO_LIMIT) * 100)}%` }}
            />
          </div>

          {isOverLimit && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              Your bio is {charCount - IG_BIO_LIMIT} characters over Instagram's 150-character profile bio limit. You can still use this text for captions or reels!
            </p>
          )}
        </div>

        {/* Quick Bullet Symbols + Plain Copy/Export Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
              Insert Symbol:
            </span>
            {QUICK_SYMBOLS.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => insertSymbol(sym)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/60 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer"
              >
                {sym}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy('plain-bio', inputText, 'Plain Formatted Bio')}
              disabled={!inputText.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-pink-600 hover:bg-pink-700 text-white transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              {copiedId === 'plain-bio' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'plain-bio' ? 'Copied Bio' : 'Copy Plain Bio'}</span>
            </button>

            <button
              type="button"
              onClick={() => setInputText('')}
              disabled={!inputText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Device & Screen-Reader Compatibility Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Compatibility &amp; Accessibility Note:</strong> Fancy Unicode styles convert Latin (A–Z, 0–9) characters into mathematical symbol characters. Hindi (Devanagari) script and emojis remain unchanged. Some decorative Unicode styles may not render on older Android phones or be read naturally by screen readers—use them mainly for your 1-line headline or display name.
          </p>
        </div>
      </div>

      {/* Generated Unicode Font Cards */}
      {inputText.trim() && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <span>Unicode Font Styles ({UNICODE_FONT_STYLES.length} Variations)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {UNICODE_FONT_STYLES.map((style) => {
              const converted = style.transform(inputText);
              const isCopied = copiedId === style.id;
              const isFav = isContentFavorited(converted);

              return (
                <div
                  key={style.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {style.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {style.note}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(style.name, converted)}
                        title={isFav ? 'Remove from saved favorites' : 'Save to favorites'}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                          isFav
                            ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-500'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line break-words leading-relaxed">
                      {converted}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(style.id, converted, style.name)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[40px] ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-pink-600 hover:bg-pink-700 text-white'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied!' : 'Copy Font'}</span>
                    </button>

                    <a
                      href={getWhatsAppShareUrl(converted)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors min-h-[40px]"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        downloadTextAsFile(converted, `instagram-bio-${style.id}`);
                        onShowToast('Bio downloaded as .txt!');
                      }}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer min-h-[40px]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.TXT</span>
                    </button>
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
