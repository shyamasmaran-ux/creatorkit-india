import React from 'react';
import { Shield, Lock, EyeOff, ServerOff, Cpu } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>Transparent Data Practices</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          CreatorKit India is built so you can access creator tools without mandatory accounts or subscriptions. Below is an accurate breakdown of which tools run strictly inside your browser and which tools send prompts to AI endpoints.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ServerOff className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            1. Tools That Run 100% Locally in Your Browser
          </h2>
          <p>
            Our <strong>Image Editor &amp; Adjuster</strong>, <strong>Image Background Remover</strong>, <strong>Image Format Converter</strong>, <strong>Instagram Bio &amp; Fancy Font Formatter</strong>, <strong>WhatsApp Link &amp; QR Code Generator</strong>, <strong>Hashtag Generator</strong>, and <strong>Creator Text Utilities</strong> execute locally inside your web browser using HTML5 Canvas and client-side JavaScript. Photos you upload to these image tools, phone numbers entered in the WhatsApp QR generator, and text pasted into the bio formatter or word counter are processed in your device's browser memory and are not stored on our application server.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            2. Server-Side AI Generators, YouTube Thumbnail Probe &amp; External Image Endpoints
          </h2>
          <p>
            When you use the <strong>YouTube Title Generator</strong>, <strong>Reel &amp; Shorts Hook / Script Generator</strong>, <strong>Instagram Caption Generator</strong>, <strong>YouTube Description Generator</strong>, or <strong>AI Thumbnail Concept Generator</strong>, your entered topic, keywords, and style options are sent to our backend API routes (<code>/api/generate-titles</code>, <code>/api/generate-reel-scripts</code>, <code>/api/generate-captions</code>, <code>/api/generate-description</code>, and <code>/api/generate-thumbnail-concepts</code>). Our server forwards your prompt to the Google Gemini API to generate responses and keeps a temporary in-memory response cache (up to 10 minutes, capped at 100 entries) to reduce duplicate requests. If the AI service is unavailable, these tools fall back to local template generation in your browser.
          </p>
          <p>
            When you use the <strong>YouTube Thumbnail Preview &amp; Downloader</strong>, the extracted 11-character YouTube video ID is used to load public thumbnail images from YouTube's official image servers (<code>i.ytimg.com</code>) and check public video title metadata via our server helper routes (<code>/api/youtube-probe</code> and <code>/api/youtube-thumbnail</code>). Custom thumbnail images you upload for feed preview remain strictly inside your browser memory.
          </p>
          <p>
            When you generate an optional AI background scene in the <strong>YouTube Thumbnail &amp; AI Visual Studio</strong>, your image prompt and dimensions are sent from your browser to free third-party AI image generation endpoints (AI Horde and Pollinations.ai) to render the requested visual. Requests processed by Google Gemini, YouTube, or third-party image providers are governed by those providers' respective API terms and privacy policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            3. No Mandatory User Accounts
          </h2>
          <p>
            CreatorKit India does not require registration, passwords, email sign-up, or phone number verification to use any tool on the website.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            4. Local Storage &amp; Saved Favorites / History
          </h2>
          <p>
            We do not use advertising pixels or cross-site behavioral tracking scripts. Your browser's <code>localStorage</code> is used strictly on your own device to store your light/dark theme preference (<code>creatorkit-theme</code>), items you star into <strong>Saved Favorites</strong> (<code>creatorkit-saved-items</code>), and your <strong>Recent Generation History</strong> (<code>creatorkit-history-items</code>). You can clear your saved favorites and history at any time using the Clear All button inside the Saved &amp; History panel.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            5. Direct Communications
          </h2>
          <p>
            Our Contact Us form prepares a prefilled <code>mailto:</code> email draft for your device's email app or opens a direct WhatsApp chat link. Contact form details are not stored in a backend database on this site and are only sent when you explicitly press Send in your email application or WhatsApp.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Last updated: October 2026. For questions regarding our privacy practices, contact us at shyamasmaran@gmail.com.
          </p>
        </section>
      </div>
    </div>
  );
};
