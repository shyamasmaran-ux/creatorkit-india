import React, { useState, useRef } from 'react';
import {
  Layout,
  Search,
  Download,
  Upload,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  MoreVertical,
} from 'lucide-react';
import { copyTextToClipboard } from '../../utils/exportUtils';

interface Props {
  onShowToast: (msg: string) => void;
}

export interface ThumbnailOption {
  key: 'maxresdefault' | 'sddefault' | 'hqdefault' | 'mqdefault';
  label: string;
  width: number;
  height: number;
  url: string;
  downloadUrl: string;
}

const SAMPLE_VIDEOS = [
  { label: 'MKBHD Tech Review', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { label: 'ISRO Chandrayaan-3', url: 'https://www.youtube.com/watch?v=DLA_64yz8Ss' },
];

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      const vParam = parsed.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
        return vParam;
      }

      const segments = parsed.pathname.split('/').filter(Boolean);
      if (
        segments.length >= 2 &&
        ['shorts', 'embed', 'live', 'v'].includes(segments[0].toLowerCase())
      ) {
        const candidate = segments[1];
        return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
      }
    }
  } catch {
    // Fall through to regex check
  }

  const regexMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return regexMatch ? regexMatch[1] : null;
}

export const YouTubeThumbnailTool: React.FC<Props> = ({ onShowToast }) => {
  const [urlInput, setUrlInput] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [availableThumbnails, setAvailableThumbnails] = useState<ThumbnailOption[]>([]);
  const [selectedResKey, setSelectedResKey] = useState<string>('');
  const [verifiedDimensions, setVerifiedDimensions] = useState<{ w: number; h: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Mobile Feed Preview Simulator State
  const [customUploadUrl, setCustomUploadUrl] = useState<string | null>(null);
  const [customUploadName, setCustomUploadName] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>(
    'I Tested 5 Budget Smartphones Under ₹15,000 in India — Honest Truth!'
  );
  const [previewChannel, setPreviewChannel] = useState<string>('Tech Creator India');
  const [previewViews, setPreviewViews] = useState<string>('1.4L views • 3 hours ago');
  const [previewDuration, setPreviewDuration] = useState<string>('11:42');
  const [feedTheme, setFeedTheme] = useState<'dark' | 'light'>('dark');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedThumbnail =
    availableThumbnails.find((t) => t.key === selectedResKey) || availableThumbnails[0] || null;

  const activePreviewImageUrl = customUploadUrl || selectedThumbnail?.url || null;

  // Client-side image verification helper to ensure we never accept YouTube's 120x90 gray missing-thumbnail placeholder
  const probeImageClientSide = (url: string): Promise<{ valid: boolean; w: number; h: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        if (img.naturalWidth <= 120 && img.naturalHeight <= 90) {
          resolve({ valid: false, w: img.naturalWidth, h: img.naturalHeight });
        } else {
          resolve({ valid: true, w: img.naturalWidth, h: img.naturalHeight });
        }
      };
      img.onerror = () => resolve({ valid: false, w: 0, h: 0 });
      img.src = url;
    });
  };

  const handleFetchThumbnails = async (overrideInput?: string) => {
    const raw = (overrideInput ?? urlInput).trim();
    if (!raw) {
      setError('Please paste a YouTube video URL (watch, youtu.be, or Shorts) or an 11-character Video ID.');
      return;
    }

    const extractedId = extractYouTubeVideoId(raw);
    if (!extractedId) {
      setError(
        'Invalid YouTube link or Video ID. Please paste a valid URL like https://www.youtube.com/watch?v=... or https://youtu.be/...'
      );
      setAvailableThumbnails([]);
      setVideoId(null);
      return;
    }

    setError(null);
    setIsLoading(true);
    setCustomUploadUrl(null);
    setCustomUploadName('');
    setVerifiedDimensions(null);

    try {
      // 1. Try server-side probe first (gives oEmbed title + HEAD size check)
      const response = await fetch(`/api/youtube-probe?videoId=${encodeURIComponent(extractedId)}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.thumbnails) && data.thumbnails.length > 0) {
          setVideoId(extractedId);
          setAvailableThumbnails(data.thumbnails);
          setSelectedResKey(data.thumbnails[0].key);
          if (data.title) setPreviewTitle(data.title);
          if (data.authorName) setPreviewChannel(data.authorName);
          onShowToast(`Found ${data.thumbnails.length} available thumbnail resolutions!`);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback: client-side resolution probing in official order
      const candidates: ThumbnailOption[] = [
        {
          key: 'maxresdefault',
          label: 'HD (1280×720)',
          width: 1280,
          height: 720,
          url: `https://i.ytimg.com/vi/${extractedId}/maxresdefault.jpg`,
          downloadUrl: `/api/youtube-thumbnail?videoId=${extractedId}&res=maxresdefault&download=1`,
        },
        {
          key: 'sddefault',
          label: 'SD (640×480)',
          width: 640,
          height: 480,
          url: `https://i.ytimg.com/vi/${extractedId}/sddefault.jpg`,
          downloadUrl: `/api/youtube-thumbnail?videoId=${extractedId}&res=sddefault&download=1`,
        },
        {
          key: 'hqdefault',
          label: 'High Quality (480×360)',
          width: 480,
          height: 360,
          url: `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg`,
          downloadUrl: `/api/youtube-thumbnail?videoId=${extractedId}&res=hqdefault&download=1`,
        },
        {
          key: 'mqdefault',
          label: 'Medium Quality (320×180)',
          width: 320,
          height: 180,
          url: `https://i.ytimg.com/vi/${extractedId}/mqdefault.jpg`,
          downloadUrl: `/api/youtube-thumbnail?videoId=${extractedId}&res=mqdefault&download=1`,
        },
      ];

      const checks = await Promise.all(
        candidates.map(async (c) => {
          const res = await probeImageClientSide(c.url);
          return res.valid ? c : null;
        })
      );

      const validList = checks.filter((item): item is ThumbnailOption => item !== null);
      if (validList.length === 0) {
        setVideoId(null);
        setAvailableThumbnails([]);
        setError(
          'No public thumbnails are available for this Video ID. The video may be private, deleted, or the ID may not exist.'
        );
        return;
      }

      setVideoId(extractedId);
      setAvailableThumbnails(validList);
      setSelectedResKey(validList[0].key);
      onShowToast(`Loaded ${validList.length} verified thumbnail resolutions.`);
    } catch {
      setError('Network error while checking YouTube thumbnails. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadThumbnail = async () => {
    if (customUploadUrl) {
      const link = document.createElement('a');
      link.href = customUploadUrl;
      link.download = customUploadName || `custom-thumbnail-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Custom thumbnail downloaded!');
      return;
    }

    if (!selectedThumbnail || !videoId) return;

    setIsDownloading(true);
    try {
      const response = await fetch(selectedThumbnail.downloadUrl);
      if (!response.ok) {
        throw new Error('Download endpoint returned error');
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `youtube-thumbnail-${videoId}-${selectedThumbnail.key}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      onShowToast(`Downloaded ${selectedThumbnail.label} thumbnail!`);
    } catch {
      setError('Could not download thumbnail automatically. Try opening the direct image URL in a new tab.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setCustomUploadUrl(objectUrl);
    setCustomUploadName(file.name);
    setError(null);
    onShowToast('Custom thumbnail loaded into YouTube Feed Preview!');
  };

  const handleCopyImageUrl = async () => {
    if (!selectedThumbnail) return;
    const ok = await copyTextToClipboard(selectedThumbnail.url);
    if (ok) {
      setCopiedUrl(true);
      onShowToast('Direct thumbnail URL copied!');
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Card: YouTube URL Input & Custom Upload */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              YouTube Thumbnail Preview &amp; Downloader
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Grab public YouTube thumbnails in verified resolutions or upload your own design to preview how it looks in the real YouTube Mobile feed.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="yt-thumb-url"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              Paste YouTube Video URL, Shorts Link, or 11-Character Video ID
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="yt-thumb-url"
                  type="text"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFetchThumbnails();
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <button
                type="button"
                onClick={() => handleFetchThumbnails()}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-60 min-h-[48px] shrink-0"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Checking Resolutions...' : 'Fetch Thumbnails'}</span>
              </button>
            </div>
          </div>

          {/* Sample Videos + Upload Custom Thumbnail Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Try example URL:
              </span>
              {SAMPLE_VIDEOS.map((sample) => (
                <button
                  key={sample.url}
                  type="button"
                  onClick={() => {
                    setUrlInput(sample.url);
                    handleFetchThumbnails(sample.url);
                  }}
                  className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer min-h-[40px]"
              >
                <Upload className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Upload Custom Thumbnail to Preview</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Split Grid: Left = Resolution Selector & Downloader, Right = Realistic YouTube Mobile Feed Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Selected Thumbnail & Resolutions (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>
                  {customUploadUrl
                    ? 'Custom Uploaded Thumbnail'
                    : selectedThumbnail
                    ? `Public Thumbnail (${selectedThumbnail.label})`
                    : 'Thumbnail Inspector'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {verifiedDimensions
                  ? `Verified image size: ${verifiedDimensions.w}×${verifiedDimensions.h}px`
                  : 'Paste a YouTube link or upload a custom image above'}
              </p>
            </div>

            {selectedThumbnail && !customUploadUrl && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Public Image</span>
              </span>
            )}
          </div>

          {/* Resolution Selector Buttons */}
          {availableThumbnails.length > 0 && !customUploadUrl && (
            <div>
              <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Available Resolutions ({availableThumbnails.length} found):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableThumbnails.map((opt) => {
                  const isActive = opt.key === (selectedThumbnail?.key || '');
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedResKey(opt.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-purple-50 dark:bg-purple-950/70 border-purple-600 dark:border-purple-500 text-purple-700 dark:text-purple-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="block text-xs">{opt.label.split(' ')[0]}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {opt.width}×{opt.height}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!availableThumbnails.some((t) => t.key === 'maxresdefault') && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-2">
                  Note: 1280×720 HD (maxresdefault) was not uploaded by the creator for this video; showing the highest available resolution.
                </p>
              )}
            </div>
          )}

          {/* Thumbnail Display Canvas */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden aspect-video flex items-center justify-center relative">
            {activePreviewImageUrl ? (
              <img
                src={activePreviewImageUrl}
                alt={previewTitle || 'YouTube thumbnail preview'}
                referrerPolicy="no-referrer"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setVerifiedDimensions({ w: img.naturalWidth, h: img.naturalHeight });
                }}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  No thumbnail loaded yet
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Enter any public YouTube URL above to grab its thumbnail, or upload your own 16:9 image to test it in the mobile feed simulator.
                </p>
              </div>
            )}
          </div>

          {/* Action Bar */}
          {activePreviewImageUrl && (
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadThumbnail}
                disabled={isDownloading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isDownloading
                    ? 'Downloading...'
                    : customUploadUrl
                    ? 'Download Custom Image'
                    : `Download ${selectedThumbnail?.label || 'Thumbnail'}`}
                </span>
              </button>

              {selectedThumbnail && !customUploadUrl && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyImageUrl}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer min-h-[44px]"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied Link' : 'Copy Image URL'}</span>
                  </button>

                  <a
                    href={selectedThumbnail.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors min-h-[44px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Original</span>
                  </a>
                </>
              )}

              {customUploadUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomUploadUrl(null);
                    setCustomUploadName('');
                  }}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-3 py-2 cursor-pointer"
                >
                  Clear Custom Upload
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Realistic YouTube Mobile Feed Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                YouTube Mobile Feed Preview
              </h2>
            </div>

            {/* Feed Theme Switcher (Light vs Dark YouTube App) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setFeedTheme('light')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  feedTheme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setFeedTheme('dark')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  feedTheme === 'dark'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Editable Title & Channel Inputs for Feed Testing */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label htmlFor="sim-title" className="font-semibold text-slate-700 dark:text-slate-300">
                  Test Video Title
                </label>
                <span
                  className={`font-mono ${
                    previewTitle.length > 65
                      ? 'text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {previewTitle.length}/100 chars
                </span>
              </div>
              <input
                id="sim-title"
                type="text"
                maxLength={100}
                value={previewTitle}
                onChange={(e) => setPreviewTitle(e.target.value)}
                placeholder="Enter your YouTube video title to test truncation..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="sim-channel" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Channel Name
                </label>
                <input
                  id="sim-channel"
                  type="text"
                  value={previewChannel}
                  onChange={(e) => setPreviewChannel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label htmlFor="sim-duration" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration Badge
                </label>
                <input
                  id="sim-duration"
                  type="text"
                  value={previewDuration}
                  onChange={(e) => setPreviewDuration(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Simulated Phone Frame */}
          <div
            className={`rounded-2xl border overflow-hidden transition-colors ${
              feedTheme === 'dark'
                ? 'bg-[#0f0f0f] border-slate-800 text-white'
                : 'bg-white border-slate-200 text-[#0f0f0f]'
            }`}
          >
            {/* Simulated YouTube Mobile Top Bar */}
            <div
              className={`px-3.5 py-2.5 flex items-center justify-between border-b text-xs font-bold ${
                feedTheme === 'dark' ? 'border-white/10' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-3.5 rounded-xs bg-red-600 relative">
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[8px] text-white"
                    aria-hidden="true"
                  >
                    ▶
                  </span>
                </span>
                <span className="tracking-tight font-extrabold text-sm">YouTube</span>
              </div>
              <span
                className={`text-[10px] font-normal ${
                  feedTheme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Mobile Home Feed
              </span>
            </div>

            {/* Video Feed Card */}
            <div className="pb-4">
              <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                {activePreviewImageUrl ? (
                  <img
                    src={activePreviewImageUrl}
                    alt={previewTitle}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-950 text-white/80 p-4 text-center text-xs">
                    Load a YouTube link or upload a custom thumbnail to preview in the mobile feed
                  </div>
                )}
                {previewDuration && (
                  <span className="absolute bottom-2 right-2 bg-black/85 text-white text-[11px] font-semibold font-mono px-1.5 py-0.5 rounded-xs">
                    {previewDuration}
                  </span>
                )}
              </div>

              {/* Metadata Row below thumbnail */}
              <div className="px-3 pt-3 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {(previewChannel || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-sm font-semibold leading-snug line-clamp-2 break-words ${
                      feedTheme === 'dark' ? 'text-[#f1f1f1]' : 'text-[#0f0f0f]'
                    }`}
                  >
                    {previewTitle || 'Untitled Video'}
                  </h3>
                  <p
                    className={`text-xs mt-1 truncate ${
                      feedTheme === 'dark' ? 'text-[#aaaaaa]' : 'text-[#606060]'
                    }`}
                  >
                    {previewChannel || 'Channel'} • {previewViews}
                  </p>
                </div>
                <MoreVertical
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    feedTheme === 'dark' ? 'text-[#f1f1f1]' : 'text-[#0f0f0f]'
                  }`}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong>CTR Check:</strong> Check if your thumbnail text stays readable next to the bottom-right duration badge (<code className="font-mono">{previewDuration}</code>) and whether your title cuts off after 2 lines.
          </p>
        </div>
      </div>
    </div>
  );
};
