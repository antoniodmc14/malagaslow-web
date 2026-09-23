/**
 * Málaga Slow – AEPD-compliant Cookie Consent Manager
 * Blocks non-essential scripts until explicit consent is stored in localStorage.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ms_cookie_consent';
  var STORAGE_ANALYTICS_KEY = 'ms_cookie_consent_analytics';
  var LEGACY_STORAGE_KEY = 'malagaslow_cookie_consent';
  var LEGACY_ANALYTICS_KEY = 'malagaslow_cookie_consent_analytics';

  /** Set your Google Analytics 4 Measurement ID here (e.g. 'G-XXXXXXXXXX'). Leave empty to skip GA injection. */
  var GA_MEASUREMENT_ID = '';

  var scriptEl = document.currentScript;
  var gaFromScript = scriptEl && scriptEl.getAttribute('data-ga-id');
  if (gaFromScript) {
    GA_MEASUREMENT_ID = gaFromScript;
  }

  var lang = (scriptEl && scriptEl.getAttribute('data-lang')) ||
    (document.documentElement.lang === 'es' ? 'es' : 'en');

  var i18n = {
    en: {
      bannerTitle: 'We use cookies',
      bannerText: 'We use essential cookies for site functionality and optional analytics cookies to understand how visitors use our website. You can accept all, reject non-essential cookies, or configure your preferences.',
      acceptAll: 'Accept All',
      rejectAll: 'Reject All',
      preferences: 'Preferences',
      modalTitle: 'Cookie Preferences',
      modalIntro: 'Manage your cookie preferences. Essential cookies are required for the website and booking services to work properly.',
      necessaryTitle: 'Necessary (Technical / Booking)',
      necessaryDesc: 'Required for core site functionality, security, and FareHarbor booking integration. Always active.',
      analyticsTitle: 'Analytics',
      analyticsDesc: 'Help us understand how visitors interact with our website (e.g. Google Analytics). Only loaded with your consent.',
      alwaysActive: 'Always active',
      savePreferences: 'Save Preferences',
      close: 'Close',
    },
    es: {
      bannerTitle: 'Utilizamos cookies',
      bannerText: 'Usamos cookies necesarias para el funcionamiento del sitio y cookies analíticas opcionales para entender cómo los visitantes usan nuestra web. Puedes aceptar todas, rechazar las no esenciales o configurar tus preferencias.',
      acceptAll: 'Aceptar todas',
      rejectAll: 'Rechazar todas',
      preferences: 'Configurar',
      modalTitle: 'Configuración de Cookies',
      modalIntro: 'Gestiona tus preferencias de cookies. Las cookies necesarias son imprescindibles para el funcionamiento del sitio y las reservas.',
      necessaryTitle: 'Necesarias (Técnicas / Reservas)',
      necessaryDesc: 'Imprescindibles para la seguridad, el funcionamiento del sitio y la integración de reservas con FareHarbor. Siempre activas.',
      analyticsTitle: 'Analíticas',
      analyticsDesc: 'Nos ayudan a entender cómo interactúan los visitantes con la web (p. ej. Google Analytics). Solo se cargan con tu consentimiento.',
      alwaysActive: 'Siempre activas',
      savePreferences: 'Guardar preferencias',
      close: 'Cerrar',
    },
  };

  var t = i18n[lang] || i18n.en;
  var bannerEl = null;
  var modalEl = null;
  var analyticsToggleEl = null;
  var gaLoaded = false;

  function migrateLegacyStorage() {
    try {
      if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(LEGACY_STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, localStorage.getItem(LEGACY_STORAGE_KEY));
      }
      if (!localStorage.getItem(STORAGE_ANALYTICS_KEY) && localStorage.getItem(LEGACY_ANALYTICS_KEY)) {
        localStorage.setItem(STORAGE_ANALYTICS_KEY, localStorage.getItem(LEGACY_ANALYTICS_KEY));
      }
    } catch (e) {
      /* storage unavailable */
    }
  }

  function ensureGtagStub() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  /** Google Consent Mode v2 — default deny until user opts in to analytics. */
  function setDefaultConsentDenied() {
    ensureGtagStub();
    if (window.__ms_consent_default_set) return;
    window.__ms_consent_default_set = true;
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500,
    });
  }

  function updateAnalyticsConsent(granted) {
    ensureGtagStub();
    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }

  migrateLegacyStorage();
  setDefaultConsentDenied();

  function getStoredConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function getStoredAnalyticsPreference() {
    try {
      return localStorage.getItem(STORAGE_ANALYTICS_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function hasValidConsent() {
    var value = getStoredConsent();
    return value === 'accepted' || value === 'rejected' || value === 'custom';
  }

  function shouldLoadAnalytics() {
    var value = getStoredConsent();
    if (value === 'accepted') return true;
    if (value === 'rejected') return false;
    if (value === 'custom') return getStoredAnalyticsPreference();
    return false;
  }

  function persistConsent(status, analyticsEnabled) {
    try {
      localStorage.setItem(STORAGE_KEY, status);
      if (status === 'custom') {
        localStorage.setItem(STORAGE_ANALYTICS_KEY, analyticsEnabled ? 'true' : 'false');
      } else {
        localStorage.removeItem(STORAGE_ANALYTICS_KEY);
      }
    } catch (e) {
      /* storage unavailable */
    }
  }

  function loadGoogleAnalytics() {
    if (gaLoaded || !GA_MEASUREMENT_ID || !shouldLoadAnalytics()) return;
    gaLoaded = true;
    window.__malagaslow_ga_loaded = true;

    ensureGtagStub();
    updateAnalyticsConsent(true);

    var gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    gtagScript.setAttribute('data-cookie-category', 'analytics');
    document.head.appendChild(gtagScript);

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  function applyConsent(options) {
    options = options || {};
    var analyticsAllowed = shouldLoadAnalytics();
    if (analyticsAllowed) {
      loadGoogleAnalytics();
    } else {
      updateAnalyticsConsent(false);
    }
    if (!options.keepBannerVisible) {
      hideBanner();
    }
    syncToggleFromStorage();
  }

  function injectStyles() {
    if (document.getElementById('malagaslow-cookie-consent-styles')) return;
    var style = document.createElement('style');
    style.id = 'malagaslow-cookie-consent-styles';
    style.textContent = [
      '#malagaslow-cookie-banner{position:fixed;bottom:1rem;left:1rem;right:1rem;z-index:9998;max-width:42rem;margin:0 auto;padding:1.25rem 1.5rem;background:#fff;border:1px solid rgba(30,30,30,.08);border-radius:1rem;box-shadow:0 12px 40px rgba(0,0,0,.12);font-family:Gilroy,sans-serif;transform:translateY(120%);opacity:0;transition:transform .35s ease,opacity .35s ease}',
      '#malagaslow-cookie-banner.is-visible{transform:translateY(0);opacity:1}',
      '#malagaslow-cookie-banner .cookie-banner-title{margin:0 0 .5rem;font-size:1.125rem;font-weight:700;color:#1E1E1E;letter-spacing:-.04em;line-height:1.2}',
      '#malagaslow-cookie-banner .cookie-banner-text{margin:0 0 1rem;font-size:.9375rem;font-weight:400;color:#4B5563;letter-spacing:-.02em;line-height:1.45}',
      '#malagaslow-cookie-banner .cookie-banner-actions{display:flex;flex-wrap:wrap;gap:.625rem}',
      '#malagaslow-cookie-banner .cookie-btn,#malagaslow-cookie-modal .cookie-btn{appearance:none;border:none;border-radius:9999px;padding:.625rem 1.125rem;font-size:.875rem;font-weight:600;letter-spacing:-.02em;cursor:pointer;transition:background-color .2s ease,transform .2s ease,color .2s ease,border-color .2s ease;line-height:1.2}',
      '#malagaslow-cookie-banner .cookie-btn-primary,#malagaslow-cookie-modal .cookie-btn-primary{background:#307EFF;color:#fff}',
      '#malagaslow-cookie-banner .cookie-btn-primary:hover,#malagaslow-cookie-modal .cookie-btn-primary:hover{background:#4B8BFF}',
      '#malagaslow-cookie-banner .cookie-btn-secondary,#malagaslow-cookie-modal .cookie-btn-secondary{background:#fff;color:#1E1E1E;border:1px solid #D1D5DB}',
      '#malagaslow-cookie-banner .cookie-btn-secondary:hover,#malagaslow-cookie-modal .cookie-btn-secondary:hover{border-color:#307EFF;color:#307EFF}',
      '#malagaslow-cookie-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .25s ease;font-family:Gilroy,sans-serif}',
      '#malagaslow-cookie-modal.is-open{opacity:1;pointer-events:auto}',
      '#malagaslow-cookie-modal .cookie-modal-panel{width:100%;max-width:32rem;max-height:90vh;overflow:auto;background:#fff;border-radius:1rem;padding:1.5rem;box-shadow:0 20px 50px rgba(0,0,0,.18)}',
      '#malagaslow-cookie-modal .cookie-modal-title{margin:0 0 .75rem;font-size:1.5rem;font-weight:700;color:#1E1E1E;letter-spacing:-.04em;line-height:1.1}',
      '#malagaslow-cookie-modal .cookie-modal-intro{margin:0 0 1.25rem;font-size:1rem;color:#4B5563;line-height:1.35;letter-spacing:-.04em}',
      '#malagaslow-cookie-modal .cookie-category{border:1px solid #E5E7EB;border-radius:.75rem;padding:1rem;margin-bottom:.75rem}',
      '#malagaslow-cookie-modal .cookie-category-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}',
      '#malagaslow-cookie-modal .cookie-category-title{margin:0 0 .375rem;font-size:1rem;font-weight:700;color:#1E1E1E;letter-spacing:-.03em}',
      '#malagaslow-cookie-modal .cookie-category-desc{margin:0;font-size:.875rem;color:#6B7280;line-height:1.35;letter-spacing:-.02em}',
      '#malagaslow-cookie-modal .cookie-always-active{font-size:.75rem;font-weight:600;color:#307EFF;white-space:nowrap;padding-top:.125rem}',
      '#malagaslow-cookie-modal .cookie-toggle{position:relative;width:2.75rem;height:1.5rem;flex-shrink:0;background:#D1D5DB;border-radius:9999px;border:none;cursor:pointer;transition:background-color .2s ease;padding:0}',
      '#malagaslow-cookie-modal .cookie-toggle[aria-checked="true"]{background:#307EFF}',
      '#malagaslow-cookie-modal .cookie-toggle:disabled{opacity:.65;cursor:not-allowed}',
      '#malagaslow-cookie-modal .cookie-toggle-knob{position:absolute;top:.125rem;left:.125rem;width:1.25rem;height:1.25rem;background:#fff;border-radius:9999px;transition:transform .2s ease;box-shadow:0 1px 3px rgba(0,0,0,.15)}',
      '#malagaslow-cookie-modal .cookie-toggle[aria-checked="true"] .cookie-toggle-knob{transform:translateX(1.25rem)}',
      '#malagaslow-cookie-modal .cookie-modal-actions{display:flex;flex-wrap:wrap;gap:.625rem;margin-top:1.25rem}',
      '@media (min-width:768px){#malagaslow-cookie-banner{bottom:1.5rem;left:1.5rem;right:1.5rem;padding:1.5rem 1.75rem}#malagaslow-cookie-banner .cookie-banner-actions{flex-wrap:nowrap}}',
    ].join('');
    document.head.appendChild(style);
  }

  function buildBanner() {
    bannerEl = document.createElement('div');
    bannerEl.id = 'malagaslow-cookie-banner';
    bannerEl.setAttribute('role', 'dialog');
    bannerEl.setAttribute('aria-live', 'polite');
    bannerEl.setAttribute('aria-label', t.bannerTitle);
    bannerEl.innerHTML =
      '<p class="cookie-banner-title">' + t.bannerTitle + '</p>' +
      '<p class="cookie-banner-text">' + t.bannerText + '</p>' +
      '<div class="cookie-banner-actions">' +
      '<button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="accept">' + t.acceptAll + '</button>' +
      '<button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="reject">' + t.rejectAll + '</button>' +
      '<button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="configure">' + t.preferences + '</button>' +
      '</div>';
    document.body.appendChild(bannerEl);

    bannerEl.addEventListener('click', function (event) {
      var action = event.target && event.target.getAttribute('data-cookie-action');
      if (action === 'accept') acceptAll();
      if (action === 'reject') rejectAll();
      if (action === 'configure') openCookieModal();
    });
  }

  function buildModal() {
    modalEl = document.createElement('div');
    modalEl.id = 'malagaslow-cookie-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML =
      '<div class="cookie-modal-panel" role="document">' +
      '<h2 class="cookie-modal-title">' + t.modalTitle + '</h2>' +
      '<p class="cookie-modal-intro">' + t.modalIntro + '</p>' +
      '<div class="cookie-category">' +
      '<div class="cookie-category-header">' +
      '<div><h3 class="cookie-category-title">' + t.necessaryTitle + '</h3><p class="cookie-category-desc">' + t.necessaryDesc + '</p></div>' +
      '<span class="cookie-always-active">' + t.alwaysActive + '</span>' +
      '</div></div>' +
      '<div class="cookie-category">' +
      '<div class="cookie-category-header">' +
      '<div><h3 class="cookie-category-title">' + t.analyticsTitle + '</h3><p class="cookie-category-desc">' + t.analyticsDesc + '</p></div>' +
      '<button type="button" class="cookie-toggle" id="malagaslow-cookie-analytics-toggle" aria-checked="false" aria-label="' + t.analyticsTitle + '"><span class="cookie-toggle-knob"></span></button>' +
      '</div></div>' +
      '<div class="cookie-modal-actions">' +
      '<button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="save">' + t.savePreferences + '</button>' +
      '<button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="close">' + t.close + '</button>' +
      '</div></div>';
    document.body.appendChild(modalEl);

    analyticsToggleEl = document.getElementById('malagaslow-cookie-analytics-toggle');
    analyticsToggleEl.addEventListener('click', function () {
      var checked = analyticsToggleEl.getAttribute('aria-checked') === 'true';
      analyticsToggleEl.setAttribute('aria-checked', checked ? 'false' : 'true');
    });

    modalEl.addEventListener('click', function (event) {
      if (event.target === modalEl) closeCookieModal();
      var action = event.target && event.target.getAttribute('data-cookie-action');
      if (action === 'save') savePreferences();
      if (action === 'close') closeCookieModal();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modalEl.classList.contains('is-open')) {
        closeCookieModal();
      }
    });
  }

  function showBanner() {
    if (!bannerEl) return;
    requestAnimationFrame(function () {
      bannerEl.classList.add('is-visible');
    });
  }

  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.classList.remove('is-visible');
  }

  function syncToggleFromStorage() {
    if (!analyticsToggleEl) return;
    var enabled = false;
    var value = getStoredConsent();
    if (value === 'accepted') enabled = true;
    if (value === 'custom') enabled = getStoredAnalyticsPreference();
    analyticsToggleEl.setAttribute('aria-checked', enabled ? 'true' : 'false');
  }

  function openCookieModal() {
    if (!modalEl) return;
    syncToggleFromStorage();
    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCookieModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function acceptAll() {
    persistConsent('accepted');
    applyConsent();
    closeCookieModal();
  }

  function rejectAll() {
    persistConsent('rejected');
    applyConsent();
    closeCookieModal();
  }

  function savePreferences() {
    var analyticsEnabled = analyticsToggleEl &&
      analyticsToggleEl.getAttribute('aria-checked') === 'true';
    var hadGaLoaded = gaLoaded;
    persistConsent('custom', analyticsEnabled);
    applyConsent();
    closeCookieModal();
    if (!analyticsEnabled && hadGaLoaded) {
      window.location.reload();
    }
  }

  function bindFooterLinks() {
    document.querySelectorAll('[data-cookie-preferences]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        openCookieModal();
      });
    });
  }

  function init() {
    injectStyles();
    buildBanner();
    buildModal();
    bindFooterLinks();

    if (hasValidConsent()) {
      applyConsent({ keepBannerVisible: false });
    } else {
      showBanner();
    }
  }

  window.openCookieModal = openCookieModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
