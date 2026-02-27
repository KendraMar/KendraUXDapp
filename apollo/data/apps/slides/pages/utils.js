// Client-side markdown parser for live preview
export const parseMarkdownToSlides = (markdownContent, title = 'Presentation') => {
  const slides = [];
  const rawSlides = markdownContent.split(/\n---\n/).map(s => s.trim()).filter(Boolean);
  
  for (const rawSlide of rawSlides) {
    const lines = rawSlide.split('\n');
    const slide = {
      type: 'content',
      heading: '',
      subheading: '',
      content: [],
      media: null // Will hold { type: 'image'|'iframe', src: '...' } if present
    };
    
    // Check for slide type directive
    const typeMatch = rawSlide.match(/<!--\s*type:\s*(\w+)\s*-->/i);
    if (typeMatch) {
      slide.type = typeMatch[1].toLowerCase();
    }
    
    // Check for section directive
    const sectionMatch = rawSlide.match(/<!--\s*section:\s*(.+?)\s*-->/i);
    if (sectionMatch) {
      slide.sectionTitle = sectionMatch[1];
    }
    
    // Check for image directive (side panel)
    const imageMatch = rawSlide.match(/<!--\s*image:\s*(.+?)\s*-->/i);
    if (imageMatch) {
      slide.media = { type: 'image', src: imageMatch[1].trim() };
    }
    
    // Check for iframe directive (side panel)
    const iframeMatch = rawSlide.match(/<!--\s*iframe:\s*(.+?)\s*-->/i);
    if (iframeMatch) {
      slide.media = { type: 'iframe', src: iframeMatch[1].trim() };
    }
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip directives
      if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) continue;
      
      // H1 - Main heading
      if (trimmed.startsWith('# ')) {
        slide.heading = trimmed.slice(2);
        continue;
      }
      
      // H2 - Subheading
      if (trimmed.startsWith('## ')) {
        slide.subheading = trimmed.slice(3);
        continue;
      }
      
      // H3 - Section heading within content
      if (trimmed.startsWith('### ')) {
        slide.content.push({ type: 'h3', text: trimmed.slice(4) });
        continue;
      }
      
      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        slide.content.push({ type: 'bullet', text: trimmed.slice(2) });
        continue;
      }
      
      // Blockquotes
      if (trimmed.startsWith('> ')) {
        slide.content.push({ type: 'quote', text: trimmed.slice(2) });
        continue;
      }
      
      // Images
      const imgMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        slide.content.push({ type: 'image', alt: imgMatch[1], src: imgMatch[2] });
        continue;
      }
      
      // Regular paragraph
      if (trimmed) {
        slide.content.push({ type: 'paragraph', text: trimmed });
      }
    }
    
    if (slide.heading || slide.content.length > 0) {
      slides.push(slide);
    }
  }
  
  return { slides, aspectRatio: '16:9', title };
};

// Generate stacked preview HTML for split view (all slides visible at once)
export const generateStackedPreviewHtml = (slideData) => {
  const slides = slideData.slides || [];
  const sectionTitle = slideData.title || 'Presentation';
  
  const parseInlineMarkdown = (text) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  };
  
  const renderSlide = (slide, index) => {
    if (slide.type === 'title') {
      return `
        <div class="slide slide-title">
          <div class="slide-number">${index + 1}</div>
          <div class="title-content">
            <h1>${parseInlineMarkdown(slide.heading)}</h1>
            ${slide.subheading ? `<h2>${parseInlineMarkdown(slide.subheading)}</h2>` : ''}
          </div>
        </div>`;
    } else if (slide.type === 'section') {
      return `
        <div class="slide slide-section">
          <div class="slide-number">${index + 1}</div>
          <h1>${parseInlineMarkdown(slide.heading)}</h1>
          ${slide.subheading ? `<h2>${parseInlineMarkdown(slide.subheading)}</h2>` : ''}
        </div>`;
    } else {
      let contentHtml = '';
      for (const item of slide.content) {
        switch (item.type) {
          case 'h3': contentHtml += `<h3>${parseInlineMarkdown(item.text)}</h3>`; break;
          case 'paragraph': contentHtml += `<p>${parseInlineMarkdown(item.text)}</p>`; break;
          case 'bullet': contentHtml += `<li>${parseInlineMarkdown(item.text)}</li>`; break;
          case 'quote': contentHtml += `<blockquote>${parseInlineMarkdown(item.text)}</blockquote>`; break;
          case 'image': contentHtml += `<img src="${item.src}" alt="${item.alt}" style="max-width:100%;"/>`; break;
        }
      }
      contentHtml = contentHtml.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
      
      const hasMedia = slide.media && slide.media.src;
      const slideClass = hasMedia ? 'slide slide-content has-media' : 'slide slide-content';
      
      // Build media column HTML if present
      let mediaHtml = '';
      if (hasMedia) {
        if (slide.media.type === 'image') {
          mediaHtml = `<div class="slide-media-column"><img src="${slide.media.src}" alt="Slide visual" /></div>`;
        } else if (slide.media.type === 'iframe') {
          // Use lazy-loading with screenshot preview (same as player.html)
          const screenshotUrl = `/api/slides/screenshot?url=${encodeURIComponent(slide.media.src)}`;
          mediaHtml = `
            <div class="slide-media-column">
              <div class="iframe-container" data-iframe-src="${slide.media.src}">
                <div class="iframe-loading">
                  <div class="iframe-loading-spinner"></div>
                </div>
                <img class="iframe-screenshot" src="${screenshotUrl}" alt="Page preview" style="display:none;"
                     onload="this.style.display='block'; this.previousElementSibling.style.display='none';"
                     onerror="this.parentElement.innerHTML='<div class=iframe-error><span>Screenshot unavailable</span><button class=load-interactive-btn onclick=loadIframe(this.closest(\\'.iframe-container\\'))>Load Interactive</button></div>';" />
                <div class="iframe-overlay">
                  <button class="load-interactive-btn" onclick="loadIframe(this.closest('.iframe-container'))">Load Interactive</button>
                  <button class="refresh-screenshot-btn" onclick="refreshScreenshot(this.closest('.iframe-container'), event)" title="Refresh screenshot">↻</button>
                </div>
              </div>
            </div>`;
        }
      }
      
      // Build body content with or without two-column layout
      let bodyContent;
      if (hasMedia) {
        bodyContent = `
          <div class="slide-text-column">
            <h1>${parseInlineMarkdown(slide.heading)}</h1>
            ${contentHtml}
          </div>
          ${mediaHtml}`;
      } else {
        bodyContent = `<h1>${parseInlineMarkdown(slide.heading)}</h1>${contentHtml}`;
      }
      
      return `
        <div class="${slideClass}">
          <div class="slide-number">${index + 1}</div>
          <div class="slide-header"><span class="section-title">${sectionTitle}</span></div>
          <div class="slide-body">
            ${bodyContent}
          </div>
        </div>`;
    }
  };
  
  const slidesHtml = slides.length > 0 
    ? slides.map((slide, i) => renderSlide(slide, i)).join('')
    : '<div class="empty-state">No slides to display. Start typing in the editor!</div>';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stacked Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700;900&family=Red+Hat+Text:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { 
      width: 100%; 
      min-height: 100%; 
      font-family: 'Red Hat Text', sans-serif; 
      background: #1a1a1a; 
      overflow-x: hidden;
      overflow-y: auto;
    }
    .slides-container {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .slide {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
    }
    .slide-number {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.6);
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
      z-index: 10;
    }
    .slide.slide-title { background: #151515; color: #fff; }
    .slide.slide-title .title-content { padding: 8% 6%; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .slide.slide-title h1 { font-family: 'Red Hat Display', sans-serif; font-size: 28px; font-weight: 700; line-height: 1.1; margin-bottom: 0.5em; max-width: 80%; }
    .slide.slide-title h2 { font-family: 'Red Hat Text', sans-serif; font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.7); }
    .slide.slide-content { background: #fff; color: #151515; }
    .slide.slide-content .slide-header { padding: 12px 20px; }
    .slide.slide-content .slide-header::before { content: ''; display: inline-block; width: 20px; height: 2px; background: #EE0000; margin-right: 8px; vertical-align: middle; }
    .slide.slide-content .slide-header .section-title { font-family: 'Red Hat Text', sans-serif; font-size: 10px; font-weight: 500; color: #EE0000; }
    .slide.slide-content .slide-body { flex: 1; padding: 0 20px 20px; overflow: hidden; }
    .slide.slide-content h1 { font-family: 'Red Hat Display', sans-serif; font-size: 22px; font-weight: 700; color: #151515; margin-bottom: 0.6em; line-height: 1.1; }
    .slide.slide-content h3 { font-family: 'Red Hat Display', sans-serif; font-size: 12px; font-weight: 600; color: #151515; margin: 0.8em 0 0.4em; }
    .slide.slide-content p { font-family: 'Red Hat Text', sans-serif; font-size: 11px; line-height: 1.5; color: #151515; margin-bottom: 0.5em; }
    .slide.slide-content ul { list-style: none; padding: 0; margin: 0.5em 0; }
    .slide.slide-content ul li { font-family: 'Red Hat Text', sans-serif; font-size: 11px; line-height: 1.5; padding-left: 1em; position: relative; margin-bottom: 0.3em; }
    .slide.slide-content ul li::before { content: ''; position: absolute; left: 0; top: 0.5em; width: 4px; height: 4px; background: #EE0000; border-radius: 50%; }
    .slide.slide-content blockquote { border-left: 3px solid #EE0000; padding-left: 0.8em; margin: 0.6em 0; font-style: italic; color: #6A6E73; font-size: 11px; }
    .slide.slide-content.has-media .slide-body { display: flex; gap: 4%; }
    .slide.slide-content.has-media .slide-text-column { flex: 0 0 46%; min-width: 0; }
    .slide.slide-content.has-media .slide-media-column { flex: 0 0 50%; display: flex; align-items: center; justify-content: center; min-width: 0; }
    .slide.slide-content.has-media .slide-media-column img:not(.iframe-screenshot) { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
    .slide.slide-section { background: linear-gradient(135deg, #151515 0%, #2a2a2a 100%); color: #fff; justify-content: center; align-items: center; text-align: center; }
    .slide.slide-section h1 { font-family: 'Red Hat Display', sans-serif; font-size: 32px; font-weight: 700; }
    .slide.slide-section h2 { font-family: 'Red Hat Text', sans-serif; font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.7); margin-top: 0.5em; }
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #666;
      font-size: 14px;
      text-align: center;
    }
    
    /* Iframe lazy-loading styles (same as player.html) */
    .iframe-container {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 4px;
      overflow: hidden;
      background: #f0f0f0;
    }
    .iframe-screenshot {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
      transition: filter 0.2s ease;
    }
    .iframe-container:hover .iframe-screenshot {
      filter: brightness(0.7);
    }
    .iframe-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s ease;
      background: rgba(0,0,0,0.3);
      border-radius: 4px;
    }
    .iframe-container:hover .iframe-overlay {
      opacity: 1;
    }
    .load-interactive-btn {
      padding: 8px 16px;
      font-family: 'Red Hat Text', sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: #fff;
      background: #EE0000;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .load-interactive-btn:hover {
      background: #cc0000;
      transform: scale(1.05);
    }
    .refresh-screenshot-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 24px;
      height: 24px;
      padding: 0;
      font-size: 12px;
      color: #fff;
      background: rgba(0,0,0,0.6);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .refresh-screenshot-btn:hover {
      background: #EE0000;
    }
    .iframe-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      border-radius: 4px;
    }
    .iframe-loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #ddd;
      border-top-color: #EE0000;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .iframe-error {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #f5f5f5;
      border-radius: 4px;
      color: #666;
      font-family: 'Red Hat Text', sans-serif;
      font-size: 11px;
    }
    /* Live iframe styles */
    .iframe-live-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 4px;
      overflow: hidden;
    }
    .iframe-live-wrapper iframe {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 4px;
    }
    .iframe-zoom-controls {
      position: absolute;
      top: 6px;
      left: 6px;
      display: flex;
      gap: 3px;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 10;
    }
    .iframe-live-wrapper:hover .iframe-zoom-controls {
      opacity: 1;
    }
    .zoom-btn {
      width: 24px;
      height: 20px;
      padding: 0;
      font-family: 'Red Hat Text', sans-serif;
      font-size: 9px;
      font-weight: 600;
      color: #fff;
      background: rgba(0,0,0,0.7);
      border: none;
      border-radius: 3px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .zoom-btn:hover {
      background: #EE0000;
    }
    .zoom-btn.active {
      background: #EE0000;
    }
    .zoom-level-indicator {
      padding: 0 6px;
      font-family: 'Red Hat Text', sans-serif;
      font-size: 9px;
      color: #fff;
      background: rgba(0,0,0,0.7);
      border-radius: 3px;
      display: flex;
      align-items: center;
    }
    .iframe-zoom-container {
      width: 100%;
      height: 100%;
      overflow: auto;
    }
    .iframe-zoom-content {
      transform-origin: top left;
      transition: transform 0.2s ease;
    }
  </style>
</head>
<body>
  <div class="slides-container">
    ${slidesHtml}
  </div>
  
  <script>
    // Iframe lazy loading and zoom controls (same as player.html)
    var ZOOM_LEVELS = [0.5, 0.75, 1, 'fit'];
    
    // Load iframe replacing the screenshot
    window.loadIframe = function(container) {
      var iframeSrc = container.dataset.iframeSrc;
      if (!iframeSrc) return;
      
      var containerWidth = container.offsetWidth;
      var containerHeight = container.offsetHeight;
      
      // Add sandbox for external URLs for security
      var isExternal = iframeSrc.startsWith('http://') || iframeSrc.startsWith('https://');
      var sandboxAttr = isExternal ? ' sandbox="allow-scripts allow-same-origin"' : '';
      
      container.innerHTML = 
        '<div class="iframe-live-wrapper" data-iframe-src="' + iframeSrc + '" data-zoom="fit">' +
          '<div class="iframe-zoom-controls">' +
            '<button class="zoom-btn" onclick="setZoom(this.closest(\\'.iframe-live-wrapper\\'), 0.5)" title="50%">50%</button>' +
            '<button class="zoom-btn" onclick="setZoom(this.closest(\\'.iframe-live-wrapper\\'), 0.75)" title="75%">75%</button>' +
            '<button class="zoom-btn" onclick="setZoom(this.closest(\\'.iframe-live-wrapper\\'), 1)" title="100%">100%</button>' +
            '<button class="zoom-btn active" onclick="setZoom(this.closest(\\'.iframe-live-wrapper\\'), \\'fit\\')" title="Fit">Fit</button>' +
            '<span class="zoom-level-indicator">Fit</span>' +
          '</div>' +
          '<div class="iframe-zoom-container">' +
            '<div class="iframe-zoom-content" style="width: ' + containerWidth + 'px; height: ' + containerHeight + 'px;">' +
              '<iframe src="' + iframeSrc + '" title="Interactive content"' + sandboxAttr + '></iframe>' +
            '</div>' +
          '</div>' +
        '</div>';
      
      var wrapper = container.querySelector('.iframe-live-wrapper');
      setZoom(wrapper, 'fit');
    };
    
    // Set zoom level on iframe
    window.setZoom = function(wrapper, zoom) {
      if (!wrapper) return;
      
      var container = wrapper.querySelector('.iframe-zoom-container');
      var content = wrapper.querySelector('.iframe-zoom-content');
      var indicator = wrapper.querySelector('.zoom-level-indicator');
      var buttons = wrapper.querySelectorAll('.zoom-btn');
      
      buttons.forEach(function(btn, index) {
        var btnZoom = ZOOM_LEVELS[index];
        btn.classList.toggle('active', btnZoom === zoom);
      });
      
      var scale = 1;
      var zoomLabel = '100%';
      
      if (zoom === 'fit') {
        var containerWidth = container.offsetWidth;
        var containerHeight = container.offsetHeight;
        var contentWidth = 1280;
        var contentHeight = 720;
        
        var scaleX = containerWidth / contentWidth;
        var scaleY = containerHeight / contentHeight;
        scale = Math.min(scaleX, scaleY, 1);
        zoomLabel = 'Fit';
      } else {
        scale = zoom;
        zoomLabel = Math.round(zoom * 100) + '%';
      }
      
      content.style.transform = 'scale(' + scale + ')';
      content.style.width = '1280px';
      content.style.height = '720px';
      
      if (indicator) {
        indicator.textContent = zoomLabel;
      }
      
      wrapper.dataset.zoom = zoom;
      container.scrollTop = 0;
      container.scrollLeft = 0;
    };
    
    // Refresh screenshot by invalidating cache
    window.refreshScreenshot = function(container, event) {
      if (event) {
        event.stopPropagation();
      }
      
      var iframeSrc = container.dataset.iframeSrc;
      if (!iframeSrc) return;
      
      var screenshotUrl = '/api/slides/screenshot?url=' + encodeURIComponent(iframeSrc);
      
      var img = container.querySelector('.iframe-screenshot');
      var loading = container.querySelector('.iframe-loading');
      var overlay = container.querySelector('.iframe-overlay');
      
      if (img) img.style.display = 'none';
      if (loading) loading.style.display = 'flex';
      if (overlay) overlay.style.display = 'none';
      
      fetch('/api/slides/screenshot?url=' + encodeURIComponent(iframeSrc), {
        method: 'DELETE'
      }).then(function() {
        var newImg = new Image();
        newImg.onload = function() {
          if (img) {
            img.src = this.src;
            img.style.display = 'block';
          }
          if (loading) loading.style.display = 'none';
          if (overlay) overlay.style.display = '';
        };
        newImg.onerror = function() {
          if (loading) loading.style.display = 'none';
          if (overlay) overlay.style.display = '';
          container.innerHTML = 
            '<div class="iframe-error">' +
              '<span>Screenshot generation failed</span>' +
              '<button class="load-interactive-btn" onclick="loadIframe(this.closest(\\'.iframe-container\\'))">Load Interactive</button>' +
            '</div>';
        };
        newImg.src = screenshotUrl + '&_=' + Date.now();
      }).catch(function(error) {
        console.error('Error refreshing screenshot:', error);
        if (loading) loading.style.display = 'none';
        if (overlay) overlay.style.display = '';
      });
    };
  </script>
</body>
</html>`;
};

// Generate complete HTML for live preview iframe (single slide view with navigation)
export const generatePlayerHtml = (slideData) => {
  const dataJson = JSON.stringify(slideData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700;900&family=Red+Hat+Text:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; font-family: 'Red Hat Text', sans-serif; background: #000; }
    .slide-container { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; }
    .slide-viewport { position: relative; background: #fff; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; visibility: hidden; transition: opacity 0.4s ease; display: flex; flex-direction: column; }
    .slide.active { opacity: 1; visibility: visible; }
    .slide.slide-title { background: #151515; color: #fff; position: relative; overflow: hidden; }
    .slide.slide-title .title-content { position: relative; z-index: 1; padding: 8% 6%; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .slide.slide-title h1 { font-family: 'Red Hat Display', sans-serif; font-size: 4.5vw; font-weight: 700; line-height: 1.1; margin-bottom: 0.5em; max-width: 70%; }
    .slide.slide-title h2 { font-family: 'Red Hat Text', sans-serif; font-size: 1.8vw; font-weight: 400; color: rgba(255,255,255,0.7); }
    .slide.slide-content { background: #fff; color: #151515; }
    .slide.slide-content .slide-header { padding: 3% 5%; }
    .slide.slide-content .slide-header::before { content: ''; display: inline-block; width: 30px; height: 2px; background: #EE0000; margin-right: 12px; vertical-align: middle; }
    .slide.slide-content .slide-header .section-title { font-family: 'Red Hat Text', sans-serif; font-size: 1vw; font-weight: 500; color: #EE0000; }
    .slide.slide-content .slide-body { flex: 1; padding: 0 5% 5%; }
    .slide.slide-content h1 { font-family: 'Red Hat Display', sans-serif; font-size: 3.5vw; font-weight: 700; color: #151515; margin-bottom: 0.8em; line-height: 1.1; }
    .slide.slide-content h3 { font-family: 'Red Hat Display', sans-serif; font-size: 1.4vw; font-weight: 600; color: #151515; margin: 1.2em 0 0.6em; }
    .slide.slide-content p { font-family: 'Red Hat Text', sans-serif; font-size: 1.3vw; line-height: 1.6; color: #151515; margin-bottom: 0.8em; }
    .slide.slide-content ul { list-style: none; padding: 0; margin: 0.8em 0; }
    .slide.slide-content ul li { font-family: 'Red Hat Text', sans-serif; font-size: 1.3vw; line-height: 1.6; padding-left: 1.5em; position: relative; margin-bottom: 0.5em; }
    .slide.slide-content ul li::before { content: ''; position: absolute; left: 0; top: 0.6em; width: 6px; height: 6px; background: #EE0000; border-radius: 50%; }
    .slide.slide-content blockquote { border-left: 4px solid #EE0000; padding-left: 1em; margin: 1em 0; font-style: italic; color: #6A6E73; }
    .slide.slide-content.has-media .slide-body { display: flex; gap: 4%; }
    .slide.slide-content.has-media .slide-text-column { flex: 0 0 46%; min-width: 0; }
    .slide.slide-content.has-media .slide-media-column { flex: 0 0 50%; display: flex; align-items: center; justify-content: center; min-width: 0; }
    .slide.slide-content.has-media .slide-media-column img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .slide.slide-content.has-media .slide-media-column iframe { width: 100%; height: 100%; border: none; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); background: #f5f5f5; }
    .slide.slide-section { background: linear-gradient(135deg, #151515 0%, #2a2a2a 100%); color: #fff; justify-content: center; align-items: center; text-align: center; }
    .slide.slide-section h1 { font-family: 'Red Hat Display', sans-serif; font-size: 5vw; font-weight: 700; }
    .slide.slide-section h2 { font-family: 'Red Hat Text', sans-serif; font-size: 2vw; font-weight: 400; color: rgba(255,255,255,0.7); margin-top: 0.5em; }
    .page-number { position: absolute; bottom: 3%; right: 5%; font-family: 'Red Hat Text', sans-serif; font-size: 1vw; color: #6A6E73; }
    .nav-controls { position: absolute; bottom: 3%; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 20px; z-index: 100; opacity: 0; transition: opacity 0.3s ease; }
    .slide-container:hover .nav-controls { opacity: 1; }
    .nav-btn { width: 44px; height: 44px; border: none; background: rgba(0,0,0,0.6); color: #fff; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
    .nav-btn:hover { background: #EE0000; transform: scale(1.1); }
    .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .nav-btn svg { width: 20px; height: 20px; }
    .slide-counter { font-family: 'Red Hat Text', sans-serif; font-size: 14px; color: #fff; background: rgba(0,0,0,0.6); padding: 8px 16px; border-radius: 20px; }
  </style>
</head>
<body>
  <div class="slide-container" id="slideContainer">
    <div class="slide-viewport" id="slideViewport"></div>
    <div class="nav-controls">
      <button class="nav-btn" id="prevBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
      <span class="slide-counter" id="slideCounter">1 / 1</span>
      <button class="nav-btn" id="nextBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>
    </div>
  </div>
  <script>
    window.SLIDE_DATA = ${dataJson};
    (function() {
      const data = window.SLIDE_DATA || { slides: [], aspectRatio: '16:9' };
      const slides = data.slides || [];
      const aspectRatio = data.aspectRatio || '16:9';
      const sectionTitle = data.title || 'Presentation';
      let currentSlide = 0;
      const viewport = document.getElementById('slideViewport');
      const container = document.getElementById('slideContainer');
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      const counter = document.getElementById('slideCounter');
      
      function getAspectRatio() { const parts = aspectRatio.split(':').map(Number); return parts[0] / parts[1]; }
      function resizeViewport() {
        const ratio = getAspectRatio();
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const containerRatio = containerWidth / containerHeight;
        let width, height;
        if (containerRatio > ratio) { height = containerHeight; width = height * ratio; }
        else { width = containerWidth; height = width / ratio; }
        viewport.style.width = width + 'px';
        viewport.style.height = height + 'px';
      }
      
      function parseInlineMarkdown(text) {
        return text.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>').replace(/\\*(.+?)\\*/g, '<em>$1</em>').replace(/\`(.+?)\`/g, '<code>$1</code>');
      }
      
      function renderSlide(slide, index) {
        const slideEl = document.createElement('div');
        slideEl.className = 'slide slide-' + slide.type;
        slideEl.dataset.index = index;
        
        if (slide.type === 'title') {
          slideEl.innerHTML = '<div class="title-content"><h1>' + parseInlineMarkdown(slide.heading) + '</h1>' + (slide.subheading ? '<h2>' + parseInlineMarkdown(slide.subheading) + '</h2>' : '') + '</div>';
        } else if (slide.type === 'section') {
          slideEl.innerHTML = '<h1>' + parseInlineMarkdown(slide.heading) + '</h1>' + (slide.subheading ? '<h2>' + parseInlineMarkdown(slide.subheading) + '</h2>' : '');
        } else {
          let contentHtml = '';
          const hasMedia = slide.media && slide.media.src;
          for (const item of slide.content) {
            switch (item.type) {
              case 'h3': contentHtml += '<h3>' + parseInlineMarkdown(item.text) + '</h3>'; break;
              case 'paragraph': contentHtml += '<p>' + parseInlineMarkdown(item.text) + '</p>'; break;
              case 'bullet': contentHtml += '<li>' + parseInlineMarkdown(item.text) + '</li>'; break;
              case 'quote': contentHtml += '<blockquote>' + parseInlineMarkdown(item.text) + '</blockquote>'; break;
              case 'image': contentHtml += '<img src="' + item.src + '" alt="' + item.alt + '" style="max-width:100%;"/>'; break;
            }
          }
          contentHtml = contentHtml.replace(/(<li>.*?<\\/li>)+/g, '<ul>$&</ul>');
          
          if (hasMedia) {
            slideEl.classList.add('has-media');
            var mediaHtml = '';
            if (slide.media.type === 'image') {
              mediaHtml = '<div class="slide-media-column"><img src="' + slide.media.src + '" alt="Slide visual" /></div>';
            } else if (slide.media.type === 'iframe') {
              // For external URLs, add sandbox for security
              var isExternal = slide.media.src.startsWith('http://') || slide.media.src.startsWith('https://');
              var sandboxAttr = isExternal ? ' sandbox="allow-scripts allow-same-origin"' : '';
              mediaHtml = '<div class="slide-media-column"><iframe src="' + slide.media.src + '" title="Slide content"' + sandboxAttr + '></iframe></div>';
            }
            slideEl.innerHTML = '<div class="slide-header"><span class="section-title">' + sectionTitle + '</span></div><div class="slide-body"><div class="slide-text-column"><h1>' + parseInlineMarkdown(slide.heading) + '</h1>' + contentHtml + '</div>' + mediaHtml + '</div><div class="page-number">' + (index + 1) + '</div>';
          } else {
            slideEl.innerHTML = '<div class="slide-header"><span class="section-title">' + sectionTitle + '</span></div><div class="slide-body"><h1>' + parseInlineMarkdown(slide.heading) + '</h1>' + contentHtml + '</div><div class="page-number">' + (index + 1) + '</div>';
          }
        }
        return slideEl;
      }
      
      function renderSlides() {
        viewport.innerHTML = '';
        if (slides.length === 0) { viewport.innerHTML = '<div class="slide active" style="display:flex;align-items:center;justify-content:center;background:#151515;color:#fff;"><p>No slides to display</p></div>'; return; }
        slides.forEach((slide, index) => { const slideEl = renderSlide(slide, index); if (index === 0) slideEl.classList.add('active'); viewport.appendChild(slideEl); });
        updateCounter(); updateButtons();
      }
      
      function goToSlide(index) {
        if (index < 0 || index >= slides.length) return;
        viewport.querySelectorAll('.slide').forEach((el, i) => { el.classList.toggle('active', i === index); });
        currentSlide = index; updateCounter(); updateButtons();
      }
      function next() { goToSlide(currentSlide + 1); }
      function prev() { goToSlide(currentSlide - 1); }
      function updateCounter() { counter.textContent = (currentSlide + 1) + ' / ' + slides.length; }
      function updateButtons() { prevBtn.disabled = currentSlide === 0; nextBtn.disabled = currentSlide === slides.length - 1; }
      
      prevBtn.addEventListener('click', prev);
      nextBtn.addEventListener('click', next);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      });

      // Mouse wheel to navigate between slides
      let lastWheelTime = 0;
      document.addEventListener('wheel', (e) => {
        e.preventDefault();
        const now = Date.now();
        if (now - lastWheelTime < 250) return;
        lastWheelTime = now;
        if (e.deltaY > 0) next();
        else if (e.deltaY < 0) prev();
      }, { passive: false });
      
      window.addEventListener('resize', resizeViewport);
      resizeViewport();
      renderSlides();
    })();
  </script>
</body>
</html>`;
};
