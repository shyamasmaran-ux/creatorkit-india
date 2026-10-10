import { GeneratedCaption, CaptionTone, PostType } from '../types';
import { generateInstagramCaptions } from '../data/templates';

export interface GenerateCaptionOptions {
  topic: string;
  postType: PostType;
  tone: CaptionTone;
  extraContext?: string;
  forceRefresh?: boolean;
  signal?: AbortSignal;
}

export interface CaptionGenerationResponse {
  captions: GeneratedCaption[];
  isAi: boolean;
  fallbackNotice?: string;
}

const REQUEST_TIMEOUT_MS = 15000;
const captionCache = new Map<string, CaptionGenerationResponse>();
const inflightRequests = new Map<string, Promise<CaptionGenerationResponse>>();

export async function fetchGeneratedCaptions(options: GenerateCaptionOptions): Promise<CaptionGenerationResponse> {
  const { topic, postType, tone, extraContext = '', forceRefresh = false, signal } = options;
  const cacheKey = `${topic.trim().toLowerCase()}|${postType}|${tone}|${extraContext.trim().toLowerCase()}`;

  if (signal?.aborted) {
    throw new DOMException('Request cancelled by user', 'AbortError');
  }

  if (!forceRefresh) {
    const cached = captionCache.get(cacheKey);
    if (cached && cached.isAi) {
      return cached;
    }

    const existingInflight = inflightRequests.get(cacheKey);
    if (existingInflight && !signal) {
      return existingInflight;
    }
  }

  const requestPromise = (async (): Promise<CaptionGenerationResponse> => {
    const controller = new AbortController();

    const onCallerAbort = () => {
      controller.abort(signal?.reason || new DOMException('Request cancelled by user', 'AbortError'));
    };

    if (signal) {
      signal.addEventListener('abort', onCallerAbort, { once: true });
    }

    const timeoutId = setTimeout(() => {
      controller.abort(new DOMException('Caption generation timed out after 15s', 'TimeoutError'));
    }, REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch('/api/generate-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, postType, tone, extraContext, forceRefresh }),
        signal: controller.signal
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Caption generation is temporarily busy.');
      }

      if (Array.isArray(data.captions) && data.captions.length > 0) {
        const result: CaptionGenerationResponse = {
          captions: data.captions,
          isAi: true
        };
        captionCache.set(cacheKey, result);
        return result;
      }

      throw new Error('No captions were returned.');
    } catch (err: any) {
      if (signal?.aborted) {
        throw new DOMException('Request cancelled by user', 'AbortError');
      }

      // Use offline template fallback when AI is unavailable, clearly marked as isAi: false
      const fallbackCaptions = generateInstagramCaptions(topic, postType, tone, extraContext);
      if (fallbackCaptions.length > 0) {
        return {
          captions: fallbackCaptions,
          isAi: false,
          fallbackNotice: 'AI service is temporarily unavailable. Showing instant offline template captions instead.'
        };
      }

      throw new Error(err?.message || 'Unable to generate captions right now. Please try again.');
    } finally {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', onCallerAbort);
      }
      inflightRequests.delete(cacheKey);
    }
  })();

  if (!forceRefresh) {
    inflightRequests.set(cacheKey, requestPromise);
  }
  return requestPromise;
}
