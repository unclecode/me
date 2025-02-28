/**
 * Terminal-style contact form
 * Provides an interactive terminal experience to collect user contact information
 */

class ContactTerminal {
  constructor() {
    this.terminalDialog = document.getElementById('contact-terminal');
    this.terminalOutput = document.getElementById('terminal-output');
    this.terminalInput = document.getElementById('terminal-input');
    this.terminalBtn = document.getElementById('contact-terminal-btn');
    this.terminalClose = document.getElementById('contact-terminal-close');
    
    // Current step in the form flow
    this.currentStep = 0;
    
    // Data collected from the user
    this.userData = {
      name: '',
      email: '',
      company: '',
      interests: [],
      message: ''
    };
    
    // Define the form flow
    this.formFlow = [
      {
        prompt: 'What is your name?',
        field: 'name',
        validate: (value) => {
          if (!value.trim()) return 'Name is required';
          return null;
        }
      },
      {
        prompt: 'What is your email address?',
        field: 'email',
        validate: (value) => {
          if (!value.trim()) return 'Email is required';
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) return 'Please enter a valid email address';
          return null;
        }
      },
      {
        prompt: 'What company or organization are you from? (optional)',
        field: 'company',
        validate: () => null // Optional field, no validation
      },
      {
        prompt: 'What services are you interested in? (Select by number, separate multiple with commas)',
        field: 'interests',
        type: 'multiselect',
        options: [
          { value: 'ai-strategy', label: 'AI Strategy' },
          { value: 'implementation', label: 'Technical Implementation' },
          { value: 'education', label: 'AI Education & Training' },
          { value: 'llm-finetuning', label: 'LLM Fine-tuning' },
          { value: 'performance', label: 'Performance Optimization' }
        ],
        validate: (value) => {
          if (!value.trim()) return 'Please select at least one option';
          return null;
        }
      },
      {
        prompt: 'Tell me more about your project or needs:',
        field: 'message',
        type: 'textarea',
        validate: (value) => {
          if (!value.trim()) return 'Please provide some details about your project';
          return null;
        }
      }
    ];
    
    this.init();
  }
  
  init() {
    // Attach event listeners
    this.terminalBtn.addEventListener('click', () => this.openTerminal());
    this.terminalClose.addEventListener('click', () => this.closeTerminal());
    this.terminalInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.processInput();
    });
    
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'terminal-overlay';
    document.body.appendChild(this.overlay);
    
    this.overlay.addEventListener('click', () => this.closeTerminal());
  }
  
  openTerminal() {
    // Reset terminal
    this.currentStep = 0;
    this.userData = {
      name: '',
      email: '',
      company: '',
      interests: [],
      message: ''
    };
    
    // Clear terminal output
    this.terminalOutput.innerHTML = `
      <div class="terminal-line">Welcome to the AI Consultancy contact wizard! 🚀</div>
      <div class="terminal-line">Let's collect some information to get started...</div>
      <div class="terminal-line">&nbsp;</div>
    `;
    
    // Show terminal
    this.terminalDialog.classList.add('active');
    this.overlay.classList.add('active');
    
    // Focus input
    this.terminalInput.focus();
    
    // Start form flow
    this.nextStep();
  }
  
  closeTerminal() {
    this.terminalDialog.classList.remove('active');
    this.overlay.classList.remove('active');
  }
  
  addLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.innerHTML = text;
    this.terminalOutput.appendChild(line);
    
    // Scroll to bottom
    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
    
    return line;
  }
  
  processInput() {
    const input = this.terminalInput.value.trim();
    this.terminalInput.value = '';
    
    // Echo input
    this.addLine(`<span class="terminal-prompt">$</span> <span class="typing">${input}</span>`);
    
    const currentQuestion = this.formFlow[this.currentStep];
    
    // Handle multi-select
    if (currentQuestion.type === 'multiselect') {
      const selectedIndexes = input.split(',').map(i => parseInt(i.trim()) - 1);
      const selectedOptions = [];
      
      // Validate selections
      let invalidSelection = false;
      selectedIndexes.forEach(index => {
        if (index < 0 || index >= currentQuestion.options.length) {
          invalidSelection = true;
          return;
        }
        selectedOptions.push(currentQuestion.options[index]);
      });
      
      if (invalidSelection) {
        this.addLine('Please enter valid option numbers, separated by commas.', 'error');
        return;
      }
      
      // Set selected values
      this.userData[currentQuestion.field] = selectedOptions.map(opt => opt.value);
      
      // Show selection
      this.addLine(`Selected: ${selectedOptions.map(opt => opt.label).join(', ')}`, 'success');
    } else {
      // Regular input field
      this.userData[currentQuestion.field] = input;
    }
    
    // Validate input
    const error = currentQuestion.validate(input);
    if (error) {
      this.addLine(error, 'error');
      return;
    }
    
    // Go to next step
    this.currentStep++;
    if (this.currentStep < this.formFlow.length) {
      // Show next question
      setTimeout(() => this.nextStep(), 500);
    } else {
      // Form completed
      this.completeForm();
    }
  }
  
  nextStep() {
    const currentQuestion = this.formFlow[this.currentStep];
    
    // Display the prompt
    this.addLine(`<span class="prompt">${currentQuestion.prompt}</span>`);
    
    // For multi-select, show options
    if (currentQuestion.type === 'multiselect') {
      currentQuestion.options.forEach((option, index) => {
        this.addLine(`<div class="terminal-option"><span class="terminal-option-number">${index + 1}.</span> ${option.label}</div>`);
      });
    }
    
    // Focus input
    this.terminalInput.focus();
  }
  
  completeForm() {
    // Show summary
    this.addLine('', 'info');
    this.addLine('Thank you! Here\'s a summary of your information:', 'info');
    this.addLine(`Name: ${this.userData.name}`, 'info');
    this.addLine(`Email: ${this.userData.email}`, 'info');
    
    if (this.userData.company) {
      this.addLine(`Company: ${this.userData.company}`, 'info');
    }
    
    const selectedInterests = this.userData.interests.map(interest => {
      const option = this.formFlow[3].options.find(opt => opt.value === interest);
      return option ? option.label : interest;
    });
    
    this.addLine(`Interests: ${selectedInterests.join(', ')}`, 'info');
    this.addLine(`Message: ${this.userData.message}`, 'info');
    this.addLine('', 'info');
    
    // Success message
    setTimeout(() => {
      this.addLine('Sending your information...', 'info');
      
      setTimeout(() => {
        this.addLine('✅ Your message has been sent successfully!', 'success');
        this.addLine('I\'ll get back to you shortly. Thank you for your interest!', 'success');
        
        // Hide input
        document.querySelector('.terminal-input-container').style.display = 'none';
        
        // Trigger confetti
        this.triggerConfetti();
        
        // Close terminal after a delay
        setTimeout(() => this.closeTerminal(), 5000);
      }, 1500);
    }, 1000);
  }
  
  triggerConfetti() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    
    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }
    
    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      
      const particleCount = 50 * (timeLeft / duration);
      
      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  }
}

// Initialize the contact terminal
document.addEventListener('DOMContentLoaded', () => {
  new ContactTerminal();
});