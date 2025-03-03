# Development Guide for Personal Website

## Build Commands
- Run local development: Open HTML files directly in browser
- Build blog: `python build.py` (converts Markdown to HTML posts)
- Force rebuild all blog posts: `python build.py --force`
- Generate command palette data: `python tools/generate_command_palette.py`

## Components
- **Blog Generator**: Python script that converts Markdown to HTML
- **Command Palette**: VSCode-like quick navigation (Cmd+P / Ctrl+P)
- **AI Assistant**: In-browser AI powered by Transformers.js with terminal interface
- **Terminal List**: Reusable component for ventures, projects, and consultancy items
- **Dot Effect**: Interactive canvas animation on homepage

## Code Style Guidelines

### Python
- Use PEP 8 style conventions
- Organize imports: standard library, third-party, local modules
- Document functions with docstrings
- Use snake_case for variables and functions

### HTML/CSS/JavaScript
- Use 2-space indentation for HTML/CSS/JS files
- Follow BEM methodology for CSS class naming
- Prefer camelCase for JavaScript variables/functions
- Use ES6+ features when appropriate
- Keep JavaScript functions small and focused
- Use semantic HTML elements

### Error Handling
- Use descriptive error messages
- Log errors with appropriate context
- Handle errors gracefully with fallbacks when possible

This personal website is a static site with a Python-based blog generator and modern JavaScript components.

## CHANGELOG

### 2025-03-03
- Implemented secure AI chat backend with LiteLLM integration
  - Created FastAPI server with streaming response support
  - Added one-time token security system to prevent API key theft
  - Implemented browser fingerprinting for additional security
  - Set up Redis-based rate limiting (120 requests per hour)
  - Created test client for verifying streaming functionality

### 2025-03-02
- Enhanced ai-agent.js with secure LLM backend connection
  - Updated frontend to handle streaming responses
  - Added responsive UI that updates in real-time as tokens arrive
  - Implemented proper error handling with fallback responses
  - Modified chatbot UI to handle code blocks and formatting
  
### Earlier
- Initial website implementation with terminal-style UI
- Implemented blog generator with Markdown to HTML conversion
- Created command palette for quick navigation (VSCode-style)
- Added interactive animations and responsive design
- Set up projects, ventures, and consultancy components


