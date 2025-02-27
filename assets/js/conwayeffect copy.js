/**
 * Interactive Conway's Game of Life dot effect for Unclecode's personal website
 * Based on halftone dot effect algorithm + Conway's Game of Life
 */

class ConwayEffect {
  constructor(options = {}) {
    this.canvas = null;
    this.ctx = null;
    this.image = null;
    this.dots = [];
    this.grid = [];
    this.gridWidth = 0;
    this.gridHeight = 0;
    this.mouse = { x: 0, y: 0 };
    this.hoveredCell = null;
    this.mouseRadius = options.mouseRadius || 100;
    this.mouseStrength = options.mouseStrength || 0.2;
    this.blockSize = options.blockSize || 12; 
    this.maxRadius = options.maxRadius || 4;
    this.spacing = options.spacing || 0;
    this.threshold = options.threshold || 20;
    this.darkMode = options.darkMode !== undefined ? options.darkMode : true;
    this.bgColor = options.bgColor || '#000000';
    this.fgColor = options.accentColor || '#8A2BE2'; // Default accent color is purple
    this.animating = false;
    this.needsRender = true;
    this.isInitialized = false;
    this.activeCells = []; // Cells where Conway simulation is running
    this.generationInterval = options.generationInterval || 200; // ms between generations
    this.lastGeneration = 0;
    
    // Animation properties
    this.hoverTransitionSpeed = 0.1; // Speed of hover transition (0-1)
    this.clickAnimDuration = 300; // Duration of click animation in ms
    this.clickAnimations = []; // Stores click animation state
    
    // Bind methods
    this.init = this.init.bind(this);
    this.loadImage = this.loadImage.bind(this);
    this.processImage = this.processImage.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.animate = this.animate.bind(this);
    this.renderDots = this.renderDots.bind(this);
    this.updateTheme = this.updateTheme.bind(this);
    this.computeNextGenerationForCell = this.computeNextGenerationForCell.bind(this);
    this.findCellAtPosition = this.findCellAtPosition.bind(this);
    this.startConwayAtCell = this.startConwayAtCell.bind(this);
  }
  
  init(canvasId, imageUrl) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.loadImage(imageUrl);
    
    // Set up event listeners
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);
    this.canvas.addEventListener('click', this.handleClick);
    
    this.isInitialized = true;
  }
  
  loadImage(imageUrl) {
    this.image = new Image();
    this.image.crossOrigin = 'Anonymous';
    this.image.onload = () => {
      this.handleResize();
      this.processImage();
      this.startAnimation();
    };
    this.image.src = imageUrl;
  }
  
  handleResize() {
    if (!this.canvas || !this.image) return;
    
    // Get the container dimensions
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Set canvas to match container
    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;
    
    // If already processed, reprocess with new dimensions
    if (this.dots.length > 0) {
      this.processImage();
    }
  }
  
  processImage() {
    if (!this.canvas || !this.ctx || !this.image) return;
    
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    
    // Clear existing dots and grid
    this.dots = [];
    this.grid = [];
    
    // Calculate aspect ratio scaling
    const imageAspect = this.image.width / this.image.height;
    const canvasAspect = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (imageAspect > canvasAspect) {
      // Image is wider than canvas
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imageAspect;
      offsetX = (canvasWidth - drawWidth) / 2;
    } else {
      // Image is taller than canvas
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imageAspect;
      offsetY = (canvasHeight - drawHeight) / 2;
    }
    
    // Draw image to canvas temporarily to sample pixel data
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.ctx.drawImage(this.image, offsetX, offsetY, drawWidth, drawHeight);
    
    // Get image data
    const imageData = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Create dots and grid
    const stepSize = this.blockSize + this.spacing;
    
    // Calculate grid dimensions
    this.gridWidth = Math.floor(canvasWidth / stepSize);
    this.gridHeight = Math.floor(canvasHeight / stepSize);
    
    // Initialize grid with empty cells
    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x] = {
          alive: false,
          brightness: 0,
          x: x * stepSize + stepSize / 2,
          y: y * stepSize + stepSize / 2,
          hovered: false,
          gridX: x,
          gridY: y
        };
      }
    }
    
    // Process image data to create dots
    for (let y = 0; y < canvasHeight; y += stepSize) {
      for (let x = 0; x < canvasWidth; x += stepSize) {
        let totalBrightness = 0;
        let samples = 0;
        
        // Sample brightness from the block
        for (let sy = 0; sy < this.blockSize; sy++) {
          for (let sx = 0; sx < this.blockSize; sx++) {
            const sampleX = x + sx;
            const sampleY = y + sy;
            
            if (sampleX < canvasWidth && sampleY < canvasHeight) {
              const pos = (sampleY * canvasWidth + sampleX) * 4;
              // Skip if position is outside the drawn image area
              if (sampleX < offsetX || sampleX >= offsetX + drawWidth || 
                  sampleY < offsetY || sampleY >= offsetY + drawHeight) {
                continue;
              }
              
              const r = data[pos];
              const g = data[pos + 1];
              const b = data[pos + 2];
              const brightness = (r + g + b) / 3;
              
              totalBrightness += brightness;
              samples++;
            }
          }
        }
        
        // Calculate average brightness for the block
        const avgBrightness = samples > 0 ? totalBrightness / samples : 0;
        
        // Apply threshold
        if (avgBrightness > (this.threshold * 2.55)) {
          const normalizedBrightness = avgBrightness / 255;
          const radius = this.maxRadius * normalizedBrightness;
          
          if (radius > 0) {
            // Calculate grid position
            const gridX = Math.floor(x / stepSize);
            const gridY = Math.floor(y / stepSize);
            
            // Ensure we're in grid bounds
            if (gridX < this.gridWidth && gridY < this.gridHeight) {
              // Add to dots array
              this.dots.push({
                x: x + this.blockSize / 2,
                y: y + this.blockSize / 2,
                radius: radius,
                originalRadius: radius,
                brightness: normalizedBrightness,
                alive: false,
                hovered: false,
                gridX: gridX,
                gridY: gridY
              });
              
              // Update grid cell
              this.grid[gridY][gridX] = {
                alive: false,
                brightness: normalizedBrightness,
                x: x + this.blockSize / 2,
                y: y + this.blockSize / 2,
                radius: radius,
                hovered: false,
                gridX: gridX,
                gridY: gridY
              };
            }
          }
        }
      }
    }
    
    this.needsRender = true;
  }
  
  findCellAtPosition(x, y) {
    // Find the cell at the given position
    const stepSize = this.blockSize + this.spacing;
    const gridX = Math.floor(x / stepSize);
    const gridY = Math.floor(y / stepSize);
    
    // Check if coordinates are within grid
    if (gridX >= 0 && gridX < this.gridWidth && 
        gridY >= 0 && gridY < this.gridHeight) {
      return this.grid[gridY][gridX];
    }
    
    return null;
  }
  
  handleMouseMove(e) {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
    
    // Reset previously hovered cell
    if (this.hoveredCell) {
      this.hoveredCell.hoverProgress = 0;
      this.hoveredCell.hovered = false;
    }
    
    // Find cell under mouse
    const cell = this.findCellAtPosition(this.mouse.x, this.mouse.y);
    if (cell) {
      cell.hovered = true;
      // If hoverProgress doesn't exist, initialize it
      if (cell.hoverProgress === undefined) {
        cell.hoverProgress = 0;
      }
      this.hoveredCell = cell;
    } else {
      this.hoveredCell = null;
    }
    
    this.needsRender = true;
  }
  
  handleClick(e) {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Find clicked cell
    const cell = this.findCellAtPosition(clickX, clickY);
    if (cell) {
      // Add click animation
      this.clickAnimations.push({
        x: cell.x,
        y: cell.y,
        radius: cell.radius,
        startTime: Date.now(),
        progress: 0,
        cell: cell
      });
      
      // Start Conway's Game of Life for this cell
      this.startConwayAtCell(cell.gridX, cell.gridY);
    }
    
    this.needsRender = true;
  }
  
  startConwayAtCell(centerX, centerY) {
    // Create a unique identifier for this simulation area
    const simulationId = `${centerX}-${centerY}-${Date.now()}`;
    
    // Define the Conway region (a square area around the clicked cell)
    const radius = 5; // How many cells in each direction to include
    
    // Initialize random cells in this region
    const conwayArea = {
      id: simulationId,
      centerX: centerX,
      centerY: centerY,
      radius: radius,
      cells: [],
      lastUpdate: Date.now()
    };
    
    // Set up initial random pattern in a glider pattern if possible
    // Add the clicked cell and neighbors as alive
    for (let y = Math.max(0, centerY - radius); y <= Math.min(this.gridHeight - 1, centerY + radius); y++) {
      for (let x = Math.max(0, centerX - radius); x <= Math.min(this.gridWidth - 1, centerX + radius); x++) {
        const cell = this.grid[y][x];
        if (cell) {
          // Add to the simulation area
          conwayArea.cells.push({
            x: x,
            y: y,
            alive: false  // Default to not alive
          });
          
          // Set some initial cells as alive to create an interesting pattern
          // This creates a simple glider pattern if space permits
          if (
            (x === centerX && y === centerY) || // Center cell
            (x === centerX - 1 && y === centerY + 1) || // Bottom left
            (x === centerX && y === centerY + 1) || // Bottom middle
            (x === centerX + 1 && y === centerY + 1) || // Bottom right
            (x === centerX + 1 && y === centerY) // Middle right
          ) {
            this.grid[y][x].alive = true;
            this.grid[y][x].conwayActive = true;
          }
        }
      }
    }
    
    // Add this Conway simulation to active simulations
    this.activeCells.push(conwayArea);
  }
  
  computeNextGenerationForCell(conwayArea) {
    const now = Date.now();
    
    // Only update at specified interval
    if (now - conwayArea.lastUpdate < this.generationInterval) {
      return;
    }
    
    // Get bounds of this simulation area
    const minX = Math.max(0, conwayArea.centerX - conwayArea.radius);
    const maxX = Math.min(this.gridWidth - 1, conwayArea.centerX + conwayArea.radius);
    const minY = Math.max(0, conwayArea.centerY - conwayArea.radius);
    const maxY = Math.min(this.gridHeight - 1, conwayArea.centerY + conwayArea.radius);
    
    // Create temporary grid for next generation
    const newStates = {};
    
    // Calculate next state for each cell
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${y}`;
        const currentCell = this.grid[y][x];
        
        if (!currentCell) continue;
        
        // Count live neighbors
        let liveNeighbors = 0;
        
        // Check all 8 neighboring cells
        for (let ny = -1; ny <= 1; ny++) {
          for (let nx = -1; nx <= 1; nx++) {
            // Skip the cell itself
            if (nx === 0 && ny === 0) continue;
            
            // Check if neighbor is within grid
            const neighborX = x + nx;
            const neighborY = y + ny;
            
            if (neighborX >= minX && neighborX <= maxX && 
                neighborY >= minY && neighborY <= maxY) {
              if (this.grid[neighborY][neighborX] && this.grid[neighborY][neighborX].alive) {
                liveNeighbors++;
              }
            }
          }
        }
        
        // Apply Conway's Game of Life rules
        if (currentCell.alive) {
          // Live cell with fewer than 2 live neighbors dies (underpopulation)
          // Live cell with more than 3 live neighbors dies (overpopulation)
          // Live cell with 2-3 live neighbors lives on
          newStates[key] = liveNeighbors === 2 || liveNeighbors === 3;
        } else {
          // Dead cell with exactly 3 live neighbors becomes a live cell (reproduction)
          newStates[key] = liveNeighbors === 3;
        }
      }
    }
    
    // Update grid with new generation
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${y}`;
        if (newStates[key] !== undefined) {
          this.grid[y][x].alive = newStates[key];
          this.grid[y][x].conwayActive = true;
        }
      }
    }
    
    // Update last update time
    conwayArea.lastUpdate = now;
    this.needsRender = true;
  }
  
  startAnimation() {
    if (!this.animating) {
      this.animating = true;
      this.animate();
    }
  }
  
  animate() {
    if (!this.animating) return;
    
    // Update hover animations
    if (this.hoveredCell && this.hoveredCell.hoverProgress !== undefined) {
      // Gradually increase hover progress to create smooth transition
      this.hoveredCell.hoverProgress = Math.min(1, this.hoveredCell.hoverProgress + this.hoverTransitionSpeed);
      this.needsRender = true;
    }
    
    // Update click animations
    const now = Date.now();
    for (let i = this.clickAnimations.length - 1; i >= 0; i--) {
      const anim = this.clickAnimations[i];
      const elapsed = now - anim.startTime;
      
      // Update progress
      anim.progress = Math.min(1, elapsed / this.clickAnimDuration);
      
      // Remove completed animations
      if (anim.progress >= 1) {
        this.clickAnimations.splice(i, 1);
      }
      
      this.needsRender = true;
    }
    
    // Update Conway simulations for active cells
    for (let i = 0; i < this.activeCells.length; i++) {
      this.computeNextGenerationForCell(this.activeCells[i]);
    }
    
    if (this.needsRender) {
      this.renderDots();
      this.needsRender = false;
    }
    
    requestAnimationFrame(this.animate);
  }
  
  renderDots() {
    if (!this.canvas || !this.ctx) return;
    
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    
    // Clear canvas and set background
    this.ctx.fillStyle = this.darkMode ? this.bgColor : '#FFFFFF';
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw grid cells as dots
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        if (!cell) continue;
        
        // Skip cells with no visible dot
        if (!cell.radius) continue;
        
        // Determine dot color based on state
        let fillColor = this.darkMode ? this.fgColor : '#000000';
        
        if (cell.alive) {
          // Brighter version of the fill color for alive cells
          fillColor = this.darkMode ? 
            `rgb(185, 103, 255)` : // Brighter purple in dark mode
            `rgb(102, 51, 153)`; // Darker purple in light mode
        }
        
        if (cell.hovered && cell.hoverProgress !== undefined) {
          // Transition to brighter color for hovered cells
          const baseColor = this.darkMode ? 
            [138, 43, 226] : // Base color (BlueViolet) in dark mode
            [102, 51, 153]; // Base color in light mode
            
          const brightColor = this.darkMode ?
            [255, 110, 255] : // Bright color in dark mode
            [175, 110, 255]; // Bright color in light mode
            
          // Interpolate between base and bright color
          const r = Math.floor(baseColor[0] + (brightColor[0] - baseColor[0]) * cell.hoverProgress);
          const g = Math.floor(baseColor[1] + (brightColor[1] - baseColor[1]) * cell.hoverProgress);
          const b = Math.floor(baseColor[2] + (brightColor[2] - baseColor[2]) * cell.hoverProgress);
          
          fillColor = `rgb(${r}, ${g}, ${b})`;
        }
        
        this.ctx.fillStyle = fillColor;
        
        // Determine dot size and position with animations
        let radius = cell.radius;
        let x = cell.x;
        let y = cell.y;
        
        // Apply hover effect (magnification)
        if (cell.hovered && cell.hoverProgress !== undefined) {
          // Scale up size based on hover progress (max 1.8x size)
          const hoverScale = 1 + (0.8 * cell.hoverProgress);
          radius *= hoverScale;
        }
        
        // Apply alive state effect
        if (cell.alive) {
          radius *= 1.3; // Make alive cells larger
        }
        
        // Draw the dot
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    // Draw click animations (jellying effect)
    for (const anim of this.clickAnimations) {
      // Animation stages:
      // 1. Compress (0-25%)
      // 2. Expand (25-60%)
      // 3. Settle (60-100%)
      let scaleFactorX = 1;
      let scaleFactorY = 1;
      
      if (anim.progress < 0.25) {
        // Compress stage - squish horizontally, expand vertically
        const compressionProgress = anim.progress / 0.25;
        scaleFactorX = 1 - (0.4 * compressionProgress);
        scaleFactorY = 1 + (0.3 * compressionProgress);
      } else if (anim.progress < 0.6) {
        // Expand stage - expand horizontally, compress vertically
        const expandProgress = (anim.progress - 0.25) / 0.35;
        scaleFactorX = 0.6 + (0.5 * expandProgress);
        scaleFactorY = 1.3 - (0.4 * expandProgress);
      } else {
        // Settle stage - return to normal with slight oscillation
        const settleProgress = (anim.progress - 0.6) / 0.4;
        const oscillation = Math.sin(settleProgress * Math.PI * 2) * (1 - settleProgress) * 0.1;
        scaleFactorX = 1.1 - (0.1 * settleProgress) + oscillation;
        scaleFactorY = 0.9 + (0.1 * settleProgress) - oscillation;
      }
      
      // Draw jelly effect
      this.ctx.fillStyle = this.fgColor;
      this.ctx.beginPath();
      this.ctx.ellipse(
        anim.x, 
        anim.y, 
        anim.radius * scaleFactorX * 1.4, // Scale x radius
        anim.radius * scaleFactorY * 1.4, // Scale y radius
        0, 0, Math.PI * 2
      );
      this.ctx.fill();
    }
  }
  
  updateTheme(isDarkMode, accentColor) {
    this.darkMode = isDarkMode;
    if (accentColor) {
      this.fgColor = accentColor;
    }
    
    if (this.darkMode) {
      this.bgColor = '#000000';
    } else {
      this.bgColor = '#FFFFFF';
      this.fgColor = '#000000';
    }
    
    this.needsRender = true;
  }
  
  destroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleClick);
    }
    
    this.animating = false;
    this.dots = [];
    this.grid = [];
    this.clickAnimations = [];
    this.activeCells = [];
    this.isInitialized = false;
  }
}

// Make available globally
window.ConwayEffect = ConwayEffect;