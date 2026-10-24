import { siteConfig, collections, products } from "./data/products.js";
import { storySequenceConfig } from "./data/storySequenceConfig.js";

/**
 * Generates an attractive, on-brand dark-gradient placeholder with a subtle
 * watch-shaped outline and the product name, overlaid with a lazy-loaded `<img>`
 * that automatically appears as soon as the user drops their photo into
 * `/public/assets/watches/...`.
 */
function createWatchVisualHTML({ imagePath, title, subtitle = "STEPUP STORIES", badge = "" }) {
  const safeTitle = escapeHTML(title);
  const safeSubtitle = escapeHTML(subtitle);
  const safePath = escapeHTML(imagePath);
  const resolvedSrc = safePath.startsWith("/") ? `.${safePath}` : safePath;

  return `
    <div class="watch-visual-slot">
      ${badge ? `<span class="product-badge">${escapeHTML(badge)}</span>` : ""}
      <img
        src="${resolvedSrc}"
        alt="${safeTitle}"
        class="watch-real-img"
        loading="lazy"
        width="600"
        height="645"
        onload="this.classList.add('is-loaded')"
        onerror="this.style.display='none'"
      />
      <div class="watch-placeholder-panel" aria-hidden="true">
        <span class="placeholder-top-tag">${safeSubtitle}</span>
        <svg
          class="placeholder-watch-svg"
          viewBox="0 0 140 190"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Upper Strap & Lugs -->
          <path d="M48 6H92L96 42H44L48 6Z" stroke="rgba(212,180,117,0.4)" stroke-width="1.5" fill="rgba(212,180,117,0.03)" />
          <line x1="54" y1="18" x2="86" y2="18" stroke="rgba(212,180,117,0.22)" stroke-width="1" />
          <line x1="52" y1="30" x2="88" y2="30" stroke="rgba(212,180,117,0.22)" stroke-width="1" />
          <!-- Lower Strap & Lugs -->
          <path d="M44 148H96L92 184H48L44 148Z" stroke="rgba(212,180,117,0.4)" stroke-width="1.5" fill="rgba(212,180,117,0.03)" />
          <line x1="52" y1="160" x2="88" y2="160" stroke="rgba(212,180,117,0.22)" stroke-width="1" />
          <line x1="54" y1="172" x2="86" y2="172" stroke="rgba(212,180,117,0.22)" stroke-width="1" />
          <!-- Octagonal Outer Bezel inspired by STEPUP STORIES emblem -->
          <polygon
            points="49,38 91,38 118,65 118,125 91,152 49,152 22,125 22,65"
            stroke="#d4b475"
            stroke-width="2"
            fill="rgba(12,16,20,0.88)"
          />
          <!-- Crown -->
          <rect x="119" y="87" width="7" height="16" rx="2" stroke="#d4b475" stroke-width="1.5" fill="#151a20" />
          <!-- Inner Dial Ring -->
          <circle cx="70" cy="95" r="41" stroke="rgba(212,180,117,0.5)" stroke-width="1.2" fill="rgba(7,9,11,0.9)" />
          <!-- Hour Indices -->
          <line x1="70" y1="58" x2="70" y2="64" stroke="#e8cfa0" stroke-width="2" />
          <line x1="70" y1="126" x2="70" y2="132" stroke="#d4b475" stroke-width="1.5" />
          <line x1="33" y1="95" x2="39" y2="95" stroke="#d4b475" stroke-width="1.5" />
          <line x1="101" y1="95" x2="107" y2="95" stroke="#d4b475" stroke-width="1.5" />
          <!-- Restrained Burgundy Jewel Accent at 12 o'clock -->
          <circle cx="70" cy="69" r="2.6" fill="#b82946" />
          <!-- Watch Hands (10:10 position) -->
          <line x1="70" y1="95" x2="54" y2="81" stroke="#e8cfa0" stroke-width="2.2" stroke-linecap="round" />
          <line x1="70" y1="95" x2="92" y2="78" stroke="#d4b475" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="70" cy="95" r="3" fill="#e8cfa0" />
        </svg>
        <div class="placeholder-caption-box">
          <p class="placeholder-watch-name">${safeTitle}</p>
          <span class="placeholder-watch-path">${safePath}</span>
        </div>
      </div>
    </div>
  `;
}

function escapeHTML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ==========================================================================
   STATE & DOM REFERENCES
   ========================================================================== */
const state = {
  activeCollection: "all",
  searchQuery: "",
  activeModalProduct: null,
  lastFocusedElement: null
};

/* ==========================================================================
   HERO LOGO ANIMATION (Lazy-loaded, Muted, Reduced-Motion & Fallback Safe)
   ========================================================================== */
function initHeroLogoAnimation() {
  const videoEl = document.getElementById("hero-logo-video");
  const toggleBtn = document.getElementById("hero-video-toggle");
  const statusText = document.getElementById("hero-video-status-text");
  if (!videoEl || !toggleBtn || !statusText) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Always enforce muted & playsinline so sound can never autoplay
  videoEl.muted = true;
  videoEl.defaultMuted = true;
  videoEl.playsInline = true;

  function showStaticFallback() {
    videoEl.classList.remove("is-playing");
    videoEl.pause();
    toggleBtn.hidden = true;
  }

  if (prefersReducedMotion.matches) {
    showStaticFallback();
    return;
  }

  // Lazy load video source after page load so it never blocks first render
  const loadVideoSource = () => {
    const source = videoEl.querySelector("source[data-src]");
    if (source && !source.src) {
      source.src = source.getAttribute("data-src");
      videoEl.load();
    }

    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          videoEl.classList.add("is-playing");
          statusText.textContent = "Pause Motion";
          toggleBtn.setAttribute("aria-label", "Pause emblem animation");
        })
        .catch(() => {
          // Fallback cleanly to static poster logo if autoplay is prevented or fails
          videoEl.classList.remove("is-playing");
          statusText.textContent = "Play Motion";
          toggleBtn.setAttribute("aria-label", "Play emblem animation");
        });
    }
  };

  videoEl.addEventListener("error", showStaticFallback);
  const sourceEl = videoEl.querySelector("source");
  if (sourceEl) {
    sourceEl.addEventListener("error", showStaticFallback);
  }

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadVideoSource, { timeout: 1200 });
  } else {
    window.addEventListener("load", loadVideoSource, { once: true });
  }

  toggleBtn.addEventListener("click", () => {
    if (videoEl.paused) {
      videoEl.play().then(() => {
        videoEl.classList.add("is-playing");
        statusText.textContent = "Pause Motion";
        toggleBtn.setAttribute("aria-label", "Pause emblem animation");
      }).catch(showStaticFallback);
    } else {
      videoEl.pause();
      statusText.textContent = "Play Motion";
      toggleBtn.setAttribute("aria-label", "Play emblem animation");
    }
  });

  prefersReducedMotion.addEventListener("change", (e) => {
    if (e.matches) {
      showStaticFallback();
    } else {
      toggleBtn.hidden = false;
      loadVideoSource();
    }
  });
}

/* ==========================================================================
   3. RENDER FIVE COLLECTIONS CAROUSEL
   ========================================================================== */
function renderCollectionsCarousel() {
  const track = document.getElementById("collections-carousel");
  if (!track) return;

  track.innerHTML = collections
    .map(
      (col) => `
      <article class="collection-card" data-collection-id="${escapeHTML(col.id)}">
        ${createWatchVisualHTML({
          imagePath: col.featuredImage,
          title: `${col.name} Collection`,
          subtitle: col.subtitle,
          badge: col.itemCountLabel
        })}
        <div class="collection-card-body">
          <div class="collection-meta">
            <span>${escapeHTML(col.subtitle)}</span>
            <span>${escapeHTML(col.itemCountLabel)}</span>
          </div>
          <h3 class="collection-card-title">${escapeHTML(col.name)}</h3>
          <p class="collection-card-desc">${escapeHTML(col.description)}</p>
          <button
            type="button"
            class="collection-explore-btn"
            data-select-collection="${escapeHTML(col.id)}"
          >
            Filter ${escapeHTML(col.name)} &#8594;
          </button>
        </div>
      </article>
    `
    )
    .join("");

  track.querySelectorAll("[data-select-collection]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const colId = btn.getAttribute("data-select-collection");
      setActiveCollection(colId, true);
    });
  });
}

/* ==========================================================================
   4. RENDER FEATURED WATCHES CAROUSEL
   ========================================================================== */
function createProductCardHTML(product) {
  return `
    <article class="product-card" data-product-id="${escapeHTML(product.id)}">
      ${createWatchVisualHTML({
        imagePath: product.image,
        title: product.name,
        subtitle: product.collectionName,
        badge: product.badge
      })}
      <div class="product-card-body">
        <span class="product-collection-label">${escapeHTML(product.collectionName)}</span>
        <h3 class="product-card-title">${escapeHTML(product.name)}</h3>
        <p class="product-card-desc">${escapeHTML(product.shortDescription)}</p>
        <div class="product-card-footer">
          <span class="product-price">${escapeHTML(product.price)}</span>
          <div class="product-card-actions">
            <button
              type="button"
              class="btn btn-outline btn-sm"
              data-open-product="${escapeHTML(product.id)}"
            >
              Details
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              data-open-product="${escapeHTML(product.id)}"
              data-focus-enquire="true"
            >
              Enquire
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderFeaturedCarousel() {
  const track = document.getElementById("featured-carousel");
  if (!track) return;

  const featuredProducts = products.filter((p) => p.featured);
  track.innerHTML = featuredProducts.map(createProductCardHTML).join("");
  bindProductCardButtons(track);
}

/* ==========================================================================
   5. COLLECTION FILTERS & WORKING SEARCH CATALOG
   ========================================================================== */
function renderFilterPills() {
  const group = document.getElementById("collection-filter-group");
  if (!group) return;

  const pills = [
    { id: "all", name: "All Collections" },
    ...collections.map((c) => ({ id: c.id, name: c.name }))
  ];

  group.innerHTML = pills
    .map(
      (pill) => `
      <button
        type="button"
        class="filter-pill"
        data-filter-id="${escapeHTML(pill.id)}"
        aria-pressed="${state.activeCollection === pill.id ? "true" : "false"}"
      >
        ${escapeHTML(pill.name)}
      </button>
    `
    )
    .join("");

  group.querySelectorAll(".filter-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-filter-id");
      setActiveCollection(id, false);
    });
  });
}

function setActiveCollection(collectionId, scrollToCatalog = false) {
  state.activeCollection = collectionId;
  renderFilterPills();
  renderCatalogGrid();

  if (scrollToCatalog) {
    const catalogSection = document.getElementById("catalog");
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: "smooth" });
    }
  }
}

function setSearchQuery(query, scrollToCatalog = false) {
  state.searchQuery = query.trim();

  const headerInput = document.getElementById("header-search-input");
  const mobileInput = document.getElementById("mobile-search-input");
  const catalogInput = document.getElementById("catalog-search-input");
  const clearBtn = document.getElementById("catalog-search-clear");

  if (headerInput && headerInput.value !== query) headerInput.value = query;
  if (mobileInput && mobileInput.value !== query) mobileInput.value = query;
  if (catalogInput && catalogInput.value !== query) catalogInput.value = query;
  if (clearBtn) clearBtn.hidden = state.searchQuery.length === 0;

  renderCatalogGrid();

  if (scrollToCatalog) {
    const catalogSection = document.getElementById("catalog");
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: "smooth" });
    }
  }
}

function renderCatalogGrid() {
  const grid = document.getElementById("catalog-grid");
  const countEl = document.getElementById("catalog-count");
  if (!grid || !countEl) return;

  const q = state.searchQuery.toLowerCase();
  const filtered = products.filter((item) => {
    const matchesCollection =
      state.activeCollection === "all" || item.collectionId === state.activeCollection;
    if (!matchesCollection) return false;
    if (!q) return true;

    const haystack = [
      item.name,
      item.collectionName,
      item.reference,
      item.shortDescription,
      item.description,
      item.price
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  countEl.textContent = `Showing ${filtered.length} of ${products.length} timepieces`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-catalog-state">
        <h3 class="collection-card-title">No Matching Timepieces Found</h3>
        <p class="section-subtitle" style="margin-inline:auto;">
          No watches matched your current filter or search query ("${escapeHTML(state.searchQuery)}").
        </p>
        <button type="button" class="btn btn-outline" id="reset-catalog-filters">
          Reset Filters &amp; Search
        </button>
      </div>
    `;
    const resetBtn = document.getElementById("reset-catalog-filters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        state.activeCollection = "all";
        renderFilterPills();
        setSearchQuery("", false);
      });
    }
    return;
  }

  grid.innerHTML = filtered.map(createProductCardHTML).join("");
  bindProductCardButtons(grid);
}

function bindProductCardButtons(container) {
  container.querySelectorAll("[data-open-product]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const productId = btn.getAttribute("data-open-product");
      const focusEnquire = btn.getAttribute("data-focus-enquire") === "true";
      openProductModal(productId, focusEnquire, btn);
    });
  });
}

/* ==========================================================================
   6. PRODUCT DETAIL MODAL
   ========================================================================== */
function openProductModal(productId, focusEnquire = false, triggerEl = null) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  state.activeModalProduct = product;
  state.lastFocusedElement = triggerEl || document.activeElement;

  const backdrop = document.getElementById("product-modal-backdrop");
  const modal = document.getElementById("product-modal");
  const collectionTag = document.getElementById("modal-collection-tag");
  const referenceEl = document.getElementById("modal-reference");
  const titleEl = document.getElementById("modal-product-title");
  const priceEl = document.getElementById("modal-product-price");
  const descEl = document.getElementById("modal-product-description");
  const specsList = document.getElementById("modal-specs-list");
  const pathCode = document.getElementById("modal-image-path-code");
  const enquireBtn = document.getElementById("modal-enquire-btn");
  const buyBtn = document.getElementById("modal-buy-btn");
  const statusEl = document.getElementById("modal-enquiry-status");

  collectionTag.textContent = product.collectionName;
  referenceEl.textContent = product.reference;
  titleEl.textContent = product.name;
  priceEl.textContent = product.price;
  descEl.textContent = product.description;
  pathCode.textContent = `/public${product.image}`;

  specsList.innerHTML = product.details
    .map(
      (d) => `
      <div class="spec-row">
        <dt>${escapeHTML(d.label)}</dt>
        <dd>${escapeHTML(d.value)}</dd>
      </div>
    `
    )
    .join("");

  enquireBtn.href = product.enquiryUrl || siteConfig.enquiry.defaultLink;
  buyBtn.href = product.buyUrl || siteConfig.enquiry.defaultLink;
  statusEl.hidden = true;

  renderModalGallery(product, 0);

  backdrop.hidden = false;
  backdrop.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (focusEnquire) {
    enquireBtn.focus();
  } else {
    modal.focus();
  }
}

function renderModalGallery(product, activeIndex) {
  const stage = document.getElementById("modal-main-stage");
  const captionEl = document.getElementById("modal-gallery-caption");
  const thumbsContainer = document.getElementById("modal-thumbnails");
  const pathCode = document.getElementById("modal-image-path-code");

  const gallery = product.gallery && product.gallery.length > 0
    ? product.gallery
    : [{ src: product.image, caption: "Primary View (Placeholder)" }];

  const currentItem = gallery[activeIndex] || gallery[0];

  stage.innerHTML = createWatchVisualHTML({
    imagePath: currentItem.src,
    title: `${product.name} — ${currentItem.caption}`,
    subtitle: product.collectionName,
    badge: product.badge
  });

  captionEl.textContent = currentItem.caption;
  pathCode.textContent = `/public${currentItem.src}`;

  thumbsContainer.innerHTML = gallery
    .map(
      (item, idx) => `
      <button
        type="button"
        class="modal-thumb-btn"
        aria-current="${idx === activeIndex ? "true" : "false"}"
        data-gallery-index="${idx}"
      >
        View ${idx + 1}<br />
        <span>${escapeHTML(item.caption.replace(" (Placeholder)", ""))}</span>
      </button>
    `
    )
    .join("");

  thumbsContainer.querySelectorAll("[data-gallery-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-gallery-index"));
      renderModalGallery(product, idx);
    });
  });
}

function closeProductModal() {
  const backdrop = document.getElementById("product-modal-backdrop");
  if (!backdrop || backdrop.hidden) return;

  backdrop.hidden = true;
  backdrop.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
    state.lastFocusedElement.focus();
  }
}

function initModalEvents() {
  const backdrop = document.getElementById("product-modal-backdrop");
  const closeBtn = document.getElementById("modal-close-btn");
  const enquireBtn = document.getElementById("modal-enquire-btn");
  const buyBtn = document.getElementById("modal-buy-btn");
  const statusEl = document.getElementById("modal-enquiry-status");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeProductModal);
  }

  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeProductModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeProductModal();
    }
  });

  const handlePlaceholderAction = (actionLabel) => (e) => {
    const href = e.currentTarget.getAttribute("href") || "";
    if (href.startsWith("#")) {
      e.preventDefault();
      const prodName = state.activeModalProduct ? state.activeModalProduct.name : "this timepiece";
      statusEl.textContent = `${actionLabel} placeholder ready for "${prodName}". Connect your WhatsApp, email, or payment link in src/data/products.js (${href}).`;
      statusEl.hidden = false;
    }
  };

  if (enquireBtn) {
    enquireBtn.addEventListener("click", handlePlaceholderAction("Concierge Enquiry"));
  }
  if (buyBtn) {
    buyBtn.addEventListener("click", handlePlaceholderAction("Direct Acquisition"));
  }
}

/* ==========================================================================
   CAROUSEL INTERACTION (Swipe, Mouse Drag, Buttons & Keyboard Arrow Keys)
   ========================================================================== */
function initCarousels() {
  document.querySelectorAll("[data-carousel-prev]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-carousel-prev");
      const track = document.getElementById(id);
      if (track) {
        track.scrollBy({ left: -360, behavior: "smooth" });
      }
    });
  });

  document.querySelectorAll("[data-carousel-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-carousel-next");
      const track = document.getElementById(id);
      if (track) {
        track.scrollBy({ left: 360, behavior: "smooth" });
      }
    });
  });

  document.querySelectorAll(".carousel-track").forEach((track) => {
    // Keyboard support when track is focused
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        track.scrollBy({ left: 340, behavior: "smooth" });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        track.scrollBy({ left: -340, behavior: "smooth" });
      }
    });

    // Pointer drag support for desktop mouse users
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    track.addEventListener("mousedown", (e) => {
      if (e.target.closest("button, a")) return;
      isDown = true;
      track.classList.add("is-dragging");
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    track.addEventListener("mouseleave", () => {
      isDown = false;
      track.classList.remove("is-dragging");
    });

    track.addEventListener("mouseup", () => {
      isDown = false;
      track.classList.remove("is-dragging");
    });

    track.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.4;
      track.scrollLeft = scrollLeft - walk;
    });
  });
}

/* ==========================================================================
   HEADER NAVIGATION, SEARCH & MOBILE MENU
   ========================================================================== */
function initHeaderAndSearch() {
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const mobileDrawer = document.getElementById("mobile-navigation-drawer");

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener("click", () => {
      const expanded = mobileToggle.getAttribute("aria-expanded") === "true";
      mobileToggle.setAttribute("aria-expanded", String(!expanded));
      mobileDrawer.hidden = expanded;
    });

    mobileDrawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileToggle.setAttribute("aria-expanded", "false");
        mobileDrawer.hidden = true;
      });
    });
  }

  const headerSearchForm = document.getElementById("header-search-form");
  const headerSearchInput = document.getElementById("header-search-input");
  const mobileSearchForm = document.getElementById("mobile-search-form");
  const mobileSearchInput = document.getElementById("mobile-search-input");
  const catalogSearchInput = document.getElementById("catalog-search-input");
  const catalogSearchClear = document.getElementById("catalog-search-clear");

  if (headerSearchForm && headerSearchInput) {
    headerSearchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      setSearchQuery(headerSearchInput.value, true);
    });
    headerSearchInput.addEventListener("input", () => {
      setSearchQuery(headerSearchInput.value, false);
    });
  }

  if (mobileSearchForm && mobileSearchInput) {
    mobileSearchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (mobileToggle && mobileDrawer) {
        mobileToggle.setAttribute("aria-expanded", "false");
        mobileDrawer.hidden = true;
      }
      setSearchQuery(mobileSearchInput.value, true);
    });
    mobileSearchInput.addEventListener("input", () => {
      setSearchQuery(mobileSearchInput.value, false);
    });
  }

  if (catalogSearchInput) {
    catalogSearchInput.addEventListener("input", () => {
      setSearchQuery(catalogSearchInput.value, false);
    });
  }

  if (catalogSearchClear) {
    catalogSearchClear.addEventListener("click", () => {
      setSearchQuery("", false);
      if (catalogSearchInput) catalogSearchInput.focus();
    });
  }
}

/* ==========================================================================
   8 & 9. NEWSLETTER & FOOTER INITIALIZATION
   ========================================================================== */
function initNewsletterAndFooter() {
  const form = document.getElementById("newsletter-form");
  const feedback = document.getElementById("newsletter-feedback");

  if (form && feedback) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("newsletter-email");
      const nameInput = document.getElementById("newsletter-name");
      const email = emailInput ? emailInput.value.trim() : "";
      const name = nameInput ? nameInput.value.trim() : "";

      if (!email || !email.includes("@")) {
        feedback.textContent = "Please enter a valid email address to join the STEPUP STORIES private register.";
        feedback.hidden = false;
        return;
      }

      feedback.textContent = `Thank you${name ? `, ${name}` : ""}. "${email}" has been recorded in the front-end preview. Connect your mailing endpoint in src/main.js when ready.`;
      feedback.hidden = false;
      form.reset();
    });
  }

  // Populate Footer dynamic data from siteConfig & collections
  const footerCollections = document.getElementById("footer-collection-links");
  if (footerCollections) {
    footerCollections.innerHTML = collections
      .map(
        (col) => `
        <li>
          <a href="#catalog" data-footer-collection="${escapeHTML(col.id)}">
            ${escapeHTML(col.name)}
          </a>
        </li>
      `
      )
      .join("");

    footerCollections.querySelectorAll("[data-footer-collection]").forEach((link) => {
      link.addEventListener("click", () => {
        const colId = link.getAttribute("data-footer-collection");
        setActiveCollection(colId, false);
      });
    });
  }

  const footerContact = document.getElementById("footer-contact-list");
  if (footerContact) {
    footerContact.innerHTML = `
      <li>${escapeHTML(siteConfig.contact.address)}</li>
      <li><a href="mailto:${escapeHTML(siteConfig.contact.email)}">${escapeHTML(siteConfig.contact.email)}</a></li>
      <li>${escapeHTML(siteConfig.contact.phone)}</li>
      <li>${escapeHTML(siteConfig.contact.hours)}</li>
    `;
  }

  const footerSocials = document.getElementById("footer-social-links");
  if (footerSocials) {
    footerSocials.innerHTML = siteConfig.socials
      .map(
        (s) => `
        <li>
          <a href="${escapeHTML(s.url)}">
            ${escapeHTML(s.label)} — <span>${escapeHTML(s.handle)}</span>
          </a>
        </li>
      `
      )
      .join("");
  }
}

/* ==========================================================================
   2.5 SCROLL-CONTROLLED FRAME SEQUENCE STORY ENGINE
   ========================================================================== */
function initScrollStorySequence() {
  const sectionEl = document.getElementById("scroll-story");
  const trackEl = document.getElementById("scroll-story-track");
  const stickyEl = document.getElementById("scroll-story-sticky");
  const canvas = document.getElementById("scroll-story-canvas");
  const posterEl = document.getElementById("scroll-story-poster");
  const progressFill = document.getElementById("scroll-story-progress-fill");
  const frameReadout = document.getElementById("scroll-story-frame-readout");
  const captionsStage = document.getElementById("scroll-story-captions-stage");
  const hintEl = document.getElementById("scroll-story-hint");
  const reducedWrap = document.getElementById("scroll-story-reduced");
  const reducedImg = document.getElementById("scroll-story-reduced-img");
  const reducedCaptions = document.getElementById("scroll-story-reduced-captions");

  if (!sectionEl || !trackEl || !canvas) return;

  const cfg = storySequenceConfig;
  const totalFrames = cfg.frameCount;

  // Apply scroll track lengths from single config file
  trackEl.style.setProperty("--story-scroll-length", cfg.scrollLengthDesktop);
  trackEl.style.setProperty("--story-scroll-length-mobile", cfg.scrollLengthMobile);
  canvas.setAttribute("aria-label", cfg.canvasAriaLabel);

  const padIndex = (n) => String(n).padStart(cfg.indexPadding || 3, "0");
  const isMobileViewport = () => window.innerWidth <= (cfg.mobileBreakpoint || 768);
  const getFrameUrl = (index1Based) => {
    const pattern = isMobileViewport() ? cfg.mobilePathPattern : cfg.desktopPathPattern;
    return pattern.replace("{index}", padIndex(index1Based));
  };

  // Populate interactive fade-in captions
  if (captionsStage) {
    captionsStage.innerHTML = cfg.captions
      .map(
        (cap) => `
        <article
          class="scroll-story-caption-card"
          data-caption-id="${escapeHTML(cap.id)}"
          data-start-frame="${cap.startFrame}"
          data-end-frame="${cap.endFrame}"
        >
          <p class="scroll-caption-eyebrow">${escapeHTML(cap.eyebrow)}</p>
          <h3 class="scroll-caption-title">${escapeHTML(cap.title)}</h3>
          <p class="scroll-caption-body">${escapeHTML(cap.body)}</p>
        </article>
      `
      )
      .join("");
  }

  // Populate reduced-motion static fallback view
  if (reducedCaptions) {
    reducedCaptions.innerHTML = cfg.captions
      .map(
        (cap) => `
        <article class="reduced-caption-item">
          <p class="scroll-caption-eyebrow">${escapeHTML(cap.eyebrow)}</p>
          <h3 class="scroll-caption-title">${escapeHTML(cap.title)}</h3>
          <p class="scroll-caption-body">${escapeHTML(cap.body)}</p>
        </article>
      `
      )
      .join("");
  }

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function applyReducedMotionState(isReduced) {
    if (isReduced) {
      trackEl.hidden = true;
      if (reducedWrap) reducedWrap.hidden = false;
      if (reducedImg) {
        reducedImg.src = getFrameUrl(cfg.reducedMotionFrame || 120);
      }
      return true;
    } else {
      trackEl.hidden = false;
      if (reducedWrap) reducedWrap.hidden = true;
      return false;
    }
  }

  if (applyReducedMotionState(reducedMotionQuery.matches)) {
    reducedMotionQuery.addEventListener("change", (e) => {
      if (!applyReducedMotionState(e.matches)) {
        initScrollStorySequence();
      }
    });
    return;
  }

  reducedMotionQuery.addEventListener("change", (e) => {
    applyReducedMotionState(e.matches);
  });

  // Frame storage & loading state (1-based index: 1..totalFrames)
  const frames = new Array(totalFrames + 1).fill(null);
  const frameStatus = new Array(totalFrames + 1).fill(0); // 0 = unloaded, 1 = loading, 2 = loaded, -1 = error
  let activeLoads = 0;
  let backgroundLoaderStarted = false;

  // Scroll & interpolation state
  let targetFrameFloat = 1;
  let currentFrameFloat = 1;
  let lastDrawnFrameIndex = -1;
  let lastCanvasWidth = 0;
  let lastCanvasHeight = 0;
  let rafId = null;

  const ctx = canvas.getContext("2d", { alpha: false });
  const captionCards = captionsStage
    ? Array.from(captionsStage.querySelectorAll(".scroll-story-caption-card"))
    : [];

  // Find the nearest loaded frame to `desiredIndex` so we never show a blank/broken frame
  function getNearestLoadedFrameIndex(desiredIndex) {
    if (frames[desiredIndex]) return desiredIndex;
    for (let offset = 1; offset < totalFrames; offset++) {
      const lower = desiredIndex - offset;
      if (lower >= 1 && frames[lower]) return lower;
      const upper = desiredIndex + offset;
      if (upper <= totalFrames && frames[upper]) return upper;
    }
    return -1;
  }

  function resizeCanvasIfNeeded() {
    if (!stickyEl) return false;
    const rect = stickyEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = Math.max(1, Math.round(rect.width * dpr));
    const displayHeight = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      lastCanvasWidth = displayWidth;
      lastCanvasHeight = displayHeight;
      return true;
    }
    return false;
  }

  function drawFrame(frameIndex) {
    const resized = resizeCanvasIfNeeded();
    const resolvedIndex = getNearestLoadedFrameIndex(frameIndex);

    if (resolvedIndex === -1) {
      // Keep the HTML poster visible until at least 1 frame is decoded
      if (posterEl) posterEl.classList.remove("is-hidden");
      return;
    }

    // Do not redraw if the resolved frame and canvas size haven't changed
    if (!resized && resolvedIndex === lastDrawnFrameIndex) {
      return;
    }

    const img = frames[resolvedIndex];
    if (!img) return;

    const cw = lastCanvasWidth || canvas.width;
    const ch = lastCanvasHeight || canvas.height;
    const iw = img.naturalWidth || cfg.frameWidth;
    const ih = img.naturalHeight || cfg.frameHeight;

    // Fill near-black background matching the site palette
    ctx.fillStyle = "#050608";
    ctx.fillRect(0, 0, cw, ch);

    // Desktop: "contain" centered; Mobile (<=768px): "cover" where it fills the vertical screen cleanly
    const useCover = isMobileViewport();
    const scale = useCover
      ? Math.max(cw / iw, ch / ih)
      : Math.min(cw / iw, ch / ih);

    const drawW = iw * scale;
    const drawH = ih * scale;
    const drawX = (cw - drawW) * 0.5;
    const drawY = (ch - drawH) * 0.5;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    lastDrawnFrameIndex = resolvedIndex;
    if (posterEl) {
      posterEl.classList.add("is-hidden");
    }
  }

  function updateHUD(frameIndex, progress0To1) {
    if (progressFill) {
      progressFill.style.transform = `scaleX(${progress0To1.toFixed(4)})`;
    }
    if (frameReadout) {
      frameReadout.textContent = `FRAME ${padIndex(frameIndex)} / ${totalFrames}`;
    }
    if (hintEl) {
      if (progress0To1 > 0.04) {
        hintEl.classList.add("is-hidden");
      } else {
        hintEl.classList.remove("is-hidden");
      }
    }
    for (let i = 0; i < captionCards.length; i++) {
      const card = captionCards[i];
      const start = Number(card.getAttribute("data-start-frame"));
      const end = Number(card.getAttribute("data-end-frame"));
      const active = frameIndex >= start && frameIndex <= end;
      card.classList.toggle("is-active", active);
    }
  }

  function computeScrollProgress() {
    const rect = trackEl.getBoundingClientRect();
    const stickyHeight = stickyEl ? stickyEl.offsetHeight : window.innerHeight;
    const scrollableDistance = Math.max(1, rect.height - stickyHeight);
    // Offset by header height so progress starts right when sticky locks in
    const headerOffset = 82;
    const scrolled = headerOffset - rect.top;
    const clamped = Math.max(0, Math.min(1, scrolled / scrollableDistance));
    targetFrameFloat = 1 + clamped * (totalFrames - 1);
    return clamped;
  }

  function tick() {
    const progress = computeScrollProgress();
    // Smooth interpolation toward target frame
    const diff = targetFrameFloat - currentFrameFloat;
    if (Math.abs(diff) > 0.05) {
      currentFrameFloat += diff * 0.28;
    } else {
      currentFrameFloat = targetFrameFloat;
    }

    const displayFrame = Math.max(1, Math.min(totalFrames, Math.round(currentFrameFloat)));
    drawFrame(displayFrame);
    updateHUD(displayFrame, progress);

    if (Math.abs(targetFrameFloat - currentFrameFloat) > 0.05) {
      rafId = window.requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function requestTick() {
    if (rafId === null) {
      rafId = window.requestAnimationFrame(tick);
    }
  }

  // Priority-aware non-blocking frame loader
  function loadSingleFrame(index, onDone) {
    if (index < 1 || index > totalFrames || frameStatus[index] !== 0) {
      if (onDone) onDone();
      return;
    }
    frameStatus[index] = 1;
    activeLoads++;

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      frames[index] = img;
      frameStatus[index] = 2;
      activeLoads--;
      // Redraw immediately if this frame improves what's currently on screen
      const targetRounded = Math.round(currentFrameFloat);
      if (Math.abs(index - targetRounded) <= 4 || lastDrawnFrameIndex === -1) {
        requestTick();
      }
      if (onDone) onDone();
    };
    img.onerror = () => {
      frameStatus[index] = -1;
      activeLoads--;
      if (onDone) onDone();
    };
    img.src = getFrameUrl(index);
  }

  function pickNextFrameToLoad() {
    const center = Math.max(1, Math.min(totalFrames, Math.round(targetFrameFloat)));
    const radius = cfg.priorityWindowRadius || 12;

    // 1. Prioritize frames near the user's current scroll position
    for (let offset = 0; offset <= radius; offset++) {
      const fwd = center + offset;
      if (fwd <= totalFrames && frameStatus[fwd] === 0) return fwd;
      const bwd = center - offset;
      if (bwd >= 1 && frameStatus[bwd] === 0) return bwd;
    }

    // 2. Next, ensure the first initialPreloadCount frames (1..25) are loaded
    const preloadLimit = Math.min(totalFrames, cfg.initialPreloadCount || 25);
    for (let i = 1; i <= preloadLimit; i++) {
      if (frameStatus[i] === 0) return i;
    }

    // 3. Finally, load remaining frames in sequential order
    for (let i = 1; i <= totalFrames; i++) {
      if (frameStatus[i] === 0) return i;
    }
    return -1;
  }

  function pumpLoadQueue() {
    const maxConcurrency = cfg.maxConcurrentLoads || 4;
    while (activeLoads < maxConcurrency) {
      const nextIdx = pickNextFrameToLoad();
      if (nextIdx === -1) break;
      loadSingleFrame(nextIdx, pumpLoadQueue);
    }
  }

  function startFrameLoading() {
    if (backgroundLoaderStarted) return;
    backgroundLoaderStarted = true;
    // Load frame 1 immediately, then pump queue
    loadSingleFrame(1, () => {
      requestTick();
      pumpLoadQueue();
    });
  }

  // Start loading the first 25 frames after initial page render, or immediately if scrolled near
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startFrameLoading();
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(sectionEl);
  }

  window.addEventListener(
    "load",
    () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(startFrameLoading, { timeout: 1000 });
      } else {
        setTimeout(startFrameLoading, 250);
      }
    },
    { once: true }
  );

  window.addEventListener(
    "scroll",
    () => {
      if (backgroundLoaderStarted) {
        pumpLoadQueue();
      }
      requestTick();
    },
    { passive: true }
  );

  window.addEventListener(
    "resize",
    () => {
      lastDrawnFrameIndex = -1;
      requestTick();
    },
    { passive: true }
  );

  // Initial layout & HUD render
  requestTick();
}

/* ==========================================================================
   BOOT APPLICATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  renderCollectionsCarousel();
  renderFeaturedCarousel();
  renderFilterPills();
  renderCatalogGrid();
  initCarousels();
  initHeaderAndSearch();
  initModalEvents();
  initNewsletterAndFooter();
  initHeroLogoAnimation();
  initScrollStorySequence();
});
