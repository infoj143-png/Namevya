/**
 * Namevya Main JavaScript
 * Handles navigation toggling, search input handling, local database lookups, and result page rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();

  // If we are on the result page, initialize search handling and page rendering
  if (document.getElementById('resultContainer')) {
    initResultPage();
  }
});

/**
 * Toggles mobile navigation menu
 */
function initMobileNav() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
        navMenu.classList.remove('active');
      }
    });
  }
}

/**
 * Handles search form submission across pages
 */
function handleSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchHint = document.getElementById('searchHint');

  if (!searchInput) return;

  const query = searchInput.value.trim();

  if (!query) {
    if (searchHint) {
      searchHint.style.color = '#e11d48';
      searchHint.textContent = 'Please enter a name to search.';
    }
    return;
  }

  // Clear search hint error if any
  if (searchHint) {
    searchHint.textContent = '';
  }

  // Navigate to Name Result page with query
  window.location.href = `name.html?query=${encodeURIComponent(query)}`;
}

/**
 * Handles card click navigation
 * @param {string} name
 */
function handleCardClick(name) {
  if (!name) return;
  window.location.href = `name.html?query=${encodeURIComponent(name.trim())}`;
}

/**
 * Initializes and renders the result page based on URL query parameter
 */
async function initResultPage() {
  const resultContainer = document.getElementById('resultContainer');
  const searchInput = document.getElementById('searchInput');
  if (!resultContainer) return;

  const urlParams = new URLSearchParams(window.location.search);
  const rawQuery = urlParams.get('query') || urlParams.get('name') || '';

  if (searchInput && rawQuery) {
    searchInput.value = rawQuery;
  }

  const cleanQuery = rawQuery.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!cleanQuery) {
    renderEmptyState(resultContainer);
    return;
  }

  // Show loading indicator
  resultContainer.innerHTML = `
    <div class="result-loading">
      <div class="spinner"></div>
      <p>Searching database for "${escapeHTML(rawQuery)}"...</p>
    </div>
  `;

  try {
    const response = await fetch('data/names.json');
    if (!response.ok) {
      throw new Error(`Failed to load database: ${response.status}`);
    }
    const namesData = await response.json();

    // Find match by exact name (case-insensitive, trimmed) or alternative spellings
    const matchedEntry = findNameEntry(namesData, cleanQuery);

    if (matchedEntry) {
      document.title = `${matchedEntry.name} - Meaning & Origin | Namevya`;
      renderNameDetails(resultContainer, matchedEntry, rawQuery);
    } else {
      document.title = `Name Not Found - Namevya`;
      renderNotFoundState(resultContainer, rawQuery);
    }
  } catch (error) {
    console.error('Error fetching names database:', error);
    resultContainer.innerHTML = `
      <div class="card error-card">
        <h2>Unable to load name database</h2>
        <p>Sorry, an unexpected error occurred while loading the name details. Please try again later.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top: 1rem;">Back to Homepage</a>
      </div>
    `;
  }
}

/**
 * Searches names array for a matching name or alternative spelling
 * @param {Array} namesData
 * @param {string} cleanQuery
 * @returns {Object|null}
 */
function findNameEntry(namesData, cleanQuery) {
  if (!Array.isArray(namesData)) return null;

  return namesData.find(item => {
    if (!item) return false;

    // Direct name match
    if (item.name && item.name.trim().replace(/\s+/g, ' ').toLowerCase() === cleanQuery) {
      return true;
    }

    // Alternative spellings match
    if (Array.isArray(item.alternativeSpellings)) {
      return item.alternativeSpellings.some(
        alt => alt && alt.trim().replace(/\s+/g, ' ').toLowerCase() === cleanQuery
      );
    }

    return false;
  }) || null;
}

/**
 * Renders name result details card
 * @param {HTMLElement} container
 * @param {Object} item
 * @param {string} searchedQuery
 */
function renderNameDetails(container, item, searchedQuery) {
  const genderClass = item.gender ? item.gender.toLowerCase() : 'unisex';
  const formattedGender = item.gender ? item.gender.charAt(0).toUpperCase() + item.gender.slice(1) : 'Unisex';

  const altSpellingsHTML = (Array.isArray(item.alternativeSpellings) && item.alternativeSpellings.length > 0)
    ? item.alternativeSpellings.map(alt => `<span class="alt-spelling-pill">${escapeHTML(alt)}</span>`).join('')
    : '<span class="text-muted">None listed</span>';

  container.innerHTML = `
    <article class="card result-card">
      <div class="result-header">
        <div class="result-title-group">
          <h1 class="result-name-title">${escapeHTML(item.name)}</h1>
          <div class="result-tags">
            <span class="gender-tag ${genderClass}">${escapeHTML(formattedGender)}</span>
            <span class="meta-tag origin-tag-pill">Origin: ${escapeHTML(item.origin || 'N/A')}</span>
            <span class="meta-tag language-tag-pill">Language: ${escapeHTML(item.language || 'N/A')}</span>
          </div>
        </div>
      </div>

      <div class="result-body">
        <div class="info-section meaning-section">
          <h2 class="info-label">Meaning</h2>
          <p class="meaning-text">"${escapeHTML(item.meaning)}"</p>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-item-label">Pronunciation</span>
            <span class="info-item-value pronunciation-value">🗣️ ${escapeHTML(item.pronunciation || 'N/A')}</span>
          </div>

          <div class="info-item">
            <span class="info-item-label">Gender</span>
            <span class="info-item-value">${escapeHTML(formattedGender)}</span>
          </div>

          <div class="info-item">
            <span class="info-item-label">Origin</span>
            <span class="info-item-value">${escapeHTML(item.origin || 'N/A')}</span>
          </div>

          <div class="info-item">
            <span class="info-item-label">Language</span>
            <span class="info-item-value">${escapeHTML(item.language || 'N/A')}</span>
          </div>
        </div>

        <div class="info-section alt-spellings-section">
          <h2 class="info-label">Alternative Spellings & Variations</h2>
          <div class="alt-spellings-list">
            ${altSpellingsHTML}
          </div>
        </div>
      </div>

      <div class="result-footer">
        <a href="index.html" class="btn btn-secondary">&larr; Back to Search</a>
      </div>
    </article>
  `;
}

/**
 * Renders friendly Not Found message
 * @param {HTMLElement} container
 * @param {string} searchedQuery
 */
function renderNotFoundState(container, searchedQuery) {
  container.innerHTML = `
    <div class="card not-found-card">
      <div class="not-found-icon">🔍</div>
      <h1 class="not-found-title">Name Not Found</h1>
      <p class="not-found-message">
        We couldn't find <strong>"${escapeHTML(searchedQuery)}"</strong> in our database yet.
      </p>
      <p class="not-found-subtext">
        Double check the spelling or try searching for another name like <strong>"Aisha"</strong>, <strong>"Muhammad"</strong>, or <strong>"Aarav"</strong>.
      </p>
      <div class="not-found-actions">
        <a href="index.html" class="btn btn-primary">&larr; Back to Search</a>
      </div>
    </div>
  `;
}

/**
 * Renders state when query parameter is empty
 * @param {HTMLElement} container
 */
function renderEmptyState(container) {
  container.innerHTML = `
    <div class="card not-found-card">
      <div class="not-found-icon">✨</div>
      <h1 class="not-found-title">Explore Name Meanings</h1>
      <p class="not-found-subtext">
        Enter a name in the search box above to discover its meaning, origin, pronunciation, and variations.
      </p>
      <div class="not-found-actions">
        <a href="index.html" class="btn btn-primary">&larr; Go to Homepage</a>
      </div>
    </div>
  `;
}

/**
 * Utility function to escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
