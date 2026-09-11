/**
 * Zaki Ahmad — Portfolio interactions.
 * No secrets, API keys or credentials belong in client JS.
 * All DOM manipulation uses textContent or safe attribute setters — no innerHTML with user input.
 */
(() => {
  "use strict";

  // ── Feature detection ──
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  const supportsIO = "IntersectionObserver" in window;

  // ── Cache DOM refs ──
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const scrollProgressBar = $(".scroll-progress");
  const cursorGlow = $(".cursor-glow");
  const nav = $(".site-nav");
  const navToggle = $(".nav-toggle");
  const navMenu = $("#nav-menu");
  const navLinks = $$("[data-nav]");
  const sections = $$("main section[id]");
  const revealEls = $$("[data-reveal]");
  const statNumbers = $$(".stat-number[data-count]");
  const tiltCards = $$("[data-tilt]");
  const heroSection = $(".hero");


  /* ================================================================
     SCROLL PROGRESS BAR
     ================================================================ */
  function updateScrollProgress() {
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollMax > 0 ? (window.scrollY / scrollMax) * 100 : 0;
    scrollProgressBar.style.width = pct + "%";
  }

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  updateScrollProgress();


  /* ================================================================
     NAV – SCROLLED STATE
     ================================================================ */
  function updateNavState() {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  }

  window.addEventListener("scroll", updateNavState, { passive: true });
  updateNavState();


  /* ================================================================
     CURSOR-REACTIVE GLOW (desktop only)
     ================================================================ */
  if (cursorGlow && !prefersReducedMotion && hasFinePointer) {
    let glowX = 0, glowY = 0, currentX = 0, currentY = 0;
    let glowActive = false;
    let rafId = null;

    function lerpGlow() {
      currentX += (glowX - currentX) * 0.12;
      currentY += (glowY - currentY) * 0.12;
      cursorGlow.style.left = currentX + "px";
      cursorGlow.style.top = currentY + "px";
      rafId = requestAnimationFrame(lerpGlow);
    }

    document.addEventListener("pointermove", (e) => {
      glowX = e.clientX;
      glowY = e.clientY;
      if (!glowActive) {
        glowActive = true;
        cursorGlow.classList.add("active");
        rafId = requestAnimationFrame(lerpGlow);
      }
    }, { passive: true });

    document.addEventListener("pointerleave", () => {
      glowActive = false;
      cursorGlow.classList.remove("active");
      if (rafId) cancelAnimationFrame(rafId);
    });
  }


  /* ================================================================
     HERO BACKGROUND – SUBTLE PARALLAX ON SCROLL
     ================================================================ */
  if (heroSection && !prefersReducedMotion) {
    const heroGrid = $(".hero-grid-pattern");
    if (heroGrid) {
      window.addEventListener("scroll", () => {
        const scrollY = window.scrollY;
        const heroH = heroSection.offsetHeight;
        if (scrollY < heroH) {
          const offset = scrollY * 0.15;
          heroGrid.style.transform = "translateY(" + offset + "px)";
        }
      }, { passive: true });
    }
  }


  /* ================================================================
     SCROLL-REVEAL (IntersectionObserver)
     ================================================================ */
  if (supportsIO && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    // If no IO or reduced motion, show everything immediately
    revealEls.forEach((el) => el.classList.add("revealed"));
  }


  /* ================================================================
     ACTIVE NAV SECTION HIGHLIGHT
     ================================================================ */
  if (supportsIO && sections.length > 0 && navLinks.length > 0) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
              link.classList.toggle("active", link.getAttribute("href") === "#" + id);
            });
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    sections.forEach((s) => navObserver.observe(s));
  }


  /* ================================================================
     MOBILE NAVIGATION
     ================================================================ */
  if (navToggle && navMenu) {
    function openNav() {
      navMenu.classList.add("open");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Close navigation menu");
      document.body.classList.add("menu-open");
    }

    function closeNav() {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation menu");
      document.body.classList.remove("menu-open");
    }

    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.contains("open");
      isOpen ? closeNav() : openNav();
    });

    // Close when a nav link is clicked
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMenu.classList.contains("open")) {
        closeNav();
        navToggle.focus();
      }
    });
  }


  /* ================================================================
     ANIMATED STAT COUNT-UP
     ================================================================ */
  if (supportsIO && !prefersReducedMotion && statNumbers.length > 0) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          const end = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || "";

          if (isNaN(end)) return;

          const duration = 1200;
          const startTime = performance.now();

          function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(end * eased) + suffix;

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          }

          requestAnimationFrame(animate);
          countObserver.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );

    statNumbers.forEach((el) => countObserver.observe(el));
  } else {
    // Show final values immediately
    statNumbers.forEach((el) => {
      el.textContent = (el.dataset.count || "0") + (el.dataset.suffix || "");
    });
  }


  /* ================================================================
     3D TILT ON CARDS (desktop with fine pointer only)
     ================================================================ */
  if (!prefersReducedMotion && hasFinePointer && tiltCards.length > 0) {
    tiltCards.forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        const rotateX = (-y * 6).toFixed(2);
        const rotateY = (x * 6).toFixed(2);

        card.style.transform =
          "perspective(800px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateY(-4px)";
      }, { passive: true });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }


  /* ================================================================
     SMOOTH SCROLL for nav links (fallback for Safari < 15.4)
     ================================================================ */
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      // Update URL without triggering scroll
      history.pushState(null, "", href);
    });
  });

})();
