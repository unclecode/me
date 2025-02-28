/**
 * Home page specific functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize dot effect only on home page
  if (document.getElementById('dot-canvas')) {
    // Hero overlay toggle
    const heroOverlay = document.getElementById('hero-overlay');
    const heroOverlayToggle = document.getElementById('hero-overlay-toggle');
    const heroToggleIcon = document.getElementById('hero-toggle-icon');
    
    // Check if the overlay was previously minimized
    const isOverlayMinimized = localStorage.getItem('hero-overlay-minimized') === 'true';
    if (isOverlayMinimized) {
      heroOverlay.classList.add('minimized');
      heroToggleIcon.classList.remove('fa-chevron-right');
      heroToggleIcon.classList.add('fa-chevron-left');
    }
    
    // Toggle overlay
    heroOverlayToggle.addEventListener('click', () => {
      heroOverlay.classList.toggle('minimized');
      const isMinimized = heroOverlay.classList.contains('minimized');
      
      // Update icon
      if (isMinimized) {
        heroToggleIcon.classList.remove('fa-chevron-right');
        heroToggleIcon.classList.add('fa-chevron-left');
      } else {
        heroToggleIcon.classList.remove('fa-chevron-left');
        heroToggleIcon.classList.add('fa-chevron-right');
      }
      
      // Save state
      localStorage.setItem('hero-overlay-minimized', isMinimized);
    });

    // Initialize dot effect with theme colors
    function getComputedThemeColor(varName) {
      return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    
    // Initialize dot effect with theme colors
    const dotEffect = new DotEffect({
      blockSize: 12,
      maxRadius: 4,
      spacing: 0,
      threshold: 30,
      mouseRadius: 120,
      mouseStrength: 0.3,
      darkMode: true,
      bgColor: '#1B191A',  // Dark background matching site theme
      accentColor: getComputedThemeColor('--terminal-primary'), // Use computed theme color
      // Disable matrix effect
      matrixMode: false,
      // Vibration effect parameters
      vibrationRadius: 180,
      vibrationStrength: 0.7,
      vibrationSpeed: 3,
      vibrationDuration: 1000,
      vibrationElasticity: 0.9
    });
    
    dotEffect.init('dot-canvas', './assets/images/me-avatar.jpg');
    
    // Store the dotEffect instance globally for access
    window.dotEffect = dotEffect;
  }
});