/**
 * Component loader
 * A simple utility to load HTML components dynamically
 */

class ComponentLoader {
  constructor() {
    this.components = {};
    this.basePath = './assets/includes/';
    this.loadedCount = 0;
    this.totalComponents = 0;
  }

  /**
   * Load a component from a file
   * @param {string} name - Component name
   * @param {string} path - Path to the component file
   * @returns {Promise}
   */
  async load(name, path) {
    try {
      this.totalComponents++;
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load component ${name}`);
      }
      const html = await response.text();
      this.components[name] = html;
      this.loadedCount++;
      return html;
    } catch (error) {
      console.error(`Error loading component ${name}:`, error);
      return null;
    }
  }

  /**
   * Load multiple components
   * @param {Object} components - Map of component names to paths
   * @returns {Promise}
   */
  async loadComponents(components) {
    const promises = Object.entries(components).map(([name, path]) => 
      this.load(name, this.basePath + path)
    );
    await Promise.all(promises);
    return this.components;
  }

  /**
   * Insert a component into the DOM
   * @param {string} selector - CSS selector for target element
   * @param {string} componentName - Name of the component to insert
   * @param {Object} params - Parameters to replace in the component template
   */
  insert(selector, componentName, params = {}) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) {
      console.warn(`No elements found for selector: ${selector}`);
      return;
    }

    let html = this.components[componentName];
    if (!html) {
      console.error(`Component not found: ${componentName}`);
      return;
    }

    // Replace parameters in template
    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`\\$${key}`, 'g');
      html = html.replace(regex, value);
    });

    elements.forEach(el => {
      el.innerHTML = html;
    });
  }

  /**
   * Wait for all components to load
   * @returns {Promise}
   */
  ready() {
    return new Promise(resolve => {
      const check = () => {
        if (this.loadedCount >= this.totalComponents) {
          resolve(this.components);
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }
}

// Create a global component loader instance
const componentLoader = new ComponentLoader();

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Define components to load
  const components = {
    'header': 'header.html',
    'footer': 'footer.html',
    'ascii-logo': 'ascii-logo.html',
    'blog-post-item': 'blog-post-item.html',
    'filter-chip': 'filter-chip.html',
    'terminal-command': 'terminal-command.html',
    'list-item': 'list-item.html',
    'venture-item': 'venture-item.html',
    'project-item': 'project-item.html',
    'expertise-item': 'expertise-item.html'
  };

  // Load all components
  await componentLoader.loadComponents(components);
  
  // Insert components into the page
  const basePath = window.location.pathname.split('/').length > 2 ? '../' : './';
  
  // Get the relative base path to root
  function getBasePath() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p.length);
    return parts.length ? '../'.repeat(parts.length) : './';
  }

  // Insert header with correct blog URL
  document.querySelectorAll('[data-component="header"]').forEach(el => {
    const relativePath = getBasePath();
    componentLoader.insert('[data-component="header"]', 'header', {
      BLOG_URL: `${relativePath}blog/index.html`,
      HOME_URL: `${relativePath}index.html`
    });
  });
  
  // Insert footer
  document.querySelectorAll('[data-component="footer"]').forEach(el => {
    componentLoader.insert('[data-component="footer"]', 'footer');
  });
  
  // Insert ASCII logo
  document.querySelectorAll('[data-component="ascii-logo"]').forEach(el => {
    componentLoader.insert('[data-component="ascii-logo"]', 'ascii-logo');
  });
  
  // Make components available globally for dynamic insertion
  window.componentLoader = componentLoader;
  
  // Dispatch a custom event when components are loaded
  document.dispatchEvent(new CustomEvent('components:loaded'));
});