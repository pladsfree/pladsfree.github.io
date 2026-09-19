/**
 * plAds - Front-End Application Controller
 * Handles Navigation, Real AdSense Loading, API Key Management, and Embed Testing
 */

const state = {
  activeRoute: 'home', // 'home' | 'img' | 'vid' | 'api'
  apiKeys: [],
  domainStats: [],
};

// Router initialization supporting #home, #img, #image, #vid, #video, #api, /enter/api
function initRouter() {
  function handleRoute() {
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    if (hash.includes('api') || hash.includes('enter') || pathname.includes('/enter/api')) {
      setActiveRoute('api');
    } else if (hash.includes('vid') || hash.includes('video') || pathname.includes('/vid')) {
      setActiveRoute('vid');
    } else if (hash.includes('img') || hash.includes('image') || pathname.includes('/img')) {
      setActiveRoute('img');
    } else {
      setActiveRoute('home');
    }
  }

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('popstate', handleRoute);
  handleRoute();
}

function setActiveRoute(route) {
  state.activeRoute = route;

  // Update navbar links
  document.querySelectorAll('.nav-link').forEach((link) => {
    const target = link.getAttribute('data-route');
    if (target === route) {
      link.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
      link.classList.remove('text-slate-600', 'hover:bg-slate-100', 'hover:text-slate-900');
    } else {
      link.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
      link.classList.add('text-slate-600', 'hover:bg-slate-100', 'hover:text-slate-900');
    }
  });

  // Toggle view containers
  const homeView = document.getElementById('view-home');
  const imgView = document.getElementById('view-img');
  const vidView = document.getElementById('view-vid');
  const apiView = document.getElementById('view-api');

  if (homeView) homeView.style.display = route === 'home' ? 'block' : 'none';
  if (imgView) imgView.style.display = route === 'img' ? 'block' : 'none';
  if (vidView) vidView.style.display = route === 'vid' ? 'block' : 'none';
  if (apiView) apiView.style.display = route === 'api' ? 'block' : 'none';

  // Update current route badge in sub-header
  const routeBadge = document.getElementById('current-route-name');
  if (routeBadge) {
    if (route === 'home') routeBadge.textContent = 'plAds/home';
    if (route === 'img') routeBadge.textContent = 'plAds/img (or /api/img)';
    if (route === 'vid') routeBadge.textContent = 'plAds/vid (or /api/vid)';
    if (route === 'api') routeBadge.textContent = '/enter/api (API Key Hub)';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Load API keys if on API view
  if (route === 'api') {
    fetchApiKeys();
    fetchStats();
  }

  // Push real AdSense units safely
  triggerAdSensePush();
}

// Push AdSense slots safely without crashing on adblock or sandboxing
function triggerAdSensePush() {
  try {
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      document.querySelectorAll('.adsbygoogle:not([data-adsbygoogle-status])').forEach(() => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          // ignore duplicate push
        }
      });
    }
  } catch (err) {
    // silent fallback
  }
}

// API Key Management Functions
async function fetchApiKeys() {
  try {
    const res = await fetch('/api/keys');
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && data.keys) {
      state.apiKeys = data.keys;
      renderApiKeysList();
    }
  } catch (err) {
    console.error('Failed to fetch API keys:', err);
  }
}

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && data.domains) {
      state.domainStats = data.domains;
      renderDomainStats();
    }
  } catch (err) {
    console.error('Failed to fetch domain stats:', err);
  }
}

function renderApiKeysList() {
  const container = document.getElementById('api-keys-list-container');
  if (!container) return;

  if (state.apiKeys.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
        No API keys created yet. Generate one above to get 60 requests per 12 hours (120 req/day).
      </div>
    `;
    return;
  }

  const origin = window.location.origin;

  container.innerHTML = state.apiKeys
    .map((item) => {
      const imgEmbed = `<iframe src="${origin}/api/${item.key}/img" width="100%" height="250" frameborder="0" scrolling="no"></iframe>`;
      const vidEmbed = `<iframe src="${origin}/api/${item.key}/vid" width="100%" height="360" frameborder="0" scrolling="no"></iframe>`;

      return `
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-900 text-sm">${escapeHtml(item.name)}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">Free Tier (60 / 12h)</span>
            </div>
            <div class="text-xs font-mono text-slate-500 mt-1 flex items-center gap-2">
              <span>Key: <strong>${item.key}</strong></span>
              <button onclick="copyToClipboard('${item.key}', 'btn-copy-k-${item.key}')" id="btn-copy-k-${item.key}" class="p-1 hover:text-blue-600 cursor-pointer">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
          </div>

          <div class="text-right">
            <div class="text-xs font-bold text-slate-700">${item.current12hRequests} / 60 reqs (12h window)</div>
            <div class="text-[11px] text-slate-400">${item.remaining12h} requests remaining</div>
          </div>
        </div>

        <!-- Endpoints & Embed Codes -->
        <div class="space-y-3 text-xs">
          <!-- Image Ad Endpoint -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-700">Image Ad Endpoint: <code class="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono">/api/${item.key}/img</code></span>
              <button onclick="copyToClipboard('${origin}/api/${item.key}/img', 'btn-img-url-${item.key}')" id="btn-img-url-${item.key}" class="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                Copy URL
              </button>
            </div>
            <div class="relative bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto flex items-center justify-between">
              <code>${escapeHtml(imgEmbed)}</code>
              <button onclick="copyToClipboard('${imgEmbed.replace(/'/g, "\\'")}', 'btn-img-emb-${item.key}')" id="btn-img-emb-${item.key}" class="ml-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] whitespace-nowrap cursor-pointer">
                Copy IFrame
              </button>
            </div>
          </div>

          <!-- Video Ad Endpoint -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-700">Video Ad Endpoint: <code class="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">/api/${item.key}/vid</code></span>
              <button onclick="copyToClipboard('${origin}/api/${item.key}/vid', 'btn-vid-url-${item.key}')" id="btn-vid-url-${item.key}" class="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer">
                Copy URL
              </button>
            </div>
            <div class="relative bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto flex items-center justify-between">
              <code>${escapeHtml(vidEmbed)}</code>
              <button onclick="copyToClipboard('${vidEmbed.replace(/'/g, "\\'")}', 'btn-vid-emb-${item.key}')" id="btn-vid-emb-${item.key}" class="ml-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] whitespace-nowrap cursor-pointer">
                Copy IFrame
              </button>
            </div>
          </div>
        </div>
      </div>
      `;
    })
    .join('');
}

function renderDomainStats() {
  const container = document.getElementById('domain-stats-container');
  if (!container) return;

  if (state.domainStats.length === 0) {
    container.innerHTML = `<div class="text-slate-400 text-xs text-center py-4">No domain requests logged yet. Embed /api/img or /api/vid on any domain to start tracking.</div>`;
    return;
  }

  container.innerHTML = state.domainStats
    .map((d) => {
      const pct = Math.min(100, (d.current24hRequests / 20) * 100);
      return `
      <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
        <div class="space-y-1">
          <div class="font-bold text-slate-800 font-mono">${escapeHtml(d.domain)}</div>
          <div class="text-[11px] text-slate-500">Lifetime Hits: ${d.totalLifetime}</div>
        </div>
        <div class="text-right space-y-1">
          <div class="font-semibold ${d.current24hRequests >= 20 ? 'text-red-600' : 'text-slate-700'}">${d.current24hRequests} / 20 reqs (24h)</div>
          <div class="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div class="h-full ${pct >= 100 ? 'bg-red-500' : 'bg-blue-600'}" style="width: ${pct}%"></div>
          </div>
        </div>
      </div>
      `;
    })
    .join('');
}

// Helpers
function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.copyToClipboard = function (text, btnId) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(btnId);
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = `<span class="text-emerald-500 font-bold text-xs">Copied!</span>`;
      setTimeout(() => {
        btn.innerHTML = orig;
      }, 2000);
    }
  }).catch(() => {
    prompt('Copy code:', text);
  });
};

// Global App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initRouter();

  // Create API Key Form Handler
  const createKeyForm = document.getElementById('create-api-key-form');
  if (createKeyForm) {
    createKeyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('api-key-name-input');
      const name = input ? input.value.trim() : '';

      if (!name) return;

      try {
        const res = await fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (data.success) {
          if (input) input.value = '';
          fetchApiKeys();
        }
      } catch (err) {
        console.error('Failed to create key:', err);
      }
    });
  }

  // Live IFrame Sandbox Tester
  const testForm = document.getElementById('iframe-test-form');
  if (testForm) {
    testForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const typeSelect = document.getElementById('test-ad-type');
      const keySelect = document.getElementById('test-api-key');
      const domainInput = document.getElementById('test-custom-domain');
      const iframePreview = document.getElementById('test-live-iframe');

      const type = typeSelect ? typeSelect.value : 'img';
      const key = keySelect ? keySelect.value : '';
      const domain = domainInput ? domainInput.value.trim() : '';

      let targetUrl = key ? `/api/${key}/${type}` : `/api/${type}`;
      if (domain) {
        targetUrl += `?domain=${encodeURIComponent(domain)}`;
      }

      if (iframePreview) {
        iframePreview.src = targetUrl;
      }
    });
  }

  // Auto trigger AdSense
  setTimeout(triggerAdSensePush, 500);
});
