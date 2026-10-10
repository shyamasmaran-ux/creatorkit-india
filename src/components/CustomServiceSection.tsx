import React from 'react';
import { MessageSquare, Check, ArrowRight, Sparkles, PhoneCall, HelpCircle } from 'lucide-react';
import { SITE_CONFIG } from '../config';

export const CustomServiceSection: React.FC = () => {
  const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsappRawNumber}?text=${encodeURIComponent(
    SITE_CONFIG.whatsappDefaultMessage
  )}`;

  return (
    <section className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-10 shadow-lg relative overflow-hidden my-12">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>{SITE_CONFIG.customService.badge}</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-3">
          {SITE_CONFIG.customService.title}
        </h2>

        <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl mb-6">
          {SITE_CONFIG.customService.description}
        </p>

        {/* Feature List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {SITE_CONFIG.customService.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs md:text-sm text-slate-200">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Bar with WhatsApp Link */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-slate-700/60">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white px-6 py-3.5 rounded-xl font-bold text-sm md:text-base shadow-lg shadow-emerald-500/20 transition-all cursor-pointer min-h-[48px]"
          >
            <MessageSquare className="w-5 h-5 fill-current" />
            <span>Enquire on WhatsApp ({SITE_CONFIG.whatsappPhoneNumber})</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </a>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Turnaround: {SITE_CONFIG.customService.turnaround} • Direct Creator Support</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          {SITE_CONFIG.customService.pricingNote}
        </p>
      </div>
    </section>
  );
};
