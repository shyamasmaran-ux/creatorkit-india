import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { copyTextToClipboard } from '../../utils/exportUtils';

interface Props {
  onShowToast: (msg: string) => void;
}

const COUNTRY_CODES = [
  { code: '91', label: '🇮🇳 India (+91)', minLen: 10, maxLen: 10 },
  { code: '1', label: '🇺🇸 USA / Canada (+1)', minLen: 10, maxLen: 10 },
  { code: '971', label: '🇦🇪 UAE (+971)', minLen: 8, maxLen: 9 },
  { code: '44', label: '🇬🇧 UK (+44)', minLen: 10, maxLen: 10 },
  { code: '65', label: '🇸🇬 Singapore (+65)', minLen: 8, maxLen: 8 },
  { code: '61', label: '🇦🇺 Australia (+61)', minLen: 9, maxLen: 9 },
];

const MESSAGE_TEMPLATES = [
  'Hi! I saw your profile on Instagram and want to know more about your services.',
  'Namaste! Please share your latest product catalog and price list.',
  'Hello! I would like to book a consultation call with you.',
  'Hi, I want to collaborate on an upcoming YouTube / Instagram promotion.',
];

export const WhatsAppGenerator: React.FC<Props> = ({ onShowToast }) => {
  const [countryCode, setCountryCode] = useState('91');
  const [phoneInput, setPhoneInput] = useState('1234567890');
  const [message, setMessage] = useState(
    'Hi! I found your link and would like to connect regarding your services.'
  );
  const [qrDarkColor, setQrDarkColor] = useState('#0f172a');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Clean digits
  const cleanDigits = phoneInput.replace(/\D/g, '');
  const selectedCountry =
    COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  // Validate phone number
  let validationError: string | null = null;
  if (!cleanDigits) {
    validationError = 'Please enter a valid WhatsApp phone number.';
  } else if (countryCode === '91' && cleanDigits.length !== 10) {
    validationError =
      'Please enter a valid 10-digit Indian mobile number.';
  } else if (cleanDigits.length < 7 || cleanDigits.length > 15) {
    validationError = 'Phone number must contain between 7 and 15 digits.';
  }

  const fullPhone = `${countryCode}${cleanDigits}`;
  const trimmedMsg = message.trim();
  const generatedLink = !validationError
    ? trimmedMsg
      ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(trimmedMsg)}`
      : `https://wa.me/${fullPhone}`
    : '';

  useEffect(() => {
    let cancelled = false;
    if (!generatedLink) {
      setQrDataUrl(null);
      return;
    }

    QRCode.toDataURL(generatedLink, {
      width: 512,
      margin: 2,
      color: {
        dark: qrDarkColor,
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
          setQrError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrError('Unable to render QR code for this input.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [generatedLink, qrDarkColor]);

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    const ok = await copyTextToClipboard(generatedLink);
    if (ok) {
      setCopiedLink(true);
      onShowToast('WhatsApp wa.me link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl || !generatedLink) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `whatsapp-qr-${fullPhone}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('WhatsApp QR Code downloaded as PNG!');
  };

  return (
    <div className="space-y-6">
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Inputs (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                WhatsApp Link &amp; QR Code Generator
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Create official click-to-chat <code className="font-mono">wa.me</code> links and high-resolution QR codes 100% locally in your browser.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label
                htmlFor="wa-country"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
              >
                Country Code
              </label>
              <select
                id="wa-country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="wa-phone"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
              >
                WhatsApp Mobile Number <span className="text-emerald-600">*</span>
              </label>
              <input
                id="wa-phone"
                type="tel"
                inputMode="numeric"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder={selectedCountry.code === '91' ? '1234567890' : 'Enter mobile number'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Optional Prefilled Message */}
          <div>
            <label
              htmlFor="wa-message"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              Prefilled Chat Message <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </label>
            <textarea
              id="wa-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Hi! I want to inquire about your services..."
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Quick Message Templates */}
          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
              Quick Prefilled Message Templates:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {MESSAGE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setMessage(tpl)}
                  className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-left cursor-pointer"
                >
                  {tpl.length > 48 ? `${tpl.slice(0, 48)}...` : tpl}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Link Output Box */}
          {generatedLink && (
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Your Official WhatsApp Link
                </span>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                  +{fullPhone}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900 font-mono text-xs text-slate-800 dark:text-slate-200 break-all">
                {generatedLink}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer min-h-[44px] ${
                    copiedLink
                      ? 'bg-slate-900 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy WhatsApp Link'}</span>
                </button>

                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors min-h-[44px]"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Test Link in WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput('');
                    setMessage('');
                  }}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Instant Local QR Code Card (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-center">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Scannable WhatsApp QR Code
              </h2>
            </div>

            {/* Color Picker for QR */}
            <div className="flex items-center gap-1.5">
              {[
                { color: '#0f172a', label: 'Dark Slate' },
                { color: '#047857', label: 'Emerald' },
                { color: '#4f46e5', label: 'Indigo' },
              ].map((sw) => (
                <button
                  key={sw.color}
                  type="button"
                  onClick={() => setQrDarkColor(sw.color)}
                  title={`QR Color: ${sw.label}`}
                  className={`w-5 h-5 rounded-full border-2 cursor-pointer ${
                    qrDarkColor === sw.color
                      ? 'border-purple-600 scale-110'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  style={{ backgroundColor: sw.color }}
                />
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[280px]">
            {qrDataUrl && !validationError ? (
              <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200">
                <img
                  src={qrDataUrl}
                  alt="WhatsApp Click to Chat QR Code"
                  className="w-56 h-56 object-contain mx-auto"
                />
                <p className="text-[11px] font-bold text-slate-700 mt-2 font-mono">
                  Scan to Chat on WhatsApp (+{fullPhone})
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-slate-400 dark:text-slate-500 max-w-xs">
                <QrCode className="w-10 h-10 mx-auto opacity-50" />
                <p className="text-xs font-medium">
                  {qrError || 'Enter a valid mobile number to generate your scannable QR code'}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownloadQR}
            disabled={!qrDataUrl || Boolean(validationError)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res QR Code (PNG)</span>
          </button>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Generated 100% locally in your browser using HTML5 Canvas — your phone number and message are never stored on any server.
          </p>
        </div>
      </div>
    </div>
  );
};
