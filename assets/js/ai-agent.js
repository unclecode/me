/**
 * AI Agent Component
 * Uses a backend API for AI interactions with secure token handling
 * Includes streaming response and fingerprinting for security
 */

class AIAgent {
  constructor() {
    this.isInitialized = false;
    this.isLoading = false;
    this.container = null;
    this.chatLog = [];
    
    // API configuration
    this.apiEndpoint = 'https://api-uc.ngrok.app/chat'; // Production URL via ngrok
    this.oneTimeToken = null; // Store one-time token for subsequent requests
    this.fingerprint = this.generateFingerprint(); // Create browser fingerprint
    
    // DOM elements
    this.terminalElement = null;
    this.inputElement = null;
    this.messagesElement = null;
    this.loadingElement = null;
    
    // Bind methods
    this.handleInput = this.handleInput.bind(this);
    
    // Create UI
    this.createUI();
  }
  
  /**
   * Generate a browser fingerprint for request validation
   */
  generateFingerprint() {
    // This is a simplified fingerprint. In production, consider using FingerprintJS
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    
    // Combine data and hash it
    const rawFingerprint = `${screenInfo}|${timeZone}|${language}|${platform}|${userAgent}|${Date.now()}`;
    return this.hashString(rawFingerprint);
  }
  
  /**
   * Simple string hashing function
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to positive hex string
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Create the terminal UI for the agent
   */
  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'ai-terminal-container';
    
    // Create terminal header
    const terminalHeader = document.createElement('div');
    terminalHeader.className = 'ai-terminal-header';
    terminalHeader.innerHTML = `
      <div class="ai-terminal-title">
        <i class="fas fa-terminal"></i> AI Assistant
      </div>
      <div class="ai-terminal-controls">
        <button class="ai-terminal-minimize" aria-label="Minimize">_</button>
        <button class="ai-terminal-close" aria-label="Close">✕</button>
      </div>
    `;
    
    // Create terminal content
    const terminalContent = document.createElement('div');
    terminalContent.className = 'ai-terminal-content';
    
    // Create terminal messages area
    this.messagesElement = document.createElement('div');
    this.messagesElement.className = 'ai-terminal-messages';
    
    // Create loading indicator
    this.loadingElement = document.createElement('div');
    this.loadingElement.className = 'ai-terminal-loading';
    this.loadingElement.innerHTML = `
      <div class="ai-loading-spinner"></div>
      <div class="ai-loading-text">Loading AI model...</div>
    `;
    this.loadingElement.style.display = 'none';
    
    // Create input area
    const inputArea = document.createElement('div');
    inputArea.className = 'ai-terminal-input-area';
    
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.className = 'ai-terminal-input';
    this.inputElement.placeholder = 'Ask me anything...';
    this.inputElement.disabled = true;
    
    const inputPrompt = document.createElement('span');
    inputPrompt.className = 'ai-terminal-prompt';
    inputPrompt.textContent = '>';
    
    // Add event listeners
    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleInput();
      }
    });
    
    // Add close button handler
    terminalHeader.querySelector('.ai-terminal-close').addEventListener('click', () => {
      this.toggleVisibility(false);
    });
    
    // Add minimize button handler
    terminalHeader.querySelector('.ai-terminal-minimize').addEventListener('click', () => {
      this.minimize();
    });
    
    // Make terminal draggable
    this.makeDraggable(terminalHeader);
    
    // Assemble the terminal
    inputArea.appendChild(inputPrompt);
    inputArea.appendChild(this.inputElement);
    
    terminalContent.appendChild(this.messagesElement);
    terminalContent.appendChild(this.loadingElement);
    terminalContent.appendChild(inputArea);
    
    this.container.appendChild(terminalHeader);
    this.container.appendChild(terminalContent);
    
    // Add initial welcome message
    this.addMessage('assistant', 'Hello! I\'m your AI assistant. I can answer questions about unclecode\'s projects and provide coding examples. Click the "Connect AI" button to initialize me.');
    
    // Add load button
    const loadButton = document.createElement('button');
    loadButton.className = 'ai-load-button';
    loadButton.textContent = 'Connect AI';
    loadButton.addEventListener('click', () => this.initialize());
    this.messagesElement.appendChild(loadButton);
    
    // Hide the terminal initially and set position explicitly
    this.container.style.display = 'none';
    this.container.style.bottom = '2rem';
    this.container.style.right = '2rem';
    
    // Add to document
    document.body.appendChild(this.container);
    
    // Add floating action button to open the terminal
    const fab = document.createElement('button');
    fab.className = 'ai-terminal-fab';
    fab.innerHTML = '<i class="fas fa-robot"></i>';
    fab.setAttribute('aria-label', 'Open AI Assistant');
    fab.addEventListener('click', () => this.toggleVisibility(true));
    
    document.body.appendChild(fab);
  }
  
  /**
   * Make an element draggable by its handle
   */
  makeDraggable(handleElement) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handleElement.onmousedown = dragMouseDown;
    
    const container = this.container;
    
    function dragMouseDown(e) {
      e.preventDefault();
      // Get the mouse cursor position at startup
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // Call a function whenever the cursor moves
      document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
      e.preventDefault();
      // Calculate the new cursor position
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      // Check if the terminal would go off screen
      const rect = container.getBoundingClientRect();
      const newTop = (container.offsetTop - pos2);
      const newLeft = (container.offsetLeft - pos1);
      
      // Set the element's new position with bounds checking
      if (newTop > 0 && newTop < window.innerHeight - 40) {
        container.style.top = newTop + "px";
      }
      
      if (newLeft > -rect.width + 100 && newLeft < window.innerWidth - 100) {
        container.style.left = newLeft + "px";
      }
      
      // Switch from fixed to absolute positioning
      if (container.style.position !== 'absolute') {
        const rect = container.getBoundingClientRect();
        container.style.top = rect.top + 'px';
        container.style.left = rect.left + 'px';
        container.style.bottom = 'auto';
        container.style.right = 'auto';
        container.style.position = 'absolute';
      }
    }
    
    function closeDragElement() {
      // Stop moving when mouse button is released
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
  
  /**
   * Toggle terminal visibility
   */
  toggleVisibility(show) {
    if (show === undefined) {
      show = this.container.style.display === 'none';
    }
    
    this.container.style.display = show ? 'flex' : 'none';
    
    if (show && this.isInitialized) {
      this.inputElement.focus();
    }
  }
  
  /**
   * Minimize the terminal
   */
  minimize() {
    // Implementation for minimizing (could shrink or dock to corner)
    this.container.classList.toggle('minimized');
  }
  
  /**
   * Initialize the AI connection to backend
   */
  async initialize() {
    if (this.isInitialized || this.isLoading) return;
    
    this.isLoading = true;
    this.loadingElement.style.display = 'flex';
    
    try {
      // Actually try to connect to backend with a health check
      this.loadingElement.querySelector('.ai-loading-text').textContent = 'Connecting to AI service...';
      
      try {
        // Test the connection to the backend
        const healthCheckUrl = 'https://api-uc.ngrok.app/health';
        const response = await fetch(healthCheckUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Backend health check failed: ${response.status}`);
        }
        
        // Successfully connected to backend
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
        
      } catch (connectionError) {
        console.warn('Backend connection test failed, will use fallback mode:', connectionError);
        // Show warning but continue initialization
        // We'll still mark as initialized but will use fallback responses
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      this.isInitialized = true;
      this.isLoading = false;
      this.loadingElement.style.display = 'none';
      this.inputElement.disabled = false;
      this.inputElement.placeholder = 'Ask me anything...';
      this.inputElement.focus();
      
      // Remove load button if it exists
      const loadButton = this.messagesElement.querySelector('.ai-load-button');
      if (loadButton) {
        loadButton.remove();
      }
      
      // Add initialized message and to chat history for context
      const welcomeMessage = 'I\'m connected and ready to chat! Ask me anything about coding, AI, or technology.';
      this.addMessage('assistant', welcomeMessage);
      this.chatLog.push({ type: 'assistant', text: welcomeMessage });
      
    } catch (error) {
      console.error('Error connecting to AI service:', error);
      this.isLoading = false;
      this.loadingElement.style.display = 'none';
      
      // Show error message
      this.addMessage('error', `Failed to connect to AI service: ${error.message}. Please try again later.`);
    }
  }
  
  /**
   * Real API call to backend with secure token handling and streaming response
   */
  async callAIBackend(userMessage) {
    // Format messages for the backend
    // We always send the full history for context
    const formattedMessages = [...this.chatLog].map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    // Add the current user message
    formattedMessages.push({
      role: 'user',
      content: userMessage
    });
    
    try {
      // Prepare the request
      const requestData = {
        messages: formattedMessages,
        browser_fingerprint: this.fingerprint,
        timestamp: Date.now(),
        token: this.oneTimeToken, // Will be null for first request
        max_tokens: 2000,
        temperature: 0.7
      };
      
      // Create streaming request
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      // Create a reader for the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Create a message element for the assistant's response that we'll update
      // as we receive chunks of the response
      const messageElement = this.addMessage('assistant', '...', 'thinking');
      const contentElement = messageElement.querySelector('.ai-message-content');
      
      let combinedContent = '';
      
      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // Split by newlines and process each line
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            
            // Handle token
            if (data.token) {
              this.oneTimeToken = data.token;
              console.log("Received new token for next request");
            }
            
            // Handle content
            if (data.content) {
              combinedContent += data.content;
              
              // Update the message content
              if (contentElement.classList.contains('thinking')) {
                contentElement.classList.remove('thinking');
                contentElement.textContent = '';
              }
              
              // Format the response with code blocks
              const formattedContent = this.formatCodeBlocks(combinedContent);
              contentElement.innerHTML = formattedContent;
              
              // Scroll to bottom
              this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
            }
            
            // Handle error
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            if (line.trim() && !e.message.includes('JSON')) {
              console.error("Error processing line:", e);
            }
          }
        }
      }
      
      // Return the final combined content
      return combinedContent;
      
    } catch (error) {
      console.error("Error calling AI backend:", error);
      
      // If there's an error with the API, fall back to a simulated response
      return this.getFallbackResponse(userMessage);
    }
  }
  
  /**
   * Fallback responses if API fails
   */
  getFallbackResponse(userMessage) {
    // Sample responses for fallback
    const lowercaseMsg = userMessage.toLowerCase();
    
    if (lowercaseMsg.includes('hello') || lowercaseMsg.includes('hi')) {
      return "Hello! I'm your AI assistant. How can I help you today?";
    } 
    else if (lowercaseMsg.includes('name')) {
      return "I'm an AI assistant for unclecode. You can call me Code Assistant!";
    }
    else if (lowercaseMsg.includes('python') || lowercaseMsg.includes('code')) {
      return "I can help with coding! Here's a simple Python example:\n\n```python\ndef greet(name):\n    return f\"Hello, {name}!\"\n\nprint(greet('World'))\n```\n\nIn the future, I'll be able to execute code samples directly in the chat.";
    }
    else if (lowercaseMsg.includes('project') || lowercaseMsg.includes('work')) {
      return "Unclecode has worked on many impressive projects including Crawl4AI, Cubie, and AdNext. Check out the Projects tab to learn more about them!";
    }
    else if (lowercaseMsg.includes('help')) {
      return "I can answer questions about unclecode's projects, provide coding examples, or chat about technology.";
    }
    else {
      // Default response for other queries
      const responses = [
        "It seems I'm having trouble connecting to my knowledge base right now. Can you try again later or ask a different question?",
        "I understand what you're asking about, but I'm experiencing a temporary connection issue.",
        "Great question! I'd like to help, but I'm currently running in fallback mode due to a connection issue.",
        "I'm having trouble accessing my full capabilities at the moment. Please try again shortly.",
        "Thanks for your question! I'm currently operating with limited functionality. Could you try again in a few minutes?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  
  /**
   * Handle user input
   */
  async handleInput() {
    const userInput = this.inputElement.value.trim();
    if (!userInput) return;
    
    // Add user message to chat
    this.addMessage('user', userInput);
    
    // Clear input
    this.inputElement.value = '';
    
    // Disable input while processing
    this.inputElement.disabled = true;
    
    try {
      // Generate response if initialized
      if (this.isInitialized) {
        // Now callAIBackend handles creating the thinking message and updating it
        // with streaming content as it arrives
        const response = await this.callAIBackend(userInput);
        
        // The response is now managed by the streaming functionality
        // So we don't need to do anything else here
        
        // Add to chat log for context history
        this.chatLog.push({ type: 'assistant', text: response });
      } else {
        // Show thinking state
        this.addMessage('assistant', '...', 'thinking');
        
        // Update the thinking message
        const thinkingMsg = this.messagesElement.querySelector('.thinking');
        if (thinkingMsg) {
          thinkingMsg.textContent = 'I need to be initialized first. Please click the "Connect AI" button.';
          thinkingMsg.classList.remove('thinking');
        } else {
          this.addMessage('assistant', 'I need to be initialized first. Please click the "Connect AI" button.');
        }
      }
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Show error message
      const thinkingMsg = this.messagesElement.querySelector('.thinking');
      if (thinkingMsg) {
        thinkingMsg.textContent = `Sorry, I encountered an error: ${error.message}`;
        thinkingMsg.classList.remove('thinking');
        thinkingMsg.classList.add('error');
      } else {
        this.addMessage('error', `Sorry, I encountered an error: ${error.message}`);
      }
    } finally {
      // Re-enable input
      this.inputElement.disabled = false;
      this.inputElement.focus();
    }
  }
  
  /**
   * Format code blocks in response
   */
  formatCodeBlocks(text) {
    // Simple conversion of markdown code blocks to HTML
    // A more robust solution would use a Markdown parser
    
    // Check if the text contains a code block
    if (!text.includes('```')) {
      return text;
    }
    
    // Replace ``` code blocks with HTML
    return text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
      return `<div class="ai-code-block">
        <div class="ai-code-block-header">
          <span>${language || 'code'}</span>
          <button class="ai-run-button" data-language="${language}">Run</button>
        </div>
        <pre><code>${this.escapeHtml(code.trim())}</code></pre>
      </div>`;
    });
  }
  
  /**
   * Escape HTML to prevent injection
   */
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  /**
   * Add a message to the chat
   */
  addMessage(type, text, extraClass = '', isHtml = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `ai-message ${type} ${extraClass}`;
    
    // Add appropriate icon based on message type
    let iconClass = '';
    if (type === 'user') {
      iconClass = 'fa-user';
    } else if (type === 'assistant') {
      iconClass = 'fa-robot';
    } else if (type === 'error') {
      iconClass = 'fa-exclamation-triangle';
    }
    
    // Create icon element
    const iconElement = document.createElement('div');
    iconElement.className = 'ai-message-icon';
    iconElement.innerHTML = `<i class="fas ${iconClass}"></i>`;
    
    // Create content element
    const contentElement = document.createElement('div');
    contentElement.className = 'ai-message-content';
    
    // Set content - either as HTML or text
    if (isHtml) {
      contentElement.innerHTML = text;
    } else {
      contentElement.textContent = text;
    }
    
    // Assemble message
    messageElement.appendChild(iconElement);
    messageElement.appendChild(contentElement);
    
    this.messagesElement.appendChild(messageElement);
    
    // Set up code block run buttons if any
    if (isHtml) {
      const runButtons = messageElement.querySelectorAll('.ai-run-button');
      runButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const language = e.target.getAttribute('data-language');
          const codeBlock = e.target.closest('.ai-code-block');
          const code = codeBlock.querySelector('code').textContent;
          
          this.executeCode(code, language, codeBlock);
        });
      });
    }
    
    // Scroll to bottom
    this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
    
    // Add to chat log only for user messages and complete assistant messages
    // "thinking" messages should not be added to the chat log
    if (extraClass !== 'thinking') {
      // Only add user and complete assistant messages to chat history
      this.chatLog.push({ type, text });
    }
    
    return messageElement;
  }
  
  /**
   * Future: Execute code 
   * This is a simulation for now, but will be implemented with a backend API
   */
  async executeCode(code, language, codeBlock) {
    // Create an output container if it doesn't exist
    let outputEl = codeBlock.querySelector('.ai-code-output');
    if (!outputEl) {
      outputEl = document.createElement('div');
      outputEl.className = 'ai-code-output';
      codeBlock.appendChild(outputEl);
    }
    
    // Show loading state
    outputEl.textContent = 'Running...';
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Simulate execution result based on language
    if (language === 'python') {
      if (code.includes('print')) {
        // Extract what's being printed and show it
        const printMatch = code.match(/print\(['"](.+?)['"]\)/);
        if (printMatch) {
          outputEl.textContent = printMatch[1];
          return;
        }
        
        // Handle print with f-strings
        const fStringMatch = code.match(/print\(f["'](.+?)["']\)/);
        if (fStringMatch) {
          // Simple f-string simulation
          let output = fStringMatch[1];
          
          // Replace {name} with 'World' if the code defines name='World'
          const nameMatch = code.match(/name\s*=\s*['"]([^'"]+)['"]/);
          if (nameMatch && output.includes('{name}')) {
            output = output.replace('{name}', nameMatch[1]);
          }
          
          outputEl.textContent = output;
          return;
        }
      }
      
      // Default output for Python
      outputEl.textContent = '✓ Code executed successfully.';
    } 
    else if (language === 'javascript' || language === 'js') {
      // Simulate JavaScript execution
      if (code.includes('console.log')) {
        const logMatch = code.match(/console\.log\(['"](.+?)['"]\)/);
        if (logMatch) {
          outputEl.textContent = logMatch[1];
          return;
        }
      }
      
      // Default output for JavaScript
      outputEl.textContent = '✓ Code executed successfully.';
    }
    else {
      // For other languages just acknowledge
      outputEl.textContent = `Code execution for ${language || 'this language'} will be supported in a future update.`;
    }
  }
}

// Initialize function that will be called from main.js
function initializeAIAgent() {
  // Load Font Awesome for icons if not already loaded
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(fontAwesome);
  }
  
  // Create agent instance (will be accessible globally)
  window.aiAgent = new AIAgent();
}

// Export initialization function
window.initializeAIAgent = initializeAIAgent;

// Initialize immediately if loaded directly (not through main.js)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initializeAIAgent, 1);
} else {
  document.addEventListener('DOMContentLoaded', initializeAIAgent);
}