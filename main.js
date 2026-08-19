/**
 * PROLED Engineering Services Limited
 * Main JavaScript File
 * Handles mobile navigation, scroll animations, and form interactions
 */

(function() {
  'use strict';

  // ============================================
  // DOM ELEMENTS
  // ============================================
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const navbarNav = document.getElementById('navbarNav');
  const revealElements = document.querySelectorAll('.reveal');

  // ============================================
  // MOBILE NAVIGATION
  // ============================================
  
  /**
   * Toggle mobile navigation menu
   */
  function toggleMobileMenu() {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    menuToggle.classList.toggle('active');
    navbarNav.classList.toggle('active');
    document.body.style.overflow = isExpanded ? '' : 'hidden';
  }

  /**
   * Close mobile navigation menu
   */
  function closeMobileMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.classList.remove('active');
    navbarNav.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Event listener for menu toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMobileMenu);
  }

  // Close menu when clicking on a nav link
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    if (navbarNav && navbarNav.classList.contains('active')) {
      if (!navbarNav.contains(event.target) && !menuToggle.contains(event.target)) {
        closeMobileMenu();
      }
    }
  });

  // Close menu on escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && navbarNav && navbarNav.classList.contains('active')) {
      closeMobileMenu();
    }
  });

  // ============================================
  // NAVBAR SCROLL EFFECT
  // ============================================
  
  /**
   * Handle navbar styling on scroll
   */
  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      // Only remove scrolled class if not on a page that needs it by default
      if (!document.body.classList.contains('page-scrolled')) {
        navbar.classList.remove('scrolled');
      }
    }
  }

  // Throttled scroll event listener
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = window.requestAnimationFrame(handleNavbarScroll);
  }, { passive: true });

  // Initial check
  handleNavbarScroll();

  // ============================================
  // SCROLL REVEAL ANIMATIONS
  // ============================================
  
  /**
   * Intersection Observer for reveal animations
   */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Optionally unobserve after revealing
        // revealObserver.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  });

  // Observe all reveal elements
  revealElements.forEach(element => {
    revealObserver.observe(element);
  });

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  
  /**
   * Smooth scroll to anchor targets
   */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ============================================
  // FORM ENHANCEMENTS
  // ============================================
  
  /**
   * Add focus styles to form inputs
   */
  const formInputs = document.querySelectorAll('.form-input, .form-textarea, .form-select');
  formInputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
    });
  });

  /**
   * Pre-select service from URL parameter
   */
  function preselectService() {
    const urlParams = new URLSearchParams(window.location.search);
    const service = urlParams.get('service');
    
    if (service) {
      const serviceSelect = document.getElementById('contact-service');
      if (serviceSelect) {
        serviceSelect.value = service;
      }
      
      // Also check the appropriate checkbox in project inquiry form
      const serviceCheckbox = document.getElementById(`service-${service}`);
      if (serviceCheckbox) {
        serviceCheckbox.checked = true;
      }
    }
  }

  // Run on page load
  preselectService();

  /**
   * Submit contact forms to the Vercel Function at /api/contact.
   */
  const forms = document.querySelectorAll('form.contact-form');
  forms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const submitBtn = form.querySelector('.form-submit');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      let status = form.querySelector('.form-status');

      if (!status) {
        status = document.createElement('p');
        status.className = 'form-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        form.insertBefore(status, submitBtn || null);
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending...';
      }
      status.textContent = '';
      status.className = 'form-status';

      const formData = new FormData(form);
      const payload = {};
      for (const [key, value] of formData.entries()) {
        if (key === 'services') {
          payload[key] = payload[key] || [];
          payload[key].push(value);
        } else {
          payload[key] = value;
        }
      }

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'We could not send your message.');
        }

        form.reset();
        status.textContent = 'Thank you. Your message has been sent successfully.';
        status.classList.add('is-success');
      } catch (error) {
        status.textContent = error.message || 'Something went wrong. Please call or email us directly.';
        status.classList.add('is-error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  });

  // ============================================
  // PROCESS STEP ANIMATION
  // ============================================
  
  /**
   * Animate process steps on scroll
   */
  const processSteps = document.querySelectorAll('.process-step');
  const processObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, {
    threshold: 0.5
  });

  processSteps.forEach(step => {
    processObserver.observe(step);
  });

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  /**
   * Debounce function for performance
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function for scroll events
   */
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ============================================
  // ACCESSIBILITY ENHANCEMENTS
  // ============================================
  
  /**
   * Skip to main content functionality
   */
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', function(e) {
      e.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
        mainContent.removeAttribute('tabindex');
      }
    });
  }

  /**
   * Add aria-current to active nav links
   */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
      link.setAttribute('aria-current', 'page');
    }
  });

  // ============================================
  // PERFORMANCE: LAZY LOAD IMAGES
  // ============================================
  
  /**
   * Lazy load images using Intersection Observer
   */
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  }

  // ============================================
  // CONSOLE MESSAGE
  // ============================================
  
  console.log('%cPROLED Engineering Services Limited', 'color: #0099FF; font-size: 20px; font-weight: bold;');
  console.log('%cEngineering Excellence. Delivered with Precision.', 'color: #666; font-size: 14px;');
  console.log('%cCAC RC: 9412965', 'color: #0099FF; font-size: 12px;');

})();
