/**
 * Command Palette Component
 * 
 * A VSCode-like command palette for quick navigation across the website
 */

class CommandPalette {
  constructor() {
    this.items = [];
    this.filteredItems = [];
    this.isOpen = false;
    this.selectedIndex = 0;
    this.container = null;
    this.input = null;
    this.resultsList = null;
    
    // Fetch command data on initialization
    this.fetchCommandData();
    
    // Bind keyboard shortcut (Cmd+P / Ctrl+P)
    this.bindShortcuts();
  }
  
  /**
   * Fetch command palette data from JSON file
   */
  async fetchCommandData() {
    try {
      // Get the correct path based on current URL
      const basePath = this.getAssetsBasePath();
      const response = await fetch(`${basePath}data/command_palette.json`);
      
      if (!response.ok) {
        throw new Error('Failed to load command palette data');
      }
      this.items = await response.json();
      console.log('Command palette data loaded:', this.items.length, 'items');
    } catch (error) {
      console.error('Error loading command palette data:', error);
    }
  }
  
  /**
   * Helper function to determine the correct assets path
   */
  getAssetsBasePath() {
    const path = window.location.pathname;
    
    // First check if we're in GitHub Pages with the global flag
    if (window.isGitHubPages && window.repoName) {
      // Use absolute paths with origin to avoid double "me" issue
      const origin = window.location.origin;
      const repoName = window.repoName;
      const basePath = `${origin}/${repoName}/assets/`;
      console.log(`Command palette using absolute GitHub Pages path: ${basePath}`);
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
  
  /**
   * Create and append command palette DOM elements
   */
  createElements() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'command-palette';
    this.container.innerHTML = `
      <div class="command-palette-container">
        <div class="command-palette-titlebar">
          <div class="command-palette-title">Command Palette</div>
          <button class="command-palette-close" aria-label="Close">✕</button>
        </div>
        <div class="command-palette-header">
          <input type="text" class="command-palette-input" placeholder="Type to search...">
          <div class="command-palette-hint">ESC to close</div>
        </div>
        <div class="command-palette-results">
          <ul class="command-palette-list"></ul>
        </div>
      </div>
    `;
    
    // Get references to elements
    this.input = this.container.querySelector('.command-palette-input');
    this.resultsList = this.container.querySelector('.command-palette-list');
    const closeButton = this.container.querySelector('.command-palette-close');
    
    // Add event listeners
    this.input.addEventListener('input', () => this.handleInput());
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
    closeButton.addEventListener('click', () => this.close());
    
    // Append to body
    document.body.appendChild(this.container);
  }
  
  /**
   * Bind keyboard shortcuts
   */
  bindShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Open on Cmd+P / Ctrl+P
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        this.toggle();
      }
      
      // Close on Escape
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  /**
   * Handle input changes
   */
  handleInput() {
    const query = this.input.value.toLowerCase().trim();
    
    if (!query) {
      this.filteredItems = [...this.items].slice(0, 10); // Show first 10 items when empty
    } else {
      this.filteredItems = this.items.filter(item => {
        return item.title.toLowerCase().includes(query) || 
               item.description.toLowerCase().includes(query) ||
               item.type.toLowerCase().includes(query);
      }).slice(0, 10); // Limit to 10 results
    }
    
    this.selectedIndex = 0;
    this.renderResults();
  }
  
  /**
   * Handle keyboard navigation
   */
  handleKeydown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
        this.renderResults();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.renderResults();
        break;
        
      case 'Enter':
        e.preventDefault();
        if (this.filteredItems.length > 0) {
          this.navigateTo(this.filteredItems[this.selectedIndex]);
        }
        break;
    }
  }
  
  /**
   * Render results list
   */
  renderResults() {
    this.resultsList.innerHTML = '';
    
    if (this.filteredItems.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'command-palette-empty';
      emptyItem.textContent = 'No results found';
      this.resultsList.appendChild(emptyItem);
      return;
    }
    
    this.filteredItems.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'command-palette-item';
      if (index === this.selectedIndex) {
        li.classList.add('selected');
      }
      
      // Define icon based on item type
      const iconMap = {
        'page': '📄',
        'blog': '📝',
        'animation': '🎬',
        'project': '🚀',
        'venture': '🏢'
      };
      
      const icon = iconMap[item.type] || '🔗';
      
      li.innerHTML = `
        <div class="item-icon">${icon}</div>
        <div class="item-content">
          <div class="item-title">${item.title}</div>
          <div class="item-description">${item.description}</div>
        </div>
        ${item.external ? '<div class="item-external">↗️</div>' : ''}
      `;
      
      li.addEventListener('click', () => {
        this.navigateTo(item);
      });
      
      this.resultsList.appendChild(li);
    });
    
    // Scroll to selected item
    const selectedElement = this.resultsList.querySelector('.selected');
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }
  
  /**
   * Navigate to selected item
   */
  navigateTo(item) {
    if (item.external) {
      window.open(item.path, '_blank');
    } else {
      window.location.href = '/' + item.path;
    }
    this.close();
  }
  
  /**
   * Open the command palette
   */
  open() {
    if (!this.container) {
      this.createElements();
    }
    
    this.container.classList.add('active');
    this.isOpen = true;
    this.input.value = '';
    this.filteredItems = [...this.items].slice(0, 10); // Show first 10 items
    this.selectedIndex = 0;
    this.renderResults();
    this.input.focus();
  }
  
  /**
   * Close the command palette
   */
  close() {
    if (this.container) {
      this.container.classList.remove('active');
    }
    this.isOpen = false;
  }
  
  /**
   * Toggle the command palette
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

// Initialize the command palette
const commandPalette = new CommandPalette();

// Export for potential use in other scripts
window.commandPalette = commandPalette;