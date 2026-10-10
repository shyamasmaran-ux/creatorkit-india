import React from 'react';
import { FileCheck, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-4">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Terms of Use</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Terms of Use & Fair Use Guidelines
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Welcome to CreatorKit India. By using our website and free utilities, you agree to these transparent and straightforward terms.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            1. 100% Ownership of Your Generated Content
          </h2>
          <p>
            Any video titles, Instagram captions, hashtag selections, YouTube descriptions, or formatted text generated on this platform belong entirely to you. You are free to publish, edit, monetize, and commercialize this content across YouTube, Instagram, Facebook, LinkedIn, TikTok, or your own commercial websites without paying royalties or attributing CreatorKit India.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            2. Permitted Use & Free Access
          </h2>
          <p>
            CreatorKit India provides productivity software free of charge for Indian content creators, students, freelance copywriters, and small businesses. You may use all tools as frequently as you like for personal and professional creative work.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            3. Disclaimer of Algorithmic Guarantees
          </h2>
          <p>
            While our templates and title formats are developed in accordance with creator industry best practices, CreatorKit India cannot guarantee specific YouTube view counts, subscriber milestones, or Instagram algorithm engagement numbers. Social media platforms update their distribution algorithms frequently, and creator success depends on video pacing, production quality, thumbnail intrigue, and audience resonance.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Third-Party Platform Policies</h2>
          <p>
            Users are solely responsible for ensuring that the titles, descriptions, and hashtags they publish comply with YouTube Community Guidelines, Instagram Terms of Use, and applicable Indian cyber regulations. Do not use our tools to produce misleading, spammy, hate speech, or deceptive content.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Limitation of Liability</h2>
          <p>
            CreatorKit India is provided 'as is' without warranty of any kind. Under no circumstances will CreatorKit India be liable for any direct or indirect damages resulting from the use of our browser utilities.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Effective Date: October 2026. If you have questions regarding these terms, write to shyamasmaran@gmail.com.
          </p>
        </section>
      </div>
    </div>
  );
};
