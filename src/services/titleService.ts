import { GeneratedTitle, TitleStyle } from '../types';

export interface GenerateTitleOptions {
  topic: string;
  keywords?: string;
  style?: TitleStyle;
  language?: 'auto' | 'hindi' | 'hinglish' | 'english';
  forceRefresh?: boolean;
  signal?: AbortSignal;
}

export interface TitleGenerationResponse {
  titles: GeneratedTitle[];
  isAi: boolean;
  fallbackNotice?: string;
}

const REQUEST_TIMEOUT_MS = 25000;
const titleCache = new Map<string, TitleGenerationResponse>();
const inflightRequests = new Map<string, Promise<TitleGenerationResponse>>();

export async function fetchGeneratedTitles(options: GenerateTitleOptions): Promise<TitleGenerationResponse> {
  const { topic, keywords = '', style = 'all', language = 'auto', forceRefresh = false, signal } = options;
  const cacheKey = `${topic.trim().toLowerCase()}|${keywords.trim().toLowerCase()}|${style}|${language}`;

  if (signal?.aborted) {
    throw new DOMException('Request cancelled by user', 'AbortError');
  }

  if (!forceRefresh) {
    const cached = titleCache.get(cacheKey);
    if (cached && cached.isAi) {
      return cached;
    }

    const existingInflight = inflightRequests.get(cacheKey);
    if (existingInflight && !signal) {
      return existingInflight;
    }
  }

  const requestPromise = (async (): Promise<TitleGenerationResponse> => {
    const controller = new AbortController();

    const onCallerAbort = () => {
      controller.abort(signal?.reason || new DOMException('Request cancelled by user', 'AbortError'));
    };

    if (signal) {
      signal.addEventListener('abort', onCallerAbort, { once: true });
    }

    const timeoutId = setTimeout(() => {
      controller.abort(new DOMException('Title generation timed out after 25s', 'TimeoutError'));
    }, REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch('/api/generate-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, keywords, style, language, forceRefresh }),
        signal: controller.signal
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Both primary and backup AI providers are currently unavailable. Please try again.');
      }

      if (Array.isArray(data.titles) && data.titles.length > 0) {
        const result: TitleGenerationResponse = {
          titles: data.titles,
          isAi: true
        };
        titleCache.set(cacheKey, result);
        return result;
      }

      throw new Error('No titles were returned by the AI provider.');
    } catch (err: any) {
      if (signal?.aborted || err?.name === 'AbortError') {
        throw new DOMException('Request cancelled by user', 'AbortError');
      }
      if (err?.name === 'TimeoutError') {
        throw new Error('AI title generation timed out across primary and backup providers. Please try again.');
      }
      throw new Error(err?.message || 'Unable to generate titles right now. Please try again.');
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
