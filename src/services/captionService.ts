import { GeneratedCaption, CaptionTone, PostType } from '../types';

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

const REQUEST_TIMEOUT_MS = 25000;
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
      controller.abort(new DOMException('Caption generation timed out after 25s', 'TimeoutError'));
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
        throw new Error(data.error || 'Both primary and backup AI providers are currently unavailable. Please try again.');
      }

      if (Array.isArray(data.captions) && data.captions.length > 0) {
        const result: CaptionGenerationResponse = {
          captions: data.captions,
          isAi: true
        };
        captionCache.set(cacheKey, result);
        return result;
      }

      throw new Error('No captions were returned by the AI provider.');
    } catch (err: any) {
      if (signal?.aborted || err?.name === 'AbortError') {
        throw new DOMException('Request cancelled by user', 'AbortError');
      }
      if (err?.name === 'TimeoutError') {
        throw new Error('AI caption generation timed out across primary and backup providers. Please try again.');
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
