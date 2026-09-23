import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const ADSENSE_CLIENT = 'ca-pub-3659618950683210';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for iframe embedding across third-party websites
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.removeHeader('X-Frame-Options');
  res.header('Content-Security-Policy', "frame-ancestors *;");
  next();
});

// Domain rate tracking (20 req / domain per 24 hours)
interface RequestLog {
  count: number;
  timestamps: number[];
}

const domainRequests: Record<string, RequestLog> = {};

// API Key Storage & Tracking (60 req / 12h)
interface ApiKeyData {
  key: string;
  name: string;
  createdAt: number;
  requestsCount: number;
  timestamps: number[];
}

const apiKeysStore: Record<string, ApiKeyData> = {
  'demo_ad_key_123': {
    key: 'demo_ad_key_123',
    name: 'Default Demo Key',
    createdAt: Date.now(),
    requestsCount: 0,
    timestamps: [],
  },
};

// Clean timestamps older than window (in milliseconds)
function cleanTimestamps(timestamps: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

// Extract domain from request headers or query
function extractDomain(req: Request): string {
  if (req.query.domain && typeof req.query.domain === 'string') {
    return req.query.domain.replace(/^https?:\/\//, '').split('/')[0];
  }

  const referer = req.headers.referer;
  if (referer) {
    try {
      const url = new URL(referer);
      return url.hostname;
    } catch {
      // fallback
    }
  }

  const origin = req.headers.origin;
  if (origin && typeof origin === 'string') {
    try {
      const url = new URL(origin);
      return url.hostname;
    } catch {
      // fallback
    }
  }

  const host = req.headers.host;
  if (host) return host.split(':')[0];

  const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
  return ip.toString();
}

// Render clean blank white HTML with pure real Google AdSense ad unit ONLY (no fake ads, no mock text)
function renderBlankWhiteAdHtml(type: 'image' | 'video', remainingReqs: number): string {
  const isVideo = type === 'video';
  const slotId = isVideo ? '7890123456' : '1234567890';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>plAds - Real Google AdSense</title>
  <meta name="google-adsense-account" content="${ADSENSE_CLIENT}">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>
  <script async custom-element="amp-auto-ads" src="https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ad-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
    }
    .adsbygoogle {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
    }
  </style>
</head>
<body>
  <amp-auto-ads type="adsense" data-ad-client="${ADSENSE_CLIENT}"></amp-auto-ads>
  <div class="ad-container">
    <ins class="adsbygoogle"
         data-ad-client="${ADSENSE_CLIENT}"
         data-ad-slot="${slotId}"
         data-ad-format="${isVideo ? 'video' : 'auto'}"
         data-full-width-responsive="true"></ins>
  </div>
  <script>
    try {
      (adsbygoogle = window.adsbygoogle || []).push({});
    } catch(e) {}
  </script>
</body>
</html>`;
}

// Render blank white HTML error when domain or key hits limit
function renderLimitExceededHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>plAds - Quota Exceeded</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #ffffff;
      color: #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div>${message}</div>
</body>
</html>`;
}

// -------------------------------------------------------------
// API DIRECTORY / INDEX SUBPATH (/api and /api/)
// -------------------------------------------------------------
app.get(['/api', '/api/'], (req, res) => {
  const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
  const host = req.headers.host || `localhost:${PORT}`;
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const endpoints = {
    service: 'plAds API Subpaths & Endpoints Directory',
    adsensePublisherId: ADSENSE_CLIENT,
    endpoints: {
      imageAd: {
        path: '/api/img',
        method: 'GET',
        description: 'Returns blank white HTML with real Google AdSense Image ad (20 requests per domain per 24h limit)',
        url: `${baseUrl}/api/img`,
        iframeSnippet: `<iframe src="${baseUrl}/api/img" width="100%" height="250" frameborder="0" scrolling="no"></iframe>`
      },
      videoAd: {
        path: '/api/vid',
        method: 'GET',
        description: 'Returns blank white HTML with real Google AdSense Video ad (20 requests per domain per 24h limit)',
        url: `${baseUrl}/api/vid`,
        iframeSnippet: `<iframe src="${baseUrl}/api/vid" width="100%" height="360" frameborder="0" scrolling="no"></iframe>`
      },
      apiKeyImageAd: {
        path: '/api/:apiKey/img',
        method: 'GET',
        description: 'Returns blank white HTML with real Google AdSense Image ad with API Key (60 requests per 12 hours)',
        exampleUrl: `${baseUrl}/api/demo_ad_key_123/img`,
        iframeSnippet: `<iframe src="${baseUrl}/api/YOUR_API_KEY/img" width="100%" height="250" frameborder="0" scrolling="no"></iframe>`
      },
      apiKeyVideoAd: {
        path: '/api/:apiKey/vid',
        method: 'GET',
        description: 'Returns blank white HTML with real Google AdSense Video ad with API Key (60 requests per 12 hours)',
        exampleUrl: `${baseUrl}/api/demo_ad_key_123/vid`,
        iframeSnippet: `<iframe src="${baseUrl}/api/YOUR_API_KEY/vid" width="100%" height="360" frameborder="0" scrolling="no"></iframe>`
      },
      createApiKey: {
        path: '/api/keys',
        method: 'POST',
        description: 'Create a new free tier API key with name',
        body: { name: 'My Website Name' }
      },
      listApiKeys: {
        path: '/api/keys',
        method: 'GET',
        description: 'List all generated API keys with remaining quota'
      },
      stats: {
        path: '/api/stats',
        method: 'GET',
        description: 'View active tracked domains, requests, and limits'
      },
      enterApiPortal: {
        path: '/enter/api',
        method: 'GET',
        description: 'Web dashboard to create and manage API keys'
      }
    }
  };

  if (acceptsHtml && !req.query.json) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>plAds - API Subpaths Directory</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body class="bg-slate-50 text-slate-900 p-6 md:p-12 font-sans antialiased">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">/api</span>
        <span class="text-xs text-slate-500 font-mono">ca-pub-3659618950683210</span>
      </div>
      <h1 class="text-2xl md:text-3xl font-black text-slate-900">plAds API Subpaths &amp; Endpoints</h1>
      <p class="text-sm text-slate-600">All available HTTP subpaths for embedding pure Google AdSense ads and managing API keys.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Image Ad Subpath -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <span class="font-mono text-sm font-bold text-blue-600">/api/img</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">20 Req/Domain</span>
        </div>
        <p class="text-xs text-slate-600">Pure blank white HTML containing real Google AdSense image banner ad.</p>
        <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
          <a href="/api/img" target="_blank" class="text-xs text-blue-600 hover:underline font-bold">Open Endpoint →</a>
        </div>
      </div>

      <!-- Video Ad Subpath -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <span class="font-mono text-sm font-bold text-indigo-600">/api/vid</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">20 Req/Domain</span>
        </div>
        <p class="text-xs text-slate-600">Pure blank white HTML containing real Google AdSense video ad unit.</p>
        <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
          <a href="/api/vid" target="_blank" class="text-xs text-indigo-600 hover:underline font-bold">Open Endpoint →</a>
        </div>
      </div>

      <!-- API Key Image Ad Subpath -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <span class="font-mono text-sm font-bold text-blue-600">/api/:apiKey/img</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">60 Req/12h</span>
        </div>
        <p class="text-xs text-slate-600">AdSense image ad stream authenticated with your API key.</p>
        <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
          <a href="/api/demo_ad_key_123/img" target="_blank" class="text-xs text-blue-600 hover:underline font-bold">Demo Key Image →</a>
        </div>
      </div>

      <!-- API Key Video Ad Subpath -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <span class="font-mono text-sm font-bold text-indigo-600">/api/:apiKey/vid</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">60 Req/12h</span>
        </div>
        <p class="text-xs text-slate-600">AdSense video ad stream authenticated with your API key.</p>
        <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
          <a href="/api/demo_ad_key_123/vid" target="_blank" class="text-xs text-indigo-600 hover:underline font-bold">Demo Key Video →</a>
        </div>
      </div>

      <!-- API Keys Manager -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <span class="font-mono text-sm font-bold text-slate-900">/api/keys</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">JSON</span>
        </div>
        <p class="text-xs text-slate-600">Create (POST) and list (GET) generated API keys.</p>
        <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
          <a href="/api/keys" target="_blank" class="text-xs text-blue-600 hover:underline font-bold">View JSON →</a>
        </div>
      </div>

      <!-- Stats Endpoint -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <span class="font-mono text-sm font-bold text-slate-900">/api/stats</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">JSON</span>
        </div>
        <p class="text-xs text-slate-600">View tracked domain quotas and lifetime request hits.</p>
        <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
          <a href="/api/stats" target="_blank" class="text-xs text-blue-600 hover:underline font-bold">View JSON →</a>
        </div>
      </div>
    </div>

    <div class="text-center pt-4">
      <a href="/" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow">
        ← Return to plAds Home
      </a>
    </div>
  </div>
</body>
</html>`);
  }

  return res.json(endpoints);
});

// -------------------------------------------------------------
// PUBLIC FREE ENDPOINTS (20 Requests per domain limit)
// -------------------------------------------------------------

function handleDomainAdRequest(req: Request, res: Response, type: 'image' | 'video') {
  const domain = extractDomain(req);
  const DOMAIN_LIMIT = 20;
  const WINDOW_24H = 24 * 60 * 60 * 1000;

  if (!domainRequests[domain]) {
    domainRequests[domain] = { count: 0, timestamps: [] };
  }

  // Clean old timestamps
  domainRequests[domain].timestamps = cleanTimestamps(domainRequests[domain].timestamps, WINDOW_24H);
  const currentCount = domainRequests[domain].timestamps.length;

  if (currentCount >= DOMAIN_LIMIT) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(429).send(renderLimitExceededHtml(`This [${domain}] hits its max requests`));
  }

  // Record request
  domainRequests[domain].timestamps.push(Date.now());
  domainRequests[domain].count += 1;
  const remaining = DOMAIN_LIMIT - (currentCount + 1);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-plAds-Domain', domain);
  res.setHeader('X-plAds-Remaining', remaining.toString());
  return res.send(renderBlankWhiteAdHtml(type, remaining));
}

// /api/img and /api/image
app.get(['/api/img', '/api/image'], (req, res) => {
  handleDomainAdRequest(req, res, 'image');
});

// /api/vid and /api/video
app.get(['/api/vid', '/api/video'], (req, res) => {
  handleDomainAdRequest(req, res, 'video');
});

// -------------------------------------------------------------
// API KEY ENDPOINTS (/api/:apiKey/img and /api/:apiKey/vid)
// 60 requests per 12 hours (120 requests per day)
// -------------------------------------------------------------

function handleApiKeyAdRequest(req: Request, res: Response, apiKey: string, type: 'image' | 'video') {
  const keyData = apiKeysStore[apiKey];
  const KEY_12H_LIMIT = 60;
  const WINDOW_12H = 12 * 60 * 60 * 1000;

  if (!keyData) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(401).send(renderLimitExceededHtml(`Invalid API Key [${apiKey}]. Create one at /enter/api`));
  }

  // Clean old timestamps for this key
  keyData.timestamps = cleanTimestamps(keyData.timestamps, WINDOW_12H);
  const currentCount = keyData.timestamps.length;

  if (currentCount >= KEY_12H_LIMIT) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(429).send(renderLimitExceededHtml(`This [${keyData.name}] hits its max requests`));
  }

  keyData.timestamps.push(Date.now());
  keyData.requestsCount += 1;
  const remaining = KEY_12H_LIMIT - (currentCount + 1);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-plAds-Key-Name', keyData.name);
  res.setHeader('X-plAds-Key-Remaining', remaining.toString());
  return res.send(renderBlankWhiteAdHtml(type, remaining));
}

// Format: /api/:apiKey/img
app.get('/api/:apiKey/img', (req, res) => {
  handleApiKeyAdRequest(req, res, req.params.apiKey, 'image');
});

// Format: /api/:apiKey/vid
app.get('/api/:apiKey/vid', (req, res) => {
  handleApiKeyAdRequest(req, res, req.params.apiKey, 'video');
});

// -------------------------------------------------------------
// API KEY MANAGEMENT & STATS API
// -------------------------------------------------------------

// Create API Key
app.post('/api/keys', (req, res) => {
  const name = (req.body.name || 'My Webapp Key').trim();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const apiKey = `plads_${randomSuffix}`;

  const newKey: ApiKeyData = {
    key: apiKey,
    name,
    createdAt: Date.now(),
    requestsCount: 0,
    timestamps: [],
  };

  apiKeysStore[apiKey] = newKey;

  res.json({
    success: true,
    message: 'API Key generated successfully',
    data: {
      key: newKey.key,
      name: newKey.name,
      limit: '60 requests / 12 hours (120 / day)',
      embedEndpoints: {
        image: `/api/${newKey.key}/img`,
        video: `/api/${newKey.key}/vid`,
      },
    },
  });
});

// List API Keys
app.get('/api/keys', (req, res) => {
  const WINDOW_12H = 12 * 60 * 60 * 1000;
  const keys = Object.values(apiKeysStore).map((k) => {
    const validTimestamps = cleanTimestamps(k.timestamps, WINDOW_12H);
    return {
      key: k.key,
      name: k.name,
      createdAt: k.createdAt,
      totalRequests: k.requestsCount,
      current12hRequests: validTimestamps.length,
      limit12h: 60,
      remaining12h: Math.max(0, 60 - validTimestamps.length),
    };
  });
  res.json({ success: true, keys });
});

// Domain and System Stats
app.get('/api/stats', (req, res) => {
  const WINDOW_24H = 24 * 60 * 60 * 1000;
  const domainStats = Object.entries(domainRequests).map(([domain, data]) => {
    const validTimestamps = cleanTimestamps(data.timestamps, WINDOW_24H);
    return {
      domain,
      totalLifetime: data.count,
      current24hRequests: validTimestamps.length,
      limit24h: 20,
      remaining24h: Math.max(0, 20 - validTimestamps.length),
    };
  });

  res.json({
    success: true,
    adsenseClient: ADSENSE_CLIENT,
    totalDomainsTracked: domainStats.length,
    domains: domainStats,
  });
});

// Direct ads.txt endpoint
app.get('/ads.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('google.com, pub-3659618950683210, DIRECT, f08c47fec0942fa0\n');
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & STATIC SERVING
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`plAds Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
