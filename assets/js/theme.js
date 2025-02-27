/**
 * Theme management for Unclecode's personal website
 * Repository: https://github.com/unclecode/me
 */

// Theme constants
const THEME_KEY = 'unclecode-theme-preference';
const LIGHT_THEME = 'light';
const DARK_THEME = 'dark';

// Function to toggle theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  
  // Update theme icon if it exists
  updateThemeIcon(newTheme);
}

// Function to update theme icon based on current theme
function updateThemeIcon(theme) {
  const themeIcon = document.getElementById('theme-icon');
  if (!themeIcon) return;
  
  if (theme === DARK_THEME) {
    // Sun icon for dark mode (to switch to light)
    themeIcon.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
  } else {
    // Moon icon for light mode (to switch to dark)
    themeIcon.innerHTML = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>`;
  }
}

// Initialize theme from localStorage or default to light
function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || LIGHT_THEME;
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

// Set up theme toggle button when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
});