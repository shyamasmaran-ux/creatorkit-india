import React, { useState } from 'react';
import { Share2, Copy, Check, MessageSquare, Users } from 'lucide-react';
import { copyTextToClipboard, getWhatsAppShareUrl } from '../utils/exportUtils';

interface Props {
  onShowToast?: (msg: string) => void;
}

export const ShareCreatorKitBanner: React.FC<Props> = ({ onShowToast }) => {
  const [copied, setCopied] = useState(false);

  const siteUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://creatorkit.in';

  const shareMessage = `Hey! Check out CreatorKit India — 15 free tools for Indian YouTubers & Instagram creators (Thumbnail Studio, YT Income Calculator in ₹, Reel Scripts, IG Grid Splitter, Fancy Bio Fonts & WhatsApp QR). No login needed: ${siteUrl}`;

  const handleCopyLink = async () => {
    const ok = await copyTextToClipboard(siteUrl);
    if (ok) {
      setCopied(true);
      onShowToast?.('CreatorKit website link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'CreatorKit India — 15 Free Creator Tools',
          text: 'Free tools for Indian YouTubers & Instagram creators (Thumbnails, Reel Scripts, YT Income Calculator, IG Grid Splitter & more):',
          url: siteUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    await handleCopyLink();
  };

  return (
    <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 border border-indigo-500/30 text-white shadow-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Users className="w-4 h-4" />
            <span>Help Fellow Indian Creators Grow</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Know a YouTuber, Reel Creator, or Small Business Owner?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Share CreatorKit India on WhatsApp with your creator friends, college groups, or editing team. All 15 tools are 100% free with zero login barriers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
          <a
            href={getWhatsAppShareUrl(shareMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-colors min-h-[44px] whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4 fill-slate-950" />
            <span>Share on WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold px-4 py-3 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Website Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold px-3.5 py-3 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
            title="Share via device menu"
          >
            <Share2 className="w-4 h-4" />
            <span className="sr-only sm:not-sr-only">Share</span>
          </button>
        </div>
      </div>
    </section>
  );
};
