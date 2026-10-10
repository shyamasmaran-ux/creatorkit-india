import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Install CreatorKit India on your device"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/80 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Install CreatorKit India App
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isInIframe && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong>Preview Mode Note:</strong> Browser home-screen installation is disabled inside embedded preview frames. Open the direct app URL in <strong>Chrome (Android/Desktop)</strong> or <strong>Safari (iOS)</strong> to install.
              </div>
            )}

            {isIOS ? (
              <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-semibold text-slate-900 dark:text-white">
                  How to install on iPhone / iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Open CreatorKit India in <strong>Safari</strong>.</li>
                  <li>Tap the <strong>Share</strong> button at the bottom of the screen.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-semibold text-slate-900 dark:text-white">
                  How to install on Android / Chrome:
                </p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Open the direct website URL in <strong>Google Chrome</strong>.</li>
                  <li>Tap the browser menu (<strong>⋮</strong>) in the top-right corner.</li>
                  <li>Select <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
                </ol>
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
              Note: Browser-local utilities (Text Formatter, Bio Fonts, WhatsApp QR, Image Editor, BG Remover) work locally once loaded, while AI generators and YouTube thumbnail fetching require an active internet connection.
            </p>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer min-h-[44px]"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
