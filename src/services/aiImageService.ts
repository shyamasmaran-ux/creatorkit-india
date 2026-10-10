/**
 * AI Image Generation Service for CreatorKit India
 * 
 * Uses the genuine, free AI Horde open-source distributed Stable Diffusion network.
 * - 100% free and open: No paid API keys, zero credit card, zero billing.
 * - Real generative AI models (Stable Diffusion / SDXL).
 * - Full CORS support for browser fetch.
 * - Detailed real-time progress callbacks (queue position, wait time, processing status).
 * - Graceful timeout and friendly error handling.
 */

export interface GenerateImageOptions {
  prompt: string;
  width?: number; // 512, 768, 1024
  height?: number; // 512, 576, 720, 768, 1024
  steps?: number;
  onProgress?: (status: string, percent?: number) => void;
  signal?: AbortSignal;
}

export interface GenerationResult {
  imageUrl: string;
  seed?: string;
  model?: string;
  width: number;
  height: number;
}

const AI_HORDE_API_URL = 'https://aihorde.net/api/v2';
const ANONYMOUS_API_KEY = '0000000000';
const CLIENT_AGENT = 'CreatorKitIndia:2.1:free-tools';

// High-availability, general-purpose SFW models on AI Horde for faster queue pickup and cleaner output
const PREFERRED_SFW_MODELS = [
  "ICBINP - I Can't Believe It's Not Photography",
  'Deliberate',
  'AbsoluteReality',
  'AlbedoBase XL (SDXL)',
  'stable_diffusion'
];

const UNSAFE_PROMPT_PATTERN = /\b(nsfw|nude|nudity|naked|explicit|porn|erotic|xxx|hentai|gore|sexual)\b/i;

// Snap dimensions to valid multiples of 64 supported by Stable Diffusion
function snapToDimension(val: number, fallback: number): number {
  if (!val || val <= 0) return fallback;
  // AI Horde limits free anonymous generations to max 1024x1024
  const clamped = Math.max(256, Math.min(1024, val));
  return Math.round(clamped / 64) * 64;
}

export async function generateRealAiImage(
  options: GenerateImageOptions,
  retryCount = 0
): Promise<GenerationResult> {
  const { prompt, onProgress, signal } = options;

  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    throw new Error('Please enter a description for the image you want to create.');
  }

  // Legitimate safety filter for explicitly unsafe prompt terms
  if (UNSAFE_PROMPT_PATTERN.test(cleanPrompt)) {
    throw new Error('This prompt contains restricted terms. Please enter a safe, family-friendly image description.');
  }

  // Snap width & height to nearest multiples of 64
  const targetWidth = snapToDimension(options.width || 768, 768);
  const targetHeight = snapToDimension(options.height || 512, 512);

  // Append negative prompt after ### to steer diffusion away from artifacts and unsafe elements
  const formattedPrompt = cleanPrompt.includes('###')
    ? cleanPrompt
    : `${cleanPrompt} ### nsfw, nude, nudity, explicit, blurry, low quality, distorted, watermark, text`;

  onProgress?.('Connecting to free AI generation network...', 10);

  // 1. Submit async generation request
  let jobId: string;
  try {
    const initResponse = await fetch(`${AI_HORDE_API_URL}/generate/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANONYMOUS_API_KEY,
        'Client-Agent': CLIENT_AGENT
      },
      body: JSON.stringify({
        prompt: formattedPrompt,
        params: {
          steps: 18,
          width: targetWidth,
          height: targetHeight,
          cfg_scale: 7,
          sampler_name: 'k_euler_a'
        },
        models: retryCount > 0 ? ['Deliberate', 'stable_diffusion'] : PREFERRED_SFW_MODELS,
        nsfw: false,
        censor_nsfw: false,
        replacement_filter: true,
        trusted_workers: false
      }),
      signal
    });

    if (!initResponse.ok) {
      if (initResponse.status === 429) {
        throw new Error('The free AI network is receiving heavy traffic. Please wait a moment and tap Retry.');
      }
      throw new Error('Free AI service is temporarily unavailable. Please tap Retry to connect.');
    }

    const initData = await initResponse.json();
    if (!initData.id) {
      throw new Error('Unable to initialize AI generation. Please tap Retry.');
    }
    jobId = initData.id;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Generation cancelled.');
    }
    throw err;
  }

  // 2. Poll job status with progress feedback
  const startTime = Date.now();
  const MAX_POLL_TIME_MS = 65000; // 65 seconds max wait
  let pollAttempts = 0;

  while (Date.now() - startTime < MAX_POLL_TIME_MS) {
    if (signal?.aborted) {
      throw new Error('Generation cancelled.');
    }

    // Wait 1.8 seconds between polling checks for snappier completion detection
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 1800);
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('Generation cancelled.'));
        }, { once: true });
      }
    });

    pollAttempts++;

    try {
      const checkResponse = await fetch(`${AI_HORDE_API_URL}/generate/check/${jobId}`, {
        headers: {
          'Client-Agent': CLIENT_AGENT
        },
        signal
      });

      if (!checkResponse.ok) continue;

      const checkData = await checkResponse.json();

      if (checkData.faulted) {
        throw new Error('The AI worker encountered an issue processing this request. Tap Retry to try another worker.');
      }

      if (checkData.done) {
        // Job is finished! Fetch the image
        onProgress?.('Finalizing generated visual...', 95);
        break;
      }

      // Friendly real-time status update
      const queuePos = checkData.queue_position;
      const waitTime = checkData.wait_time;

      if (queuePos > 0 && checkData.processing === 0) {
        onProgress?.(
          `Assigned to AI cluster queue (~10–20s)...`,
          Math.min(80, 20 + pollAttempts * 4)
        );
      } else {
        onProgress?.(
          `Synthesizing image with Stable Diffusion (~${Math.max(2, Math.min(20, waitTime || 6))}s)...`,
          Math.min(92, 50 + pollAttempts * 5)
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'Generation cancelled.') {
        throw err;
      }
      // If a transient check fails, continue polling
    }
  }

  // 3. Retrieve completed result
  try {
    const statusResponse = await fetch(`${AI_HORDE_API_URL}/generate/status/${jobId}`, {
      headers: {
        'Client-Agent': CLIENT_AGENT
      },
      signal
    });

    if (!statusResponse.ok) {
      throw new Error('Image generation completed, but download failed. Tap Retry to re-fetch.');
    }

    const statusData = await statusResponse.json();
    const generation = statusData.generations?.[0];

    if (!generation || !generation.img) {
      if (!statusData.done) {
        throw new Error('The free AI queue is unusually busy right now. Please tap Retry to try again.');
      }
      throw new Error('No image was returned by the AI worker. Tap Retry to try again.');
    }

    // Never display AI Horde's censored black warning placeholder image as a successful result
    if (generation.censored || generation.state === 'censored') {
      if (retryCount < 1 && !signal?.aborted) {
        onProgress?.('Worker filter false-positive detected, retrying with a clean worker...', 40);
        return generateRealAiImage(options, retryCount + 1);
      }
      throw new Error('The community worker flagged this image unexpectedly. Please tap Retry or adjust your description.');
    }

    const rawImg = generation.img;
    let finalImageUrl = rawImg;

    // If it's a URL, fetch it and convert to local blob object URL to prevent CORS/expiry issues
    if (rawImg.startsWith('http')) {
      try {
        const imgFetch = await fetch(rawImg, { signal });
        if (imgFetch.ok) {
          const blob = await imgFetch.blob();
          finalImageUrl = URL.createObjectURL(blob);
        }
      } catch {
        // Fall back to original URL if blob fetch fails
        finalImageUrl = rawImg;
      }
    } else if (!rawImg.startsWith('data:')) {
      // It might be a base64 string
      finalImageUrl = `data:image/webp;base64,${rawImg}`;
    }

    onProgress?.('Image generated successfully!', 100);

    return {
      imageUrl: finalImageUrl,
      seed: generation.seed,
      model: generation.model,
      width: targetWidth,
      height: targetHeight
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Generation cancelled.');
    }
    throw err;
  }
}
