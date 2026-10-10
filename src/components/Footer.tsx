import React from 'react';
import { MessageSquare, Heart, Shield, Lock, FileText, Compass, ExternalLink } from 'lucide-react';
import { PageTab } from '../types';
import { SITE_CONFIG } from '../config';

interface Props {
  onNavigate: (tab: PageTab) => void;
}

export const Footer: React.FC<Props> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsappRawNumber}?text=${encodeURIComponent(
    SITE_CONFIG.whatsappDefaultMessage
  )}`;

  const handleNav = (tab: PageTab) => {
    onNavigate(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-sm">
                CK
              </div>
              <span className="font-bold text-lg text-white">CreatorKit India</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering Indian YouTubers, Instagram creators, students, and digital entrepreneurs with free, fast, browser-based productivity utilities.
            </p>
            <div className="text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">100% Client-Side Privacy:</span> No logins, no database storage, and no tracking cookies.
            </div>
          </div>

          {/* Tools Navigation */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Creator Tools
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('youtube-title')}
                  className="hover:text-purple-400 transition-colors cursor-pointer"
                >
                  YouTube Title Generator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('youtube-thumbnail')}
                  className="hover:text-red-400 transition-colors cursor-pointer"
                >
                  YouTube Thumbnail Preview &amp; Downloader
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('youtube-calculator')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  YouTube Income &amp; Sponsorship Calculator (₹)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('reel-script')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Reel &amp; Shorts Hook / Script Generator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('instagram-caption')}
                  className="hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Instagram Caption Generator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('instagram-bio')}
                  className="hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Instagram Bio &amp; Fancy Font Formatter
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('instagram-splitter')}
                  className="hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Instagram Carousel &amp; Grid Splitter
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('whatsapp-generator')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  WhatsApp Link &amp; QR Code Generator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('hashtag-generator')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Hashtag Generator for India
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('youtube-description')}
                  className="hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  YouTube Description Generator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('text-to-image')}
                  className="hover:text-purple-400 transition-colors cursor-pointer"
                >
                  YouTube Thumbnail &amp; AI Visual Studio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('all-tools')}
                  className="text-purple-400 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View All 15 Tools</span>
                  <span>→</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Information & Legal
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('about')}
                  className="hover:text-white transition-colors"
                >
                  About CreatorKit India
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact & Support
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('privacy')}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy (Client-Side Only)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('terms')}
                  className="hover:text-white transition-colors"
                >
                  Terms of Use & Fair Use
                </button>
              </li>
            </ul>
          </div>

          {/* Custom Services & WhatsApp */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Custom Content Services
            </h3>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Need personalized scripts, monthly caption calendars, or bespoke social media copy?
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp: {SITE_CONFIG.whatsappPhoneNumber}</span>
            </a>
          </div>
        </div>

        {/* Bottom Credits & Disclaimer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} CreatorKit India. Free educational & productivity utilities for creators.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for the Indian Creator Community
          </p>
        </div>
      </div>
    </footer>
  );
};
