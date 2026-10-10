import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '50kb' }));

// Initialize GoogleGenAI SDK (server-side only)
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Primary and fast fallback model (2 models * 6.5s max = 13s worst-case, safely within 15s client timeout)
const TEXT_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-latest'
];

// Simple in-memory LRU cache & in-flight deduplication to avoid redundant duplicate AI requests
const responseCache = new Map<string, { data: any; timestamp: number }>();
const inflightServerRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_ENTRIES = 100;
const PER_MODEL_TIMEOUT_MS = 6500; // 6.5s max per model attempt so fallback finishes within 15s client timeout

function getCachedResponse(key: string): any | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedResponse(key: string, data: any): void {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { data, timestamp: Date.now() });
}

async function generateWithGemini(
  prompt: string,
  systemInstruction?: string,
  expectJson = false
): Promise<string> {
  if (!ai) {
    throw new Error('NO_API_KEY');
  }

  let lastError: Error | null = null;
  for (const model of TEXT_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new Error(`Model ${model} timed out after ${PER_MODEL_TIMEOUT_MS}ms`));
    }, PER_MODEL_TIMEOUT_MS);

    try {
      const config: Record<string, any> = {
        abortSignal: controller.signal,
      };
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (expectJson) {
        config.responseMimeType = 'application/json';
      }
      // Disable hidden thinking overhead on flash models to reduce latency to ~2-5s while preserving full output quality
      if (model.includes('gemini-3')) {
        config.thinkingConfig = { thinkingBudget: 0 };
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      continue;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error('All models unavailable');
}

// 1. YouTube Title Generator API
app.post('/api/generate-titles', async (req, res) => {
  try {
    const { topic, keywords, style, language, forceRefresh } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Please enter a video topic.' });
    }

    const cleanTopic = topic.trim();
    const cleanKeywords = keywords ? String(keywords).trim() : '';
    const cleanStyle = style || 'all';
    const cleanLanguage = language || 'auto';

    const cacheKey = `titles:${cleanTopic.toLowerCase()}|${cleanKeywords.toLowerCase()}|${cleanStyle}|${cleanLanguage}`;
    if (!forceRefresh) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.json({ success: true, titles: cached, cached: true });
      }
    }

    let generationPromise = !forceRefresh ? inflightServerRequests.get(cacheKey) : undefined;
    if (!generationPromise) {
      const systemPrompt = `You are an expert YouTube title strategist for Indian and global creators.
Generate 10 distinct, natural, high-CTR YouTube titles strictly about the user's topic.
Rules:
- Directly reflect the exact topic and keywords without inventing fake events or generic filler clichés.
- Ensure every title uses a different hook or angle (no near-duplicates).
- Language: write in Hindi (Devanagari) if "hindi", Roman Hindi if "hinglish", English if "english", or match input language if "auto".
- Use diverse styles (or focus on the preferred style): "Simple", "Curiosity Style", "Vlog Style", "Educational", "Emotional", "Storytelling", "Review & Honest", "How-To".
- Return ONLY a JSON array of 10 objects: [{"title":"Exact video title","style":"Style Label"}]`;

      const variationNote = forceRefresh ? ` | Regeneration request #${Math.floor(Math.random() * 900 + 100)}: use fresh hooks and angles.` : '';
      const userPrompt = `Topic: "${cleanTopic}"${cleanKeywords ? ` | Keywords: "${cleanKeywords}"` : ''} | Style: ${cleanStyle} | Language: ${cleanLanguage}${variationNote}`;

      generationPromise = (async () => {
        const rawResponse = await generateWithGemini(userPrompt, systemPrompt, true);
        let parsed: any[] = [];
        try {
          const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
          parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse);
        } catch {
          const lines = rawResponse.split('\n').filter(l => l.trim().match(/^\d+[\.\)]/));
          parsed = lines.map((l) => ({
            title: l.replace(/^\d+[\.\)]\s*/, '').replace(/[*_"`]/g, '').trim(),
            style: 'Creator Choice'
          }));
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Failed to parse generated titles');
        }

        const seenTitles = new Set<string>();
        const formattedTitles = parsed
          .map((item, idx) => ({
            id: `gen-${idx + 1}-${Date.now()}`,
            title: String(item.title || '').trim(),
            style: String(item.style || 'Creative').trim()
          }))
          .filter(item => {
            if (!item.title) return false;
            const norm = item.title.toLowerCase();
            if (seenTitles.has(norm)) return false;
            seenTitles.add(norm);
            return true;
          })
          .slice(0, 10);

        if (formattedTitles.length === 0) {
          throw new Error('No valid titles generated');
        }

        setCachedResponse(cacheKey, formattedTitles);
        return formattedTitles;
      })();

      if (!forceRefresh) {
        inflightServerRequests.set(cacheKey, generationPromise);
      }
    }

    try {
      const formattedTitles = await generationPromise;
      res.json({
        success: true,
        titles: formattedTitles
      });
    } finally {
      if (!forceRefresh) {
        inflightServerRequests.delete(cacheKey);
      }
    }
  } catch {
    res.status(503).json({
      error: 'AI title generation is temporarily busy. Please try again in a moment.'
    });
  }
});

// 2. Instagram Caption Generator API
app.post('/api/generate-captions', async (req, res) => {
  try {
    const { topic, postType, tone, extraContext, forceRefresh } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Please enter what your Instagram post is about.' });
    }

    const cleanTopic = topic.trim();
    const cleanType = postType || 'reel';
    const cleanTone = tone || 'friendly';
    const cleanExtra = extraContext ? String(extraContext).trim() : '';

    const cacheKey = `captions:${cleanTopic.toLowerCase()}|${cleanType}|${cleanTone}|${cleanExtra.toLowerCase()}`;
    if (!forceRefresh) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.json({ success: true, captions: cached, cached: true });
      }
    }

    let generationPromise = !forceRefresh ? inflightServerRequests.get(cacheKey) : undefined;
    if (!generationPromise) {
      const systemPrompt = `You are an Instagram copywriter for Indian creators.
Generate 5 distinct, authentic captions strictly tailored to the user's topic, format, and tone.
Rules:
- Each caption must take a unique angle: a strong opening hook, a concise 1-2 sentence body directly about the topic, a natural CTA, and 5 relevant hashtags.
- Match the input language (Hindi, Hinglish, or English) and use natural emojis sparingly.
- Return ONLY a JSON array of 5 objects:
[{"hook":"Opening hook","body":"Concise 1-2 sentence body","cta":"Call to action","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5"]}]`;

      const variationNote = forceRefresh ? ` | Regeneration request #${Math.floor(Math.random() * 900 + 100)}: provide fresh hooks and phrasing.` : '';
      const userPrompt = `Topic: "${cleanTopic}" | Format: ${cleanType} | Tone: ${cleanTone}${cleanExtra ? ` | Context: "${cleanExtra}"` : ''}${variationNote}`;

      generationPromise = (async () => {
        const rawResponse = await generateWithGemini(userPrompt, systemPrompt, true);
        let parsed: any[] = [];
        try {
          const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
          parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse);
        } catch {
          parsed = [];
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Failed to parse generated captions');
        }

        const seenHooks = new Set<string>();
        const formatted = parsed
          .map((item, idx) => {
            const hook = String(item.hook || '').trim();
            const body = String(item.body || '').trim();
            const cta = String(item.cta || '').trim();
            const hashtags = Array.isArray(item.hashtags) ? item.hashtags.map((t: any) => String(t).trim()).filter(Boolean) : [];
            const fullCaption = `${hook}\n\n${body}\n\n${cta}\n\n.\n.\n${hashtags.join(' ')}`.trim();

            return {
              id: `cap-${idx + 1}-${Date.now()}`,
              hook,
              body,
              cta,
              hashtags,
              fullCaption,
              tone: cleanTone,
              postType: cleanType
            };
          })
          .filter(item => {
            if (!item.hook && !item.body) return false;
            const norm = `${item.hook}|${item.body}`.toLowerCase();
            if (seenHooks.has(norm)) return false;
            seenHooks.add(norm);
            return true;
          })
          .slice(0, 5);

        if (formatted.length === 0) {
          throw new Error('No valid captions generated');
        }

        setCachedResponse(cacheKey, formatted);
        return formatted;
      })();

      if (!forceRefresh) {
        inflightServerRequests.set(cacheKey, generationPromise);
      }
    }

    try {
      const formatted = await generationPromise;
      res.json({ success: true, captions: formatted });
    } finally {
      if (!forceRefresh) {
        inflightServerRequests.delete(cacheKey);
      }
    }
  } catch {
    res.status(503).json({
      error: 'AI caption generation is temporarily busy. Please try again in a moment.'
    });
  }
});

// 3. YouTube Description Generator API
app.post('/api/generate-description', async (req, res) => {
  try {
    const { topic, keywords, channelName, socials, includeTimestamps, includeDisclaimer, forceRefresh } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Please enter your video topic.' });
    }

    const cleanTopic = topic.trim();
    const cleanKeywords = keywords ? String(keywords).trim() : '';
    const cleanChannel = channelName ? String(channelName).trim() : 'Creator';
    const socialLinks: string[] = [];
    if (socials?.instagram) socialLinks.push(`Instagram: ${socials.instagram}`);
    if (socials?.telegram) socialLinks.push(`Telegram: ${socials.telegram}`);
    if (socials?.twitter) socialLinks.push(`Twitter/X: ${socials.twitter}`);
    if (socials?.email) socialLinks.push(`Email: ${socials.email}`);

    const cacheKey = `desc:${cleanTopic.toLowerCase()}|${cleanKeywords.toLowerCase()}|${cleanChannel.toLowerCase()}|${socialLinks.join(',')}|${Boolean(includeTimestamps)}|${Boolean(includeDisclaimer)}`;
    if (!forceRefresh) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.json({ success: true, description: cached, cached: true });
      }
    }

    let generationPromise = !forceRefresh ? inflightServerRequests.get(cacheKey) : undefined;
    if (!generationPromise) {
      const systemPrompt = `You are a YouTube SEO specialist. Write a clear, concise, ready-to-publish YouTube video description (~130-180 words) strictly for the user's topic.
Structure:
1. Strong 2-sentence SEO hook explaining the video.
2. 3-4 concise bullet points of key takeaways.
3. ${includeTimestamps ? '4-5 realistic chapter timestamps (starting at 00:00).' : 'No timestamps.'}
4. Brief subscribe CTA for "${cleanChannel}"${socialLinks.length > 0 ? ` and social links (${socialLinks.join(' | ')})` : ''}.
5. ${includeDisclaimer ? 'A 1-sentence standard educational disclaimer.' : 'No disclaimer.'}
6. 5 relevant hashtags on the final line.
Never invent fake facts or filler paragraphs.`;

      const variationNote = forceRefresh ? ` | Regeneration request #${Math.floor(Math.random() * 900 + 100)}: write fresh wording and structure.` : '';
      const userPrompt = `Topic: "${cleanTopic}"${cleanKeywords ? ` | Keywords: "${cleanKeywords}"` : ''} | Channel: "${cleanChannel}"${variationNote}`;

      generationPromise = (async () => {
        const rawResponse = await generateWithGemini(userPrompt, systemPrompt, false);
        const trimmedDesc = rawResponse.trim();
        if (!trimmedDesc) {
          throw new Error('Empty description returned');
        }
        setCachedResponse(cacheKey, trimmedDesc);
        return trimmedDesc;
      })();

      if (!forceRefresh) {
        inflightServerRequests.set(cacheKey, generationPromise);
      }
    }

    try {
      const trimmedDesc = await generationPromise;
      res.json({
        success: true,
        description: trimmedDesc
      });
    } finally {
      if (!forceRefresh) {
        inflightServerRequests.delete(cacheKey);
      }
    }
  } catch {
    res.status(503).json({
      error: 'AI description generation is temporarily busy. Please try again in a moment.'
    });
  }
});

// 4. Reel & YouTube Shorts Hook / Script Generator API
app.post('/api/generate-reel-scripts', async (req, res) => {
  try {
    const { topic, style, language, duration, forceRefresh } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Please enter a video topic for your Reel or Short.' });
    }

    const cleanTopic = topic.trim();
    const cleanStyle = style || 'educational';
    const cleanLang = language || 'hinglish';
    const cleanDuration = duration || '45s';

    const cacheKey = `reels:${cleanTopic.toLowerCase()}|${cleanStyle}|${cleanLang}|${cleanDuration}`;
    if (!forceRefresh) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.json({ success: true, scripts: cached, cached: true });
      }
    }

    let generationPromise = !forceRefresh ? inflightServerRequests.get(cacheKey) : undefined;
    if (!generationPromise) {
      const systemPrompt = `You are a short-form video scriptwriter for Indian YouTube Shorts and Instagram Reels creators.
Generate 3 distinct, topic-specific short-form video script outlines (~30-60 seconds) strictly about the user's topic.
Rules:
- Language: write in Hindi (Devanagari) if "hindi", Roman Hindi conversational Hinglish if "hinglish", or English if "english".
- Each variation MUST use a completely different angle (e.g., Angle 1: Curiosity / Surprising Fact, Angle 2: Common Mistake / Warning, Angle 3: Practical Step-by-Step / Story).
- Never output generic filler; include specific points relevant to the exact topic.
- Return ONLY a JSON array of 3 objects:
[{"angle":"Angle name","hook":"Spoken 0-3s opening hook line","visualCue":"Camera/B-roll visual action for opening","scriptBody":"3-4 bullet points for 0:04 to 0:45","cta":"Final 5s call to action","estimatedDuration":"45 sec"}]`;

      const variationNote = forceRefresh ? ` | Regeneration request #${Math.floor(Math.random() * 900 + 100)}: create fresh hooks and angles.` : '';
      const userPrompt = `Topic: "${cleanTopic}" | Style: ${cleanStyle} | Language: ${cleanLang} | Target Duration: ${cleanDuration}${variationNote}`;

      generationPromise = (async () => {
        const rawResponse = await generateWithGemini(userPrompt, systemPrompt, true);
        let parsed: any[] = [];
        try {
          const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
          parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse);
        } catch {
          parsed = [];
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Failed to parse generated scripts');
        }

        const seenHooks = new Set<string>();
        const formatted = parsed
          .map((item, idx) => ({
            id: `reel-${idx + 1}-${Date.now()}`,
            angle: String(item.angle || `Variation ${idx + 1}`).trim(),
            hook: String(item.hook || '').trim(),
            visualCue: String(item.visualCue || 'Show subject clearly on camera with bold caption overlay').trim(),
            scriptBody: Array.isArray(item.scriptBody)
              ? item.scriptBody.map((b: any) => `• ${String(b).trim()}`).join('\n')
              : String(item.scriptBody || '').trim(),
            cta: String(item.cta || '').trim(),
            estimatedDuration: String(item.estimatedDuration || cleanDuration).trim(),
          }))
          .filter((item) => {
            if (!item.hook || !item.scriptBody) return false;
            const norm = item.hook.toLowerCase();
            if (seenHooks.has(norm)) return false;
            seenHooks.add(norm);
            return true;
          })
          .slice(0, 3);

        if (formatted.length === 0) {
          throw new Error('No valid scripts generated');
        }

        setCachedResponse(cacheKey, formatted);
        return formatted;
      })();

      if (!forceRefresh) {
        inflightServerRequests.set(cacheKey, generationPromise);
      }
    }

    try {
      const formatted = await generationPromise;
      res.json({ success: true, scripts: formatted });
    } finally {
      if (!forceRefresh) {
        inflightServerRequests.delete(cacheKey);
      }
    }
  } catch {
    res.status(503).json({
      error: 'AI script generation is temporarily busy. Please try again in a moment.'
    });
  }
});

// 5. Topic-Specific YouTube Thumbnail Concept Generator API
app.post('/api/generate-thumbnail-concepts', async (req, res) => {
  try {
    const { topic, style, language, forceRefresh } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Please enter your video topic.' });
    }

    const cleanTopic = topic.trim();
    const cleanStyle = style || 'educational';
    const cleanLang = language || 'hinglish';

    const cacheKey = `thumbconcepts:${cleanTopic.toLowerCase()}|${cleanStyle}|${cleanLang}`;
    if (!forceRefresh) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.json({ success: true, concepts: cached, cached: true });
      }
    }

    let generationPromise = !forceRefresh ? inflightServerRequests.get(cacheKey) : undefined;
    if (!generationPromise) {
      const systemPrompt = `You are a YouTube thumbnail art director for Indian creators.
Given a video topic, visual style, and language, design 3 distinct, high-CTR thumbnail concepts.
Rules:
- "headline" MUST be ultra-short (2 to 4 words max) for mobile readability. Write in Hindi (Devanagari) if "hindi", punchy Roman Hindi if "hinglish", or English if "english".
- "subbadge" is a 1-3 word kicker tag (e.g. "REAL TEST", "SACH KYA HAI?", "2025 GUIDE", "BIG MISTAKE").
- "aiScenePrompt" is a detailed visual background description in English for Stable Diffusion (NO text/words in the image prompt; describe subject, lighting, environment, and colors matching the topic).
- "layoutType" must be one of: "left-focus", "center-impact", "split-vs", "top-banner".
- Return ONLY a JSON array of 3 objects:
[{"angleLabel":"Curiosity Hook","headline":"2-4 WORD TEXT","subbadge":"SHORT TAG","bgStart":"#0f172a","bgEnd":"#312e81","accentColor":"#f59e0b","textColor":"#ffffff","layoutType":"left-focus","aiScenePrompt":"Detailed photography/3D scene prompt without text"}]`;

      const variationNote = forceRefresh ? ` | Regeneration #${Math.floor(Math.random() * 900 + 100)}` : '';
      const userPrompt = `Topic: "${cleanTopic}" | Visual Style: ${cleanStyle} | Text Language: ${cleanLang}${variationNote}`;

      generationPromise = (async () => {
        const rawResponse = await generateWithGemini(userPrompt, systemPrompt, true);
        let parsed: any[] = [];
        try {
          const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
          parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse);
        } catch {
          parsed = [];
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Failed to parse thumbnail concepts');
        }

        const validLayouts = ['left-focus', 'center-impact', 'split-vs', 'top-banner'];
        const formatted = parsed
          .map((item, idx) => ({
            id: `tc-${idx + 1}-${Date.now()}`,
            style: cleanStyle,
            angleLabel: String(item.angleLabel || `Concept ${idx + 1}`).trim(),
            headline: String(item.headline || cleanTopic.slice(0, 22)).trim(),
            subbadge: String(item.subbadge || cleanStyle.toUpperCase()).trim(),
            bgStart: /^#[0-9a-fA-F]{6}$/.test(item.bgStart) ? item.bgStart : '#0f172a',
            bgEnd: /^#[0-9a-fA-F]{6}$/.test(item.bgEnd) ? item.bgEnd : '#4338ca',
            accentColor: /^#[0-9a-fA-F]{6}$/.test(item.accentColor) ? item.accentColor : '#f59e0b',
            textColor: /^#[0-9a-fA-F]{6}$/.test(item.textColor) ? item.textColor : '#ffffff',
            layoutType: validLayouts.includes(item.layoutType) ? item.layoutType : 'left-focus',
            aiScenePrompt: String(item.aiScenePrompt || `High contrast YouTube studio background for ${cleanTopic}, dramatic rim lighting, 4k`).trim(),
          }))
          .slice(0, 3);

        setCachedResponse(cacheKey, formatted);
        return formatted;
      })();

      if (!forceRefresh) {
        inflightServerRequests.set(cacheKey, generationPromise);
      }
    }

    try {
      const formatted = await generationPromise;
      res.json({ success: true, concepts: formatted });
    } finally {
      if (!forceRefresh) {
        inflightServerRequests.delete(cacheKey);
      }
    }
  } catch {
    res.status(503).json({
      error: 'AI concept generator is temporarily busy. Using instant local studio concepts.'
    });
  }
});

// 6. YouTube Public Thumbnail Probe & Download Helper
const YT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const YT_RESOLUTIONS = [
  { key: 'maxresdefault', label: 'HD (1280×720)', width: 1280, height: 720 },
  { key: 'sddefault', label: 'SD (640×480)', width: 640, height: 480 },
  { key: 'hqdefault', label: 'High Quality (480×360)', width: 480, height: 360 },
  { key: 'mqdefault', label: 'Medium Quality (320×180)', width: 320, height: 180 },
] as const;

app.get('/api/youtube-probe', async (req, res) => {
  try {
    const videoId = String(req.query.videoId || '').trim();
    if (!YT_ID_REGEX.test(videoId)) {
      return res.status(400).json({ error: 'Invalid YouTube Video ID. A valid ID has 11 characters.' });
    }

    // Check oEmbed metadata & availability in parallel with thumbnail HEAD requests
    const oembedPromise = fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    )
      .then(async (r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const probePromises = YT_RESOLUTIONS.map(async (item) => {
      const url = `https://i.ytimg.com/vi/${videoId}/${item.key}.jpg`;
      try {
        const resp = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(4500),
        });
        if (!resp.ok) return null;
        const contentLength = Number(resp.headers.get('content-length') || '0');
        // YouTube's missing-thumbnail placeholder is ~1097 bytes (120x90 gray icon)
        if (contentLength > 0 && contentLength < 1400) return null;
        return {
          key: item.key,
          label: item.label,
          width: item.width,
          height: item.height,
          url,
          downloadUrl: `/api/youtube-thumbnail?videoId=${videoId}&res=${item.key}&download=1`,
        };
      } catch {
        return null;
      }
    });

    const [meta, ...probed] = await Promise.all([oembedPromise, ...probePromises]);
    const available = probed.filter(Boolean);

    if (available.length === 0) {
      return res.status(404).json({
        error: 'No public thumbnails were found for this video ID. The video may be private, removed, or invalid.',
      });
    }

    return res.json({
      success: true,
      videoId,
      title: meta?.title || '',
      authorName: meta?.author_name || '',
      thumbnails: available,
    });
  } catch {
    return res.status(502).json({
      error: 'Unable to reach YouTube thumbnail servers right now. Please check your connection and try again.',
    });
  }
});

app.get('/api/youtube-thumbnail', async (req, res) => {
  try {
    const videoId = String(req.query.videoId || '').trim();
    const resKey = String(req.query.res || 'hqdefault').trim();
    const validRes = YT_RESOLUTIONS.find((r) => r.key === resKey);

    if (!YT_ID_REGEX.test(videoId) || !validRes) {
      return res.status(400).json({ error: 'Invalid video ID or thumbnail resolution.' });
    }

    const targetUrl = `https://i.ytimg.com/vi/${videoId}/${validRes.key}.jpg`;
    const upstream = await fetch(targetUrl, { signal: AbortSignal.timeout(7000) });

    if (!upstream.ok) {
      return res.status(404).json({ error: 'Requested thumbnail resolution is not available for this video.' });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 1400) {
      return res.status(404).json({ error: 'Thumbnail resolution is unavailable for this video.' });
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (req.query.download === '1') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="youtube-thumbnail-${videoId}-${validRes.key}.jpg"`
      );
    }
    return res.send(buffer);
  } catch {
    return res.status(502).json({ error: 'Failed to download thumbnail image from YouTube.' });
  }
});

// Start dev server with Vite middleware
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CreatorKit India server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch(console.error);
