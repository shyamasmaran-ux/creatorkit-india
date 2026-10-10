import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  Copy,
  Check,
  Download,
  Share2,
  Bookmark,
  TrendingUp,
  Briefcase,
  Video,
  Info,
} from 'lucide-react';
import {
  copyTextToClipboard,
  downloadTextAsFile,
  getWhatsAppShareUrl,
} from '../../utils/exportUtils';
import { toggleFavoriteItem } from '../../services/storageService';

interface Props {
  onShowToast: (msg: string) => void;
}

interface NicheConfig {
  id: string;
  label: string;
  rpmMinInr: number;
  rpmAvgInr: number;
  rpmMaxInr: number;
  sponsorCpvInr: number; // Base INR per view for 60s integrated sponsorship
  notes: string;
}

const NICHES: NicheConfig[] = [
  {
    id: 'finance',
    label: 'Finance, Investing & Business',
    rpmMinInr: 120,
    rpmAvgInr: 210,
    rpmMaxInr: 340,
    sponsorCpvInr: 1.4,
    notes: 'Highest advertiser demand in India from fintech, brokers, banking, and SaaS brands.',
  },
  {
    id: 'tech',
    label: 'Tech, Smartphones & Coding',
    rpmMinInr: 75,
    rpmAvgInr: 125,
    rpmMaxInr: 195,
    sponsorCpvInr: 0.95,
    notes: 'Strong Q3/Q4 festive brand budgets from smartphone launches, laptops, and AI/coding platforms.',
  },
  {
    id: 'education',
    label: 'Education, Exam Prep & Career',
    rpmMinInr: 55,
    rpmAvgInr: 95,
    rpmMaxInr: 145,
    sponsorCpvInr: 0.85,
    notes: 'High trust and long watch-time; strong sponsorship demand from EdTech, books, and upskilling.',
  },
  {
    id: 'auto',
    label: 'Automobiles, Bikes & EVs',
    rpmMinInr: 65,
    rpmAvgInr: 115,
    rpmMaxInr: 175,
    sponsorCpvInr: 0.9,
    notes: 'High-ticket purchase audience sought after by accessories, insurance, and auto brands.',
  },
  {
    id: 'vlog',
    label: 'Vlogs, Lifestyle & Travel',
    rpmMinInr: 35,
    rpmAvgInr: 60,
    rpmMaxInr: 95,
    sponsorCpvInr: 0.55,
    notes: 'Broad D2C sponsorship appeal (grooming, fashion, travel booking, and daily lifestyle apps).',
  },
  {
    id: 'food',
    label: 'Cooking, Street Food & Fitness',
    rpmMinInr: 35,
    rpmAvgInr: 58,
    rpmMaxInr: 90,
    sponsorCpvInr: 0.6,
    notes: 'Great fit for kitchen appliances, health supplements, FMCG, and D2C food brands.',
  },
  {
    id: 'gaming',
    label: 'Gaming & Esports',
    rpmMinInr: 22,
    rpmAvgInr: 42,
    rpmMaxInr: 70,
    sponsorCpvInr: 0.38,
    notes: 'High view volume and loyal youth audience; monetizes well via gaming gear and app sponsors.',
  },
  {
    id: 'shorts',
    label: 'YouTube Shorts / Vertical Feed',
    rpmMinInr: 3,
    rpmAvgInr: 6,
    rpmMaxInr: 12,
    sponsorCpvInr: 0.18,
    notes: 'Shorts Feed AdSense RPM in India is lower per 1K views, so brand integrations drive primary income.',
  },
];

const GEO_MULTIPLIERS = [
  { id: 'india', label: 'India Audience (85%+ Indian Viewers)', rpmMult: 1.0, sponsorMult: 1.0 },
  { id: 'mixed', label: 'India + NRI Mix (20%+ US/UK/UAE/Canada)', rpmMult: 1.85, sponsorMult: 1.45 },
  { id: 'global', label: 'Global English Audience (Tier-1 Majority)', rpmMult: 3.2, sponsorMult: 2.2 },
];

const ENGAGEMENT_LEVELS = [
  { id: 'standard', label: 'Standard Engagement (3% – 5%)', mult: 1.0 },
  { id: 'high', label: 'High Community Engagement (6%+)', mult: 1.3 },
  { id: 'authority', label: 'Niche Authority / High Buyer Intent', mult: 1.6 },
];

const VIEW_PRESETS = [
  { label: '5K', value: 5000 },
  { label: '15K', value: 15000 },
  { label: '30K', value: 30000 },
  { label: '50K', value: 50000 },
  { label: '1 Lakh', value: 100000 },
  { label: '5 Lakh', value: 500000 },
];

function formatInr(amount: number): string {
  const rounded = Math.round(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rounded);
}

function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(num));
}

export const YouTubeCalculator: React.FC<Props> = ({ onShowToast }) => {
  const [nicheId, setNicheId] = useState<string>('tech');
  const [viewsPerVideo, setViewsPerVideo] = useState<number>(30000);
  const [videosPerMonth, setVideosPerMonth] = useState<number>(8);
  const [geoId, setGeoId] = useState<string>('india');
  const [engagementId, setEngagementId] = useState<string>('standard');
  const [channelName, setChannelName] = useState<string>('');
  const [copiedCard, setCopiedCard] = useState(false);
  const [savedCard, setSavedCard] = useState(false);

  const selectedNiche = useMemo(
    () => NICHES.find((n) => n.id === nicheId) || NICHES[1],
    [nicheId]
  );

  const selectedGeo = useMemo(
    () => GEO_MULTIPLIERS.find((g) => g.id === geoId) || GEO_MULTIPLIERS[0],
    [geoId]
  );

  const selectedEngagement = useMemo(
    () => ENGAGEMENT_LEVELS.find((e) => e.id === engagementId) || ENGAGEMENT_LEVELS[0],
    [engagementId]
  );

  const calculations = useMemo(() => {
    const safeViews = Math.max(100, viewsPerVideo);
    const safeVideos = Math.max(1, Math.min(100, videosPerMonth));
    const monthlyViews = safeViews * safeVideos;

    const rpmMin = Math.round(selectedNiche.rpmMinInr * selectedGeo.rpmMult);
    const rpmAvg = Math.round(selectedNiche.rpmAvgInr * selectedGeo.rpmMult);
    const rpmMax = Math.round(selectedNiche.rpmMaxInr * selectedGeo.rpmMult);

    const monthlyAdSenseMin = (monthlyViews / 1000) * rpmMin;
    const monthlyAdSenseAvg = (monthlyViews / 1000) * rpmAvg;
    const monthlyAdSenseMax = (monthlyViews / 1000) * rpmMax;

    const yearlyAdSenseAvg = monthlyAdSenseAvg * 12;

    // Sponsorship calculations based on average views per video
    const baseIntegrated =
      safeViews *
      selectedNiche.sponsorCpvInr *
      selectedGeo.sponsorMult *
      selectedEngagement.mult;

    // Round neatly to nearest 500
    const roundNeat = (val: number) => Math.max(1000, Math.round(val / 500) * 500);

    const integratedMin = roundNeat(baseIntegrated * 0.85);
    const integratedMax = roundNeat(baseIntegrated * 1.25);

    const dedicatedMin = roundNeat(baseIntegrated * 2.1);
    const dedicatedMax = roundNeat(baseIntegrated * 3.0);

    const shortReelMin = roundNeat(baseIntegrated * 0.55);
    const shortReelMax = roundNeat(baseIntegrated * 0.85);

    const linkPinMin = roundNeat(baseIntegrated * 0.25);
    const linkPinMax = roundNeat(baseIntegrated * 0.4);

    return {
      monthlyViews,
      rpmMin,
      rpmAvg,
      rpmMax,
      monthlyAdSenseMin,
      monthlyAdSenseAvg,
      monthlyAdSenseMax,
      yearlyAdSenseAvg,
      integratedMin,
      integratedMax,
      dedicatedMin,
      dedicatedMax,
      shortReelMin,
      shortReelMax,
      linkPinMin,
      linkPinMax,
    };
  }, [viewsPerVideo, videosPerMonth, selectedNiche, selectedGeo, selectedEngagement]);

  const rateCardSummaryText = useMemo(() => {
    const brandHeader = channelName.trim()
      ? `${channelName.trim()} — Sponsorship & Collaboration Rate Card`
      : 'Creator Sponsorship & Collaboration Rate Card (India)';

    return [
      `📊 ${brandHeader}`,
      `• Niche: ${selectedNiche.label}`,
      `• Average Views per Video: ${formatIndianNumber(viewsPerVideo)} views`,
      `• Monthly Reach (${videosPerMonth} videos): ~${formatIndianNumber(calculations.monthlyViews)} views/month`,
      `• Audience Profile: ${selectedGeo.label}`,
      '',
      '💼 Brand Integration Deliverables & Rates (INR):',
      `1. 60–90s Integrated Video Shoutout: ${formatInr(calculations.integratedMin)} – ${formatInr(calculations.integratedMax)}`,
      `2. Dedicated Full Review / Feature Video: ${formatInr(calculations.dedicatedMin)} – ${formatInr(calculations.dedicatedMax)}`,
      `3. YouTube Short / Instagram Reel Collaboration: ${formatInr(calculations.shortReelMin)} – ${formatInr(calculations.shortReelMax)}`,
      `4. Pinned Comment + Description Link + Community Post: ${formatInr(calculations.linkPinMin)} – ${formatInr(calculations.linkPinMax)}`,
      '',
      'Generated via CreatorKit India',
    ].join('\n');
  }, [
    channelName,
    selectedNiche,
    viewsPerVideo,
    videosPerMonth,
    selectedGeo,
    calculations,
  ]);

  const handleCopyRateCard = async () => {
    const ok = await copyTextToClipboard(rateCardSummaryText);
    if (ok) {
      setCopiedCard(true);
      onShowToast('Sponsorship Rate Card copied to clipboard!');
      setTimeout(() => setCopiedCard(false), 2000);
    }
  };

  const handleDownloadRateCard = () => {
    const ok = downloadTextAsFile(rateCardSummaryText, 'creator-sponsorship-rate-card');
    if (ok) {
      onShowToast('Rate Card downloaded as .txt file!');
    }
  };

  const handleSaveRateCard = () => {
    const res = toggleFavoriteItem({
      toolId: 'youtube-calculator',
      toolName: 'YT Income & Brand Calculator',
      title: `${selectedNiche.label} (${formatIndianNumber(viewsPerVideo)} avg views)`,
      content: rateCardSummaryText,
    });
    setSavedCard(res.saved);
    onShowToast(
      res.saved
        ? 'Saved Rate Card to Favorites!'
        : 'Removed Rate Card from Favorites'
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calculator Controls (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                YouTube Income &amp; Sponsorship Calculator (₹)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Realistic Indian AdSense RPM benchmarks and brand deal rate cards in ₹ INR.
              </p>
            </div>
          </div>

          {/* Optional Channel Name for Rate Card */}
          <div>
            <label
              htmlFor="calc-channel-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Channel / Creator Name <span className="text-slate-400 font-normal">(Optional, for Rate Card export)</span>
            </label>
            <input
              id="calc-channel-name"
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g. TechWithRohan / Neha Vlogs"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Content Niche Selector */}
          <div>
            <label
              htmlFor="calc-niche"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              1. Select Content Category / Niche
            </label>
            <select
              id="calc-niche"
              value={nicheId}
              onChange={(e) => setNicheId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {NICHES.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label} (Avg India RPM: ₹{n.rpmAvgInr}/1K)
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {selectedNiche.notes}
            </p>
          </div>

          {/* Average Views Per Video */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="calc-views"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                2. Average Views Per Video
              </label>
              <span className="text-sm font-bold font-mono tabular-nums text-purple-600 dark:text-purple-400">
                {formatIndianNumber(viewsPerVideo)} views
              </span>
            </div>

            <input
              id="calc-views"
              type="range"
              min={1000}
              max={500000}
              step={1000}
              value={Math.min(500000, viewsPerVideo)}
              onChange={(e) => setViewsPerVideo(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {VIEW_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setViewsPerVideo(preset.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono tabular-nums transition-colors cursor-pointer ${
                      viewsPerVideo === preset.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min={100}
                max={50000000}
                value={viewsPerVideo}
                onChange={(e) => setViewsPerVideo(Math.max(0, Number(e.target.value)))}
                aria-label="Exact average views per video"
                className="w-28 px-2.5 py-1 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-right"
              />
            </div>
          </div>

          {/* Videos Published Per Month */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="calc-freq"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                3. Videos Uploaded Per Month
              </label>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {videosPerMonth} videos / mo
              </span>
            </div>
            <input
              id="calc-freq"
              type="range"
              min={1}
              max={30}
              step={1}
              value={videosPerMonth}
              onChange={(e) => setVideosPerMonth(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Audience Geography & Engagement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label
                htmlFor="calc-geo"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                4. Viewer Geography
              </label>
              <select
                id="calc-geo"
                value={geoId}
                onChange={(e) => setGeoId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {GEO_MULTIPLIERS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="calc-engagement"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                5. Audience Engagement
              </label>
              <select
                id="calc-engagement"
                value={engagementId}
                onChange={(e) => setEngagementId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {ENGAGEMENT_LEVELS.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Live Revenue & Sponsorship Rate Card (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card 1: AdSense Earnings Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Estimated YouTube AdSense Income
                </h2>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {formatIndianNumber(calculations.monthlyViews)} monthly views
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Conservative Monthly
                </span>
                <span className="text-lg font-extrabold font-mono tabular-nums text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {formatInr(calculations.monthlyAdSenseMin)}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  RPM ~₹{calculations.rpmMin}/1K
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                  Expected Monthly Avg
                </span>
                <span className="text-xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                  {formatInr(calculations.monthlyAdSenseAvg)}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  RPM ~₹{calculations.rpmAvg}/1K
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Peak Q4 / Festive Season
                </span>
                <span className="text-lg font-extrabold font-mono tabular-nums text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {formatInr(calculations.monthlyAdSenseMax)}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  RPM ~₹{calculations.rpmMax}/1K
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 text-slate-600 dark:text-slate-400">
              <span>Estimated Yearly AdSense Projection (12 months):</span>
              <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {formatInr(calculations.yearlyAdSenseAvg)} / year
              </span>
            </div>
          </div>

          {/* Card 2: Brand Sponsorship Rate Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Recommended Brand Sponsorship Rates
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Per Deliverable
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    60–90 Sec Integrated Video Shoutout
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mid-roll or pre-roll segment inside a regular video
                  </p>
                </div>
                <span className="font-bold font-mono tabular-nums text-purple-700 dark:text-purple-300 whitespace-nowrap shrink-0">
                  {formatInr(calculations.integratedMin)} – {formatInr(calculations.integratedMax)}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Dedicated Full Review / Brand Video
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    100% focused on the sponsor product or service
                  </p>
                </div>
                <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
                  {formatInr(calculations.dedicatedMin)} – {formatInr(calculations.dedicatedMax)}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    YouTube Short / Instagram Reel Integration
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    30–60 sec vertical video with CTA &amp; pinned comment
                  </p>
                </div>
                <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
                  {formatInr(calculations.shortReelMin)} – {formatInr(calculations.shortReelMax)}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Link in Description + Pinned Comment Add-On
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    30-day pinned link placement on new upload
                  </p>
                </div>
                <span className="font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                  {formatInr(calculations.linkPinMin)} – {formatInr(calculations.linkPinMax)}
                </span>
              </div>
            </div>

            {/* Action Buttons: Copy / WhatsApp / Download / Save */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRateCard}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[42px] whitespace-nowrap"
              >
                {copiedCard ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCard ? 'Copied Rate Card!' : 'Copy Rate Card'}</span>
              </button>

              <a
                href={getWhatsAppShareUrl(rateCardSummaryText)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[42px] whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadRateCard}
                className="inline-flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[42px] whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .TXT</span>
              </button>

              <button
                type="button"
                onClick={handleSaveRateCard}
                className="inline-flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[42px] whitespace-nowrap"
              >
                <Bookmark className={`w-3.5 h-3.5 ${savedCard ? 'fill-amber-500' : ''}`} />
                <span>{savedCard ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              <p>
                Estimates are based on average Indian YouTube RPMs and creator agency CPV benchmarks. Actual earnings vary by watch time, ad-block rates, Q4 seasonality, and brand conversion metrics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
