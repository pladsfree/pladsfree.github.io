/**
 * plAds - Static Application Engine (Vanilla JS)
 * Free Ad Hosting & Showcase Network
 */

// State
const state = {
  activeRoute: 'home', // 'home' | 'img' | 'vid'
  imgFilter: 'all',
  videoAd: {
    isPlaying: false,
    currentTime: 0,
    duration: 15,
    isMuted: false,
    canSkip: false,
    skipTimer: 5,
    hasSkipped: false,
    currentAdIndex: 0,
    isFullscreen: false,
  },
  rewardedAd: {
    isPlaying: false,
    timeLeft: 10,
    isUnlocked: false,
  },
  customAd: {
    headline: 'Lightning Fast Cloud Hosting',
    tagline: 'Deploy static sites in seconds with 99.99% uptime SLA guarantee.',
    cta: 'Start Free Trial',
    theme: 'blue',
    format: '728x90',
  },
};

// Video Ad campaigns
const videoCampaigns = [
  {
    title: 'HyperCloud NextGen Infrastructure',
    tagline: 'Scale effortlessly across 45 global edge regions with zero latency.',
    cta: 'Claim $300 Credits',
    accentColor: '#3b82f6',
    secondaryColor: '#1e40af',
    duration: 15,
  },
  {
    title: 'CyberShield Quantum VPN',
    tagline: 'Military-grade encryption protecting your privacy and security everywhere.',
    cta: 'Get 80% Off Today',
    accentColor: '#10b981',
    secondaryColor: '#047857',
    duration: 12,
  },
  {
    title: 'DevForge AI Studio Pro',
    tagline: 'Supercharge your development workflow with instant static deployments.',
    cta: 'Explore Features',
    accentColor: '#8b5cf6',
    secondaryColor: '#6d28d9',
    duration: 18,
  },
];

// Router initialization
function initRouter() {
  function handleHash() {
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    if (hash.includes('vid') || pathname.includes('/vid')) {
      setActiveRoute('vid');
    } else if (hash.includes('img') || pathname.includes('/img')) {
      setActiveRoute('img');
    } else {
      setActiveRoute('home');
    }
  }

  window.addEventListener('hashchange', handleHash);
  handleHash();
}

function setActiveRoute(route) {
  state.activeRoute = route;

  // Update nav buttons active style
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

  // Toggle views
  const homeView = document.getElementById('view-home');
  const imgView = document.getElementById('view-img');
  const vidView = document.getElementById('view-vid');

  if (homeView) homeView.style.display = route === 'home' ? 'block' : 'none';
  if (imgView) imgView.style.display = route === 'img' ? 'block' : 'none';
  if (vidView) vidView.style.display = route === 'vid' ? 'block' : 'none';

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update current page indicator in title/subtext
  const routeNameElem = document.getElementById('current-route-name');
  if (routeNameElem) {
    if (route === 'home') routeNameElem.textContent = 'plAds/home';
    if (route === 'img') routeNameElem.textContent = 'plAds/img';
    if (route === 'vid') routeNameElem.textContent = 'plAds/vid';
  }

  // Trigger AdSense push safely
  tryPushAdSense();
}

// Push AdSense slots safely without breaking if adblock or sandbox prevents it
function tryPushAdSense() {
  try {
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      document.querySelectorAll('.adsbygoogle:not([data-adsbygoogle-status])').forEach(() => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          // Ignore duplicate push errors
        }
      });
    }
  } catch (err) {
    // Silent fail for adblock or sandbox
  }
}

// Initialize Video Ad Player Canvas
let videoCanvasInterval = null;
function initVideoPlayer() {
  const canvas = document.getElementById('video-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let frame = 0;

  function drawVideoFrame() {
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const campaign = videoCampaigns[state.videoAd.currentAdIndex];

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, campaign.secondaryColor);
    grad.addColorStop(1, campaign.accentColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Animated geometric particles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 6; i++) {
      const x = (Math.sin(frame * 0.02 + i) * 0.5 + 0.5) * width;
      const y = (Math.cos(frame * 0.015 + i * 1.5) * 0.5 + 0.5) * height;
      const radius = 40 + Math.sin(frame * 0.03 + i) * 20;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center Ad Content
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 80, height / 2 - 90, 160, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('SPONSORED VIDEO AD', width / 2, height / 2 - 77);

    // Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(campaign.title, width / 2, height / 2 - 35);

    // Tagline
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(campaign.tagline, width / 2, height / 2 + 5);

    // CTA Button simulation on video
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 100, height / 2 + 45, 200, 42, 8);
    ctx.fill();

    ctx.fillStyle = campaign.secondaryColor;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(campaign.cta + ' →', width / 2, height / 2 + 66);

    if (state.videoAd.isPlaying) {
      frame++;
    }
  }

  // Animation Loop
  function startRenderLoop() {
    if (videoCanvasInterval) clearInterval(videoCanvasInterval);
    videoCanvasInterval = setInterval(drawVideoFrame, 1000 / 30);
  }

  startRenderLoop();
}

// Video ad timer loop
let videoTimerInterval = null;
function startVideoTimer() {
  if (videoTimerInterval) clearInterval(videoTimerInterval);

  videoTimerInterval = setInterval(() => {
    if (!state.videoAd.isPlaying) return;

    state.videoAd.currentTime += 0.5;

    // Update skip timer
    if (state.videoAd.skipTimer > 0) {
      state.videoAd.skipTimer -= 0.5;
      if (state.videoAd.skipTimer <= 0) {
        state.videoAd.skipTimer = 0;
        state.videoAd.canSkip = true;
      }
    }

    // Check completion
    const campaign = videoCampaigns[state.videoAd.currentAdIndex];
    if (state.videoAd.currentTime >= campaign.duration) {
      // Ad finished, switch to next ad
      state.videoAd.currentAdIndex = (state.videoAd.currentAdIndex + 1) % videoCampaigns.length;
      state.videoAd.currentTime = 0;
      state.videoAd.skipTimer = 5;
      state.videoAd.canSkip = false;
    }

    updateVideoUI();
  }, 500);
}

function updateVideoUI() {
  const campaign = videoCampaigns[state.videoAd.currentAdIndex];
  const duration = campaign.duration;
  const progressPercent = (state.videoAd.currentTime / duration) * 100;

  // Update progress bar
  const progressBar = document.getElementById('video-progress-fill');
  if (progressBar) progressBar.style.width = `${progressPercent}%`;

  // Update time display
  const timeDisplay = document.getElementById('video-time-display');
  if (timeDisplay) {
    const curSec = Math.floor(state.videoAd.currentTime);
    timeDisplay.textContent = `0:${curSec < 10 ? '0' : ''}${curSec} / 0:${duration}`;
  }

  // Update skip button
  const skipBtn = document.getElementById('video-skip-btn');
  const skipCount = document.getElementById('video-skip-countdown');
  if (skipBtn && skipCount) {
    if (state.videoAd.canSkip) {
      skipBtn.classList.remove('opacity-60', 'cursor-not-allowed');
      skipBtn.classList.add('opacity-100', 'hover:bg-slate-900', 'cursor-pointer');
      skipCount.textContent = 'Skip Ad';
    } else {
      skipBtn.classList.add('opacity-60', 'cursor-not-allowed');
      skipBtn.classList.remove('opacity-100', 'hover:bg-slate-900', 'cursor-pointer');
      skipCount.textContent = `Skip in ${Math.ceil(state.videoAd.skipTimer)}s`;
    }
  }

  // Update companion card
  const compTitle = document.getElementById('companion-ad-title');
  const compTagline = document.getElementById('companion-ad-tagline');
  const compCta = document.getElementById('companion-ad-cta');
  if (compTitle) compTitle.textContent = campaign.title;
  if (compTagline) compTagline.textContent = campaign.tagline;
  if (compCta) compCta.textContent = campaign.cta;
}

// Rewarded Ad Timer
let rewardedTimer = null;
function toggleRewardedAd() {
  const btn = document.getElementById('btn-watch-rewarded');
  const statusElem = document.getElementById('rewarded-status');
  const timerElem = document.getElementById('rewarded-timer-text');
  const progressElem = document.getElementById('rewarded-progress');

  if (state.rewardedAd.isPlaying) return;

  state.rewardedAd.isPlaying = true;
  state.rewardedAd.timeLeft = 8;
  state.rewardedAd.isUnlocked = false;

  if (btn) btn.disabled = true;
  if (statusElem) statusElem.textContent = 'Ad is playing... Please do not close.';

  if (rewardedTimer) clearInterval(rewardedTimer);
  rewardedTimer = setInterval(() => {
    state.rewardedAd.timeLeft -= 1;
    if (timerElem) timerElem.textContent = `${state.rewardedAd.timeLeft}s remaining`;
    if (progressElem) {
      const pct = ((8 - state.rewardedAd.timeLeft) / 8) * 100;
      progressElem.style.width = `${pct}%`;
    }

    if (state.rewardedAd.timeLeft <= 0) {
      clearInterval(rewardedTimer);
      state.rewardedAd.isPlaying = false;
      state.rewardedAd.isUnlocked = true;
      if (btn) btn.disabled = false;
      if (statusElem) statusElem.textContent = 'Reward Unlocked! 100 Free Ad Hosting Credits Added.';
      if (timerElem) timerElem.textContent = 'Complete!';

      // Highlight rewarded badge
      const badge = document.getElementById('reward-badge-unlocked');
      if (badge) badge.classList.remove('hidden');
    }
  }, 1000);
}

// Image Ad Filtering
function initImageFilters() {
  const buttons = document.querySelectorAll('.img-filter-btn');
  const adCards = document.querySelectorAll('.image-ad-card');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      buttons.forEach((b) => {
        b.classList.remove('bg-blue-600', 'text-white');
        b.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
      });
      btn.classList.add('bg-blue-600', 'text-white');
      btn.classList.remove('bg-white', 'text-slate-700');

      adCards.forEach((card) => {
        const format = card.getAttribute('data-format');
        if (filter === 'all' || format === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Custom Ad Creator
function initCustomAdCreator() {
  const headlineInput = document.getElementById('custom-ad-headline');
  const taglineInput = document.getElementById('custom-ad-tagline');
  const ctaInput = document.getElementById('custom-ad-cta');
  const themeSelect = document.getElementById('custom-ad-theme');
  const formatSelect = document.getElementById('custom-ad-format');

  const previewBox = document.getElementById('custom-ad-preview-box');
  const previewHeadline = document.getElementById('custom-ad-preview-headline');
  const previewTagline = document.getElementById('custom-ad-preview-tagline');
  const previewCta = document.getElementById('custom-ad-preview-cta');

  function updatePreview() {
    if (!previewBox) return;

    const headline = headlineInput ? headlineInput.value : state.customAd.headline;
    const tagline = taglineInput ? taglineInput.value : state.customAd.tagline;
    const cta = ctaInput ? ctaInput.value : state.customAd.cta;
    const theme = themeSelect ? themeSelect.value : state.customAd.theme;
    const format = formatSelect ? formatSelect.value : state.customAd.format;

    if (previewHeadline) previewHeadline.textContent = headline || 'Your Ad Headline Here';
    if (previewTagline) previewTagline.textContent = tagline || 'Engaging description showcasing your product or services.';
    if (previewCta) previewCta.textContent = cta || 'Learn More';

    // Change themes
    previewBox.className = 'relative rounded-lg p-6 text-white shadow-md transition-all flex flex-col justify-between overflow-hidden ';
    if (theme === 'blue') {
      previewBox.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-indigo-800');
    } else if (theme === 'emerald') {
      previewBox.classList.add('bg-gradient-to-r', 'from-emerald-600', 'to-teal-800');
    } else if (theme === 'purple') {
      previewBox.classList.add('bg-gradient-to-r', 'from-purple-600', 'to-pink-700');
    } else if (theme === 'amber') {
      previewBox.classList.add('bg-gradient-to-r', 'from-amber-600', 'to-red-700');
    } else {
      previewBox.classList.add('bg-gradient-to-r', 'from-slate-800', 'to-slate-950');
    }

    // Change format dimensions
    if (format === '728x90') {
      previewBox.style.minHeight = '110px';
    } else if (format === '300x250') {
      previewBox.style.minHeight = '250px';
    } else if (format === '336x280') {
      previewBox.style.minHeight = '280px';
    } else {
      previewBox.style.minHeight = '140px';
    }
  }

  [headlineInput, taglineInput, ctaInput, themeSelect, formatSelect].forEach((input) => {
    if (input) {
      input.addEventListener('input', updatePreview);
      input.addEventListener('change', updatePreview);
    }
  });

  updatePreview();
}

// Copy Code Helper with Visual Feedback
window.copyToClipboard = function (text, btnId) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(btnId);
    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `
        <svg class="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="text-xs font-semibold text-emerald-600">Copied!</span>
      `;
      setTimeout(() => {
        btn.innerHTML = originalHtml;
      }, 2000);
    }
  }).catch(() => {
    // Fallback prompt
    prompt('Copy ad code:', text);
  });
};

// Global App Initialization on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initVideoPlayer();
  initImageFilters();
  initCustomAdCreator();

  // Play/Pause Video Ad
  const playBtn = document.getElementById('video-play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      state.videoAd.isPlaying = !state.videoAd.isPlaying;
      const playIcon = document.getElementById('video-play-icon');
      const pauseIcon = document.getElementById('video-pause-icon');

      if (state.videoAd.isPlaying) {
        if (playIcon) playIcon.classList.add('hidden');
        if (pauseIcon) pauseIcon.classList.remove('hidden');
        startVideoTimer();
      } else {
        if (playIcon) playIcon.classList.remove('hidden');
        if (pauseIcon) pauseIcon.classList.add('hidden');
      }
    });
  }

  // Skip Video Ad Button
  const skipBtn = document.getElementById('video-skip-btn');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (state.videoAd.canSkip) {
        state.videoAd.currentAdIndex = (state.videoAd.currentAdIndex + 1) % videoCampaigns.length;
        state.videoAd.currentTime = 0;
        state.videoAd.skipTimer = 5;
        state.videoAd.canSkip = false;
        updateVideoUI();
      }
    });
  }

  // Rewarded Ad Trigger
  const rewardedBtn = document.getElementById('btn-watch-rewarded');
  if (rewardedBtn) {
    rewardedBtn.addEventListener('click', toggleRewardedAd);
  }

  // Dismiss Floating Bottom Ad Banner
  const closeFloatingAdBtn = document.getElementById('btn-close-floating-ad');
  if (closeFloatingAdBtn) {
    closeFloatingAdBtn.addEventListener('click', () => {
      const banner = document.getElementById('floating-bottom-ad-banner');
      if (banner) banner.style.display = 'none';
    });
  }

  // Refresh ads randomizer
  const refreshAdsBtn = document.getElementById('btn-refresh-ads');
  if (refreshAdsBtn) {
    refreshAdsBtn.addEventListener('click', () => {
      const badges = document.querySelectorAll('.ad-refresh-target');
      badges.forEach((el) => {
        el.classList.add('animate-pulse');
        setTimeout(() => el.classList.remove('animate-pulse'), 600);
      });
      tryPushAdSense();
    });
  }

  // Auto-play preview video ad automatically
  setTimeout(() => {
    state.videoAd.isPlaying = true;
    const playIcon = document.getElementById('video-play-icon');
    const pauseIcon = document.getElementById('video-pause-icon');
    if (playIcon) playIcon.classList.add('hidden');
    if (pauseIcon) pauseIcon.classList.remove('hidden');
    startVideoTimer();
  }, 800);
});
