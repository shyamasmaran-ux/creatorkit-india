// src/server/apiApp.ts
import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
var apiApp = express();
var KNOWN_API_PATHS = /* @__PURE__ */ new Set([
  "/generate-titles",
  "/generate-captions",
  "/generate-description",
  "/generate-reel-scripts",
  "/generate-thumbnail-concepts",
  "/youtube-probe",
  "/youtube-thumbnail"
]);
apiApp.use((req, _res, next) => {
  if (req.url && !req.url.startsWith("/api/")) {
    const pathname = req.url.split("?")[0];
    if (KNOWN_API_PATHS.has(pathname)) {
      req.url = `/api${req.url}`;
    }
  }
  next();
});
apiApp.use((req, res, next) => {
  if (!req.url || !req.url.startsWith("/api/")) {
    return next();
  }
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return next();
  }
  if (typeof req.body === "string" && req.body.trim().length > 0) {
    try {
      req.body = JSON.parse(req.body);
      return next();
    } catch {
    }
  }
  express.json({ limit: "50kb" })(req, res, next);
});
function readServerApiKey(varNames, placeholderKeys = []) {
  for (const name of varNames) {
    const raw = process.env[name];
    if (typeof raw !== "string") continue;
    let clean = raw.trim();
    if (clean.startsWith('"') && clean.endsWith('"') || clean.startsWith("'") && clean.endsWith("'")) {
      clean = clean.slice(1, -1).trim();
    }
    if (clean.toLowerCase().startsWith("bearer ")) {
      clean = clean.slice(7).trim();
    }
    if (!clean) continue;
    const lower = clean.toLowerCase();
    const isPlaceholder = placeholderKeys.some((p) => lower === p.toLowerCase()) || lower.includes("placeholder") || lower.includes("your_") || lower.includes("my_");
    if (isPlaceholder) continue;
    return clean;
  }
  return "";
}
function getGroqKey() {
  return readServerApiKey(
    ["GROQ_API_KEY", "VITE_GROQ_API_KEY", "GROQ_KEY", "GROQ_APIKEY"],
    ["MY_GROQ_API_KEY", "YOUR_GROQ_API_KEY"]
  );
}
function getOpenRouterKey() {
  return readServerApiKey(
    ["OPENROUTER_API_KEY", "VITE_OPENROUTER_API_KEY", "OPEN_ROUTER_API_KEY", "OPENROUTER_KEY"],
    ["MY_OPENROUTER_API_KEY", "YOUR_OPENROUTER_API_KEY"]
  );
}
function getGeminiKey() {
  return readServerApiKey(
    ["GEMINI_API_KEY", "VITE_GEMINI_API_KEY", "GEMINI_KEY"],
    ["MY_GEMINI_API_KEY", "YOUR_GEMINI_API_KEY"]
  );
}
function getGeminiClient() {
  const apiKey = getGeminiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
var DEFAULT_GROQ_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b"
];
var OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
var VERIFIED_OPENROUTER_FREE_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-2-9b-it:free",
  "google/gemma-4-31b-it:free"
];
function isVerifiedFreeOpenRouterModel(modelId) {
  const clean = modelId.trim();
  return clean === "openrouter/free" || clean.endsWith(":free");
}
var GEMINI_TEXT_MODELS = [
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-flash-latest"
];
var responseCache = /* @__PURE__ */ new Map();
var inflightServerRequests = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 10 * 60 * 1e3;
var MAX_CACHE_ENTRIES = 100;
var GROQ_TIMEOUT_MS = 6500;
var OPENROUTER_TIMEOUT_MS = 7500;
var GEMINI_TIMEOUT_MS = 15e3;
function getCachedResponse(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}
function setCachedResponse(key, data) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { data, timestamp: Date.now() });
}
function parseJsonArrayFromText(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return [];
  const fenceStripped = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const direct = JSON.parse(fenceStripped);
    if (Array.isArray(direct)) return direct;
    if (direct && typeof direct === "object") {
      const arrayVal = Object.values(direct).find((v) => Array.isArray(v));
      if (arrayVal && arrayVal.length > 0) return arrayVal;
    }
  } catch {
  }
  const firstBracket = fenceStripped.indexOf("[");
  const lastBracket = fenceStripped.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const candidate = fenceStripped.slice(firstBracket, lastBracket + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
    } catch {
    }
  }
  return [];
}
async function generateWithGroq(prompt, systemInstruction, expectJson = false) {
  const apiKey = getGroqKey();
  if (!apiKey) {
    throw new Error("NO_GROQ_KEY");
  }
  const messages = [];
  if (systemInstruction) {
    messages.push({
      role: "system",
      content: expectJson ? `${systemInstruction}
IMPORTANT: Output ONLY a valid JSON array. Do not include markdown fences or extra commentary.` : systemInstruction
    });
  }
  messages.push({ role: "user", content: prompt });
  const configuredModel = (process.env.GROQ_MODEL || "").trim();
  const modelsToTry = [];
  if (configuredModel) {
    modelsToTry.push(configuredModel);
  }
  for (const m of DEFAULT_GROQ_MODELS) {
    if (!modelsToTry.includes(m)) {
      modelsToTry.push(m);
    }
  }
  let lastError = null;
  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new Error(`Groq model ${model} timed out after ${GROQ_TIMEOUT_MS}ms`));
    }, GROQ_TIMEOUT_MS);
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1400
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`Groq HTTP ${response.status}: ${errBody.slice(0, 160)}`);
      }
      const data = await response.json();
      const text = String(data?.choices?.[0]?.message?.content || "").trim();
      if (!text) {
        throw new Error(`Groq model ${model} returned empty content`);
      }
      if (expectJson && parseJsonArrayFromText(text).length === 0) {
        throw new Error(`Groq model ${model} did not return a valid JSON array`);
      }
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (controller.signal.aborted || lastError.message.includes("timed out") || lastError.message.includes("HTTP 401")) {
        break;
      }
      continue;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError || new Error("Groq provider failed");
}
async function generateWithOpenRouter(prompt, systemInstruction, expectJson = false) {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error("NO_OPENROUTER_KEY");
  }
  const configuredModel = (process.env.OPENROUTER_MODEL || "").trim();
  const candidateModels = [];
  if (configuredModel && isVerifiedFreeOpenRouterModel(configuredModel)) {
    candidateModels.push(configuredModel);
  }
  for (const freeModel of VERIFIED_OPENROUTER_FREE_MODELS) {
    if (!candidateModels.includes(freeModel)) {
      candidateModels.push(freeModel);
    }
  }
  const messages = [];
  if (systemInstruction) {
    messages.push({
      role: "system",
      content: expectJson ? `${systemInstruction}
IMPORTANT: Output ONLY a valid JSON array. Do not include markdown fences or extra commentary.` : systemInstruction
    });
  }
  messages.push({ role: "user", content: prompt });
  let lastError = null;
  for (const model of candidateModels) {
    if (!isVerifiedFreeOpenRouterModel(model)) {
      continue;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new Error(`OpenRouter model ${model} timed out after ${OPENROUTER_TIMEOUT_MS}ms`));
    }, OPENROUTER_TIMEOUT_MS);
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "https://creatorkit.india",
          "X-Title": "CreatorKit India"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1400
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`OpenRouter HTTP ${response.status}: ${errBody.slice(0, 160)}`);
      }
      const data = await response.json();
      if (data?.error) {
        throw new Error(`OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      const text = String(data?.choices?.[0]?.message?.content || "").trim();
      if (!text) {
        throw new Error(`OpenRouter model ${model} returned empty content`);
      }
      if (expectJson && parseJsonArrayFromText(text).length === 0) {
        throw new Error(`OpenRouter model ${model} did not return a valid JSON array`);
      }
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message.includes("HTTP 401") || lastError.message.includes("HTTP 429")) {
        break;
      }
      continue;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError || new Error("OpenRouter free backup provider failed");
}
async function generateWithGemini(prompt, systemInstruction, expectJson = false) {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("NO_GEMINI_KEY");
  }
  let lastError = null;
  for (const model of GEMINI_TEXT_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new Error(`Model ${model} timed out after ${GEMINI_TIMEOUT_MS}ms`));
    }, GEMINI_TIMEOUT_MS);
    try {
      const config = {
        abortSignal: controller.signal
      };
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (expectJson) {
        config.responseMimeType = "application/json";
      }
      if (model.includes("gemini-3")) {
        config.thinkingConfig = { thinkingBudget: 0 };
      }
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config
      });
      if (response && response.text) {
        if (expectJson && parseJsonArrayFromText(response.text).length === 0) {
          throw new Error(`Gemini model ${model} did not return a valid JSON array`);
        }
        return response.text;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError || new Error("All Gemini models unavailable");
}
async function generateAiContent(prompt, systemInstruction, expectJson = false) {
  const hasGroqKey = Boolean(getGroqKey());
  const hasOpenRouterKey = Boolean(getOpenRouterKey());
  const hasGeminiKey = Boolean(getGeminiKey());
  if (!hasGroqKey && !hasOpenRouterKey && !hasGeminiKey) {
    throw new Error("NO_AI_PROVIDER_CONFIGURED");
  }
  const providerErrors = [];
  if (hasGroqKey) {
    try {
      return await generateWithGroq(prompt, systemInstruction, expectJson);
    } catch (err) {
      providerErrors.push(`Groq: ${err?.message || "failed"}`);
    }
  }
  if (hasOpenRouterKey) {
    try {
      return await generateWithOpenRouter(prompt, systemInstruction, expectJson);
    } catch (err) {
      providerErrors.push(`OpenRouter: ${err?.message || "failed"}`);
    }
  }
  if (hasGeminiKey) {
    try {
      return await generateWithGemini(prompt, systemInstruction, expectJson);
    } catch (err) {
      providerErrors.push(`Gemini: ${err?.message || "failed"}`);
    }
  }
  const combinedError = new Error("ALL_AI_PROVIDERS_FAILED");
  combinedError.details = providerErrors;
  throw combinedError;
}
function sanitizeErrorDetail(raw) {
  const clean = String(raw || "").trim();
  if (clean.includes("401")) {
    return clean.includes("Groq") ? "Groq authentication failed (HTTP 401: rejected GROQ_API_KEY \u2014 verify key at console.groq.com/keys)" : "OpenRouter authentication failed (HTTP 401: rejected OPENROUTER_API_KEY \u2014 verify key at openrouter.ai/keys)";
  }
  if (clean.includes("404")) {
    return clean.includes("Groq") ? "Groq model unavailable (HTTP 404: requested model not supported on this account)" : "OpenRouter model unavailable (HTTP 404)";
  }
  if (clean.includes("429")) {
    return clean.includes("Groq") ? "Groq rate limit reached (HTTP 429: API request quota reached)" : "OpenRouter rate limit reached (HTTP 429: free model tier limit reached on OpenRouter)";
  }
  if (clean.includes("timed out")) {
    return clean.includes("Groq") ? "Groq request timed out" : "OpenRouter request timed out";
  }
  return clean.slice(0, 120);
}
function getProviderFailureMessage(err, toolLabel) {
  if (err?.message === "NO_AI_PROVIDER_CONFIGURED") {
    return `AI ${toolLabel} is unavailable because server AI keys (GROQ_API_KEY or OPENROUTER_API_KEY) were not found in the server runtime environment. If you recently added them to Vercel Project Settings, please trigger a Redeployment on Vercel so the serverless functions receive the updated environment variables.`;
  }
  if (err?.message === "ALL_AI_PROVIDERS_FAILED" && Array.isArray(err?.details) && err.details.length > 0) {
    const sanitized = err.details.map(sanitizeErrorDetail).join("; ");
    const isRateLimited = err.details.some((d) => d.includes("429"));
    if (isRateLimited) {
      return `Unable to generate ${toolLabel} right now due to provider rate limits: ${sanitized}. Your account's free tier request limit has been reached on the AI provider.`;
    }
    return `Unable to generate ${toolLabel} right now. Upstream AI providers encountered errors: ${sanitized}.`;
  }
  return `Unable to generate ${toolLabel} right now: primary and backup AI providers failed or were unavailable.`;
}
apiApp.post(["/api/generate-titles", "/generate-titles"], async (req, res) => {
  try {
    const { topic, keywords, style, language, forceRefresh } = req.body || {};
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Please enter a video topic." });
    }
    const cleanTopic = topic.trim();
    const cleanKeywords = keywords ? String(keywords).trim() : "";
    const cleanStyle = style || "all";
    const cleanLanguage = language || "auto";
    const cacheKey = `titles:${cleanTopic.toLowerCase()}|${cleanKeywords.toLowerCase()}|${cleanStyle}|${cleanLanguage}`;
    if (!forceRefresh) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.json({ success: true, titles: cached, cached: true });
      }
    }
    let generationPromise = !forceRefresh ? inflightServerRequests.get(cacheKey) : void 0;
    if (!generationPromise) {
      const systemPrompt = `You are an expert YouTube title strategist for Indian and global creators.
Generate 10 distinct, natural, high-CTR YouTube titles strictly about the user's topic.
Rules:
- Directly reflect the exact topic and keywords without inventing fake events or generic filler clich\xE9s.
- Ensure every title uses a different hook or angle (no near-duplicates).
- Language: write in Hindi (Devanagari) if "hindi", Roman Hindi if "hinglish", English if "english", or match input language if "auto".
- Use diverse styles (or focus on the preferred style): "Simple", "Curiosity Style", "Vlog Style", "Educational", "Emotional", "Storytelling", "Review & Honest", "How-To".
- Return ONLY a JSON array of 10 objects: [{"title":"Exact video title","style":"Style Label"}]`;
      const variationNote = forceRefresh ? ` | Regeneration request #${Math.floor(Math.random() * 900 + 100)}: use fresh hooks and angles.` : "";
      const userPrompt = `Topic: "${cleanTopic}"${cleanKeywords ? ` | Keywords: "${cleanKeywords}"` : ""} | Style: ${cleanStyle} | Language: ${cleanLanguage}${variationNote}`;
      generationPromise = (async () => {
        const rawResponse = await generateAiContent(userPrompt, systemPrompt, true);
        const parsed = parseJsonArrayFromText(rawResponse);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("Failed to parse generated titles");
        }
        const seenTitles = /* @__PURE__ */ new Set();
        const formattedTitles = parsed.map((item, idx) => ({
          id: `gen-${idx + 1}-${Date.now()}`,
          title: String(item.title || "").trim(),
          style: String(item.style || "Creative").trim()
        })).filter((item) => {
          if (!item.title) return false;
          const norm = item.title.toLowerCase();
          if (seenTitles.has(norm)) return false;
          seenTitles.add(norm);
          return true;
        }).slice(0, 10);
        if (formattedTitles.length === 0) {
          throw new Error("No valid titles generated");
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
  } catch (err) {
    res.status(503).json({
      error: getProviderFailureMessage(err, "YouTube titles")
    });
  }
});
apiApp.post(["/api/generate-captions", "/generate-captions"], async (req, res) => {
  try {
    const { topic, postType, tone, extraContext, forceRefresh } = req.body || {};
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Please enter what your Instagram post is about." });
    }
    const cleanTopic = topic.trim();
    const cleanType = postType || "reel";
    const cleanTone = tone || "friendly";
    const cleanExtra = extraContext ? String(extraContext).trim() : "";
    const cacheKey = `captions:${cleanTopic.toLowerCase()}|${cleanType}|${cleanTone}|${cleanExtra.toLowerCase()}`;
    if (!forceRefresh) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.json({ success: true, captions: cached, cached: true });
      }
    }
    let generationPromise = !forceRefresh ? inflightServerRequests.get(cacheKey) : void 0;
    if (!generationPromise) {
      const systemPrompt = `You are an Instagram copywriter for Indian creators.
Generate 5 distinct, authentic captions strictly tailored to the user's topic, format, and tone.
Rules:
- Each caption must take a unique angle: a strong opening hook, a concise 1-2 sentence body directly about the topic, a natural CTA, and 5 relevant hashtags.
- Match the input language (Hindi, Hinglish, or English) and use natural emojis sparingly.
- Return ONLY a JSON array of 5 objects:
[{"hook":"Opening hook","body":"Concise 1-2 sentence body","cta":"Call to action","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5"]}]`;
      const variationNote = forceRefresh ? ` | Regeneration request #${Math.floor(Math.random() * 900 + 100)}: provide fresh hooks and phrasing.` : "";
      const userPrompt = `Topic: "${cleanTopic}" | Format: ${cleanType} | Tone: ${cleanTone}${cleanExtra ? ` | Context: "${cleanExtra}"` : ""}${variationNote}`;
      generationPromise = (async () => {
        const rawResponse = await generateAiContent(userPrompt, systemPrompt, true);
        const parsed = parseJsonArrayFromText(rawResponse);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("Failed to parse generated captions");
        }
        const seenHooks = /* @__PURE__ */ new Set();
        const formatted = parsed.map((item, idx) => {
          const hook = String(item.hook || "").trim();
          const body = String(item.body || "").trim();
          const cta = String(item.cta || "").trim();
          const hashtags = Array.isArray(item.hashtags) ? item.hashtags.map((t) => String(t).trim()).filter(Boolean) : [];
          const fullCaption = `${hook}

${body}

${cta}

.
.
${hashtags.join(" ")}`.trim();
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
        }).filter((item) => {
          if (!item.hook && !item.body) return false;
          const norm = `${item.hook}|${item.body}`.toLowerCase();
          if (seenHooks.has(norm)) return false;
          seenHooks.add(norm);
          return true;
        }).slice(0, 5);
        if (formatted.length === 0) {
          throw new Error("No valid captions generated");
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
  } catch (err) {
    res.status(503).json({
      error: getProviderFailureMessage(err, "Instagram captions")
    });
  }
});
apiApp.post(["/api/generate-description", "/generate-description"], async (req, res) => {
  try {
    const { topic, keywords, channelName, socials, includeTimestamps, includeDisclaimer, forceRefresh } = req.body || {};
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Please enter your video topic." });
    }
    const cleanTopic = topic.trim();
    const cleanKeywords = keywords ? String(keywords).trim() : "";
    const cleanChannel = channelName ? String(channelName).trim() : "Creator";
    const socialLinks = [];
    if (socials?.instagram) socialLinks.push(`Instagram: ${socials.instagram}`);
    if (socials?.telegram) socialLinks.push(`Telegram: ${socials.telegram}`);
    if (socials?.twitter) socialLinks.push(`Twitter/X: ${socials.twitter}`);
    if (socials?.email) socialLinks.push(`Email: ${socials.email}`);
    const cacheKey = `desc:${cleanTopic.toLowerCase()}|${cleanKeywords.toLowerCase()}|${cleanChannel.toLowerCase()}|${socialLinks.join(",")}|${Boolean(includeTimestamps)}|${Boolean(includeDisclaimer)}`;
    if (!forceRefresh) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.json({ success: true, description: cached, cached: true });
      }
    }
    let generationPromise = !forceRefresh ? inflightServerRequests.get(cacheKey) : void 0;
    if (!generationPromise) {
      const systemPrompt = `You are a YouTube SEO specialist. Write a clear, concise, ready-to-publish YouTube video description (~130-180 words) strictly for the user's topic.
Structure:
1. Strong 2-sentence SEO hook explaining the video.
2. 3-4 concise bullet points of key takeaways.
3. ${includeTimestamps ? "4-5 realistic chapter timestamps (starting at 00:00)." : "No timestamps."}
4. Brief subscribe CTA for "${cleanChannel}"${socialLinks.length > 0 ? ` and social links (${socialLinks.join(" | ")})` : ""}.
5. ${includeDisclaimer ? "A 1-sentence standard educational disclaimer." : "No disclaimer."}
6. 5 relevant hashtags on the final line.
Never invent fake facts or filler paragraphs.`;
      const variationNote = forceRefresh ? ` | Regeneration request #${Math.floor(Math.random() * 900 + 100)}: write fresh wording and structure.` : "";
      const userPrompt = `Topic: "${cleanTopic}"${cleanKeywords ? ` | Keywords: "${cleanKeywords}"` : ""} | Channel: "${cleanChannel}"${variationNote}`;
      generationPromise = (async () => {
        const rawResponse = await generateAiContent(userPrompt, systemPrompt, false);
        const trimmedDesc = rawResponse.trim();
        if (!trimmedDesc) {
          throw new Error("Empty description returned");
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
  } catch (err) {
    res.status(503).json({
      error: getProviderFailureMessage(err, "YouTube description")
    });
  }
});
apiApp.post(["/api/generate-reel-scripts", "/generate-reel-scripts"], async (req, res) => {
  try {
    const { topic, style, language, duration, forceRefresh } = req.body || {};
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Please enter a video topic for your Reel or Short." });
    }
    const cleanTopic = topic.trim();
    const cleanStyle = style || "educational";
    const cleanLang = language || "hinglish";
    const cleanDuration = duration || "45s";
    const cacheKey = `reels:${cleanTopic.toLowerCase()}|${cleanStyle}|${cleanLang}|${cleanDuration}`;
    if (!forceRefresh) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.json({ success: true, scripts: cached, cached: true });
      }
    }
    let generationPromise = !forceRefresh ? inflightServerRequests.get(cacheKey) : void 0;
    if (!generationPromise) {
      const systemPrompt = `You are a short-form video scriptwriter for Indian YouTube Shorts and Instagram Reels creators.
Generate 3 distinct, topic-specific short-form video script outlines (~30-60 seconds) strictly about the user's topic.
Rules:
- Language: write in Hindi (Devanagari) if "hindi", Roman Hindi conversational Hinglish if "hinglish", or English if "english".
- Each variation MUST use a completely different angle (e.g., Angle 1: Curiosity / Surprising Fact, Angle 2: Common Mistake / Warning, Angle 3: Practical Step-by-Step / Story).
- Never output generic filler; include specific points relevant to the exact topic.
- Return ONLY a JSON array of 3 objects:
[{"angle":"Angle name","hook":"Spoken 0-3s opening hook line","visualCue":"Camera/B-roll visual action for opening","scriptBody":"3-4 bullet points for 0:04 to 0:45","cta":"Final 5s call to action","estimatedDuration":"45 sec"}]`;
      const variationNote = forceRefresh ? ` | Regeneration request #${Math.floor(Math.random() * 900 + 100)}: create fresh hooks and angles.` : "";
      const userPrompt = `Topic: "${cleanTopic}" | Style: ${cleanStyle} | Language: ${cleanLang} | Target Duration: ${cleanDuration}${variationNote}`;
      generationPromise = (async () => {
        const rawResponse = await generateAiContent(userPrompt, systemPrompt, true);
        const parsed = parseJsonArrayFromText(rawResponse);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("Failed to parse generated scripts");
        }
        const seenHooks = /* @__PURE__ */ new Set();
        const formatted = parsed.map((item, idx) => ({
          id: `reel-${idx + 1}-${Date.now()}`,
          angle: String(item.angle || `Variation ${idx + 1}`).trim(),
          hook: String(item.hook || "").trim(),
          visualCue: String(item.visualCue || "Show subject clearly on camera with bold caption overlay").trim(),
          scriptBody: Array.isArray(item.scriptBody) ? item.scriptBody.map((b) => `\u2022 ${String(b).trim()}`).join("\n") : String(item.scriptBody || "").trim(),
          cta: String(item.cta || "").trim(),
          estimatedDuration: String(item.estimatedDuration || cleanDuration).trim()
        })).filter((item) => {
          if (!item.hook || !item.scriptBody) return false;
          const norm = item.hook.toLowerCase();
          if (seenHooks.has(norm)) return false;
          seenHooks.add(norm);
          return true;
        }).slice(0, 3);
        if (formatted.length === 0) {
          throw new Error("No valid scripts generated");
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
  } catch (err) {
    res.status(503).json({
      error: getProviderFailureMessage(err, "Reel & Shorts scripts")
    });
  }
});
apiApp.post(["/api/generate-thumbnail-concepts", "/generate-thumbnail-concepts"], async (req, res) => {
  try {
    const { topic, style, language, forceRefresh } = req.body || {};
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Please enter your video topic." });
    }
    const cleanTopic = topic.trim();
    const cleanStyle = style || "educational";
    const cleanLang = language || "hinglish";
    const cacheKey = `thumbconcepts:${cleanTopic.toLowerCase()}|${cleanStyle}|${cleanLang}`;
    if (!forceRefresh) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.json({ success: true, concepts: cached, cached: true });
      }
    }
    let generationPromise = !forceRefresh ? inflightServerRequests.get(cacheKey) : void 0;
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
      const variationNote = forceRefresh ? ` | Regeneration #${Math.floor(Math.random() * 900 + 100)}` : "";
      const userPrompt = `Topic: "${cleanTopic}" | Visual Style: ${cleanStyle} | Text Language: ${cleanLang}${variationNote}`;
      generationPromise = (async () => {
        const rawResponse = await generateAiContent(userPrompt, systemPrompt, true);
        const parsed = parseJsonArrayFromText(rawResponse);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("Failed to parse thumbnail concepts");
        }
        const validLayouts = ["left-focus", "center-impact", "split-vs", "top-banner"];
        const formatted = parsed.map((item, idx) => ({
          id: `tc-${idx + 1}-${Date.now()}`,
          style: cleanStyle,
          angleLabel: String(item.angleLabel || `Concept ${idx + 1}`).trim(),
          headline: String(item.headline || cleanTopic.slice(0, 22)).trim(),
          subbadge: String(item.subbadge || cleanStyle.toUpperCase()).trim(),
          bgStart: /^#[0-9a-fA-F]{6}$/.test(item.bgStart) ? item.bgStart : "#0f172a",
          bgEnd: /^#[0-9a-fA-F]{6}$/.test(item.bgEnd) ? item.bgEnd : "#4338ca",
          accentColor: /^#[0-9a-fA-F]{6}$/.test(item.accentColor) ? item.accentColor : "#f59e0b",
          textColor: /^#[0-9a-fA-F]{6}$/.test(item.textColor) ? item.textColor : "#ffffff",
          layoutType: validLayouts.includes(item.layoutType) ? item.layoutType : "left-focus",
          aiScenePrompt: String(item.aiScenePrompt || `High contrast YouTube studio background for ${cleanTopic}, dramatic rim lighting, 4k`).trim()
        })).slice(0, 3);
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
  } catch (err) {
    res.status(503).json({
      error: getProviderFailureMessage(err, "thumbnail concepts")
    });
  }
});
var YT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
var YT_RESOLUTIONS = [
  { key: "maxresdefault", label: "HD (1280\xD7720)", width: 1280, height: 720 },
  { key: "sddefault", label: "SD (640\xD7480)", width: 640, height: 480 },
  { key: "hqdefault", label: "High Quality (480\xD7360)", width: 480, height: 360 },
  { key: "mqdefault", label: "Medium Quality (320\xD7180)", width: 320, height: 180 }
];
apiApp.get(["/api/youtube-probe", "/youtube-probe"], async (req, res) => {
  try {
    const videoId = String(req.query.videoId || "").trim();
    if (!YT_ID_REGEX.test(videoId)) {
      return res.status(400).json({ error: "Invalid YouTube Video ID. A valid ID has 11 characters." });
    }
    const oembedPromise = fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { signal: AbortSignal.timeout(5e3) }
    ).then(async (r) => r.ok ? r.json() : null).catch(() => null);
    const probePromises = YT_RESOLUTIONS.map(async (item) => {
      const url = `https://i.ytimg.com/vi/${videoId}/${item.key}.jpg`;
      try {
        const resp = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(4500)
        });
        if (!resp.ok) return null;
        const contentLength = Number(resp.headers.get("content-length") || "0");
        if (contentLength > 0 && contentLength < 1400) return null;
        return {
          key: item.key,
          label: item.label,
          width: item.width,
          height: item.height,
          url,
          downloadUrl: `/api/youtube-thumbnail?videoId=${videoId}&res=${item.key}&download=1`
        };
      } catch {
        return null;
      }
    });
    const [meta, ...probed] = await Promise.all([oembedPromise, ...probePromises]);
    const available = probed.filter(Boolean);
    if (available.length === 0) {
      return res.status(404).json({
        error: "No public thumbnails were found for this video ID. The video may be private, removed, or invalid."
      });
    }
    return res.json({
      success: true,
      videoId,
      title: meta?.title || "",
      authorName: meta?.author_name || "",
      thumbnails: available
    });
  } catch {
    return res.status(502).json({
      error: "Unable to reach YouTube thumbnail servers right now. Please check your connection and try again."
    });
  }
});
apiApp.get(["/api/youtube-thumbnail", "/youtube-thumbnail"], async (req, res) => {
  try {
    const videoId = String(req.query.videoId || "").trim();
    const resKey = String(req.query.res || "hqdefault").trim();
    const validRes = YT_RESOLUTIONS.find((r) => r.key === resKey);
    if (!YT_ID_REGEX.test(videoId) || !validRes) {
      return res.status(400).json({ error: "Invalid video ID or thumbnail resolution." });
    }
    const targetUrl = `https://i.ytimg.com/vi/${videoId}/${validRes.key}.jpg`;
    const upstream = await fetch(targetUrl, { signal: AbortSignal.timeout(7e3) });
    if (!upstream.ok) {
      return res.status(404).json({ error: "Requested thumbnail resolution is not available for this video." });
    }
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 1400) {
      return res.status(404).json({ error: "Thumbnail resolution is unavailable for this video." });
    }
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    if (req.query.download === "1") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="youtube-thumbnail-${videoId}-${validRes.key}.jpg"`
      );
    }
    return res.send(buffer);
  } catch {
    return res.status(502).json({ error: "Failed to download thumbnail image from YouTube." });
  }
});
export {
  apiApp,
  parseJsonArrayFromText
};
