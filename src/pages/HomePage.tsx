import React, { useState } from 'react';
import { 
  Search, Sparkles, Video, Instagram, Hash, FileText, Type, 
  ArrowRight, ShieldCheck, Zap, Smartphone, HelpCircle,
  Image as ImageIcon, Layout, Repeat, Scissors, Wand2,
  AtSign, Clapperboard, QrCode, IndianRupee, Grid
} from 'lucide-react';
import { ALL_TOOLS } from '../data/toolsList';
import { PageTab } from '../types';
import { CustomServiceSection } from '../components/CustomServiceSection';
import { ShareCreatorKitBanner } from '../components/ShareCreatorKitBanner';

interface Props {
  onNavigate: (tab: PageTab) => void;
  onShowToast?: (msg: string) => void;
}

const CATEGORIES = [
  'All',
  'YouTube',
  'Instagram',
  'Image & Design',
  'SEO & Discovery',
  'Text & Utility',
  'AI Creative',
];

export const HomePage: React.FC<Props> = ({ onNavigate, onShowToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;
    const matchesKeyword = tool.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
    const matchesSearch =
      tool.title.toLowerCase().includes(q) ||
      tool.shortName.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q) ||
      matchesKeyword;
    return matchesCategory && matchesSearch;
  });

  const getToolIcon = (icon: string) => {
    switch (icon) {
      case 'Video':
        return <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'Instagram':
        return <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
      case 'AtSign':
        return <AtSign className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
      case 'Clapperboard':
        return <Clapperboard className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'QrCode':
        return <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'IndianRupee':
        return <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Grid':
        return <Grid className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
      case 'Hash':
        return <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Type':
        return <Type className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'Layout':
        return <Layout className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'Repeat':
        return <Repeat className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'Scissors':
        return <Scissors className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Sparkles':
        return <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'YouTube':
        return 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Instagram':
        return 'bg-pink-50 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800';
      case 'SEO & Discovery':
        return 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Text & Utility':
        return 'bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800';
      case 'Image & Design':
        return 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'AI Creative':
        return 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative pt-6 pb-4 md:py-12 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>100% Free Tools for Indian Creators & Businesses</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
          Supercharge Your Content with{' '}
          <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
            CreatorKit India
          </span>
        </h1>

        <p className="mt-4 md:mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Free, lightning-fast generator tools built specifically for Indian YouTubers, Instagram creators, students, and digital sellers. No login, no subscriptions, works right in your browser.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-xl mx-auto">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search 15 tools (e.g. YT Income, IG Grid, Thumbnail, Reel Script, WhatsApp QR)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-16 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm md:text-base transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Instant Client-Side
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Private (No Login)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-blue-500" /> Mobile-First on Android
          </span>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {searchQuery || selectedCategory !== 'All'
                ? `Matching Tools (${filteredTools.length})`
                : `Popular Creator Tools (${ALL_TOOLS.length})`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Pick a tool below to start creating optimized content in seconds.
            </p>
          </div>

          {!searchQuery && selectedCategory === 'All' && (
            <button
              type="button"
              onClick={() => onNavigate('all-tools')}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline cursor-pointer"
            >
              <span>View All {ALL_TOOLS.length} Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {filteredTools.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">
              No tools found matching "{searchQuery || selectedCategory}"
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
            >
              Reset filters and view all tools
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {getToolIcon(tool.icon)}
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getCategoryColor(
                        tool.category
                      )}`}
                    >
                      {tool.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors mb-2">
                    {tool.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    {tool.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate(tool.id)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-purple-600 dark:hover:bg-purple-600 text-slate-800 dark:text-slate-100 hover:text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 group-hover:border-purple-600 transition-all cursor-pointer min-h-[44px]"
                >
                  <span>Open {tool.shortName}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Share CreatorKit Referral Banner */}
      <ShareCreatorKitBanner onShowToast={onShowToast} />

      {/* Why Indian Creators Choose CreatorKit */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Built Specifically for Indian Digital Creators
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Most creator tools online demand paid dollar subscriptions, credit cards, or spam you with logins. CreatorKit India is completely free and works right in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/60">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold mb-3">
              01
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1.5">No Login or Sign-up</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No forms to fill, no email collection, and no passwords to remember. Open any tool and generate what you need in 5 seconds.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold mb-3">
              02
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1.5">Indian Audience Nuances</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Includes Hinglish flavor templates, INR (₹) price-point hooks, and tags tailored for Indian reels, tech unboxings, and students.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold mb-3">
              03
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1.5">100% Android & Mobile Friendly</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tested on mobile viewports. Easy tap targets, 1-click clipboard copy buttons, and lightweight code that runs without lag.
            </p>
          </div>
        </div>
      </section>

      {/* Custom Caption & Content Service (Monetization Preparation) */}
      <CustomServiceSection />

      {/* Frequently Asked Questions */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>Creator FAQ</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
              Are these tools really 100% free to use?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Yes, entirely free. All generator logic runs client-side inside your browser using JavaScript and battle-tested creator templates. There are no paywalls or trial limits.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
              Can I use the generated YouTube titles and captions commercially?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Yes, absolutely. Any title, caption, hashtag set, or description you generate belongs completely to you. You can use them for monetized YouTube channels, client social accounts, or brand sponsorships.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
              Do I need high-speed Wi-Fi to use CreatorKit India?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              No. Because the tool does not rely on heavy cloud servers or paid remote APIs, it loads fast even on 4G and mobile data connections across India.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
