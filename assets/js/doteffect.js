/**
 * Interactive dot effect for Unclecode's personal website
 * Based on halftone dot effect algorithm
 * With water ripple effect on click
 * Includes interactive controls for customization
 */

class DotEffect {
  constructor(options = {}) {
    this.canvas = null;
    this.ctx = null;
    this.image = null;
    this.dots = [];
    this.waves = [];
    this.vibrations = [];
    this.mouse = { x: 0, y: 0 };
    this.mouseRadius = options.mouseRadius || 100;
    this.mouseStrength = options.mouseStrength || 0.2;
    this.blockSize = options.blockSize || 8; 
    this.maxRadius = options.maxRadius || 4;
    this.spacing = options.spacing || 0;
    this.threshold = options.threshold || 20;
    this.darkMode = options.darkMode !== undefined ? options.darkMode : true;
    this.bgColor = options.bgColor || '#1B191A';
    this.fgColor = options.accentColor || '#A7959C'; // Default accent color
    this.defaultFgColor = '#A7959C'; // Store the default color for resets
    this.animating = false;
    this.needsRender = true;
    this.isInitialized = false;
    this.matrixMode = options.matrixMode !== undefined ? options.matrixMode : true;
    this.matrixSpeed = options.matrixSpeed || 2;
    this.lastMatrixUpdate = 0;
    this.controlsVisible = false;
    this.currentImage = null;
    
    // Color for matrix effect and rainbow effects
    // Define base colors for matrix effect
    this.baseColors = [
      { r: 17, g: 34, b: 17 },    // #112211 - Darkest green
      { r: 34, g: 85, b: 34 },    // #225522
      { r: 51, g: 170, b: 51 },   // #33AA33
      { r: 51, g: 255, b: 51 },   //rgb(51, 255, 139) - Brightest green (terminal green)
      { r: 68, g: 255, b: 68 },   // #44FF44
      { r: 102, g: 255, b: 102 }, // #66FF66
      { r: 136, g: 255, b: 136 }  // #88FF88
    ];
    
    // Rainbow colors for the new hover effect
    this.rainbowColors = [
      { r: 255, g: 0, b: 0 },     // Red
      { r: 255, g: 165, b: 0 },   // Orange
      { r: 255, g: 255, b: 0 },   // Yellow
      { r: 0, g: 255, b: 0 },     // Green
      { r: 0, g: 127, b: 255 },   // Blue
      { r: 75, g: 0, b: 130 },    // Indigo
      { r: 148, g: 0, b: 211 }    // Violet
    ];
    
    // Rainbow effect settings
    this.rainbowEnabled = true;
    this.rainbowTrail = { x: 0, y: 0, active: false };
    this.rainbowRadius = 180;
    this.rainbowIntensity = 0.8;
    this.rainbowPersistence = 0.995; // Higher value for slower fade (0-1)
    this.rainbowSpeed = 0.002; // Even slower color cycling for more elegance
    this.rainbowPhase = 0; // Current position in the color cycle
    this.lastMouseMoveTime = 0;
    this.rainbowMemory = []; // Stores previous positions for persistent effect
    this.maxMemorySize = 10; // How many previous positions to remember
    
    // Ripple effect options
    this.waveSpeed = options.waveSpeed || 5;
    this.waveAmplitude = options.waveAmplitude || 15;
    this.waveDuration = options.waveDuration || 3000; // ms
    this.waveDecay = options.waveDecay || 0.7; // Wave strength decay factor
    
    // Vibration effect options
    this.vibrationRadius = options.vibrationRadius || 150;
    this.vibrationStrength = options.vibrationStrength || 0.5;
    this.vibrationSpeed = options.vibrationSpeed || 2; 
    this.vibrationDuration = options.vibrationDuration || 800; // ms
    this.vibrationElasticity = options.vibrationElasticity || 0.85; // Elastic return factor
    
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
    this.createWave = this.createWave.bind(this);
    this.updateWaves = this.updateWaves.bind(this);
    this.createVibration = this.createVibration.bind(this);
    this.updateVibrations = this.updateVibrations.bind(this);
    this.interpolateColor = this.interpolateColor.bind(this);
    this.createControls = this.createControls.bind(this);
    this.updateFromControls = this.updateFromControls.bind(this);
    this.toggleControls = this.toggleControls.bind(this);
    this.downloadImage = this.downloadImage.bind(this);
    this.handleFileUpload = this.handleFileUpload.bind(this);
  }
  
  init(canvasId, imageUrl) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.currentImage = imageUrl;
    
    // Load settings from localStorage if available
    this.loadSettings();
    
    this.loadImage(imageUrl);
    
    // Set up event listeners
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);
    this.canvas.addEventListener('click', this.handleClick);
    
    // Create control panel
    this.createControls();
    
    this.isInitialized = true;
  }
  
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('dotEffect-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Apply saved settings if they exist
        if (settings.blockSize) this.blockSize = settings.blockSize;
        if (settings.maxRadius) this.maxRadius = settings.maxRadius;
        if (settings.spacing) this.spacing = settings.spacing;
        if (settings.threshold) this.threshold = settings.threshold;
        if (settings.bgColor) this.bgColor = settings.bgColor;
        if (settings.fgColor) this.fgColor = settings.fgColor;
      }
    } catch (error) {
      console.error('Error loading dot effect settings:', error);
    }
  }
  
  saveSettings() {
    try {
      const settings = {
        blockSize: this.blockSize,
        maxRadius: this.maxRadius,
        spacing: this.spacing,
        threshold: this.threshold,
        bgColor: this.bgColor,
        fgColor: this.fgColor
      };
      
      localStorage.setItem('dotEffect-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving dot effect settings:', error);
    }
  }
  
  createControls() {
    // Create container for controls
    const container = document.createElement('div');
    container.className = 'dot-effect-controls';
    container.style.display = this.controlsVisible ? 'block' : 'none';
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'dot-effect-toggle';
    toggleButton.innerHTML = '⚙️ Play with dots';
    toggleButton.addEventListener('click', this.toggleControls);
    
    // Create header with title and close button
    const header = document.createElement('div');
    header.className = 'dot-effect-header';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Dot Effect Controls';
    title.className = 'dot-effect-title';
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'dot-effect-close';
    closeButton.innerHTML = '✕';
    closeButton.addEventListener('click', this.toggleControls);
    
    // Assemble header
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create control panel content
    const controlsContent = document.createElement('div');
    controlsContent.className = 'dot-effect-controls-content';
    
    // Create sliders for different parameters
    const createSlider = (name, min, max, value, step, onChange) => {
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'dot-effect-slider-container';
      
      const label = document.createElement('label');
      label.textContent = name;
      label.className = 'dot-effect-label';
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = min;
      slider.max = max;
      slider.value = value;
      slider.step = step || 1;
      slider.className = 'dot-effect-slider';
      
      const valueDisplay = document.createElement('span');
      valueDisplay.textContent = value;
      valueDisplay.className = 'dot-effect-value';
      
      slider.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
        onChange(parseFloat(e.target.value));
      });
      
      sliderContainer.appendChild(label);
      sliderContainer.appendChild(slider);
      sliderContainer.appendChild(valueDisplay);
      
      return sliderContainer;
    };
    
    // Create color pickers
    const createColorPicker = (name, value, onChange) => {
      const colorContainer = document.createElement('div');
      colorContainer.className = 'dot-effect-color-container';
      
      const label = document.createElement('label');
      label.textContent = name;
      label.className = 'dot-effect-label';
      
      const colorPicker = document.createElement('input');
      colorPicker.type = 'color';
      colorPicker.value = value;
      colorPicker.className = 'dot-effect-color';
      
      colorPicker.addEventListener('input', (e) => {
        onChange(e.target.value);
      });
      
      colorContainer.appendChild(label);
      colorContainer.appendChild(colorPicker);
      
      return colorContainer;
    };
    
    // Add sliders
    controlsContent.appendChild(createSlider('Block Size', 4, 20, this.blockSize, 1, (value) => {
      this.blockSize = value;
      this.processImage();
    }));
    
    controlsContent.appendChild(createSlider('Max Dot Radius', 1, 10, this.maxRadius, 0.5, (value) => {
      this.maxRadius = value;
      this.processImage();
    }));
    
    controlsContent.appendChild(createSlider('Spacing', 0, 10, this.spacing, 1, (value) => {
      this.spacing = value;
      this.processImage();
    }));
    
    controlsContent.appendChild(createSlider('Brightness Threshold', 0, 100, this.threshold, 1, (value) => {
      this.threshold = value;
      this.processImage();
    }));
    
    // Add color pickers
    controlsContent.appendChild(createColorPicker('Background Color', this.bgColor, (value) => {
      this.bgColor = value;
      this.needsRender = true;
    }));
    
    controlsContent.appendChild(createColorPicker('Dot Color', this.fgColor, (value) => {
      this.fgColor = value;
      this.needsRender = true;
    }));
    
    // Add file upload
    const fileUploadContainer = document.createElement('div');
    fileUploadContainer.className = 'dot-effect-upload-container';
    
    const fileLabel = document.createElement('label');
    fileLabel.textContent = 'Upload Image';
    fileLabel.className = 'dot-effect-label';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'dot-effect-file';
    fileInput.addEventListener('change', this.handleFileUpload);
    
    fileUploadContainer.appendChild(fileLabel);
    fileUploadContainer.appendChild(fileInput);
    
    controlsContent.appendChild(fileUploadContainer);
    
    // Add download button
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Image';
    downloadButton.className = 'dot-effect-download';
    downloadButton.addEventListener('click', this.downloadImage);
    
    controlsContent.appendChild(downloadButton);
    
    // Add button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dot-effect-button-container';
    
    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Settings';
    resetButton.className = 'dot-effect-reset';
    resetButton.addEventListener('click', () => {
      this.blockSize = 8;
      this.maxRadius = 4;
      this.spacing = 0;
      this.threshold = 20;
      this.bgColor = '#1B191A';
      this.fgColor = this.defaultFgColor;
      
      // Reset all sliders and color pickers
      const sliders = container.querySelectorAll('.dot-effect-slider');
      const values = container.querySelectorAll('.dot-effect-value');
      
      sliders[0].value = this.blockSize;
      values[0].textContent = this.blockSize;
      
      sliders[1].value = this.maxRadius;
      values[1].textContent = this.maxRadius;
      
      sliders[2].value = this.spacing;
      values[2].textContent = this.spacing;
      
      sliders[3].value = this.threshold;
      values[3].textContent = this.threshold;
      
      const colorPickers = container.querySelectorAll('.dot-effect-color');
      colorPickers[0].value = this.bgColor;
      colorPickers[1].value = this.fgColor;
      
      // Reprocess image with default settings
      this.processImage();
    });
    
    buttonContainer.appendChild(resetButton);
    
    // Add apply button
    const applyButton = document.createElement('button');
    applyButton.textContent = 'Apply Changes';
    applyButton.className = 'dot-effect-apply';
    applyButton.addEventListener('click', this.updateFromControls);
    
    buttonContainer.appendChild(applyButton);
    
    controlsContent.appendChild(buttonContainer);
    
    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
      .dot-effect-toggle {
        position: absolute;
        top: 20px;
        left: 20px;
        background-color: #1B191A;
        color: #726d6f;
        border: 1px solid #726d6f;
        border-radius: 4px;
        padding: 8px 12px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.2s ease;
      }
      
      .dot-effect-toggle:hover {
        background-color: #726d6f;
        color: #1B191A;
      }
      
      .dot-effect-controls {
        position: absolute;
        top: 100px;
        left: 60px;
        background-color: #1B191A;
        border: 1px solid #726d6f;
        border-radius: 6px;
        width: 320px;
        z-index: 1000;
        font-family: 'JetBrains Mono', monospace;
        color: #726d6f;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        cursor: move;
        user-select: none;
      }
      
      .dot-effect-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background-color: #2e2c2d;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        border-bottom: 1px solid #494949;
      }
      
      .dot-effect-title {
        margin: 0;
        font-size: 16px;
        font-weight: normal;
      }
      
      .dot-effect-close {
        cursor: pointer;
        background: none;
        border: none;
        font-size: 16px;
        color: #726d6f;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 4px;
      }
      
      .dot-effect-close:hover {
        background-color: #494949;
      }
      
      .dot-effect-controls-content {
        padding: 15px;
        max-height: 70vh;
        overflow-y: auto;
      }
      
      .dot-effect-slider-container,
      .dot-effect-color-container,
      .dot-effect-upload-container {
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .dot-effect-label {
        flex: 0 0 40%;
        font-size: 14px;
      }
      
      .dot-effect-slider {
        flex: 1;
        margin: 0 10px;
        height: 5px;
        -webkit-appearance: none;
        appearance: none;
        background: #494949;
        outline: none;
        border-radius: 3px;
      }
      
      .dot-effect-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background: #726d6f;
        cursor: pointer;
      }
      
      .dot-effect-value {
        flex: 0 0 30px;
        text-align: right;
        font-size: 14px;
      }
      
      .dot-effect-color {
        height: 25px;
        width: 50px;
        border: none;
        border-radius: 4px;
        background: none;
        cursor: pointer;
        padding: 0;
      }
      
      .dot-effect-file {
        margin-left: 10px;
        font-size: 14px;
        color: #726d6f;
      }
      
      .dot-effect-button-container {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-top: 15px;
      }
      
      .dot-effect-download {
        display: block;
        margin: 10px auto;
        padding: 8px 15px;
        background-color: #1B191A;
        color: #726d6f;
        border: 1px solid #726d6f;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 80%;
      }
      
      .dot-effect-reset,
      .dot-effect-apply {
        flex: 1;
        padding: 8px 15px;
        background-color: #1B191A;
        color: #726d6f;
        border: 1px solid #726d6f;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .dot-effect-download:hover,
      .dot-effect-reset:hover,
      .dot-effect-apply:hover {
        background-color: #726d6f;
        color: #1B191A;
      }
    `;
    
    document.head.appendChild(style);
    
    // Combine all elements
    container.appendChild(header);
    container.appendChild(controlsContent);
    
    // Add to document
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.style.position = 'relative';
      this.canvas.parentElement.appendChild(toggleButton);
      this.canvas.parentElement.appendChild(container);
    } else {
      document.body.appendChild(toggleButton);
      document.body.appendChild(container);
    }
    
    // Save references
    this.controlsElement = container;
    this.toggleButton = toggleButton;
    
    // Make the controls draggable
    this.makeDraggable(container, header);
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
    
    // Clear existing dots
    this.dots = [];
    
    // Save settings whenever processing image
    this.saveSettings();
    
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
    
    // Create dots
    const stepSize = this.blockSize + this.spacing;
    
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
            this.dots.push({
              x: x + this.blockSize / 2,
              y: y + this.blockSize / 2,
              radius: radius,
              originalRadius: radius,
              brightness: normalizedBrightness,
              originalX: x + this.blockSize / 2,
              originalY: y + this.blockSize / 2,
              colorPosition: Math.random(), // Random initial position in color gradient (0-1)
              colorPhase: Math.random() * Math.PI * 2, // Random phase for oscillation
              colorSpeed: 0.05 + Math.random() * 0.15 // Very slow oscillation for hypnotic effect
            });
          }
        }
      }
    }
    
    this.needsRender = true;
  }
  
  handleMouseMove(e) {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
    
    // Create a small vibration wave at mouse position
    this.createVibration(this.mouse.x, this.mouse.y);
    
    // Handle rainbow effect
    if (this.rainbowEnabled) {
      // Remember current position and color phase
      const now = Date.now();
      
      // Only add to memory if we've moved a significant distance
      // or if it's been a while since the last move
      const lastPos = this.rainbowMemory.length > 0 ? this.rainbowMemory[this.rainbowMemory.length - 1] : null;
      const timeDiff = lastPos ? now - lastPos.time : Infinity;
      const distanceThreshold = 20; // Minimum distance to record a new position
      const timeThreshold = 100; // Minimum time between recordings
      
      let shouldRecord = !lastPos;
      
      if (lastPos) {
        const dx = this.mouse.x - lastPos.x;
        const dy = this.mouse.y - lastPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        shouldRecord = (distance > distanceThreshold || timeDiff > timeThreshold);
      }
      
      if (shouldRecord) {
        // Add current position to memory
        this.rainbowMemory.push({
          x: this.mouse.x,
          y: this.mouse.y,
          phase: this.rainbowPhase,
          time: now,
          active: 1.0 // Full intensity
        });
        
        // Limit memory size
        if (this.rainbowMemory.length > this.maxMemorySize) {
          this.rainbowMemory.shift();
        }
      }
      
      // Set current active position
      this.rainbowTrail.x = this.mouse.x;
      this.rainbowTrail.y = this.mouse.y;
      this.rainbowTrail.active = 1.0;
      this.lastMouseMoveTime = now;
    }
    
    this.needsRender = true;
  }
  
  createVibration(x, y) {
    // Store the current mouse position and timestamp for vibration effect
    const now = Date.now();
    
    // Store only the last 5 positions to limit memory usage
    if (!this.vibrations) this.vibrations = [];
    
    this.vibrations.push({
      x: x,
      y: y,
      strength: 1,
      startTime: now,
      lastUpdate: now
    });
    
    // Keep only the most recent vibrations
    if (this.vibrations.length > 5) {
      this.vibrations.shift();
    }
  }
  
  handleClick(e) {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Get the current rainbow phase for colored ripples
    let waveColor = null;
    
    if (this.rainbowEnabled) {
      // Determine if we should use rainbow color for the wave
      waveColor = {
        phase: this.rainbowPhase,
        color: this.getRainbowColor(this.rainbowPhase)
      };
    }
    
    this.createWave(clickX, clickY, waveColor);
  }
  
  createWave(x, y, colorInfo = null) {
    const now = Date.now();
    
    this.waves.push({
      x: x,
      y: y,
      radius: 0,
      strength: 1,
      startTime: now,
      lastUpdate: now,
      colorInfo: colorInfo // Store the color info
    });
    
    this.needsRender = true;
  }
  
  updateWaves() {
    const now = Date.now();
    const waveLifetime = this.waveDuration;
    
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      const elapsed = now - wave.startTime;
      const deltaTime = now - wave.lastUpdate;
      
      // Update wave radius
      wave.radius += this.waveSpeed * (deltaTime / 16); // Normalize by 16ms (~ 60fps)
      
      // Decrease strength over time
      wave.strength = 1 - (elapsed / waveLifetime);
      
      // Remove waves that have expired
      if (elapsed > waveLifetime || wave.strength <= 0) {
        this.waves.splice(i, 1);
      } else {
        wave.lastUpdate = now;
      }
    }
    
    if (this.waves.length > 0) {
      this.needsRender = true;
    }
  }
  
  startAnimation() {
    if (!this.animating) {
      this.animating = true;
      this.animate();
    }
  }
  
  animate() {
    if (!this.animating) return;
    
    const now = Date.now();
    
    // Update wave positions
    if (this.waves.length > 0) {
      this.updateWaves();
    }
    
    // Update vibrations
    if (this.vibrations && this.vibrations.length > 0) {
      this.updateVibrations();
    }
    
    // Update matrix effect colors
    if (this.matrixMode && (now - this.lastMatrixUpdate > (1000 / this.matrixSpeed))) {
      this.updateMatrixColors(now);
      this.lastMatrixUpdate = now;
      this.needsRender = true;
    }
    
    // Always render if rainbow effect is active
    if (this.rainbowEnabled && this.rainbowTrail.active) {
      this.needsRender = true;
    }
    
    if (this.needsRender) {
      this.renderDots();
      this.needsRender = false;
    }
    
    requestAnimationFrame(this.animate);
  }
  
  updateMatrixColors(now) {
    // Update the color of each dot for matrix effect
    for (const dot of this.dots) {
      // Calculate oscillation based on time and dot's phase/speed
      const time = now / 1000; // Convert to seconds
      const oscillation = Math.sin(time * dot.colorSpeed + dot.colorPhase);
      
      // Map oscillation (-1 to 1) to position in color range (0 to 1)
      // This creates a smooth oscillation between darker and brighter greens
      const normalizedOsc = (oscillation + 1) / 2; // Convert to 0-1 range
      
      // Save the continuous value rather than converting to an index
      // This will be used for interpolation between colors
      dot.colorPosition = normalizedOsc;
    }
  }
  
  updateVibrations() {
    const now = Date.now();
    const vibrationLifetime = this.vibrationDuration;
    
    for (let i = this.vibrations.length - 1; i >= 0; i--) {
      const vibration = this.vibrations[i];
      const elapsed = now - vibration.startTime;
      
      // Update vibration strength - decay over time
      vibration.strength = Math.max(0, 1 - (elapsed / vibrationLifetime));
      
      // Remove vibrations that have expired
      if (elapsed > vibrationLifetime || vibration.strength <= 0) {
        this.vibrations.splice(i, 1);
      }
    }
    
    if (this.vibrations.length > 0) {
      this.needsRender = true;
    }
  }
  
  renderDots() {
    if (!this.canvas || !this.ctx) return;
    
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const now = Date.now();
    
    // Update rainbow phase for smooth color transitions
    this.rainbowPhase += this.rainbowSpeed;
    if (this.rainbowPhase > 1) this.rainbowPhase -= 1;
    
    // Check if the rainbow effect should fade out
    const timeSinceLastMove = now - this.lastMouseMoveTime;
    if (timeSinceLastMove > 50 && this.rainbowTrail.active) {
      // Gradually decrease intensity if mouse hasn't moved
      this.rainbowTrail.active = this.rainbowTrail.active * this.rainbowPersistence;
      
      // Deactivate if it gets too small
      if (this.rainbowTrail.active < 0.01) {
        this.rainbowTrail.active = false;
      }
    }
    
    // Update rainbow memory points, fading them out slowly
    for (let i = 0; i < this.rainbowMemory.length; i++) {
      const point = this.rainbowMemory[i];
      // Fade out much more slowly than the current position
      point.active *= this.rainbowPersistence;
    }
    
    // Remove memory points that have faded too much
    this.rainbowMemory = this.rainbowMemory.filter(point => point.active > 0.01);
    
    // Clear canvas and set background
    this.ctx.fillStyle = this.darkMode ? this.bgColor : '#FFFFFF';
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw and update dots
    for (const dot of this.dots) {
      // Reset to original position and size
      dot.x = dot.originalX;
      dot.y = dot.originalY;
      dot.radius = dot.originalRadius;
      
      // Apply rainbow effect if enabled
      let rainbowEffect = false;
      let rainbowColor = null;
      let rainbowIntensity = 0;
      
      // Check current mouse position first
      if (this.rainbowEnabled && this.rainbowTrail.active) {
        // Calculate distance from the dot to the mouse position
        const dx = dot.originalX - this.rainbowTrail.x;
        const dy = dot.originalY - this.rainbowTrail.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply rainbow effect based on distance
        if (distance < this.rainbowRadius) {
          // Calculate a smooth falloff based on distance
          const normalizedDistance = distance / this.rainbowRadius;
          const falloff = 1 - Math.pow(normalizedDistance, 2); // Quadratic falloff for smoother gradient
          
          // Calculate final intensity
          rainbowIntensity = falloff * this.rainbowIntensity * this.rainbowTrail.active;
          
          if (rainbowIntensity > 0.05) { // Only apply if above threshold
            rainbowEffect = true;
            
            // Calculate color position based on distance and phase
            // This creates a smooth gradient of colors that radiates outward
            const colorPosition = (this.rainbowPhase + distance / (this.rainbowRadius * 3)) % 1.0;
            
            // Get color from the rainbow spectrum
            rainbowColor = this.getRainbowColor(colorPosition);
            
            // Make dots near the mouse slightly larger
            dot.radius += dot.originalRadius * rainbowIntensity * 0.3;
          }
        }
      }
      
      // Then check previous positions in memory for persistent effect
      if (!rainbowEffect && this.rainbowEnabled && this.rainbowMemory.length > 0) {
        // Find the memory point with the strongest effect on this dot
        let strongestEffect = { intensity: 0, colorPosition: 0 };
        
        for (const memory of this.rainbowMemory) {
          // Skip inactive memory points
          if (memory.active < 0.05) continue;
          
          const dx = dot.originalX - memory.x;
          const dy = dot.originalY - memory.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < this.rainbowRadius) {
            // Calculate a smooth falloff based on distance
            const normalizedDistance = distance / this.rainbowRadius;
            const falloff = 1 - Math.pow(normalizedDistance, 2); 
            
            // Calculate intensity for this memory point
            const intensity = falloff * this.rainbowIntensity * memory.active;
            
            if (intensity > strongestEffect.intensity) {
              // Calculate color position based on memory's phase and dot distance
              const colorPosition = (memory.phase + distance / (this.rainbowRadius * 3)) % 1.0;
              
              strongestEffect = { 
                intensity, 
                colorPosition,
                memory 
              };
            }
          }
        }
        
        // Apply the strongest effect if any
        if (strongestEffect.intensity > 0.05) {
          rainbowEffect = true;
          rainbowIntensity = strongestEffect.intensity;
          rainbowColor = this.getRainbowColor(strongestEffect.colorPosition);
          dot.radius += dot.originalRadius * rainbowIntensity * 0.3;
        }
      }
      
      // Apply vibration effect
      if (this.vibrations && this.vibrations.length > 0) {
        let totalVibrationEffect = { x: 0, y: 0, radius: 0 };
        
        for (const vibration of this.vibrations) {
          const dx = dot.originalX - vibration.x;
          const dy = dot.originalY - vibration.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only affect dots within vibration radius
          if (distance < this.vibrationRadius) {
            // Calculate vibration intensity based on distance
            const intensity = Math.pow(1 - distance / this.vibrationRadius, 2) * vibration.strength;
            
            // Calculate vibration angle with some randomization for natural look
            const angle = Math.atan2(dy, dx) + (Math.random() * 0.2 - 0.1);
            
            // Calculate vibration amplitude based on distance and time
            // Create sine wave oscillation effect
            const elapsed = now - vibration.startTime;
            const phase = elapsed * this.vibrationSpeed / 100;
            const oscillation = Math.sin(phase + distance / 10) * this.vibrationStrength * intensity;
            
            // Calculate displacement with elastic return
            const displacement = oscillation * Math.exp(-elapsed / (this.vibrationDuration * 0.5));
            
            // Add to total vibration effect
            totalVibrationEffect.x += Math.cos(angle) * displacement * 8;
            totalVibrationEffect.y += Math.sin(angle) * displacement * 8;
            
            // Vary the dot radius slightly
            totalVibrationEffect.radius += intensity * oscillation * 0.5;
          }
        }
        
        // Apply total vibration effect
        dot.x += totalVibrationEffect.x;
        dot.y += totalVibrationEffect.y;
        
        // Add safeguard to prevent negative radius
        const radiusChange = totalVibrationEffect.radius * dot.originalRadius;
        // Limit the reduction to 90% of original radius to avoid negatives
        if (radiusChange < 0) {
          dot.radius += Math.max(radiusChange, -0.9 * dot.originalRadius);
        } else {
          dot.radius += radiusChange;
        }
      }
      
      // Apply wave effects from click
      if (this.waves.length > 0) {
        let totalWaveEffect = { x: 0, y: 0, radius: 0 };
        let waveRainbowEffect = false;
        let waveRainbowColor = null;
        
        for (const wave of this.waves) {
          const dx = dot.originalX - wave.x;
          const dy = dot.originalY - wave.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Calculate wave effect based on distance from wave center
          const waveRadius = wave.radius;
          const waveWidth = this.waveAmplitude * 2; // Width of the wave peak
          
          // Only affect dots that are near the wave peak
          if (Math.abs(distance - waveRadius) < waveWidth) {
            // Calculate how close to the peak of the wave this point is
            const distFromPeak = Math.abs(distance - waveRadius);
            const peakIntensity = 1 - (distFromPeak / waveWidth);
            
            // Calculate wave direction
            const angle = Math.atan2(dy, dx);
            
            // Wave effect strength based on position and wave strength
            const effectStrength = peakIntensity * wave.strength * this.waveAmplitude;
            
            // Generate simple harmonic motion along the wave direction
            // Using sine of the distance creates the wave pattern
            const wavePhase = (distance / 20) % (Math.PI * 2); // Controls wave frequency
            const waveDisplacement = Math.sin(wavePhase) * effectStrength;
            
            // Add this wave's effect to the total
            totalWaveEffect.x += Math.cos(angle) * waveDisplacement;
            totalWaveEffect.y += Math.sin(angle) * waveDisplacement;
            
            // Make dots larger at the peak of the wave
            totalWaveEffect.radius += peakIntensity * wave.strength * 1.5;
            
            // Apply colored wave effect if wave has color info
            if (wave.colorInfo && peakIntensity > 0.4) {
              // Stronger rainbow effect at the peak of the wave
              const waveColorIntensity = peakIntensity * wave.strength;
              
              // If this is a stronger effect than any previous wave or rainbow effect
              if (waveColorIntensity > rainbowIntensity && !waveRainbowEffect) {
                waveRainbowEffect = true;
                
                // Use wave's stored color
                if (typeof wave.colorInfo.phase === 'number') {
                  // Calculate a color position that varies with distance for ripple effect
                  const colorPos = (wave.colorInfo.phase + distance / 200) % 1.0;
                  waveRainbowColor = this.getRainbowColor(colorPos);
                } else {
                  waveRainbowColor = wave.colorInfo.color;
                }
              }
            }
          }
        }
        
        // Apply total wave effect
        dot.x += totalWaveEffect.x;
        dot.y += totalWaveEffect.y;
        
        // Add safeguard to prevent negative radius
        const radiusChange = totalWaveEffect.radius * dot.originalRadius;
        // Limit the reduction to 90% of original radius to avoid negatives
        if (radiusChange < 0) {
          dot.radius += Math.max(radiusChange, -0.9 * dot.originalRadius);
        } else {
          dot.radius += radiusChange;
        }
        
        // Override rainbow effect with wave color if applicable
        if (waveRainbowEffect && waveRainbowColor) {
          rainbowEffect = true;
          rainbowColor = waveRainbowColor;
        }
      }
      
      // Ensure radius is never negative before drawing
      const safeRadius = Math.max(0.1, dot.radius);
      
      // Set the dot color based on effects
      if (rainbowEffect && rainbowColor) {
        // Use the rainbow color for this dot
        this.ctx.fillStyle = rainbowColor;
      } else if (this.matrixMode && this.darkMode) {
        // Use smooth interpolated color based on the dot's position in the color gradient
        this.ctx.fillStyle = this.interpolateColor(dot.colorPosition);
      } else {
        // Use the default color
        this.ctx.fillStyle = this.darkMode ? this.fgColor : this.bgColor;
      }
      
      // Draw the dot
      this.ctx.beginPath();
      this.ctx.arc(dot.x, dot.y, safeRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  // Interpolate between two colors based on a position value (0-1)
  interpolateColor(position, colorArray = this.baseColors) {
    // Ensure position is between 0 and 1
    position = Math.max(0, Math.min(1, position));
    
    // Calculate which two colors to interpolate between
    const numColors = colorArray.length;
    const scaledPosition = position * (numColors - 1);
    const index1 = Math.floor(scaledPosition);
    const index2 = Math.min(index1 + 1, numColors - 1);
    const localPosition = scaledPosition - index1; // Position between the two colors (0-1)
    
    // Get the two colors to interpolate between
    const color1 = colorArray[index1];
    const color2 = colorArray[index2];
    
    // Interpolate RGB values
    const r = Math.round(color1.r + (color2.r - color1.r) * localPosition);
    const g = Math.round(color1.g + (color2.g - color1.g) * localPosition);
    const b = Math.round(color1.b + (color2.b - color1.b) * localPosition);
    
    // Return color in RGB format
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Get a rainbow color from the spectrum
  getRainbowColor(position) {
    return this.interpolateColor(position, this.rainbowColors);
  }

  updateTheme(isDarkMode, accentColor, bgColor) {
    this.darkMode = isDarkMode;
    
    if (accentColor) {
      this.fgColor = accentColor;
      this.defaultFgColor = accentColor;
    }
    
    // If a background color is provided, use it; otherwise, use default colors
    if (bgColor) {
      this.bgColor = bgColor;
    } else if (this.darkMode) {
      this.bgColor = '#1B191A';
    } else {
      this.bgColor = '#F5F5F5';
      // If no accent color provided for light mode, use current defaultFgColor but darker
      if (!accentColor) {
        this.fgColor = '#333333';
      }
    }
    
    this.needsRender = true;
    this.saveSettings(); // Save theme changes
  }
  
  toggleControls() {
    this.controlsVisible = !this.controlsVisible;
    if (this.controlsElement) {
      this.controlsElement.style.display = this.controlsVisible ? 'block' : 'none';
    }
  }
  
  makeDraggable(element, handle) {
    if (!element || !handle) return;
    
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.addEventListener('mousedown', dragMouseDown);
    
    function dragMouseDown(e) {
      e.preventDefault();
      // Get the initial mouse cursor position
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      // When the mouse button is released, stop moving
      document.addEventListener('mouseup', closeDragElement);
      
      // Call function when the cursor moves
      document.addEventListener('mousemove', elementDrag);
    }
    
    function elementDrag(e) {
      e.preventDefault();
      
      // Calculate the new cursor position
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      // Set the element's new position
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
      // Stop moving when mouse button is released
      document.removeEventListener('mouseup', closeDragElement);
      document.removeEventListener('mousemove', elementDrag);
    }
  }
  
  handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.currentImage = img.src;
          this.loadImage(img.src);
        };
        img.src = e.target.result;
      };
      
      reader.readAsDataURL(file);
    }
  }
  
  downloadImage() {
    if (!this.canvas) return;
    
    // Create a temporary link
    const link = document.createElement('a');
    link.download = 'dot-effect-creation.png';
    
    // Convert the canvas to a blob and create a URL
    this.canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      link.href = url;
      
      // Simulate a click on the link to trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }
  
  updateFromControls() {
    // Process image with current settings
    this.processImage();
    
    // Save settings to localStorage
    this.saveSettings();
  }
  
  destroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleClick);
    }
    
    // Remove controls
    if (this.controlsElement && this.controlsElement.parentElement) {
      this.controlsElement.parentElement.removeChild(this.controlsElement);
    }
    
    if (this.toggleButton && this.toggleButton.parentElement) {
      this.toggleButton.parentElement.removeChild(this.toggleButton);
    }
    
    this.animating = false;
    this.dots = [];
    this.waves = [];
    this.vibrations = [];
    this.isInitialized = false;
  }
}

// Make available globally
window.DotEffect = DotEffect;