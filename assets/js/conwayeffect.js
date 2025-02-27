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
    this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0 };
    this.hoveredCell = null;
    this.mouseRadius = options.mouseRadius || 150; // Increased radius for smoother magnify effect
    this.mouseStrength = options.mouseStrength || 0.3;
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
    this.generationInterval = options.generationInterval || 120; // Faster generations
    this.lastGeneration = 0;
    
    // Animation properties
    this.hoverTransitionSpeed = options.hoverTransitionSpeed || 0.15; // Speed of hover transition
    this.clickAnimDuration = 400; // Duration of click animation in ms
    this.clickAnimations = []; // Stores click animation state
    this.ripples = []; // Stores ripple animations
    
    // Magnification effect settings
    this.magnifyFactor = options.magnifyFactor || 2.0; // Max magnification at mouse position
    this.magnifyFalloff = options.magnifyFalloff || 1.5; // How quickly the effect fades with distance
    
    // Conway settings
    this.conwayInitDensity = options.conwayInitDensity || 0.4; // How many cells start alive (0-1)
    this.conwayRadius = options.conwayRadius || 6; // Size of Conway area around click
    
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
    this.createRipple = this.createRipple.bind(this);
    this.updateRipples = this.updateRipples.bind(this);
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
    console.log("Loading image:", imageUrl);
    this.image = new Image();
    this.image.crossOrigin = 'Anonymous';
    
    this.image.onload = () => {
      console.log("Image loaded successfully:", imageUrl, `(${this.image.width}x${this.image.height})`);
      this.handleResize();
      this.processImage();
      this.startAnimation();
    };
    
    this.image.onerror = (err) => {
      console.error("Failed to load image:", imageUrl, err);
      // Create a default grid even if image fails to load
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
        
        // Apply threshold - making sure dots show up by lowering threshold if needed
        if (avgBrightness > (this.threshold * 2.55) || this.dots.length < 100) {  // Ensure we have some dots
          const normalizedBrightness = avgBrightness / 255;
          // Ensure radius is never zero
          const radius = Math.max(this.maxRadius * normalizedBrightness, 0.5);
          
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
              brightness: normalizedBrightness > 0 ? normalizedBrightness : 0.3,
              alive: false,
              hovered: false,
              gridX: gridX,
              gridY: gridY
            });
            
            // Update grid cell
            this.grid[gridY][gridX] = {
              alive: false,
              brightness: normalizedBrightness > 0 ? normalizedBrightness : 0.3,
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
    
    // Fallback: If we still don't have dots, create a basic grid
    if (this.dots.length < 10) {
      console.log("Creating fallback dot grid");
      const defaultBrightness = 0.7;
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          // Add a dot for every grid position
          const dotX = x * stepSize + stepSize / 2;
          const dotY = y * stepSize + stepSize / 2;
          
          this.dots.push({
            x: dotX,
            y: dotY,
            radius: this.maxRadius * defaultBrightness,
            originalRadius: this.maxRadius * defaultBrightness,
            brightness: defaultBrightness,
            alive: false,
            hovered: false,
            gridX: x,
            gridY: y
          });
          
          this.grid[y][x] = {
            alive: false,
            brightness: defaultBrightness,
            x: dotX,
            y: dotY,
            radius: this.maxRadius * defaultBrightness,
            hovered: false,
            gridX: x,
            gridY: y
          };
        }
      }
    }
    
    console.log(`Created ${this.dots.length} dots in the grid`);
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
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
    
    // No need to track individual hovered cells for the magnify effect
    // as we'll apply it to all dots within mouse radius
    
    this.needsRender = true;
  }
  
  handleClick(e) {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Create a ripple effect at the click position
    this.createRipple(clickX, clickY);
    
    // Find cell at click position
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
      
      // Wait a short moment before starting Conway to let ripple animation play
      setTimeout(() => {
        // Start Conway's Game of Life for this cell
        this.startConwayAtCell(cell.gridX, cell.gridY);
      }, 200);
    }
    
    this.needsRender = true;
  }
  
  createRipple(x, y) {
    // Create a ripple effect
    this.ripples.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: this.mouseRadius * 1.2,
      startTime: Date.now(),
      duration: 500, // ms
      opacity: 1
    });
  }
  
  updateRipples() {
    const now = Date.now();
    
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      const elapsed = now - ripple.startTime;
      const progress = Math.min(1, elapsed / ripple.duration);
      
      // Update ripple properties
      ripple.radius = ripple.maxRadius * progress;
      ripple.opacity = 1 - progress;
      
      // Remove finished ripples
      if (progress >= 1) {
        this.ripples.splice(i, 1);
      }
    }
    
    if (this.ripples.length > 0) {
      this.needsRender = true;
    }
  }
  
  startConwayAtCell(centerX, centerY) {
    // Create a unique identifier for this simulation area
    const simulationId = `${centerX}-${centerY}-${Date.now()}`;
    
    // Define the Conway region (a square area around the clicked cell)
    const radius = this.conwayRadius; // How many cells in each direction to include
    
    // Initialize random cells in this region
    const conwayArea = {
      id: simulationId,
      centerX: centerX,
      centerY: centerY,
      radius: radius,
      cells: [],
      lastUpdate: Date.now()
    };
    
    // Find distance of cells from center for radial pattern
    const getDistanceFromCenter = (x, y) => {
      const dx = x - centerX;
      const dy = y - centerY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    // Randomly initialize cells within the radius
    for (let y = Math.max(0, centerY - radius); y <= Math.min(this.gridHeight - 1, centerY + radius); y++) {
      for (let x = Math.max(0, centerX - radius); x <= Math.min(this.gridWidth - 1, centerX + radius); x++) {
        const cell = this.grid[y][x];
        if (cell) {
          // Calculate distance from center
          const distance = getDistanceFromCenter(x, y);
          
          // Only include cells within the circular area
          if (distance <= radius) {
            // Add to the simulation area
            conwayArea.cells.push({
              x: x,
              y: y,
              alive: false
            });
            
            // Randomly set some cells as alive with higher probability near center
            const probability = this.conwayInitDensity * (1 - distance / (radius + 1));
            if (Math.random() < probability) {
              this.grid[y][x].alive = true;
              this.grid[y][x].conwayActive = true;
            }
          }
        }
      }
    }
    
    // Make sure we have at least some alive cells
    let aliveCount = 0;
    conwayArea.cells.forEach(cell => {
      if (this.grid[cell.y][cell.x].alive) aliveCount++;
    });
    
    // If too few alive cells, add some more
    if (aliveCount < 5) {
      // Ensure the center cell is alive
      if (this.grid[centerY][centerX]) {
        this.grid[centerY][centerX].alive = true;
        this.grid[centerY][centerX].conwayActive = true;
        
        // Add a few more cells around the center
        const nearbyOffsets = [
          [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1]
        ];
        
        nearbyOffsets.forEach(([dx, dy]) => {
          const nx = centerX + dx;
          const ny = centerY + dy;
          if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
            if (Math.random() < 0.6) {
              this.grid[ny][nx].alive = true;
              this.grid[ny][nx].conwayActive = true;
            }
          }
        });
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
    
    // Update ripple animations
    this.updateRipples();
    
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
    
    // Check if we have dots to render
    if (this.dots.length === 0) {
      console.error("No dots to render!");
      return;
    }
    
    // Draw grid cells as dots
    for (let gridY = 0; gridY < this.gridHeight; gridY++) {
      for (let gridX = 0; gridX < this.gridWidth; gridX++) {
        if (!this.grid[gridY] || !this.grid[gridY][gridX]) continue;
        
        const cell = this.grid[gridY][gridX];
        
        // Calculate distance from mouse for magnification effect
        const dx = cell.x - this.mouse.x;
        const dy = cell.y - this.mouse.y;
        const distanceFromMouse = Math.sqrt(dx * dx + dy * dy);
        const mouseEffect = distanceFromMouse < this.mouseRadius 
          ? Math.pow(1 - distanceFromMouse / this.mouseRadius, this.magnifyFalloff)
          : 0;
        
        // Determine dot color based on state and mouse proximity
        let baseFillColor = this.darkMode ? this.fgColor : '#000000';
        const baseOpacity = this.darkMode ? Math.max(0.3, cell.brightness) : Math.max(0.3, cell.brightness);
        
        // Parse base color components
        const baseR = parseInt(this.fgColor.slice(1, 3), 16);
        const baseG = parseInt(this.fgColor.slice(3, 5), 16);
        const baseB = parseInt(this.fgColor.slice(5, 7), 16);
        
        // Define bright color for mouse hover
        const brightR = 255;
        const brightG = 110;
        const brightB = 255;
        
        // Define alive cell color
        const aliveR = 185;
        const aliveG = 103;
        const aliveB = 255;
        
        let fillR, fillG, fillB, fillOpacity;
        
        if (cell.alive) {
          // For alive cells
          fillR = aliveR;
          fillG = aliveG;
          fillB = aliveB;
          fillOpacity = 1.0;
        } else {
          // For normal cells, interpolate between base and bright color based on mouse proximity
          fillR = Math.floor(baseR + (brightR - baseR) * mouseEffect);
          fillG = Math.floor(baseG + (brightG - baseG) * mouseEffect);
          fillB = Math.floor(baseB + (brightB - baseB) * mouseEffect);
          
          // Increase opacity based on mouse proximity
          fillOpacity = baseOpacity + (1 - baseOpacity) * mouseEffect * 0.7;
        }
        
        // Set the fill color
        this.ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillOpacity})`;
        
        // Determine dot size and position with animations
        let radius = Math.max(1, cell.radius || 2); // Ensure radius is never 0
        
        // Apply mouse magnification effect
        radius *= 1 + (this.magnifyFactor - 1) * mouseEffect;
        
        // Apply alive state effect
        if (cell.alive) {
          radius *= 1.3; // Make alive cells larger
        }
        
        // Draw the dot
        this.ctx.beginPath();
        this.ctx.arc(cell.x, cell.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    // Draw ripple effects
    for (const ripple of this.ripples) {
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity * 0.6})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      this.ctx.stroke();
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