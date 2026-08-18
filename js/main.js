/**
 * Namevya Main JavaScript
 * Handles navigation toggling, search input handling, and smooth page interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
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
 * Handles search submission on homepage
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

  // Display feedback for user
  if (searchHint) {
    searchHint.style.color = '#4f46e5';
    searchHint.textContent = `Searching meanings for "${query}"... Detailed name pages are coming soon!`;
  }
}

/**
 * Handles sample card clicks on popular names
 * @param {string} name
 */
function handleCardClick(name) {
  const searchInput = document.getElementById('searchInput');
  const searchHint = document.getElementById('searchHint');

  if (searchInput) {
    searchInput.value = name;
    searchInput.focus();
  }

  if (searchHint) {
    searchHint.style.color = '#4f46e5';
    searchHint.textContent = `Viewing overview for "${name}". Full profile pages coming soon!`;
  }

  // Smooth scroll up to search section
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
