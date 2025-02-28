document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const THEME_KEY = 'unclecode-theme-preference';
  const LIGHT_THEME = 'light';
  const DARK_THEME = 'dark';
  
  // Set theme
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }
  
  // Theme handling completely moved to new method
  
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
  
  // Define theme options with VSCode-inspired themes
  const themeOptions = {
    'monokai-dark': {
      primary: '#88c0d0',   // Cyan circles (similar to previous theme)
      secondary: '#ff79c6', // Pink
      tertiary: '#a6e22e',  // Green
      bg: '#1a1a1a',        // Very dark background
      text: '#f8f8f2',      // Off-white text
      isDark: true
    },
    'dracula': {
      primary: '#bd93f9',   // Purple
      secondary: '#ff79c6', // Pink
      tertiary: '#8be9fd',  // Cyan
      bg: '#282a36',        // Dark background
      text: '#f8f8f2',      // Off-white text
      isDark: true
    },
    'nord': {
      primary: '#88c0d0',   // Light blue
      secondary: '#b48ead', // Purple
      tertiary: '#a3be8c',  // Green
      bg: '#2e3440',        // Dark blue-gray background
      text: '#e5e9f0',      // Light gray text
      isDark: true
    },
    'monokai': {
      primary: '#f92672',   // Pink
      secondary: '#a6e22e', // Green
      tertiary: '#66d9ef',  // Blue
      bg: '#272822',        // Dark olive background
      text: '#f8f8f2',      // Off-white text
      isDark: true
    },
    'github-dark': {
      primary: '#58a6ff',   // Blue
      secondary: '#7ee787', // Green
      tertiary: '#ff7b72',  // Red
      bg: '#0d1117',        // Very dark background
      text: '#c9d1d9',      // Light gray text
      isDark: true
    },
    'github-light': {
      primary: '#0969da',   // Blue
      secondary: '#1a7f37', // Green
      tertiary: '#cf222e',  // Red
      bg: '#ffffff',        // White background
      text: '#24292f',      // Dark gray text
      isDark: false
    },
    'solarized-light': {
      primary: '#268bd2',   // Blue
      secondary: '#d33682', // Magenta
      tertiary: '#859900',  // Green
      bg: '#fdf6e3',        // Light cream background
      text: '#657b83',      // Gray-brown text
      isDark: false
    }
  };
  
  // Set up new simplified menu
  const menuToggle = document.getElementById('menu-dropdown-toggle');
  const menuDropdown = document.getElementById('menu-dropdown');
  const themesToggle = document.getElementById('themes-dropdown-toggle');
  const themesDropdown = document.getElementById('themes-dropdown');
  const fontsToggle = document.getElementById('fonts-dropdown-toggle');
  const fontsDropdown = document.getElementById('fonts-dropdown');
  
  // setupDropdowns is defined below, so we'll call it at the end of the script
  
  // Setup menu interactions
  function setupDropdowns() {
    // Handle Menu dropdown
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      hideAllDropdowns();
      menuDropdown.style.display = 'block';
      document.addEventListener('click', closeDropdownsOnClickOutside);
    });
    
    // Handle Themes dropdown
    themesToggle.addEventListener('click', (e) => {
      e.preventDefault();
      hideAllDropdowns();
      themesDropdown.style.display = 'block';
      document.addEventListener('click', closeDropdownsOnClickOutside);
    });
    
    // Handle Fonts dropdown
    fontsToggle.addEventListener('click', (e) => {
      e.preventDefault();
      hideAllDropdowns();
      fontsDropdown.style.display = 'block';
      document.addEventListener('click', closeDropdownsOnClickOutside);
    });
    
    // Connect tab navigation
    document.querySelectorAll('.dropdown-item[data-tab]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        activateTab(tab);
        hideAllDropdowns();
      });
    });
    
    // Connect theme options
    document.querySelectorAll('.theme-option').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const theme = item.getAttribute('data-theme');
        switchColorTheme(theme);
        hideAllDropdowns();
      });
    });
    
    // Connect font options
    document.querySelectorAll('.font-option').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const font = item.getAttribute('data-font');
        switchFont(font);
        hideAllDropdowns();
      });
    });
  }
  
  // Hide all dropdown menus
  function hideAllDropdowns() {
    menuDropdown.style.display = 'none';
    themesDropdown.style.display = 'none';
    fontsDropdown.style.display = 'none';
    document.removeEventListener('click', closeDropdownsOnClickOutside);
  }
  
  // Close dropdowns when clicking outside
  function closeDropdownsOnClickOutside(e) {
    const clickedDropdown = e.target.closest('.dropdown-menu');
    const clickedToggle = e.target.closest('.menu-item');
    
    if (!clickedDropdown && !clickedToggle) {
      hideAllDropdowns();
    }
  }
  
  // Load fonts
  function loadFont(fontName) {
    if (fontName === 'JetBrains Mono') return; // Already loaded
    
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@300;400;500;700&display=swap`;
    document.head.appendChild(fontLink);
  }
  
  // Switch font
  function switchFont(fontName) {
    // Load the font if not JetBrains Mono
    if (fontName !== 'JetBrains Mono') {
      loadFont(fontName);
    }
    
    // Update CSS variable
    document.documentElement.style.setProperty('--monospace', `'${fontName}', monospace`);
    
    // Save preference
    localStorage.setItem('font-preference', fontName);
    
    // Update active state in font dropdown
    document.querySelectorAll('.font-option').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-font') === fontName);
    });
  }
  
  // Toggle hero overlay panel
  function toggleHeroOverlay() {
    const heroOverlay = document.getElementById('hero-overlay');
    const heroToggleIcon = document.getElementById('hero-toggle-icon');
    
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
  }
  
  // Old menu functions removed - the new menu system uses simpler dropdown approach
  
  // Menu interactions are now handled by setupDropdowns function
  
  // Handle keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl shortcuts
    if (e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'a': activateTab('about'); e.preventDefault(); break;
        case 'v': activateTab('ventures'); e.preventDefault(); break;
        case 'p': activateTab('projects'); e.preventDefault(); break;
        case 'c': activateTab('consultancy'); e.preventDefault(); break;
        case 'b': window.location.href = './blog/index.html'; e.preventDefault(); break;
        case 'd': window.dotEffect.toggleControls(); e.preventDefault(); break;
        case 't': toggleHeroOverlay(); e.preventDefault(); break;
      }
    }
    
    // Alt shortcuts
    if (e.altKey) {
      switch (e.key) {
        case '1': switchColorTheme('dracula'); e.preventDefault(); break;
        case '2': switchColorTheme('nord'); e.preventDefault(); break;
        case '3': switchColorTheme('monokai'); e.preventDefault(); break;
        case '4': switchColorTheme('github-dark'); e.preventDefault(); break;
        case '5': switchColorTheme('github-light'); e.preventDefault(); break;
        case '6': switchColorTheme('solarized-light'); e.preventDefault(); break;
        case 'j': switchFont('JetBrains Mono'); e.preventDefault(); break;
        case 'f': switchFont('Fira Code'); e.preventDefault(); break;
        case 'i': switchFont('IBM Plex Mono'); e.preventDefault(); break;
        case 'c': switchFont('Cascadia Code'); e.preventDefault(); break;
      }
    }
  });
  
  // Initialize menu system
  setupDropdowns();
  
  
  // Theme Management
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
  
  // Enhanced theme switching function
  function switchColorTheme(themeName) {
    const theme = themeOptions[themeName];
    
    if (!theme) return;
    
    // Update CSS variables
    document.documentElement.style.setProperty('--terminal-primary', theme.primary);
    document.documentElement.style.setProperty('--terminal-secondary', theme.secondary);
    document.documentElement.style.setProperty('--terminal-tertiary', theme.tertiary);
    document.documentElement.style.setProperty('--terminal-bg', theme.bg);
    document.documentElement.style.setProperty('--terminal-text', theme.text);
    
    // Set dark/light theme
    document.documentElement.setAttribute('data-theme', theme.isDark ? 'dark' : 'light');
    
    // Update dot effect if initialized
    if (window.dotEffect) {
      // Use primary color for dots, background color for background
      window.dotEffect.updateTheme(theme.isDark, theme.primary, theme.bg);
      // Force redraw of the dots
      window.dotEffect.needsRender = true;
    }
    
    // Save preference
    localStorage.setItem('theme-preference', themeName);
    
    // Update active state in theme dropdown
    document.querySelectorAll('.theme-option').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-theme') === themeName);
    });
  }
  
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  function activateTab(tabId) {
    // Deactivate all tabs
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Activate selected tab
    const selectedTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (selectedTab) selectedTab.classList.add('active');
    
    // tabLinks are not in the new menu system, so we skip them
    
    const contentTab = document.getElementById(tabId);
    if (contentTab) contentTab.classList.add('active');
  }
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      activateTab(tabId);
      
      // Update URL without page reload
      history.pushState(null, null, `#${tabId}`);
    });
  });
  
  // We no longer have tabLinks in the new menu system
  // This functionality is now handled in setupDropdowns
  
  // Tab links within content
  document.querySelectorAll('[data-tab-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab-link');
      activateTab(tabId);
      
      // Update URL without page reload
      history.pushState(null, null, `#${tabId}`);
    });
  });
  
  // Check URL hash on page load
  if (window.location.hash) {
    const tabId = window.location.hash.substring(1);
    if (document.getElementById(tabId)) {
      activateTab(tabId);
    }
  }
  
  // Add keyboard help in footer
  const footer = document.querySelector('footer');
  const keyboardHelp = document.createElement('div');
  keyboardHelp.className = 'keyboard-help';
  keyboardHelp.innerHTML = `
    <div class="keyboard-help-header">
      <span class="keyboard-help-title">Keyboard Shortcuts</span>
      <button class="keyboard-help-toggle" id="keyboard-help-toggle">Show</button>
    </div>
    <div class="keyboard-help-content" id="keyboard-help-content">
      <div class="keyboard-help-section">
        <div class="keyboard-help-section-title">Navigation</div>
        <div class="keyboard-shortcut"><span class="shortcut-key">Ctrl+A</span> <span class="shortcut-desc">About</span></div>
        <div class="keyboard-shortcut"><span class="shortcut-key">Ctrl+V</span> <span class="shortcut-desc">Ventures</span></div>
        <div class="keyboard-shortcut"><span class="shortcut-key">Ctrl+P</span> <span class="shortcut-desc">Projects</span></div>
        <div class="keyboard-shortcut"><span class="shortcut-key">Ctrl+C</span> <span class="shortcut-desc">Consultancy</span></div>
        <div class="keyboard-shortcut"><span class="shortcut-key">Ctrl+B</span> <span class="shortcut-desc">Blog</span></div>
      </div>
      <div class="keyboard-help-section">
        <div class="keyboard-help-section-title">Actions</div>
        <div class="keyboard-shortcut"><span class="shortcut-key">Ctrl+D</span> <span class="shortcut-desc">Play with Dots</span></div>
        <div class="keyboard-shortcut"><span class="shortcut-key">Ctrl+T</span> <span class="shortcut-desc">Toggle Panel</span></div>
      </div>
      <div class="keyboard-help-section">
        <div class="keyboard-help-section-title">Themes & Fonts</div>
        <div class="keyboard-shortcut"><span class="shortcut-key">Alt+1/2/3</span> <span class="shortcut-desc">Change Color Theme</span></div>
        <div class="keyboard-shortcut"><span class="shortcut-key">Alt+J/F/I</span> <span class="shortcut-desc">Change Font</span></div>
      </div>
    </div>
  `;
  
  // Add styles for keyboard help
  const keyboardHelpStyle = document.createElement('style');
  keyboardHelpStyle.textContent = `
    .keyboard-help {
      margin: 1.5rem auto 0;
      max-width: 600px;
      font-family: var(--monospace);
      border: 1px solid var(--terminal-border);
      border-radius: 6px;
      background-color: var(--terminal-highlight);
    }
    
    .keyboard-help-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem 1rem;
      border-bottom: 1px solid var(--terminal-border);
    }
    
    .keyboard-help-title {
      color: var(--terminal-primary);
      font-weight: bold;
    }
    
    .keyboard-help-toggle {
      background: none;
      border: 1px solid var(--terminal-border);
      border-radius: 4px;
      padding: 0.3rem 0.6rem;
      color: var(--terminal-text);
      font-family: var(--monospace);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .keyboard-help-toggle:hover {
      background-color: var(--terminal-primary);
      color: var(--terminal-bg);
      border-color: var(--terminal-primary);
    }
    
    .keyboard-help-content {
      display: none;
      padding: 1rem;
    }
    
    .keyboard-help-content.active {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }
    
    .keyboard-help-section-title {
      color: var(--terminal-gray);
      font-size: 0.85rem;
      margin-bottom: 0.6rem;
      padding-bottom: 0.3rem;
      border-bottom: 1px solid var(--terminal-border);
    }
    
    .keyboard-shortcut {
      display: flex;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
    }
    
    .shortcut-key {
      flex: 0 0 80px;
      color: var(--terminal-secondary);
      background-color: rgba(0, 0, 0, 0.2);
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      border: 1px solid var(--terminal-border);
      margin-right: 0.5rem;
    }
    
    .shortcut-desc {
      color: var(--terminal-dimmed-text);
    }
  `;
  document.head.appendChild(keyboardHelpStyle);
  
  // Insert before social links
  const socialLinks = footer.querySelector('.social-links');
  footer.insertBefore(keyboardHelp, socialLinks);
  
  // Toggle keyboard help
  const keyboardHelpToggle = document.getElementById('keyboard-help-toggle');
  const keyboardHelpContent = document.getElementById('keyboard-help-content');
  
  keyboardHelpToggle.addEventListener('click', () => {
    keyboardHelpContent.classList.toggle('active');
    keyboardHelpToggle.textContent = keyboardHelpContent.classList.contains('active') ? 'Hide' : 'Show';
  });
  
  // Project filtering
  const filterButtons = document.querySelectorAll('.filter-tag');
  const projectItems = document.querySelectorAll('.project-item');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      const filter = button.getAttribute('data-filter');
      
      // Filter projects
      projectItems.forEach(item => {
        if (filter === 'all' || item.getAttribute('data-categories').includes(filter)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
  
  // Handle mobile layout if needed
  if (window.innerWidth <= 768) {
    // Position dropdowns for mobile
    menuDropdown.style.left = '0';
    themesDropdown.style.left = '0';
    fontsDropdown.style.left = '0';
  }
  
  // Initialize menu system
  setupDropdowns();
  
  // Load saved theme and font preferences
  const savedTheme = localStorage.getItem('theme-preference') || 'monokai-dark';
  switchColorTheme(savedTheme);
  
  const savedFont = localStorage.getItem('font-preference') || 'JetBrains Mono';
  switchFont(savedFont);
});