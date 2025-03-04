// Wait for both DOM and components to be loaded before initializing
function initializeApp() {
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
  
  // Home page specific functionality has been moved to home.js
  
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
    
    if (heroOverlay && heroToggleIcon) {
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
        case 'd': if (window.dotEffect) window.dotEffect.toggleControls(); e.preventDefault(); break;
        case 't': if (document.getElementById('hero-overlay')) toggleHeroOverlay(); e.preventDefault(); break;
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
  
  // Dot effect initialization moved to home.js
  
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
    
    // Update dot effect if initialized (only on homepage)
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
  
  // Setup keyboard shortcuts modal
  const keyboardShortcutsToggle = document.getElementById('keyboard-shortcuts-toggle');
  const keyboardShortcutsModal = document.getElementById('keyboard-shortcuts-modal');
  const modalClose = document.querySelector('.modal-close');
  
  // Show modal when clicking on "Shortcuts" in the header
  if (keyboardShortcutsToggle) {
    keyboardShortcutsToggle.addEventListener('click', (e) => {
      e.preventDefault();
      keyboardShortcutsModal.style.display = 'block';
    });
  }
  
  // Close modal when clicking on X
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      keyboardShortcutsModal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === keyboardShortcutsModal) {
      keyboardShortcutsModal.style.display = 'none';
    }
  });
  
  // Set up version indicator
  const versionIndicator = document.getElementById('version-indicator');
  if (versionIndicator) {
    // Store version in localStorage to detect changes
    const currentVersion = '1.0.3'; // Update this when making changes
    const lastVersion = localStorage.getItem('site-version') || '';
    
    // Update the version text
    versionIndicator.textContent = `v${currentVersion}`;
    
    // Check if version changed since last visit
    if (lastVersion && lastVersion !== currentVersion) {
      // Highlight version indicator to show changes
      versionIndicator.style.backgroundColor = 'var(--terminal-primary)';
      versionIndicator.style.color = 'var(--terminal-bg)';
      versionIndicator.style.opacity = '1';
      
      // Add tooltip to explain what's new
      versionIndicator.title = `Updated from v${lastVersion} to v${currentVersion}. Changes: Shortcuts menu added, GitHub Pages support`;
    }
    
    // Save current version
    localStorage.setItem('site-version', currentVersion);
  }
  
  // Project filtering
  const filterButtons = document.querySelectorAll('.filter-tag');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      const filter = button.getAttribute('data-filter');
      
      // Get all project items (they might be loaded dynamically)
      const projectItems = document.querySelectorAll('.list-item[data-categories]');
      
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
}

// Get the relative base path for assets
function getAssetsBasePath() {
  // If we're in the blog directory, adjust path accordingly
  const path = window.location.pathname;
  
  // First check if we're in GitHub Pages with the global flag
  if (window.isGitHubPages && window.repoName) {
    // Use absolute paths with origin to avoid double "me" issue
    const origin = window.location.origin;
    const repoName = window.repoName;
    const basePath = `${origin}/${repoName}/assets/`;
    console.log(`Using absolute GitHub Pages path: ${basePath}`);
    return basePath;
  }
  // Regular path resolution
  else if (path.includes('/me/')) {
    // For GitHub Pages deployment
    if (path.includes('/me/blog/posts/')) {
      return '../../assets/';
    } else if (path.includes('/me/blog/')) {
      return '../assets/';
    } else {
      return './assets/';
    }
  } 
  // For local development
  else {
    if (path.includes('/blog/posts/')) {
      return '../../assets/';
    } else if (path.includes('/blog/')) {
      return '../assets/';
    } else {
      return './assets/';
    }
  }
}

// Load command palette script
function loadCommandPalette() {
  return new Promise((resolve) => {
    const basePath = getAssetsBasePath();
    
    const script = document.createElement('script');
    script.src = `${basePath}js/command-palette.js`;
    script.onload = resolve;
    document.head.appendChild(script);
    
    // Also load the CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${basePath}css/command-palette.css`;
    document.head.appendChild(link);
  });
}

// Load AI agent
function loadAIAgent() {
  return new Promise((resolve) => {
    const basePath = getAssetsBasePath();
    
    const script = document.createElement('script');
    script.src = `${basePath}js/ai-agent.js`;
    script.onload = resolve;
    document.head.appendChild(script);
    
    // Also load the CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${basePath}css/ai-terminal.css`;
    document.head.appendChild(link);
  });
}

// Initialize the app when both DOM and components are loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load command palette
  loadCommandPalette().then(() => {
    console.log('Command palette loaded');
  });
  
  // Load AI agent
  loadAIAgent().then(() => {
    console.log('AI agent loaded');
    // Initialize AI agent after script is loaded
    if (window.initializeAIAgent) {
      window.initializeAIAgent();
    }
  });
  
  // Check if we're using components
  const hasComponents = document.querySelector('[data-component]');
  
  if (hasComponents) {
    // Wait for components to load before initializing
    document.addEventListener('components:loaded', initializeApp);
  } else {
    // No components, initialize immediately
    initializeApp();
  }
});