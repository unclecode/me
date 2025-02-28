/**
 * Blog specific functionality
 * Handles dynamic post loading, filtering, and terminal commands
 */

// Blog data
const blogPosts = [
  {
    "id": 1,
    "title": "Testing Code Blocks with File Names",
    "url": "./posts/test-code-blocks.html",
    "date": "Feb 27, 2025",
    "readingTime": "3 min",
    "categories": [
      "programming"
    ],
    "tags": [
      "programming",
      "test"
    ]
  },
  {
    "id": 2,
    "title": "Modern CSS Features Every Developer Should Know in 2025",
    "url": "./posts/modern-css-features.html",
    "date": "Feb 20, 2025",
    "readingTime": "8 min",
    "categories": [
      "web",
      "programming"
    ],
    "tags": [
      "web",
      "programming"
    ]
  },
  {
    "id": 3,
    "title": "What's New in the Latest Open Source LLMs - A Technical Breakdown",
    "url": "./posts/latest-llm-developments.html",
    "date": "Feb 12, 2025",
    "readingTime": "15 min",
    "categories": [
      "ai"
    ],
    "tags": [
      "ai",
      "research"
    ]
  },
  {
    "id": 4,
    "title": "Creating Reliable Vector Databases for RAG Applications",
    "url": "./posts/effective-vector-databases.html",
    "date": "Jan 28, 2025",
    "readingTime": "10 min",
    "categories": [
      "ai",
      "programming"
    ],
    "tags": [
      "ai",
      "programming",
      "database"
    ]
  }
];

// Blog filter categories
const filterCategories = [
  {
    "value": "all",
    "label": "all",
    "active": true
  },
  {
    "value": "ai",
    "label": "ai",
    "active": false
  },
  {
    "value": "programming",
    "label": "programming",
    "active": false
  },
  {
    "value": "web",
    "label": "web",
    "active": false
  }
];

// Terminal commands state
let currentCommand = "ls -la";
let currentResult = `total ${blogPosts.length} articles`;
let currentFilter = "all";
let currentSearch = "";

// Blog component loader
class BlogComponentLoader {
  constructor() {
    // Wait for components to load
    document.addEventListener('components:loaded', () => {
      this.initBlog();
    });
  }

  async initBlog() {
    await this.loadComponents();
    this.attachEventListeners();
    this.updateTerminalOutput();
  }

  async loadComponents() {
    // ASCII logo is now loaded by the component loader

    // Load filter chips
    this.renderFilterChips();

    // Load posts
    this.renderPosts();

    // Initialize terminal output
    this.updateTerminalOutput();
  }

  renderFilterChips() {
    const filterContainer = document.getElementById('filter-chips-container');
    if (!filterContainer) return;

    filterCategories.forEach(filter => {
      const chipHtml = this.createFilterChip(filter);
      filterContainer.innerHTML += chipHtml;
    });
  }

  createFilterChip(filter) {
    // Check if the component loader and filter-chip component are available
    if (window.componentLoader && window.componentLoader.components['filter-chip']) {
      // Clone the component template
      let html = window.componentLoader.components['filter-chip'];
      
      // Replace placeholders
      html = html.replace('$ACTIVE_CLASS', filter.active ? 'active' : '');
      html = html.replace('$FILTER_VALUE', filter.value);
      html = html.replace('$FILTER_LABEL', filter.label);
      
      return html;
    }
    return '';
  }

  renderPosts(filterValue = 'all', searchTerm = '') {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;

    postsContainer.innerHTML = '';

    const filteredPosts = this.getFilteredPosts(filterValue, searchTerm);
    
    filteredPosts.forEach(post => {
      const postHtml = this.createPostItem(post);
      postsContainer.innerHTML += postHtml;
    });
  }

  getFilteredPosts(filterValue, searchTerm) {
    return blogPosts.filter(post => {
      // Filter by category
      const categoryMatch = filterValue === 'all' || post.categories.includes(filterValue);
      
      // Filter by search term
      const titleMatch = searchTerm === '' || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase());
      const tagMatch = searchTerm === '' || 
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return categoryMatch && (titleMatch || tagMatch);
    });
  }

  createPostItem(post) {
    // Check if the component loader and blog-post-item component are available
    if (window.componentLoader && window.componentLoader.components['blog-post-item']) {
      // Clone the component template
      let html = window.componentLoader.components['blog-post-item'];
      
      // Generate tags HTML
      const tagsHtml = post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('');
      
      // Replace placeholders with post data
      html = html.replace('$POST_NUMBER', post.id);
      html = html.replace('$POST_TITLE', post.title);
      html = html.replace('$POST_URL', post.url);
      html = html.replace('$POST_DATE', post.date);
      html = html.replace('$POST_READING_TIME', post.readingTime);
      html = html.replace('$POST_CATEGORIES', post.categories.join(' '));
      html = html.replace('$POST_TAGS', tagsHtml);
      
      return html;
    }
    return '';
  }

  updateTerminalOutput() {
    const outputContainer = document.getElementById('terminal-output-container');
    if (!outputContainer) return;

    // Check if the component loader and terminal-command component are available
    if (window.componentLoader && window.componentLoader.components['terminal-command']) {
      // Clone the component template
      let html = window.componentLoader.components['terminal-command'];
      
      // Replace placeholders
      html = html.replace('$TERMINAL_COMMAND', currentCommand);
      html = html.replace('$TERMINAL_RESULT', currentResult);
      
      outputContainer.innerHTML = html;
    }
  }

  updateCommand(filter, search) {
    if (search && search.length > 0) {
      currentCommand = `grep -r "${search}" ./posts/`;
      const filteredPosts = this.getFilteredPosts(filter, search);
      currentResult = filteredPosts.length > 0 
        ? `found ${filteredPosts.length} matching posts`
        : 'no matches found';
    } else if (filter && filter !== 'all') {
      currentCommand = `find ./posts/ -name "*${filter}*"`;
      const filteredPosts = this.getFilteredPosts(filter, '');
      currentResult = `found ${filteredPosts.length} posts with category: ${filter}`;
    } else {
      currentCommand = `ls -la`;
      currentResult = `total ${blogPosts.length} articles`;
    }

    this.updateTerminalOutput();
  }

  attachEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        currentSearch = searchTerm;
        this.renderPosts(currentFilter, searchTerm);
        this.updateCommand(currentFilter, searchTerm);
      });
    }
    
    // Filter functionality
    const filterButtons = document.querySelectorAll('.filter-tag');
    if (filterButtons.length) {
      filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Remove active class from all buttons
          filterButtons.forEach(btn => btn.classList.remove('active'));
          
          // Add active class to clicked button
          button.classList.add('active');
          
          const filter = button.getAttribute('data-filter');
          currentFilter = filter;
          
          // Update posts
          this.renderPosts(filter, currentSearch);
          this.updateCommand(filter, currentSearch);
        });
      });
    }
  }
}

// Initialize blog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const blogPageElements = document.getElementById('posts-container');
  if (blogPageElements) {
    new BlogComponentLoader();
  }
});