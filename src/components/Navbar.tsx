import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronRight, Video, Instagram, Hash, Type, Compass, Image as ImageIcon, Layout, Repeat, Scissors, Wand2, Sun, Moon, Star, AtSign, Clapperboard, QrCode } from 'lucide-react';
import { PageTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { getSavedItems } from '../services/storageService';

interface Props {
  currentTab: PageTab;
  onNavigate: (tab: PageTab) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenSavedModal?: () => void;
}

export const Navbar: React.FC<Props> = ({ currentTab, onNavigate, darkMode = false, onToggleDarkMode, onOpenSavedModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const syncCount = () => {
      setSavedCount(getSavedItems().length);
    };
    syncCount();
    window.addEventListener('creatorkit-storage-updated', syncCount);
    return () => window.removeEventListener('creatorkit-storage-updated', syncCount);
  }, []);

  const handleNav = (tab: PageTab) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks: { id: PageTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'all-tools', label: 'All Tools' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  const quickTools: { id: PageTab; label: string; icon: React.ReactNode }[] = [
    { id: 'youtube-title', label: 'YouTube Titles', icon: <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" /> },
    { id: 'youtube-thumbnail', label: 'YT Thumbnail Tool', icon: <Layout className="w-4 h-4 text-red-600 dark:text-red-400" /> },
    { id: 'reel-script', label: 'Reel & Shorts Scripts', icon: <Clapperboard className="w-4 h-4 text-rose-600 dark:text-rose-400" /> },
    { id: 'text-to-image', label: 'Thumbnail & AI Studio', icon: <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" /> },
    { id: 'instagram-caption', label: 'IG Captions', icon: <Instagram className="w-4 h-4 text-pink-600 dark:text-pink-400" /> },
    { id: 'instagram-bio', label: 'IG Bio & Fonts', icon: <AtSign className="w-4 h-4 text-pink-600 dark:text-pink-400" /> },
    { id: 'whatsapp-generator', label: 'WhatsApp Link & QR', icon: <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
    { id: 'hashtag-generator', label: 'Hashtags', icon: <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
    { id: 'image-editor', label: 'Image Editor', icon: <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" /> },
    { id: 'format-converter', label: 'Format Converter', icon: <Repeat className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
    { id: 'background-remover', label: 'BG Remover', icon: <Scissors className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
    { id: 'text-utilities', label: 'Text Tools', icon: <Type className="w-4 h-4 text-violet-600 dark:text-violet-400" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-lg tracking-tighter">CK</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg md:text-xl tracking-tight text-slate-900 dark:text-white">
                  CreatorKit
                </span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  India
                </span>
              </div>
              <span className="hidden sm:block text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5">
                Free Creator & Social Media Tools
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNav(link.id)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Theme Toggle + Saved + PWA + CTA */}
          <div className="hidden md:flex items-center gap-2">
            <PWAInstallButton />
            {onOpenSavedModal && (
              <button
                type="button"
                onClick={onOpenSavedModal}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 dark:hover:text-amber-300 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="View Saved Favorites & Recent History"
              >
                <Star className={`w-4 h-4 ${savedCount > 0 ? 'fill-amber-400 text-amber-500' : 'text-amber-500'}`} />
                <span>Saved</span>
                {savedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {savedCount}
                  </span>
                )}
              </button>
            )}
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleNav('all-tools')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Compass className="w-4 h-4" />
              <span>All 13 Tools</span>
            </button>
          </div>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="flex md:hidden items-center gap-1.5">
            <PWAInstallButton />
            {onOpenSavedModal && (
              <button
                type="button"
                onClick={onOpenSavedModal}
                aria-label="Saved Favorites and History"
                className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <Star className={`w-4 h-4 ${savedCount > 0 ? 'fill-amber-400 text-amber-500' : 'text-amber-500'}`} />
                {savedCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {savedCount}
                  </span>
                )}
              </button>
            )}
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleNav('all-tools')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap shrink-0"
            >
              All Tools
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">
              Pages
            </span>
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNav(link.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors ${
                  currentTab === link.id
                    ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">
              Direct Tool Access
            </span>
            {quickTools.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleNav(t.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {t.icon}
                  <span>{t.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
