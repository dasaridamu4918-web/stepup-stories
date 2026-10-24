import { siteConfig, collections, products } from "./data/products.js";

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
});
