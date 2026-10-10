import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { AllToolsPage } from './pages/AllToolsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { YouTubeTitleGenerator } from './components/tools/YouTubeTitleGenerator';
import { YouTubeThumbnailTool } from './components/tools/YouTubeThumbnailTool';
import { YouTubeCalculator } from './components/tools/YouTubeCalculator';
import { InstagramCaptionGenerator } from './components/tools/InstagramCaptionGenerator';
import { InstagramBioGenerator } from './components/tools/InstagramBioGenerator';
import { InstagramGridSplitter } from './components/tools/InstagramGridSplitter';
import { ReelScriptGenerator } from './components/tools/ReelScriptGenerator';
import { HashtagGenerator } from './components/tools/HashtagGenerator';
import { YouTubeDescriptionGenerator } from './components/tools/YouTubeDescriptionGenerator';
import { WhatsAppGenerator } from './components/tools/WhatsAppGenerator';
import { TextUtilities } from './components/tools/TextUtilities';
import { ImageEditor } from './components/tools/ImageEditor';
import { ImageFormatConverter } from './components/tools/ImageFormatConverter';
import { BackgroundRemover } from './components/tools/BackgroundRemover';
import { TextToImageGenerator } from './components/tools/TextToImageGenerator';
import { SavedItemsModal } from './components/SavedItemsModal';
import { PageTab } from './types';
import { ALL_TOOLS } from './data/toolsList';
import { ChevronRight, ArrowLeft, Star } from 'lucide-react';

const VALID_TABS: PageTab[] = [
  'home',
  'all-tools',
  'youtube-title',
  'youtube-thumbnail',
  'youtube-calculator',
  'instagram-caption',
  'instagram-bio',
  'instagram-splitter',
  'reel-script',
  'hashtag-generator',
  'youtube-description',
  'whatsapp-generator',
  'text-utilities',
  'image-editor',
  'format-converter',
  'background-remover',
  'text-to-image',
  'about',
  'contact',
  'privacy',
  'terms',
];

function getCleanRootUrl(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname || '/'}${window.location.search}`;
}

function getValidTab(value: unknown): PageTab {
  if (typeof value !== 'string') return 'home';
  const normalized = value.replace(/^#\/?/, '').trim().toLowerCase() as PageTab;
  return VALID_TABS.includes(normalized) ? normalized : 'home';
}

function updateMetaTags(title: string, description: string) {
  document.title = title;
  const setMeta = (selector: string, content: string) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', content);
  };
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<PageTab>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('creatorkit-theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('creatorkit-theme', darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [darkMode]);

  // Always open the Home page on initial load or reload, clear any stale URL hash,
  // and support in-session mobile Back/Forward buttons via browser history state.
  useEffect(() => {
    setActiveTab('home');
    window.history.replaceState({ tab: 'home' }, '', getCleanRootUrl());

    const handlePopState = (event: PopStateEvent) => {
      const nextTab = getValidTab(event.state?.tab);
      setActiveTab(nextTab);
      if (window.location.href.includes('#')) {
        window.history.replaceState({ tab: nextTab }, '', getCleanRootUrl());
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleNavigate = (tab: PageTab) => {
    const nextTab = getValidTab(tab);
    setActiveTab(nextTab);
    window.history.pushState({ tab: nextTab }, '', getCleanRootUrl());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Dynamic Document Title and SEO meta tags helper
  useEffect(() => {
    const defaultDesc =
      'Free creator tools for Indian YouTubers, Instagram creators, students, and small businesses. Generate YouTube titles, thumbnails, Reel scripts, Instagram captions, fancy bios, WhatsApp QR codes, and more.';
    const toolMeta = ALL_TOOLS.find((t) => t.id === activeTab);
    if (toolMeta) {
      updateMetaTags(`${toolMeta.title} - CreatorKit India`, toolMeta.description);
    } else {
      switch (activeTab) {
        case 'all-tools':
          updateMetaTags(
            'All 15 Free Creator Tools - CreatorKit India',
            'Browse all 15 free online creator utilities for YouTube, Instagram Reels, Shorts, WhatsApp, and image editing.'
          );
          break;
        case 'about':
          updateMetaTags(
            'About Us - CreatorKit India',
            'Learn how CreatorKit India empowers Indian YouTubers, Instagram creators, and small businesses with free browser-first tools.'
          );
          break;
        case 'contact':
          updateMetaTags(
            'Contact & Support - CreatorKit India',
            'Get in touch with the CreatorKit India team for feedback, support, or custom social media content services.'
          );
          break;
        case 'privacy':
          updateMetaTags(
            'Privacy Policy - CreatorKit India',
            'Transparent breakdown of which CreatorKit India tools run 100% locally in your browser and which use server-side AI endpoints.'
          );
          break;
        case 'terms':
          updateMetaTags(
            'Terms of Use - CreatorKit India',
            'Terms of use and fair usage guidelines for CreatorKit India free creator utilities.'
          );
          break;
        default:
          updateMetaTags('CreatorKit India - Free Creator & Social Media Tools', defaultDesc);
      }
    }
  }, [activeTab]);

  const isToolView = [
    'youtube-title',
    'youtube-thumbnail',
    'youtube-calculator',
    'instagram-caption',
    'instagram-bio',
    'instagram-splitter',
    'reel-script',
    'hashtag-generator',
    'youtube-description',
    'whatsapp-generator',
    'text-utilities',
    'image-editor',
    'format-converter',
    'background-remover',
    'text-to-image',
  ].includes(activeTab);

  const currentToolMeta = ALL_TOOLS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Top Navigation */}
      <Navbar
        currentTab={activeTab}
        onNavigate={handleNavigate}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        onOpenSavedModal={() => setSavedModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Tool View Breadcrumb & Quick Switcher */}
        {isToolView && currentToolMeta && (
          <div className="mb-6 space-y-4">
            {/* Breadcrumb Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <button
                  type="button"
                  onClick={() => handleNavigate('home')}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                >
                  Home
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <button
                  type="button"
                  onClick={() => handleNavigate('all-tools')}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                >
                  Tools
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="text-slate-900 dark:text-slate-100 font-semibold">{currentToolMeta.title}</span>
              </div>

              <button
                type="button"
                onClick={() => setSavedModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/70 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/80 transition-colors cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>Saved &amp; History</span>
              </button>
            </div>

            {/* Quick Mobile Tool Switcher Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => handleNavigate('all-tools')}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>All Tools</span>
              </button>
              {ALL_TOOLS.map((t) => {
                const isActive = t.id === activeTab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleNavigate(t.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {t.shortName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* View Router */}
        {activeTab === 'home' && <HomePage onNavigate={handleNavigate} onShowToast={showToast} />}
        {activeTab === 'all-tools' && <AllToolsPage onNavigate={handleNavigate} />}

        {/* Tool Views */}
        {activeTab === 'youtube-title' && (
          <YouTubeTitleGenerator onShowToast={showToast} />
        )}
        {activeTab === 'youtube-thumbnail' && (
          <YouTubeThumbnailTool onShowToast={showToast} />
        )}
        {activeTab === 'youtube-calculator' && (
          <YouTubeCalculator onShowToast={showToast} />
        )}
        {activeTab === 'instagram-caption' && (
          <InstagramCaptionGenerator onShowToast={showToast} />
        )}
        {activeTab === 'instagram-bio' && (
          <InstagramBioGenerator onShowToast={showToast} />
        )}
        {activeTab === 'instagram-splitter' && (
          <InstagramGridSplitter onShowToast={showToast} />
        )}
        {activeTab === 'reel-script' && (
          <ReelScriptGenerator onShowToast={showToast} />
        )}
        {activeTab === 'hashtag-generator' && (
          <HashtagGenerator onShowToast={showToast} />
        )}
        {activeTab === 'youtube-description' && (
          <YouTubeDescriptionGenerator onShowToast={showToast} />
        )}
        {activeTab === 'whatsapp-generator' && (
          <WhatsAppGenerator onShowToast={showToast} />
        )}
        {activeTab === 'text-utilities' && (
          <TextUtilities onShowToast={showToast} />
        )}
        {activeTab === 'image-editor' && (
          <ImageEditor onShowToast={showToast} />
        )}
        {activeTab === 'format-converter' && (
          <ImageFormatConverter onShowToast={showToast} />
        )}
        {activeTab === 'background-remover' && (
          <BackgroundRemover onShowToast={showToast} />
        )}
        {activeTab === 'text-to-image' && (
          <TextToImageGenerator onShowToast={showToast} />
        )}

        {/* Informational Pages */}
        {activeTab === 'about' && <AboutPage onNavigate={handleNavigate} />}
        {activeTab === 'contact' && <ContactPage onShowToast={showToast} />}
        {activeTab === 'privacy' && <PrivacyPage />}
        {activeTab === 'terms' && <TermsPage />}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Saved Favorites & Recent History Modal */}
      <SavedItemsModal
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
        onNavigate={handleNavigate}
        onShowToast={showToast}
      />

      {/* Global Toast Feedback */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
