import { ReelScriptStyle, ReelScriptVariation } from '../types';

export interface ReelScriptResponse {
  scripts: ReelScriptVariation[];
  isAi: boolean;
  fallbackNotice?: string;
}

const CLIENT_TIMEOUT_MS = 15000;

export function generateOfflineReelScripts(
  topic: string,
  style: ReelScriptStyle,
  language: 'hindi' | 'hinglish' | 'english',
  duration: string
): ReelScriptVariation[] {
  const cleanTopic = topic.trim();
  const isDevanagari = language === 'hindi' || /[\u0900-\u097F]/.test(cleanTopic);
  const isEnglish = language === 'english';

  if (isDevanagari) {
    return [
      {
        id: `offline-reel-1-${Date.now()}`,
        angle: 'जिज्ञासा और सच्चाई (Curiosity Hook)',
        hook: `90% लोग "${cleanTopic}" के बारे में यह सबसे बड़ी बात नहीं जानते!`,
        visualCue: 'कैमरे के पास आकर हाथ में मुख्य विषय/प्रोडक्ट दिखाएं और स्क्रीन पर बोल्ड टेक्स्ट लगाएं।',
        scriptBody: [
          `• [0:04–0:15] जब भी हम ${cleanTopic} की बात करते हैं, अक्सर लोग सिर्फ ऊपरी जानकारी देखते हैं।`,
          `• [0:15–0:35] असली फर्क तब पड़ता है जब आप इसके 3 मुख्य पहलुओं को सही क्रम में लागू करते हैं।`,
          `• [0:35–0:50] इससे आपका समय भी बचता है और परिणाम भी दोगुना बेहतर मिलता है।`,
        ].join('\n'),
        cta: 'इस रील को सेव करें ताकि बाद में भूल न जाएं, और ऐसे ही वीडियो के लिए फॉलो करें!',
        estimatedDuration: duration,
      },
      {
        id: `offline-reel-2-${Date.now()}`,
        angle: 'आम गलतियाँ (Mistakes to Avoid)',
        hook: `अगर आप भी "${cleanTopic}" शुरू कर रहे हैं, तो यह गलती बिल्कुल मत करना!`,
        visualCue: 'स्क्रीन पर लाल ❌ निशान के साथ शुरुआत करें और फिर सही तरीका ✅ दिखाएं।',
        scriptBody: [
          `• [0:04–0:18] पहली गलती: बिना पूरी जानकारी के जल्दबाजी में शुरुआत करना।`,
          `• [0:18–0:36] सही तरीका: ${cleanTopic} में हमेशा बेसिक स्टेप्स को पहले मजबूत करें।`,
          `• [0:36–0:50] मैंने खुद यह बदलाव किया और नतीजा आपके सामने है।`,
        ].join('\n'),
        cta: 'कमेंट में बताएं आपका अनुभव कैसा रहा और अपने दोस्तों के साथ शेयर करें!',
        estimatedDuration: duration,
      },
      {
        id: `offline-reel-3-${Date.now()}`,
        angle: 'स्टेप-बाय-स्टेप गाइड (Quick Action Guide)',
        hook: `सिर्फ 45 सेकंड में "${cleanTopic}" को सबसे आसान भाषा में समझें:`,
        visualCue: 'तेज़ कट्स (Quick Cuts) के साथ स्क्रीन पर 1, 2, 3 पॉइंटर्स दिखाएं।',
        scriptBody: [
          `• [0:04–0:16] स्टेप 1: सबसे पहले ${cleanTopic} की मुख्य ज़रूरत को पहचानें।`,
          `• [0:16–0:32] स्टेप 2: रोज़ाना 15-20 मिनट प्रैक्टिकल अभ्यास पर ध्यान दें।`,
          `• [0:32–0:48] स्टेप 3: अपने रिज़ल्ट को ट्रैक करें और ज़रूरी सुधार करें।`,
        ].join('\n'),
        cta: 'पार्ट 2 चाहिए तो कमेंट में "YES" लिखें!',
        estimatedDuration: duration,
      },
    ];
  }

  if (isEnglish) {
    return [
      {
        id: `offline-reel-1-${Date.now()}`,
        angle: 'Pattern Interrupt & Curiosity',
        hook: `Stop scrolling if you care about ${cleanTopic} — most people get this completely backwards.`,
        visualCue: 'Close-up talking head with sudden zoom-in and bold yellow subtitle on screen.',
        scriptBody: [
          `• [0:04–0:16] Everyone talks about ${cleanTopic}, but nobody explains the actual starting point.`,
          `• [0:16–0:34] Focus on the core fundamentals first instead of chasing complicated shortcuts.`,
          `• [0:34–0:48] Once you fix this single habit, your results with ${cleanTopic} become consistent.`,
        ].join('\n'),
        cta: 'Save this Reel for your next session and follow for practical breakdowns!',
        estimatedDuration: duration,
      },
      {
        id: `offline-reel-2-${Date.now()}`,
        angle: 'Mistake & Fix Breakdown',
        hook: `The #1 mistake beginners make with ${cleanTopic} (and how to fix it in 30 seconds):`,
        visualCue: 'Split screen or hand gesture showing "Wrong vs Right" approach.',
        scriptBody: [
          `• [0:04–0:18] The Mistake: Trying to do everything at once without a clear checklist.`,
          `• [0:18–0:35] The Fix: Break ${cleanTopic} down into 3 repeatable daily steps.`,
          `• [0:35–0:50] Real takeaway: Consistency beats intensity every single time.`,
        ].join('\n'),
        cta: 'Share this with a friend who needs to hear this today!',
        estimatedDuration: duration,
      },
      {
        id: `offline-reel-3-${Date.now()}`,
        angle: 'Rapid 3-Step Framework',
        hook: `Here is the exact 3-step checklist for ${cleanTopic} I wish I knew earlier:`,
        visualCue: 'Point to 3 text boxes appearing one by one on screen.',
        scriptBody: [
          `• [0:04–0:16] Step 1: Set a clear, measurable goal before starting ${cleanTopic}.`,
          `• [0:16–0:32] Step 2: Use proven tools and avoid unnecessary distractions.`,
          `• [0:32–0:48] Step 3: Review what worked after 7 days and refine your process.`,
        ].join('\n'),
        cta: 'Comment "GUIDE" below and bookmark this video for later!',
        estimatedDuration: duration,
      },
    ];
  }

  // Default: Conversational Indian Hinglish
  return [
    {
      id: `offline-reel-1-${Date.now()}`,
      angle: 'Curiosity & Reality Check (Hinglish)',
      hook: `Bhai, agar aap "${cleanTopic}" try kar rahe ho, toh ruk kar ye 30 seconds zaroor dekh lo!`,
      visualCue: 'Camera ke paas aakar हाथ में मुख्य चीज़ या स्क्रीन रिकॉर्डिंग दिखाएं।',
      scriptBody: [
        `• [0:04–0:16] Jab maine ${cleanTopic} start kiya tha, mujhe laga sab kuch bahut complicated hai.`,
        `• [0:16–0:34] Lekin asli game-changer tab aata hai jab aap basics par focus karte ho aur extra confusion hata dete ho.`,
        `• [0:34–0:48] Is ek simple change se aapka time aur effort dono half ho jayega.`,
      ].join('\n'),
      cta: 'Ye Reel abhi Save kar lo warna baad me dhoondhte rahoge, aur Follow karna mat bhoolna!',
      estimatedDuration: duration,
    },
    {
      id: `offline-reel-2-${Date.now()}`,
      angle: 'Common Mistake Warning (Hinglish)',
      hook: `90% beginners "${cleanTopic}" me ye ek badi galti karte hain — kya aap bhi kar rahe ho?`,
      visualCue: 'Screen par Red Cross ❌ dikhayein aur phir Green Tick ✅ ke saath solution batayein.',
      scriptBody: [
        `• [0:04–0:18] Galti #1: Bina proper plan ke seedha result expect karna.`,
        `• [0:18–0:36] Sahi Tarika: ${cleanTopic} ko step-by-step break karo aur pehle 7 din consistency rakho.`,
        `• [0:36–0:50] Jo log ye simple rule follow karte hain, unka result hamesha standout karta hai.`,
      ].join('\n'),
      cta: 'Apne us dost ko Share karo jo abhi ispe kaam kar raha hai!',
      estimatedDuration: duration,
    },
    {
      id: `offline-reel-3-${Date.now()}`,
      angle: 'Fast 3-Point Checklist (Hinglish)',
      hook: `Sirf 45 seconds me "${cleanTopic}" ka complete practical roadmap samjho:`,
      visualCue: 'Fast jump-cuts ke saath screen par Point 1, Point 2, Point 3 pop-up karein.',
      scriptBody: [
        `• [0:04–0:16] Point 1: Sabse pehle ${cleanTopic} ka core objective clear rakho.`,
        `• [0:16–0:32] Point 2: Free aur practical resources se shuruat karo,faltu kharcha mat karo.`,
        `• [0:32–0:48] Point 3: Har hafte apni progress check karo aur next level par upgrade karo.`,
      ].join('\n'),
      cta: 'Comment me "PART 2" likho agar iska detailed breakdown chahiye!',
      estimatedDuration: duration,
    },
  ];
}

export async function fetchReelScripts(params: {
  topic: string;
  style: ReelScriptStyle;
  language: 'hindi' | 'hinglish' | 'english';
  duration: string;
  forceRefresh?: boolean;
  signal?: AbortSignal;
}): Promise<ReelScriptResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException('Request timed out', 'TimeoutError'));
  }, CLIENT_TIMEOUT_MS);

  const onExternalAbort = () => controller.abort(params.signal?.reason);
  if (params.signal) {
    if (params.signal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException('Aborted', 'AbortError');
    }
    params.signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const response = await fetch('/api/generate-reel-scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: params.topic,
        style: params.style,
        language: params.language,
        duration: params.duration,
        forceRefresh: Boolean(params.forceRefresh),
      }),
      signal: controller.signal,
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.scripts) && data.scripts.length > 0) {
        return {
          scripts: data.scripts,
          isAi: true,
        };
      }
    }

    const fallback = generateOfflineReelScripts(
      params.topic,
      params.style,
      params.language,
      params.duration
    );
    return {
      scripts: fallback,
      isAi: false,
      fallbackNotice:
        'Live AI service is currently busy — showing structured offline template scripts for your topic. Tap "Retry AI Generation" anytime for fresh AI scripts.',
    };
  } catch (err: any) {
    if (params.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const fallback = generateOfflineReelScripts(
      params.topic,
      params.style,
      params.language,
      params.duration
    );
    return {
      scripts: fallback,
      isAi: false,
      fallbackNotice:
        'AI request timed out or network was unreachable — showing structured offline template scripts so you can keep working.',
    };
  } finally {
    clearTimeout(timeoutId);
    params.signal?.removeEventListener('abort', onExternalAbort);
  }
}
