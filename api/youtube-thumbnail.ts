import { apiApp } from '../src/server/apiApp.js';

export default function handler(req: any, res: any) {
  if (!req.url || req.url === '/' || req.url.startsWith('/?')) {
    const query = req.url && req.url.startsWith('/?') ? req.url.slice(1) : '';
    req.url = `/api/youtube-thumbnail${query ? `?${query}` : ''}`;
  }
  return apiApp(req, res);
}

