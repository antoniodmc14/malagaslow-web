/**
 * Shared UI: mobile menu + gallery lightbox.
 * Language for menu aria-labels follows <html lang="...">.
 */
(function () {
  'use strict';

  var isSpanish = (document.documentElement.lang || '').toLowerCase().indexOf('es') === 0;
  var menuLabels = isSpanish
    ? { open: 'Abrir menú', close: 'Cerrar menú' }
    : { open: 'Open menu', close: 'Close menu' };

  function initMobileMenu() {
    var burgerBtn = document.getElementById('burger-btn');
    var burgerIcon = burgerBtn && burgerBtn.querySelector('.burger-icon');
    var backdrop = document.getElementById('mobile-menu-backdrop');
    var mobileMenu = document.getElementById('mobile-menu');
    var menuContent = document.getElementById('mobile-menu-content');
    var mobileLinks = document.querySelectorAll('.mobile-nav-link');
    var closeBtn = document.getElementById('mobile-menu-close');

    if (!burgerBtn && !mobileMenu) return;

    function openMobileMenu() {
      if (menuContent) menuContent.classList.remove('opacity-0');
      if (burgerIcon) burgerIcon.classList.add('open');
      if (burgerBtn) {
        burgerBtn.setAttribute('aria-expanded', 'true');
        burgerBtn.setAttribute('aria-label', menuLabels.close);
      }
      if (backdrop) {
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
        backdrop.setAttribute('aria-hidden', 'false');
      }
      if (mobileMenu) {
        mobileMenu.classList.remove('translate-x-full');
        mobileMenu.classList.add('translate-x-0');
        mobileMenu.setAttribute('aria-hidden', 'false');
      }
      document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
      if (menuContent) menuContent.classList.add('opacity-0');
      setTimeout(function () {
        if (mobileMenu) {
          mobileMenu.classList.remove('translate-x-0');
          mobileMenu.classList.add('translate-x-full');
          mobileMenu.setAttribute('aria-hidden', 'true');
        }
        if (burgerIcon) burgerIcon.classList.remove('open');
        if (burgerBtn) {
          burgerBtn.setAttribute('aria-expanded', 'false');
          burgerBtn.setAttribute('aria-label', menuLabels.open);
        }
        if (backdrop) {
          backdrop.classList.add('opacity-0', 'pointer-events-none');
          backdrop.setAttribute('aria-hidden', 'true');
        }
        document.body.style.overflow = '';
      }, 300);
    }

    function toggleMobileMenu() {
      var isOpen = mobileMenu && !mobileMenu.classList.contains('translate-x-full');
      if (isOpen) closeMobileMenu();
      else openMobileMenu();
    }

    if (burgerBtn) burgerBtn.addEventListener('click', toggleMobileMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
    if (backdrop) backdrop.addEventListener('click', closeMobileMenu);
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
    document.querySelectorAll('.mobile-lang-option').forEach(function (btn) {
      btn.addEventListener('click', closeMobileMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (mobileMenu && !mobileMenu.classList.contains('translate-x-full')) {
        closeMobileMenu();
      }
    });
    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 768px)').matches) {
        closeMobileMenu();
      }
    });
  }

  function initLightbox() {
    var triggers = document.querySelectorAll('.gallery-lightbox-trigger');
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightbox-img');
    var closeBtn = document.getElementById('lightbox-close');
    if (!lightbox || !lightboxImg) return;

    function openLightbox(src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.classList.remove('hidden');
      lightbox.classList.add('flex');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.add('hidden');
      lightbox.classList.remove('flex');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    triggers.forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (window.matchMedia('(min-width: 768px)').matches) {
          e.preventDefault();
          openLightbox(a.getAttribute('href'), a.getAttribute('data-alt'));
        }
      });
    });
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
        closeLightbox();
      }
    });
  }

  function init() {
    initMobileMenu();
    initLightbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
