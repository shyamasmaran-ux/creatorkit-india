import { generateYouTubeDescription } from '../data/templates';

export interface GenerateDescriptionOptions {
  topic: string;
  keywords?: string;
  channelName?: string;
  socials?: { instagram?: string; twitter?: string; telegram?: string; email?: string };
  includeTimestamps?: boolean;
  includeDisclaimer?: boolean;
  forceRefresh?: boolean;
  signal?: AbortSignal;
}

export interface DescriptionGenerationResponse {
  description: string;
  isAi: boolean;
  fallbackNotice?: string;
}

const REQUEST_TIMEOUT_MS = 15000;
const descriptionCache = new Map<string, DescriptionGenerationResponse>();
const inflightRequests = new Map<string, Promise<DescriptionGenerationResponse>>();

export async function fetchGeneratedDescription(options: GenerateDescriptionOptions): Promise<DescriptionGenerationResponse> {
  const { signal, forceRefresh = false, ...payload } = options;
  const cacheKey = JSON.stringify({
    topic: payload.topic.trim().toLowerCase(),
    keywords: (payload.keywords || '').trim().toLowerCase(),
    channelName: (payload.channelName || '').trim().toLowerCase(),
    socials: payload.socials || {},
    includeTimestamps: Boolean(payload.includeTimestamps),
    includeDisclaimer: Boolean(payload.includeDisclaimer)
  });

  if (signal?.aborted) {
    throw new DOMException('Request cancelled by user', 'AbortError');
  }

  if (!forceRefresh) {
    const cached = descriptionCache.get(cacheKey);
    if (cached && cached.isAi) {
      return cached;
    }

    const existingInflight = inflightRequests.get(cacheKey);
    if (existingInflight && !signal) {
      return existingInflight;
    }
  }

  const requestPromise = (async (): Promise<DescriptionGenerationResponse> => {
    const controller = new AbortController();

    const onCallerAbort = () => {
      controller.abort(signal?.reason || new DOMException('Request cancelled by user', 'AbortError'));
    };

    if (signal) {
      signal.addEventListener('abort', onCallerAbort, { once: true });
    }

    const timeoutId = setTimeout(() => {
      controller.abort(new DOMException('Description generation timed out after 15s', 'TimeoutError'));
    }, REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, forceRefresh }),
        signal: controller.signal
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Description generation is temporarily busy.');
      }

      if (data.description && typeof data.description === 'string' && data.description.trim()) {
        const result: DescriptionGenerationResponse = {
          description: data.description.trim(),
          isAi: true
        };
        descriptionCache.set(cacheKey, result);
        return result;
      }

      throw new Error('No description was returned.');
    } catch (err: any) {
      if (signal?.aborted) {
        throw new DOMException('Request cancelled by user', 'AbortError');
      }

      // Use offline template fallback when AI is unavailable, clearly marked as isAi: false
      const fallbackDesc = generateYouTubeDescription(payload);
      if (fallbackDesc) {
        return {
          description: fallbackDesc,
          isAi: false,
          fallbackNotice: 'AI service is temporarily unavailable. Showing an instant offline template description instead.'
        };
      }

      throw new Error(err?.message || 'Unable to generate description right now. Please try again.');
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
