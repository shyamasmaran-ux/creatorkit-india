import React, { useState, useRef } from 'react';
import { Mail, MessageSquare, Send, AlertCircle, PhoneCall, Copy, Check, ExternalLink } from 'lucide-react';
import { SITE_CONFIG } from '../config';

interface Props {
  onShowToast: (msg: string) => void;
}

const RECIPIENT_EMAIL = 'shyamasmaran@gmail.com';

export const ContactPage: React.FC<Props> = ({ onShowToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Feedback or Tool Suggestion');
  const [message, setMessage] = useState('');
  const [draftPrepared, setDraftPrepared] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mailtoAnchorRef = useRef<HTMLAnchorElement | null>(null);

  const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsappRawNumber}?text=${encodeURIComponent(
    'Hi CreatorKit India team! I have an enquiry or feedback regarding your creator tools.'
  )}`;

  const formattedBody = `Name: ${name.trim()}\nReply-To Email: ${email.trim()}\nTopic: ${subject}\n\nMessage:\n${message.trim()}`;
  const mailtoHref = `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(
    `[CreatorKit India] ${subject} - from ${name.trim()}`
  )}&body=${encodeURIComponent(formattedBody)}`;

  const directWhatsappUrl = `https://wa.me/${SITE_CONFIG.whatsappRawNumber}?text=${encodeURIComponent(
    `Hello CreatorKit India,\n\n${formattedBody}`
  )}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill out all required fields before preparing your email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid email address so we can reply to you.');
      return;
    }

    setError(null);
    setDraftPrepared(true);

    // Trigger functional mailto: link to open the user's email client with prefilled details
    setTimeout(() => {
      mailtoAnchorRef.current?.click();
    }, 50);

    onShowToast(`Opening your email app addressed to ${RECIPIENT_EMAIL}...`);
  };

  const handleCopyFormatted = () => {
    navigator.clipboard.writeText(`To: ${RECIPIENT_EMAIL}\nSubject: [CreatorKit India] ${subject}\n\n${formattedBody}`);
    setCopiedDetails(true);
    onShowToast('Message details copied to clipboard!');
    setTimeout(() => setCopiedDetails(false), 2000);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setMessage('');
    setDraftPrepared(false);
    setError(null);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hidden anchor for triggering mailto: without window.open */}
      <a ref={mailtoAnchorRef} href={mailtoHref} className="hidden" aria-hidden="true">
        Send Email
      </a>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Get in Touch with CreatorKit India
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Have a question, want a new creator tool built, or interested in our bespoke Custom Caption & Content Service? Reach out to us directly via email or WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Direct Email
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              For partnership enquiries, suggestions, or general support:
            </p>
            <a
              href={`mailto:${RECIPIENT_EMAIL}`}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 underline block break-all"
            >
              {RECIPIENT_EMAIL}
            </a>
          </div>

          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-6 border border-emerald-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <PhoneCall className="w-4 h-4" />
              <span>WhatsApp Support</span>
            </div>
            <h2 className="text-base font-bold text-white">Chat on WhatsApp</h2>
            <p className="text-xs text-slate-300">
              Fastest response for custom content, video script orders, and creator collaborations.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open WhatsApp Chat</span>
            </a>
            <p className="text-xs text-slate-300">
              Direct: {SITE_CONFIG.whatsappPhoneNumber}
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          {draftPrepared && (
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Email Draft Prepared — Please Send in Your Email App
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Your message has been prefilled for <strong>{RECIPIENT_EMAIL}</strong>, but <strong>it has not been sent yet</strong>. Please press <strong>Send</strong> inside your email app to complete delivery.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Email App ({RECIPIENT_EMAIL})</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyFormatted}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  {copiedDetails ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDetails ? 'Copied Message Details!' : 'Copy Details Manually'}</span>
                </button>

                <a
                  href={directWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp Instead</span>
                </a>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline ml-auto cursor-pointer"
                >
                  Clear Form
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Compose a Message</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Fill out the fields below to open a prefilled email to <strong>{RECIPIENT_EMAIL}</strong> in your email app. You will need to press Send in your email app to deliver the message.
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="c-name" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Your Name <span className="text-purple-600 dark:text-purple-400">*</span>
                </label>
                <input
                  id="c-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label htmlFor="c-email" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Your Email Address <span className="text-purple-600 dark:text-purple-400">*</span>
                </label>
                <input
                  id="c-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="c-subject" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Subject / Topic
              </label>
              <select
                id="c-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="Feedback or Tool Suggestion">💡 Suggest a New Tool or Improvement</option>
                <option value="Custom Content Service">📝 Custom Caption & Content Service Enquiry</option>
                <option value="Bug or Issue Report">🐛 Report an Issue or Bug</option>
                <option value="General Question">❓ General Creator Support</option>
              </select>
            </div>

            <div>
              <label htmlFor="c-message" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Your Message <span className="text-purple-600 dark:text-purple-400">*</span>
              </label>
              <textarea
                id="c-message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts, suggestions, or what you need help with..."
                className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                <span>Open in Email App ({RECIPIENT_EMAIL})</span>
              </button>

              {name.trim() && message.trim() && (
                <a
                  href={directWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold px-4 py-3 rounded-xl text-xs transition-colors cursor-pointer min-h-[44px]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Or Send via WhatsApp</span>
                </a>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
