const path = require('path');
const fs = require('fs');
const { dataDir } = require('../../../../server/lib/config');
const { hasHeroImage } = require('../../../../server/lib/heroService');

const slidesDir = path.join(dataDir, 'slides');
const templatesDir = path.join(slidesDir, 'templates');
const examplesTemplatesDir = path.join(__dirname, '..', '..', '..', 'examples', 'slides-templates');

// Ensure directories exist
if (!fs.existsSync(slidesDir)) {
  fs.mkdirSync(slidesDir, { recursive: true });
}
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Copy example templates to data/slides/templates if they don't exist
function copyExampleTemplates() {
  if (!fs.existsSync(examplesTemplatesDir)) {
    return;
  }
  
  const exampleTemplates = fs.readdirSync(examplesTemplatesDir, { withFileTypes: true });
  
  for (const entry of exampleTemplates) {
    if (!entry.isDirectory()) continue;
    
    const templateName = entry.name;
    const destTemplateDir = path.join(templatesDir, templateName);
    
    // Only copy if template doesn't exist in data directory
    if (!fs.existsSync(destTemplateDir)) {
      const srcTemplateDir = path.join(examplesTemplatesDir, templateName);
      
      // Create destination directory
      fs.mkdirSync(destTemplateDir, { recursive: true });
      
      // Copy all files from source to destination
      const files = fs.readdirSync(srcTemplateDir);
      for (const file of files) {
        const srcFile = path.join(srcTemplateDir, file);
        const destFile = path.join(destTemplateDir, file);
        
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
        }
      }
      
      console.log(`🎨 Created slide template "${templateName}" from examples/slides-templates/`);
    }
  }
}

// Initialize templates on startup
copyExampleTemplates();

// Load metadata for a slide deck folder
function loadSlideMetadata(folderId, baseDir) {
  const dir = baseDir || slidesDir;
  const folderPath = path.join(dir, folderId);
  
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return null;
  }
  
  // Skip templates folder
  if (folderId === 'templates') {
    return null;
  }
  
  const metadataPath = path.join(folderPath, 'metadata.json');
  const slidesPath = path.join(folderPath, 'slides.md');
  
  // Check for slides.md file
  if (!fs.existsSync(slidesPath)) {
    return null;
  }
  
  // Load metadata.json
  let metadata = {
    title: folderId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    template: 'uxd',
    aspectRatio: '16:9',
    createdAt: new Date().toISOString()
  };
  
  if (fs.existsSync(metadataPath)) {
    try {
      const loadedMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      metadata = { ...metadata, ...loadedMetadata };
    } catch (err) {
      console.error(`Error parsing metadata.json for ${folderId}:`, err);
    }
  }
  
  // Get slide count from markdown
  const slidesContent = fs.readFileSync(slidesPath, 'utf-8');
  const slideCount = countSlides(slidesContent);
  
  const stats = fs.statSync(slidesPath);
  
  return {
    id: folderId,
    ...metadata,
    slideCount,
    hasHero: hasHeroImage(folderPath),
    modifiedAt: stats.mtime.toISOString()
  };
}

// Count slides in markdown (slides are separated by ---)
function countSlides(markdown) {
  const slides = markdown.split(/^---$/m).filter(s => s.trim());
  return slides.length;
}

// Parse markdown to slide objects
function parseMarkdownToSlides(markdown) {
  const slideBlocks = markdown.split(/^---$/m).filter(s => s.trim());
  
  return slideBlocks.map((block, index) => {
    const lines = block.trim().split('\n');
    const slide = {
      index,
      type: 'content',
      heading: '',
      subheading: '',
      content: [],
      rawMarkdown: block.trim(),
      media: null // Will hold { type: 'image'|'iframe', src: '...' } if present
    };
    
    // Parse all directives from the slide
    const directiveLines = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
        // Parse type directive
        const typeMatch = trimmed.match(/<!--\s*type:\s*(\w+)\s*-->/i);
        if (typeMatch) {
          slide.type = typeMatch[1];
        }
        
        // Parse image directive for side panel
        const imageMatch = trimmed.match(/<!--\s*image:\s*(.+?)\s*-->/i);
        if (imageMatch) {
          slide.media = { type: 'image', src: imageMatch[1].trim() };
        }
        
        // Parse iframe directive for side panel
        const iframeMatch = trimmed.match(/<!--\s*iframe:\s*(.+?)\s*-->/i);
        if (iframeMatch) {
          slide.media = { type: 'iframe', src: iframeMatch[1].trim() };
        }
        
        directiveLines.push(line);
      }
    }
    
    // Parse headings and content (skip directive lines)
    for (const line of lines) {
      if (directiveLines.includes(line)) continue;
      
      if (line.startsWith('# ')) {
        slide.heading = line.slice(2).trim();
      } else if (line.startsWith('## ')) {
        slide.subheading = line.slice(3).trim();
      } else if (line.startsWith('### ')) {
        slide.content.push({ type: 'h3', text: line.slice(4).trim() });
      } else if (line.startsWith('- ')) {
        slide.content.push({ type: 'bullet', text: line.slice(2).trim() });
      } else if (line.startsWith('* ')) {
        slide.content.push({ type: 'bullet', text: line.slice(2).trim() });
      } else if (line.startsWith('> ')) {
        slide.content.push({ type: 'quote', text: line.slice(2).trim() });
      } else if (line.startsWith('![')) {
        const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
        if (imgMatch) {
          slide.content.push({ type: 'image', alt: imgMatch[1], src: imgMatch[2] });
        }
      } else if (line.trim()) {
        slide.content.push({ type: 'paragraph', text: line.trim() });
      }
    }
    
    // Detect slide type from content if not specified
    if (slide.type === 'content') {
      if (slide.heading && !slide.subheading && slide.content.length <= 2) {
        slide.type = 'title';
      }
    }
    
    return slide;
  });
}

// List all templates
function listTemplates() {
  if (!fs.existsSync(templatesDir)) {
    return [];
  }
  
  const entries = fs.readdirSync(templatesDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const templatePath = path.join(templatesDir, entry.name);
      const configPath = path.join(templatePath, 'template.json');
      
      let config = {
        id: entry.name,
        name: entry.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: ''
      };
      
      if (fs.existsSync(configPath)) {
        try {
          const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          config = { ...config, ...loadedConfig };
        } catch (err) {
          console.error(`Error parsing template.json for ${entry.name}:`, err);
        }
      }
      
      return config;
    });
}

module.exports = {
  slidesDir,
  templatesDir,
  loadSlideMetadata,
  countSlides,
  parseMarkdownToSlides,
  listTemplates
};
