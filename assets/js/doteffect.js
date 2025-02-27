/**
 * Interactive dot effect for Unclecode's personal website
 * Based on halftone dot effect algorithm
 * With water ripple effect on click
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
    this.fgColor = options.accentColor || '#8A2BE2'; // Default accent color is purple
    this.animating = false;
    this.needsRender = true;
    this.isInitialized = false;
    this.matrixMode = options.matrixMode !== undefined ? options.matrixMode : true;
    this.matrixSpeed = options.matrixSpeed || 2;
    this.lastMatrixUpdate = 0;
    
    // Color for matrix effect (various shades of green)
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
    
    // Clear existing dots
    this.dots = [];
    
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
    
    this.createWave(clickX, clickY);
  }
  
  createWave(x, y) {
    const now = Date.now();
    
    this.waves.push({
      x: x,
      y: y,
      radius: 0,
      strength: 1,
      startTime: now,
      lastUpdate: now
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
    
    // Clear canvas and set background
    this.ctx.fillStyle = this.darkMode ? this.bgColor : '#FFFFFF';
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw and update dots
    for (const dot of this.dots) {
      // Reset to original position and size
      dot.x = dot.originalX;
      dot.y = dot.originalY;
      dot.radius = dot.originalRadius;
      
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
            const now = Date.now();
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
      }
      
      // Ensure radius is never negative before drawing
      const safeRadius = Math.max(0.1, dot.radius);
      
      // Set the dot color based on matrix mode
      if (this.matrixMode && this.darkMode) {
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
  interpolateColor(position) {
    // Ensure position is between 0 and 1
    position = Math.max(0, Math.min(1, position));
    
    // Calculate which two colors to interpolate between
    const numColors = this.baseColors.length;
    const scaledPosition = position * (numColors - 1);
    const index1 = Math.floor(scaledPosition);
    const index2 = Math.min(index1 + 1, numColors - 1);
    const localPosition = scaledPosition - index1; // Position between the two colors (0-1)
    
    // Get the two colors to interpolate between
    const color1 = this.baseColors[index1];
    const color2 = this.baseColors[index2];
    
    // Interpolate RGB values
    const r = Math.round(color1.r + (color2.r - color1.r) * localPosition);
    const g = Math.round(color1.g + (color2.g - color1.g) * localPosition);
    const b = Math.round(color1.b + (color2.b - color1.b) * localPosition);
    
    // Return color in hex format
    return `rgb(${r}, ${g}, ${b})`;
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
    this.waves = [];
    this.vibrations = [];
    this.isInitialized = false;
  }
}

// Make available globally
window.DotEffect = DotEffect;