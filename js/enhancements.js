/**
 * enhancements.js — GreenCart UI Enhancements
 *
 * ADDITIVE ONLY — This file does NOT modify any functions from script.js.
 * All original logic (addToCart, removeFromCart, updateCartDisplay, Swiper init,
 * navbar/search/login/cart toggles) is preserved untouched in script.js.
 *
 * What this file adds:
 *  1. Dark Mode Toggle (localStorage persistent)
 *  2. Toast Notification System
 *  3. Wishlist Feature (localStorage persistent)
 *  4. Cart Badge Counter
 *  5. Back-to-Top Button
 *  6. Scroll Reveal Animations
 *  7. Live Search/Filter for products
 */

/* =============================================================
   WAIT FOR DOM
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {

    /* ----------------------------------------------------------
       0. SWIPER — re-initialize with enhanced config
       (script.js already inits but this ensures correct timing with FA6)
    ---------------------------------------------------------- */
    // Swiper is initialized in script.js — no changes needed.

    /* ----------------------------------------------------------
       1. DARK MODE TOGGLE
    ---------------------------------------------------------- */
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const html = document.documentElement;

    // Restore saved preference
    const savedTheme = localStorage.getItem('gc-theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateDarkIcon(savedTheme);

    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('gc-theme', next);
            updateDarkIcon(next);
            showToast(next === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on', 'info');
        });
    }

    function updateDarkIcon(theme) {
        if (!darkModeBtn) return;
        darkModeBtn.className = theme === 'dark'
            ? 'fa-solid fa-sun'
            : 'fa-solid fa-moon';
    }

    /* ----------------------------------------------------------
       2. TOAST NOTIFICATION SYSTEM
    ---------------------------------------------------------- */
    // Icons per type
    const TOAST_ICONS = {
        success: 'fa-solid fa-circle-check',
        error: 'fa-solid fa-circle-xmark',
        info: 'fa-solid fa-circle-info',
        warning: 'fa-solid fa-triangle-exclamation'
    };

    /**
     * showToast — global accessible function
     * @param {string} message - text to show
     * @param {'success'|'error'|'info'|'warning'} type
     * @param {number} duration - ms before auto-dismiss (default 3000)
     */
    window.showToast = function (message, type = 'success', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="${TOAST_ICONS[type] || TOAST_ICONS.info}"></i><span>${message}</span>`;

        container.appendChild(toast);

        // Auto-remove
        const timer = setTimeout(() => dismissToast(toast), duration);

        // Click to dismiss early
        toast.addEventListener('click', () => {
            clearTimeout(timer);
            dismissToast(toast);
        });
    };

    function dismissToast(toast) {
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }

    /* ----------------------------------------------------------
       3. CART BADGE COUNTER
       Hooks onto the existing cart array from script.js
    ---------------------------------------------------------- */
    const cartBadge = document.getElementById('cart-count');

    window.updateCartBadge = function () {
        // `cart` is defined globally in script.js
        if (typeof cart === 'undefined' || !cartBadge) return;
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = total > 99 ? '99+' : total;

        if (total > 0) {
            cartBadge.classList.add('visible');
            cartBadge.classList.add('bump');
            setTimeout(() => cartBadge.classList.remove('bump'), 300);
        } else {
            cartBadge.classList.remove('visible');
        }
    };

    /* ── Patch addToCart to also call badge updater & toast (SAFE WRAP) ── */
    // We save original from script.js, wrap it, and reassign globally
    const _originalAddToCart = window.addToCart;
    if (typeof _originalAddToCart === 'function') {
        window.addToCart = function (productId, productName, productPrice, productsrc) {
            _originalAddToCart(productId, productName, productPrice, productsrc);
            updateCartBadge();
            showToast(`🛒 <strong>${productName}</strong> added to cart!`, 'success');
        };
    }

    /* ── Patch removeFromCart to also call badge updater & toast (SAFE WRAP) ── */
    const _originalRemoveFromCart = window.removeFromCart;
    if (typeof _originalRemoveFromCart === 'function') {
        window.removeFromCart = function (productId) {
            // Find name before removal
            const item = (typeof cart !== 'undefined') ? cart.find(i => i.id === productId) : null;
            _originalRemoveFromCart(productId);
            updateCartBadge();
            if (item) showToast(`Removed <strong>${item.name}</strong> from cart`, 'error');
        };
    }

    /* ----------------------------------------------------------
       4. CART DOM OVERRIDES (New Order Summary UI)
    ---------------------------------------------------------- */
    const _originalUpdateCartDisplay = window.updateCartDisplay;
    if (typeof _originalUpdateCartDisplay === 'function') {
        window.updateCartDisplay = function () {
            _originalUpdateCartDisplay();
            updateEmptyCartState();
            updateCartBadge();

            // Phase 2: Update structural summary instead of .total
            if (typeof cart !== 'undefined') {
                const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const subtotalEl = document.getElementById('summary-subtotal');
                const totalEl = document.getElementById('summary-total');
                const summaryContainer = document.getElementById('order-summary-container');
                const emptyMsg = document.getElementById('empty-cart-msg');
                const btn = document.querySelector('.shopping-cart .btn');

                if (cart.length > 0) {
                    if (subtotalEl) subtotalEl.textContent = `$${totalAmount.toFixed(2)}/-`;
                    if (totalEl) totalEl.textContent = `$${totalAmount.toFixed(2)}/-`;
                    if (summaryContainer) summaryContainer.style.display = 'flex';
                    if (emptyMsg) emptyMsg.style.display = 'none';
                    if (btn) btn.style.display = 'block';
                } else {
                    if (summaryContainer) summaryContainer.style.display = 'none';
                    if (emptyMsg) emptyMsg.style.display = 'block';
                    if (btn) btn.style.display = 'none';
                }
            }
        };
    }

    function updateEmptyCartState() {
        // Redundant since we handle it in the wrapper above, but kept safe
        const emptyMsg = document.getElementById('empty-cart-msg');
        if (!emptyMsg || typeof cart === 'undefined') return;
        emptyMsg.style.display = cart.length === 0 ? 'block' : 'none';
    }

    /* ----------------------------------------------------------
       6. WISHLIST FEATURE (Completely new; does not touch cart)
    ---------------------------------------------------------- */
    let wishlist = [];

    // Load from localStorage
    try {
        const saved = localStorage.getItem('gc-wishlist');
        if (saved) wishlist = JSON.parse(saved) || [];
    } catch (e) { wishlist = []; }

    const wishlistBtn = document.getElementById('wishlist-btn');
    const wishlistPanel = document.getElementById('wishlist-panel');
    const wishlistItemsContainer = document.getElementById('wishlist-items');
    const wishlistClearBtn = document.getElementById('wishlist-clear-btn');

    // Toggle wishlist panel (same pattern as existing cart/search toggles)
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', () => {
            wishlistPanel.classList.toggle('active');
            // Close other panels (same as existing script.js behavior)
            document.querySelector('.search-form').classList.remove('active');
            document.getElementById('shopping-cart').classList.remove('active');
            document.querySelector('.login-form').classList.remove('active');
            document.querySelector('.navbar').classList.remove('active');
        });
    }

    // Close wishlist on scroll (same as other panels in script.js)
    window.addEventListener('scroll', () => {
        if (wishlistPanel) wishlistPanel.classList.remove('active');
    }, { passive: true });

    // Clear all wishlist items
    if (wishlistClearBtn) {
        wishlistClearBtn.addEventListener('click', () => {
            wishlist = [];
            saveWishlist();
            renderWishlist();
            // Reset all heart icons
            document.querySelectorAll('.wishlist-heart').forEach(btn => {
                btn.classList.remove('wishlisted');
                btn.querySelector('i').className = 'fa-regular fa-heart';
            });
            showToast('Wishlist cleared', 'info');
        });
    }

    // Handle wishlist heart buttons on product cards
    document.querySelectorAll('.wishlist-heart').forEach(btn => {
        const pid = btn.getAttribute('data-product-id');

        // Restore state
        if (wishlist.find(i => i.id === pid)) {
            btn.classList.add('wishlisted');
            btn.querySelector('i').className = 'fa-solid fa-heart';
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(pid, btn);
        });
    });

    function toggleWishlist(pid, btn) {
        const idx = wishlist.findIndex(i => i.id === pid);
        const name = document.querySelector(`.product-${pid}-name`)?.textContent || `Product ${pid}`;
        const price = document.querySelector(`.price-${pid}`)?.textContent || '';
        const src = `images/product-${pid}.png`;

        if (idx === -1) {
            // Add to wishlist
            wishlist.push({ id: pid, name, price, src });
            btn.classList.add('wishlisted');
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-heart';
            showToast(`❤️ <strong>${name}</strong> added to wishlist!`, 'success');
        } else {
            // Remove from wishlist
            wishlist.splice(idx, 1);
            btn.classList.remove('wishlisted');
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'fa-regular fa-heart';
            showToast(`Removed <strong>${name}</strong> from wishlist`, 'error');
        }

        saveWishlist();
        renderWishlist();
    }

    function saveWishlist() {
        try { localStorage.setItem('gc-wishlist', JSON.stringify(wishlist)); } catch (e) { }
    }

    function renderWishlist() {
        if (!wishlistItemsContainer) return;
        wishlistItemsContainer.innerHTML = '';

        if (wishlist.length === 0) {
            wishlistItemsContainer.innerHTML = `
                <div class="empty-wishlist-msg">
                    <i class="fa-regular fa-heart"></i>
                    <p>No items in wishlist</p>
                </div>`;
            return;
        }

        wishlist.forEach(item => {
            const div = document.createElement('div');
            div.className = 'wishlist-item';
            div.innerHTML = `
                <img src="${item.src}" alt="${item.name}">
                <div class="wishlist-item-info">
                    <h4>${item.name}</h4>
                    <span>${item.price}</span>
                </div>
                <button class="will-add-to-cart" data-id="${item.id}">+ Cart</button>
                <button class="remove-wishlist" data-id="${item.id}" aria-label="Remove from wishlist">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            wishlistItemsContainer.appendChild(div);
        });

        // Add-to-cart from wishlist
        wishlistItemsContainer.querySelectorAll('.will-add-to-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.getAttribute('data-id');
                const item = wishlist.find(i => i.id === pid);
                if (item && typeof addToCart === 'function') {
                    const price = parseFloat(item.price.replace('$', '').replace('/-', ''));
                    addToCart(pid, item.name, price, item.src);
                }
            });
        });

        // Remove from wishlist via X button
        wishlistItemsContainer.querySelectorAll('.remove-wishlist').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.getAttribute('data-id');
                const heart = document.querySelector(`.wishlist-heart[data-product-id="${pid}"]`);
                if (heart) {
                    heart.classList.remove('wishlisted');
                    const icon = heart.querySelector('i');
                    if (icon) icon.className = 'fa-regular fa-heart';
                }
                const i = wishlist.findIndex(x => x.id === pid);
                if (i !== -1) wishlist.splice(i, 1);
                saveWishlist();
                renderWishlist();
            });
        });
    }

    // Initial render
    renderWishlist();

    /* ----------------------------------------------------------
       7. BACK TO TOP BUTTON
    ---------------------------------------------------------- */
    const backToTopBtn = document.getElementById('back-to-top');

    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }, { passive: true });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ----------------------------------------------------------
       8. SCROLL REVEAL ANIMATIONS
    ---------------------------------------------------------- */
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        revealElements.forEach(el => observer.observe(el));
    } else {
        // Fallback: show all immediately if no IntersectionObserver support
        revealElements.forEach(el => el.classList.add('visible'));
    }

    /* ----------------------------------------------------------
       9. SMART SEARCH / PRODUCT FILTER & SUGGESTIONS
       Filters product cards and provides live suggestions overlay
    ---------------------------------------------------------- */
    const searchBox = document.getElementById('search-box');
    const noResults = document.getElementById('no-results');
    const searchSuggestions = document.getElementById('search-suggestions');
    let activeFilter = 'all';

    // NEW: Price slider state
    let maxPrice = 250;
    const priceSlider = document.getElementById('price-slider');
    const priceDisplay = document.getElementById('price-display');

    // NEW: Search history state
    let recentSearches = JSON.parse(localStorage.getItem('gc-recent-searches')) || [];

    function saveSearchQuery(query) {
        if (!query || query.length < 2) return;
        recentSearches = recentSearches.filter(q => q !== query);
        recentSearches.unshift(query);
        if (recentSearches.length > 5) recentSearches.pop();
        localStorage.setItem('gc-recent-searches', JSON.stringify(recentSearches));
    }

    // Build product dictionary for suggestions (runs once)
    const allProductSlides = Array.from(document.querySelectorAll('.products .swiper-slide.box'));
    const productData = allProductSlides.map(slide => {
        const id = slide.querySelector('.will-add-to-cart')?.getAttribute('data-id') || slide.querySelector('.wishlist-heart')?.getAttribute('data-product-id');
        const name = slide.querySelector('h3')?.textContent || '';
        const price = slide.querySelector('.price')?.textContent.split('/')[0] || '';
        const src = slide.querySelector('img')?.src || '';
        const starsText = slide.querySelector('.stars')?.innerHTML || '';
        // Extract rating dynamically or mock it
        const rating = (starsText.match(/fa-solid fa-star/g) || []).length + ((starsText.match(/fa-star-half-stroke/g) || []).length * 0.5) || 5;
        const numPrice = parseFloat(price.replace('$', '')) || 0;

        // Save to element for sorting later
        slide.setAttribute('data-price', numPrice);
        slide.setAttribute('data-rating', rating);

        return { id, name, price, src, element: slide, numPrice, rating };
    });

    if (searchBox) {
        searchBox.addEventListener('input', () => {
            const query = searchBox.value.trim().toLowerCase();
            filterProducts(query, activeFilter);
            showSuggestions(query);
        });

        // Hide suggestions on blur (with delay to allow click)
        searchBox.addEventListener('blur', () => {
            setTimeout(() => {
                if (searchSuggestions) searchSuggestions.classList.remove('active');
            }, 200);
        });

        searchBox.addEventListener('focus', () => {
            if (searchBox.value.trim().length > 0) {
                showSuggestions(searchBox.value.trim().toLowerCase());
            }
        });
    }

    function showSuggestions(query) {
        if (!searchSuggestions) return;
        if (query.length === 0) {
            if (recentSearches.length > 0) {
                searchSuggestions.innerHTML = `<div style="padding: 1.2rem 2rem 0.5rem; font-size: 1.2rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Recent Searches</div>` +
                    recentSearches.map(q => `
                    <div class="suggestion-item history-item" data-query="${q}">
                        <i class="fa-solid fa-clock"></i>
                        <div class="suggestion-info">
                            <h4 style="margin: 0; text-transform: capitalize;">${q}</h4>
                        </div>
                    </div>
                `).join('');
                searchSuggestions.classList.add('active');

                searchSuggestions.querySelectorAll('.history-item').forEach(item => {
                    item.addEventListener('click', () => {
                        searchBox.value = item.getAttribute('data-query');
                        searchBox.dispatchEvent(new Event('input'));
                    });
                });
            } else {
                searchSuggestions.classList.remove('active');
            }
            return;
        }

        const matches = productData.filter(p => p.name.toLowerCase().includes(query)).slice(0, 5); // top 5

        if (matches.length > 0) {
            searchSuggestions.innerHTML = matches.map(m => `
                <div class="suggestion-item" data-id="${m.id}">
                    <img src="${m.src}" alt="${m.name}">
                    <div class="suggestion-info">
                        <h4>${m.name}</h4>
                        <span>${m.price}</span>
                    </div>
                </div>
            `).join('');
            searchSuggestions.classList.add('active');

            // Add click events to suggestions
            searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const pid = item.getAttribute('data-id');
                    const targetProduct = productData.find(p => p.id === pid);
                    if (targetProduct) {
                        searchBox.value = targetProduct.name;
                        saveSearchQuery(targetProduct.name.toLowerCase());
                        filterProducts(targetProduct.name.toLowerCase(), activeFilter);
                        targetProduct.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Highlight
                        targetProduct.element.style.outline = '3px solid var(--green)';
                        setTimeout(() => targetProduct.element.style.outline = '', 1500);
                        searchSuggestions.classList.remove('active');
                    }
                });
            });
        } else {
            searchSuggestions.innerHTML = `<div class="suggestion-item"><div class="suggestion-info"><h4>No matches found</h4></div></div>`;
            searchSuggestions.classList.add('active');
        }
    }

    /* ----------------------------------------------------------
       10. CATEGORY FILTER TABS & SORTING
    ---------------------------------------------------------- */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort-select');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.getAttribute('data-filter');
            const query = searchBox ? searchBox.value.trim().toLowerCase() : '';
            filterProducts(query, activeFilter);
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortProducts(e.target.value);
        });
    }

    if (priceSlider) {
        priceSlider.addEventListener('input', (e) => {
            maxPrice = parseInt(e.target.value);
            if (priceDisplay) priceDisplay.textContent = `$${maxPrice}`;
            const query = searchBox ? searchBox.value.trim().toLowerCase() : '';
            filterProducts(query, activeFilter);
        });
    }

    function filterProducts(query, category) {
        let visibleCount = 0;

        allProductSlides.forEach(slide => {
            const nameEl = slide.querySelector('h3');
            const name = nameEl ? nameEl.textContent.toLowerCase() : '';
            const cat = slide.getAttribute('data-category') || '';
            const price = parseFloat(slide.getAttribute('data-price')) || 0;

            const matchesQuery = !query || name.includes(query);
            const matchesCategory = category === 'all' || cat === category;
            const matchesPrice = price <= maxPrice;

            if (matchesQuery && matchesCategory && matchesPrice) {
                slide.style.display = ''; // restore flow
                setTimeout(() => { slide.style.opacity = '1'; slide.style.transform = 'scale(1)'; }, 10);
                visibleCount++;
            } else {
                slide.style.opacity = '0';
                slide.style.transform = 'scale(0.95)';
                setTimeout(() => { if (slide.style.opacity === '0') slide.style.display = 'none'; }, 300);
            }
        });

        if (noResults) {
            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    function sortProducts(sortType) {
        const wrapper = document.querySelector('.products .swiper-wrapper');
        if (!wrapper) return;

        const slides = Array.from(wrapper.querySelectorAll('.swiper-slide.box'));

        slides.sort((a, b) => {
            const priceA = parseFloat(a.getAttribute('data-price')) || 0;
            const priceB = parseFloat(b.getAttribute('data-price')) || 0;
            const ratingA = parseFloat(a.getAttribute('data-rating')) || 0;
            const ratingB = parseFloat(b.getAttribute('data-rating')) || 0;

            if (sortType === 'price-low') return priceA - priceB;
            if (sortType === 'price-high') return priceB - priceA;
            if (sortType === 'rating') return ratingB - ratingA;
            return 0; // Default order depends on DOM order, which we lost. Ideally we save original order.
        });

        // Re-append in new order (flashes slightly but works without framework)
        slides.forEach(slide => wrapper.appendChild(slide));
    }

    /* ----------------------------------------------------------
       INITIAL BADGE SYNC
    ---------------------------------------------------------- */
    setTimeout(() => {
        updateCartBadge();
        updateEmptyCartState();
    }, 100);

    /* ----------------------------------------------------------
       11. QUICK VIEW MODAL & RECENTLY VIEWED
    ---------------------------------------------------------- */
    let recentlyViewedIds = JSON.parse(localStorage.getItem('gc-recently-viewed')) || [];

    function renderRecentlyViewed() {
        const container = document.getElementById('recently-viewed-container');
        const section = document.getElementById('recently-viewed-section');
        if (!container || !section) return;

        if (recentlyViewedIds.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'grid'; // .box-container is grid
        container.innerHTML = '';

        recentlyViewedIds.forEach(id => {
            const prod = productData.find(p => p.id === id);
            if (prod) {
                const html = `
                    <div class="box">
                        <img src="${prod.src}" alt="${prod.name}" style="height: 12rem; margin-bottom: 1rem;">
                        <h3>${prod.name}</h3>
                        <div class="price" style="font-size: 1.8rem;">$${prod.numPrice}/-</div>
                        <button class="btn" style="padding: 0.8rem 2rem; font-size: 1.3rem;" onclick="addToCart('${prod.id}', '${prod.name}', ${prod.numPrice}, '${prod.src}')">add to cart</button>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', html);
            }
        });

        // Re-attach fly events to the newly generated buttons
        container.querySelectorAll('.btn[onclick^="addToCart"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const box = btn.closest('.box');
                if (box) {
                    const img = box.querySelector('img');
                    if (img) flyToCart(img);
                }
            });
        });
    }

    // Call initial render
    renderRecentlyViewed();

    const modal = document.getElementById('quick-view-modal');
    const modalClose = document.getElementById('modal-close');
    const qvImg = document.getElementById('qv-img');
    const qvName = document.getElementById('qv-name');
    const qvPrice = document.getElementById('qv-price');
    const qvStars = document.getElementById('qv-stars');
    const qvBadge = document.getElementById('qv-badge');
    const qvAddBtn = document.getElementById('qv-add-btn');
    const qvWishlistBtn = document.getElementById('qv-wishlist-btn');

    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const pid = btn.getAttribute('data-product-id');
            const product = productData.find(p => p.id === pid);
            if (!product) return;

            // Populate Modal
            qvImg.src = product.src;
            qvName.textContent = product.name;
            qvPrice.textContent = `$${product.numPrice}/-`;
            qvBadge.textContent = product.element.querySelector('.product-badge')?.textContent || '🌿 Fresh';
            qvStars.innerHTML = product.element.querySelector('.stars')?.innerHTML || '';

            qvAddBtn.setAttribute('data-product-id', pid);
            qvWishlistBtn.setAttribute('data-product-id', pid);

            // Update modal wishlist heart state
            if (wishlist.find(i => i.id === pid)) {
                qvWishlistBtn.classList.add('wishlisted');
                qvWishlistBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
            } else {
                qvWishlistBtn.classList.remove('wishlisted');
                qvWishlistBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
            }

            // Update recently viewed
            if (!recentlyViewedIds.includes(pid)) {
                recentlyViewedIds.unshift(pid);
                if (recentlyViewedIds.length > 4) recentlyViewedIds.pop();
                localStorage.setItem('gc-recently-viewed', JSON.stringify(recentlyViewedIds));
                renderRecentlyViewed();
            }

            // Show modal
            modal.classList.add('active');
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', () => modal.classList.remove('active'));
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    // Modal action buttons
    if (qvAddBtn) {
        qvAddBtn.addEventListener('click', () => {
            const pid = qvAddBtn.getAttribute('data-product-id');
            const product = productData.find(p => p.id === pid);
            if (product && typeof addToCart === 'function') {
                addToCart(pid, product.name, product.numPrice, product.src);
                // Trigger fly animation from modal image
                flyToCart(qvImg);
                modal.classList.remove('active');
            }
        });
    }

    if (qvWishlistBtn) {
        qvWishlistBtn.addEventListener('click', () => {
            const pid = qvWishlistBtn.getAttribute('data-product-id');
            // Find corresponding DOM heart and simulate click to handle logic reliably
            const domHeart = document.querySelector(`.wishlist-heart[data-product-id="${pid}"]`);
            if (domHeart) {
                toggleWishlist(pid, domHeart);
                // Sync modal heart visually immediately
                if (wishlist.find(i => i.id === pid)) {
                    qvWishlistBtn.classList.add('wishlisted');
                    qvWishlistBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
                } else {
                    qvWishlistBtn.classList.remove('wishlisted');
                    qvWishlistBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
                }
            }
        });
    }

    /* ----------------------------------------------------------
       12. FLY TO CART ANIMATION (Micro-interaction)
    ---------------------------------------------------------- */
    // Add fly events to main product card Add-to-Cart buttons
    document.querySelectorAll('.btn[onclick^="addToCart"]').forEach(btn => {
        // Prevent default onclick to run our custom logic first? No, inline onclick runs first.
        // We will just attach an event listener that runs concurrently.
        btn.addEventListener('click', (e) => {
            // Find sibling image
            const box = btn.closest('.box');
            if (box) {
                const img = box.querySelector('img');
                if (img) flyToCart(img);
            }
        });
    });

    function flyToCart(sourceImg) {
        const cartIcon = document.getElementById('cart-btn');
        if (!cartIcon || !sourceImg) return;

        // Clone the image
        const flyingImg = sourceImg.cloneNode();
        flyingImg.classList.add('fly-to-cart');
        document.body.appendChild(flyingImg);

        // Get coordinates
        const sourceRect = sourceImg.getBoundingClientRect();
        const targetRect = cartIcon.getBoundingClientRect();

        // Initial position
        flyingImg.style.left = `${sourceRect.left}px`;
        flyingImg.style.top = `${sourceRect.top}px`;
        flyingImg.style.width = `${sourceRect.width}px`;
        flyingImg.style.height = `${sourceRect.height}px`;

        // Force reflow
        flyingImg.getBoundingClientRect();

        // Animate to cart icon
        flyingImg.style.left = `${targetRect.left}px`;
        flyingImg.style.top = `${targetRect.top}px`;
        flyingImg.style.width = '20px';
        flyingImg.style.height = '20px';
        flyingImg.style.opacity = '0.5';
        flyingImg.style.transform = 'scale(0.1) rotate(360deg)'; // spin while flying

        // Cleanup
        flyingImg.addEventListener('transitionend', () => {
            flyingImg.remove();
        }, { once: true });

        // Failsafe cleanup
        setTimeout(() => { if (flyingImg.parentNode) flyingImg.remove(); }, 1000);
    }

    /* ----------------------------------------------------------
       13. SKELETON LOADERS
       Removes placeholder classes after page load
    ---------------------------------------------------------- */
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.querySelectorAll('.skeleton').forEach(el => {
                el.classList.remove('skeleton');
            });
        }, 600); // slight delay for visual smoothness
    });

}); // End DOMContentLoaded
