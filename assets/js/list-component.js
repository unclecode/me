/**
 * List Component Renderer
 * Renders list items using component templates
 */

const PROJECTS = [
    {
      "title": "Cubie",
      "description": "An AI-empowered learning platform with personalized education.",
      "link": "https://cubie.kidocode.com/",
      "logo": "https://static.wixstatic.com/media/95371c_cef0363acc384adba0cbea2695027500~mv2.png/v1/fill/w_121,h_121,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/cubie-cover.png"
    },
    {
      "title": "Mojitofilms",
      "description": "An app with personalised movie recommendations, powered by AI assistant.",
      "link": "https://www.mojitofilms.com/",
      "logo": "https://static.wixstatic.com/media/95371c_df93487c495741879349c3f30132662a~mv2.png/v1/fill/w_121,h_121,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/mojito-cover.png"
    },
    {
      "title": "AdNext",
      "description": "AI platform that enhances e-commerce conversions and customer satisfaction.",
      "link": "https://adnext.ai/",
      "logo": "https://static.wixstatic.com/media/95371c_8de65b4261ed4385be0ed4453e386738~mv2.png/v1/fill/w_121,h_121,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/adnext-cover.png"
    },
    {
      "title": "Talk2Me",
      "description": "Chat-based AI app to learn new things through character conversations.",
      "link": "https://talk2me.stucent.ai/",
      "logo": "https://static.wixstatic.com/media/95371c_bf225f9564ad4d52bfd23e06ce9703d3~mv2.png/v1/fill/w_121,h_121,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/talktome-cover.png"
    },
    {
      "title": "Potatomath",
      "description": "An engaging and gamified math mobile application for K12 students.",
      "link": "http://www.potatomath.com/",
      "logo": "https://static.wixstatic.com/media/95371c_73b53dcea85142e2ab045ae9b6c34336~mv2.png/v1/fill/w_121,h_121,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/potatomath-cover.png"
    },
    {
      "title": "Talk2Me",
      "description": "Chat-based AI app to learn new things through character conversations.",
      "link": "http://www.potatomath.com/",
      "logo": "https://static.wixstatic.com/media/95371c_73b53dcea85142e2ab045ae9b6c34336~mv2.png/v1/fill/w_121,h_121,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/potatomath-cover.png"
    },
    {
      "title": "Beat the Bot",
      "description": "Interactive educational game where kids outsmart AI while learning and having fun.",
      "link": "http://www.potatomath.com/",
      "logo": "https://static.wixstatic.com/media/95371c_73b53dcea85142e2ab045ae9b6c34336~mv2.png/v1/fill/w_121,h_121,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/potatomath-cover.png"
    },
    {
      "title": "Craft4Me",
      "description": "AI-powered tool to create personalized courses tailored to individual learning goals.",
      "link": "http://www.potatomath.com/",
      "logo": "https://static.wixstatic.com/media/95371c_73b53dcea85142e2ab045ae9b6c34336~mv2.png/v1/fill/w_121,h_121,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/potatomath-cover.png"
    },
    {
      "title": "Upped by Astro",
      "description": "An educational website with various content for students to facilitate self-learning.",
      "link": "http://www.potatomath.com/",
      "logo": "https://static.wixstatic.com/media/95371c_73b53dcea85142e2ab045ae9b6c34336~mv2.png/v1/fill/w_121,h_121,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/potatomath-cover.png"
    },
    {
      "title": "Star Tutor",
      "description": "An e-learning platform that provides live tuitions to wide age-range of students.",
      "link": "http://www.potatomath.com/",
      "logo": "https://static.wixstatic.com/media/95371c_73b53dcea85142e2ab045ae9b6c34336~mv2.png/v1/fill/w_121,h_121,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/potatomath-cover.png"
    }
  ];

class ListComponentRenderer {
  constructor() {
    // Wait for components to load
    document.addEventListener('components:loaded', () => {
      this.initComponents();
    });
  }

  initComponents() {
    this.renderVentures();
    this.renderProjects();
    this.renderExpertise();
  }

  renderVentures() {
    const container = document.querySelector('.ventures-list');
    if (!container || !window.componentLoader) return;

    const ventureItems = [
      {
        number: 1,
        title: "Aleph Null",
        logo: "https://static.wixstatic.com/media/95371c_f2f6d914015240dea9fdd3b4e3fe114f~mv2.png",
        description: "Asia's leading Edtech hub, democratizing AI in education and empowering the next generation of learners.",
        url: "https://www.alephnull.sg"
      },
      {
        number: 2,
        title: "Kidocode",
        logo: "https://static.wixstatic.com/media/95371c_bcae68bb50b94569986b2566d34d491c~mv2.png",
        description: "Founded in 2014, empowering knowledge workers with adaptive education systems for over 30,000 students.",
        url: "https://kidocode.com"
      },
      {
        number: 3,
        title: "KPlay Team",
        logo: "https://static.wixstatic.com/media/95371c_4688d51a1ce14d88a0122d92949a0ba6~mv2.png",
        description: "Software development and consultancy focusing on web & mobile app development services for enterprises.",
        url: "https://www.kplay.team/"
      },
      {
        number: 4,
        title: "Pycademy",
        logo: "https://static.wixstatic.com/media/95371c_eee00e6750a84ddeaf598c0abeba294d~mv2.png",
        description: "Skills development and certification training for IT and Data Science professionals with simulations.",
        url: "https://pycademy.net/about-us/"
      }
    ];

    this.renderItems(container, ventureItems, 'venture-item');
  }

  renderProjects() {
    const container = document.querySelector('.projects-list');
    if (!container || !window.componentLoader) return;

    // Map projects from PROJECTS constant
    const projectItems = PROJECTS.map((project, index) => {
      // Determine project category and tags
      let category = "project";
      let tags = "";
      
      if (project.description.toLowerCase().includes("ai")) {
        tags += '<span class="project-tag">ai</span>';
        category += " ai";
      }
      
      if (project.description.toLowerCase().includes("education")) {
        tags += '<span class="project-tag">education</span>';
        category += " education";
      } else if (project.description.toLowerCase().includes("recommendation")) {
        tags += '<span class="project-tag">recommendation</span>';
      } else if (project.description.toLowerCase().includes("e-commerce")) {
        tags += '<span class="project-tag">e-commerce</span>';
      } else if (project.description.toLowerCase().includes("game")) {
        tags += '<span class="project-tag">game</span>';
      }
      
      // Create a more consistent item structure
      return {
        number: index + 1,
        title: project.title,
        logo: `<img src="${project.logo}" alt="${project.title}">`,
        description: project.description,
        tags: tags || '<span class="project-tag">project</span>',
        url: project.link,
        categories: category
      };
    });

    this.renderItems(container, projectItems, 'project-item');
  }

  renderExpertise() {
    const container = document.querySelector('.expertise-list');
    if (!container || !window.componentLoader) return;

    const expertiseItems = [
      {
        number: 1,
        title: "AI Strategy",
        icon: '<div class="icon-logo"><i class="fas fa-brain"></i></div>',
        description: "Develop practical, ROI-focused AI implementation plans"
      },
      {
        number: 2,
        title: "Technical Implementation",
        icon: '<div class="icon-logo"><i class="fas fa-code-branch"></i></div>',
        description: "Optimize deployment and integration of AI systems"
      },
      {
        number: 3,
        title: "AI Education",
        icon: '<div class="icon-logo"><i class="fas fa-graduation-cap"></i></div>',
        description: "Training programs to upskill your team in AI technologies"
      },
      {
        number: 4,
        title: "LLM Fine-tuning",
        icon: '<div class="icon-logo"><i class="fas fa-cog"></i></div>',
        description: "Custom AI models tailored to your specific business domain"
      },
      {
        number: 5,
        title: "Performance Optimization",
        icon: '<div class="icon-logo"><i class="fas fa-tachometer-alt"></i></div>',
        description: "Enhance speed and efficiency of your AI systems"
      }
    ];

    this.renderItems(container, expertiseItems, 'expertise-item');
  }

  renderItems(container, items, componentName) {
    if (!container || !window.componentLoader || !window.componentLoader.components[componentName]) return;
    
    container.innerHTML = '';
    
    items.forEach((item, index) => {
      let html = window.componentLoader.components[componentName];
      
      // Common replacements for all components
      html = html.replace(/\$ITEM_NUMBER/g, item.number || index + 1);
      
      // Replace placeholders based on component type
      if (componentName === 'venture-item') {
        html = html.replace(/\$ITEM_TITLE/g, item.title || '');
        html = html.replace(/\$ITEM_LOGO/g, item.logo || '');
        html = html.replace(/\$ITEM_DESCRIPTION/g, item.description || '');
        html = html.replace(/\$ITEM_URL/g, item.url || '#');
        html = html.replace(/\$ITEM_CATEGORIES/g, item.categories || '');
      } else if (componentName === 'project-item') {
        html = html.replace(/\$ITEM_NUMBER/g, item.number || index + 1);
        html = html.replace(/\$ITEM_TITLE/g, item.title || '');
        html = html.replace(/\$ITEM_LOGO_HTML/g, item.logo || '');
        html = html.replace(/\$ITEM_DESCRIPTION/g, item.description || '');
        html = html.replace(/\$ITEM_TAGS/g, item.tags || '');
        html = html.replace(/\$ITEM_URL/g, item.url || '#');
        html = html.replace(/\$ITEM_TARGET/g, item.url && item.url.startsWith && item.url.startsWith('http') ? 'target="_blank"' : '');
        html = html.replace(/\$ITEM_CATEGORIES/g, item.categories || '');
      } else if (componentName === 'expertise-item') {
        html = html.replace(/\$ITEM_NUMBER/g, item.number || index + 1);
        html = html.replace(/\$ITEM_TITLE/g, item.title || '');
        html = html.replace(/\$ITEM_ICON/g, item.icon || '');
        html = html.replace(/\$ITEM_DESCRIPTION/g, item.description || '');
      }
      
      container.innerHTML += html;
    });
  }
}

// Initialize the list component renderer
document.addEventListener('DOMContentLoaded', () => {
  new ListComponentRenderer();
});