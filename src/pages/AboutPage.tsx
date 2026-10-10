import React from 'react';
import { Target, Users, Zap, ShieldCheck, Heart, Sparkles, Compass } from 'lucide-react';
import { PageTab } from '../types';

interface Props {
  onNavigate: (tab: PageTab) => void;
}

export const AboutPage: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-4">
          <Heart className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400" />
          <span>About CreatorKit India</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Free, Accessible Creator Tools for Bharat
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          We built CreatorKit India with one straightforward mission: give Indian YouTubers, Instagram creators, students, and small businesses high-quality creator utilities with zero friction and zero cost.
        </p>
      </div>

      {/* The Problem & Our Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">The Challenge Creators Face</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Most social media tools on the internet today demand $29/month subscriptions, require credit cards that often fail on Indian payment gateways, mandate sign-up emails, or throttle basic features. For a student or beginner creator starting in Delhi, Bengaluru, Pune, Lucknow, or any corner of India, these barriers slow down the creative process.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">The CreatorKit India Solution</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            CreatorKit India requires no mandatory user accounts and no paid subscriptions. Our image editor, background remover, format converter, Instagram bio font formatter, WhatsApp link &amp; QR code generator, hashtag generator, and text utilities run locally in your browser, while our YouTube title, Reel &amp; Shorts script, Instagram caption, YouTube description, and thumbnail concept generators combine server-side AI generation with built-in offline fallback templates.
          </p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Our Core Principles</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy-Conscious Design</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Our image editing, background removal, format conversion, hashtag, and text counter tools run locally inside your browser memory, while AI generators only transmit the topic and parameters needed to generate your requested output.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Transparent &amp; Honest</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              We clearly label whether results come from live AI generation or from our offline fallback templates when the AI service is busy, and we openly explain how each tool works.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm">
              <Users className="w-4 h-4" />
              <span>Made for Indian Audiences</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Templates account for Indian currency references (₹), localized slang and Hinglish options, and the specific dynamics of Indian social media algorithms.
            </p>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 rounded-2xl p-6 sm:p-8 border border-purple-100 dark:border-purple-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Ready to level up your content?</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">Try our free tools right now without creating an account.</p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('all-tools')}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>Explore All Tools</span>
        </button>
      </div>
    </div>
  );
};
