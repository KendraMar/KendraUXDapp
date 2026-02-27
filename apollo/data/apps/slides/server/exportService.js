const { getPuppeteer } = require('./screenshotService');

// Generate standalone HTML for export (all styles and scripts embedded)
function generateStandaloneHtml(slideDeck, slides) {
  const sectionTitle = slideDeck.title || 'Presentation';
  const aspectRatio = slideDeck.aspectRatio || '16:9';
  
  const parseInlineMarkdown = (text) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  };
  
  const renderSlide = (slide, index) => {
    if (slide.type === 'title') {
      return `
        <div class="slide slide-title" data-index="${index}">
          <div class="title-content">
            <h1>${parseInlineMarkdown(slide.heading || '')}</h1>
            ${slide.subheading ? `<h2>${parseInlineMarkdown(slide.subheading)}</h2>` : ''}
          </div>
        </div>`;
    } else if (slide.type === 'section') {
      return `
        <div class="slide slide-section" data-index="${index}">
          <h1>${parseInlineMarkdown(slide.heading || '')}</h1>
          ${slide.subheading ? `<h2>${parseInlineMarkdown(slide.subheading)}</h2>` : ''}
        </div>`;
    } else {
      let contentHtml = '';
      for (const item of (slide.content || [])) {
        switch (item.type) {
          case 'h3': contentHtml += `<h3>${parseInlineMarkdown(item.text)}</h3>`; break;
          case 'paragraph': contentHtml += `<p>${parseInlineMarkdown(item.text)}</p>`; break;
          case 'bullet': contentHtml += `<li>${parseInlineMarkdown(item.text)}</li>`; break;
          case 'quote': contentHtml += `<blockquote>${parseInlineMarkdown(item.text)}</blockquote>`; break;
          case 'image': contentHtml += `<img src="${item.src}" alt="${item.alt}" style="max-width:100%;"/>`; break;
        }
      }
      // Wrap consecutive li elements in ul
      contentHtml = contentHtml.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
      
      return `
        <div class="slide slide-content" data-index="${index}">
          <div class="slide-header"><span class="section-title">${sectionTitle}</span></div>
          <div class="slide-body">
            <h1>${parseInlineMarkdown(slide.heading || '')}</h1>
            ${contentHtml}
          </div>
          <div class="page-number">${index + 1}</div>
        </div>`;
    }
  };
  
  const slidesHtml = slides.map((slide, i) => renderSlide(slide, i)).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sectionTitle}</title>
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
    @media print {
      .nav-controls { display: none !important; }
      .slide-container { background: white; }
      .slide { page-break-after: always; position: relative; opacity: 1; visibility: visible; }
    }
  </style>
</head>
<body>
  <div class="slide-container" id="slideContainer">
    <div class="slide-viewport" id="slideViewport">
      ${slidesHtml}
    </div>
    <div class="nav-controls">
      <button class="nav-btn" id="prevBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
      <span class="slide-counter" id="slideCounter">1 / ${slides.length}</span>
      <button class="nav-btn" id="nextBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>
    </div>
  </div>
  <script>
    (function() {
      const slides = document.querySelectorAll('.slide');
      const totalSlides = slides.length;
      let currentSlide = 0;
      const viewport = document.getElementById('slideViewport');
      const container = document.getElementById('slideContainer');
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      const counter = document.getElementById('slideCounter');
      const aspectRatio = '${aspectRatio}';
      
      function getAspectRatio() { const parts = aspectRatio.split(':').map(Number); return parts[0] / parts[1]; }
      function resizeViewport() {
        const ratio = getAspectRatio();
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const containerRatio = containerWidth / containerHeight;
        let width, height;
        if (containerRatio > ratio) { height = containerHeight * 0.9; width = height * ratio; }
        else { width = containerWidth * 0.9; height = width / ratio; }
        viewport.style.width = width + 'px';
        viewport.style.height = height + 'px';
      }
      
      function goToSlide(index) {
        if (index < 0 || index >= totalSlides) return;
        slides.forEach((el, i) => { el.classList.toggle('active', i === index); });
        currentSlide = index;
        counter.textContent = (currentSlide + 1) + ' / ' + totalSlides;
        prevBtn.disabled = currentSlide === 0;
        nextBtn.disabled = currentSlide === totalSlides - 1;
      }
      function next() { goToSlide(currentSlide + 1); }
      function prev() { goToSlide(currentSlide - 1); }
      
      if (slides.length > 0) slides[0].classList.add('active');
      prevBtn.addEventListener('click', prev);
      nextBtn.addEventListener('click', next);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
        else if (e.key === 'f' || e.key === 'F') {
          if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); }
          else { document.exitFullscreen(); }
        }
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
      goToSlide(0);
    })();
  </script>
</body>
</html>`;
}

// Helper function to generate PDF-optimized HTML
function generatePdfHtml(slideDeck, slides, pageWidth, pageHeight) {
  const sectionTitle = slideDeck.title || 'Presentation';
  
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
          <div class="title-content">
            <h1>${parseInlineMarkdown(slide.heading || '')}</h1>
            ${slide.subheading ? `<h2>${parseInlineMarkdown(slide.subheading)}</h2>` : ''}
          </div>
        </div>`;
    } else if (slide.type === 'section') {
      return `
        <div class="slide slide-section">
          <h1>${parseInlineMarkdown(slide.heading || '')}</h1>
          ${slide.subheading ? `<h2>${parseInlineMarkdown(slide.subheading)}</h2>` : ''}
        </div>`;
    } else {
      let contentHtml = '';
      for (const item of (slide.content || [])) {
        switch (item.type) {
          case 'h3': contentHtml += `<h3>${parseInlineMarkdown(item.text)}</h3>`; break;
          case 'paragraph': contentHtml += `<p>${parseInlineMarkdown(item.text)}</p>`; break;
          case 'bullet': contentHtml += `<li>${parseInlineMarkdown(item.text)}</li>`; break;
          case 'quote': contentHtml += `<blockquote>${parseInlineMarkdown(item.text)}</blockquote>`; break;
          case 'image': contentHtml += `<img src="${item.src}" alt="${item.alt}" style="max-width:100%;"/>`; break;
        }
      }
      contentHtml = contentHtml.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
      
      return `
        <div class="slide slide-content">
          <div class="slide-header"><span class="section-title">${sectionTitle}</span></div>
          <div class="slide-body">
            <h1>${parseInlineMarkdown(slide.heading || '')}</h1>
            ${contentHtml}
          </div>
          <div class="page-number">${index + 1}</div>
        </div>`;
    }
  };
  
  const slidesHtml = slides.map((slide, i) => renderSlide(slide, i)).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700;900&family=Red+Hat+Text:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${pageWidth}px; margin: 0; padding: 0; font-family: 'Red Hat Text', sans-serif; }
    .slide { width: ${pageWidth}px; height: ${pageHeight}px; page-break-after: always; display: flex; flex-direction: column; overflow: hidden; }
    .slide:last-child { page-break-after: auto; }
    .slide.slide-title { background: #151515; color: #fff; }
    .slide.slide-title .title-content { padding: 8% 6%; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .slide.slide-title h1 { font-family: 'Red Hat Display', sans-serif; font-size: 43px; font-weight: 700; line-height: 1.1; margin-bottom: 0.5em; max-width: 70%; }
    .slide.slide-title h2 { font-family: 'Red Hat Text', sans-serif; font-size: 17px; font-weight: 400; color: rgba(255,255,255,0.7); }
    .slide.slide-content { background: #fff; color: #151515; }
    .slide.slide-content .slide-header { padding: 3% 5%; }
    .slide.slide-content .slide-header::before { content: ''; display: inline-block; width: 15px; height: 2px; background: #EE0000; margin-right: 6px; vertical-align: middle; }
    .slide.slide-content .slide-header .section-title { font-family: 'Red Hat Text', sans-serif; font-size: 10px; font-weight: 500; color: #EE0000; }
    .slide.slide-content .slide-body { flex: 1; padding: 0 5% 5%; }
    .slide.slide-content h1 { font-family: 'Red Hat Display', sans-serif; font-size: 34px; font-weight: 700; color: #151515; margin-bottom: 0.8em; line-height: 1.1; }
    .slide.slide-content h3 { font-family: 'Red Hat Display', sans-serif; font-size: 14px; font-weight: 600; color: #151515; margin: 1.2em 0 0.6em; }
    .slide.slide-content p { font-family: 'Red Hat Text', sans-serif; font-size: 13px; line-height: 1.6; color: #151515; margin-bottom: 0.8em; }
    .slide.slide-content ul { list-style: none; padding: 0; margin: 0.8em 0; }
    .slide.slide-content ul li { font-family: 'Red Hat Text', sans-serif; font-size: 13px; line-height: 1.6; padding-left: 1.5em; position: relative; margin-bottom: 0.5em; }
    .slide.slide-content ul li::before { content: ''; position: absolute; left: 0; top: 0.6em; width: 3px; height: 3px; background: #EE0000; border-radius: 50%; }
    .slide.slide-content blockquote { border-left: 2px solid #EE0000; padding-left: 1em; margin: 1em 0; font-style: italic; color: #6A6E73; font-size: 13px; }
    .slide.slide-section { background: linear-gradient(135deg, #151515 0%, #2a2a2a 100%); color: #fff; justify-content: center; align-items: center; text-align: center; }
    .slide.slide-section h1 { font-family: 'Red Hat Display', sans-serif; font-size: 48px; font-weight: 700; }
    .slide.slide-section h2 { font-family: 'Red Hat Text', sans-serif; font-size: 19px; font-weight: 400; color: rgba(255,255,255,0.7); margin-top: 0.5em; }
    .page-number { position: absolute; bottom: 3%; right: 5%; font-family: 'Red Hat Text', sans-serif; font-size: 10px; color: #6A6E73; }
  </style>
</head>
<body>
  ${slidesHtml}
</body>
</html>`;
}

// Helper function to generate single slide HTML for PNG export
function generateSingleSlideHtml(slideDeck, slide, index, pageWidth, pageHeight) {
  const sectionTitle = slideDeck.title || 'Presentation';
  
  const parseInlineMarkdown = (text) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  };
  
  let slideContent;
  if (slide.type === 'title') {
    slideContent = `
      <div class="slide slide-title">
        <div class="title-content">
          <h1>${parseInlineMarkdown(slide.heading || '')}</h1>
          ${slide.subheading ? `<h2>${parseInlineMarkdown(slide.subheading)}</h2>` : ''}
        </div>
      </div>`;
  } else if (slide.type === 'section') {
    slideContent = `
      <div class="slide slide-section">
        <h1>${parseInlineMarkdown(slide.heading || '')}</h1>
        ${slide.subheading ? `<h2>${parseInlineMarkdown(slide.subheading)}</h2>` : ''}
      </div>`;
  } else {
    let contentHtml = '';
    for (const item of (slide.content || [])) {
      switch (item.type) {
        case 'h3': contentHtml += `<h3>${parseInlineMarkdown(item.text)}</h3>`; break;
        case 'paragraph': contentHtml += `<p>${parseInlineMarkdown(item.text)}</p>`; break;
        case 'bullet': contentHtml += `<li>${parseInlineMarkdown(item.text)}</li>`; break;
        case 'quote': contentHtml += `<blockquote>${parseInlineMarkdown(item.text)}</blockquote>`; break;
        case 'image': contentHtml += `<img src="${item.src}" alt="${item.alt}" style="max-width:100%;"/>`; break;
      }
    }
    contentHtml = contentHtml.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
    
    slideContent = `
      <div class="slide slide-content">
        <div class="slide-header"><span class="section-title">${sectionTitle}</span></div>
        <div class="slide-body">
          <h1>${parseInlineMarkdown(slide.heading || '')}</h1>
          ${contentHtml}
        </div>
        <div class="page-number">${index + 1}</div>
      </div>`;
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700;900&family=Red+Hat+Text:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${pageWidth}px; height: ${pageHeight}px; margin: 0; padding: 0; font-family: 'Red Hat Text', sans-serif; overflow: hidden; }
    .slide { width: ${pageWidth}px; height: ${pageHeight}px; display: flex; flex-direction: column; overflow: hidden; position: relative; }
    .slide.slide-title { background: #151515; color: #fff; }
    .slide.slide-title .title-content { padding: 8% 6%; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .slide.slide-title h1 { font-family: 'Red Hat Display', sans-serif; font-size: 86px; font-weight: 700; line-height: 1.1; margin-bottom: 0.5em; max-width: 70%; }
    .slide.slide-title h2 { font-family: 'Red Hat Text', sans-serif; font-size: 34px; font-weight: 400; color: rgba(255,255,255,0.7); }
    .slide.slide-content { background: #fff; color: #151515; }
    .slide.slide-content .slide-header { padding: 3% 5%; }
    .slide.slide-content .slide-header::before { content: ''; display: inline-block; width: 30px; height: 2px; background: #EE0000; margin-right: 12px; vertical-align: middle; }
    .slide.slide-content .slide-header .section-title { font-family: 'Red Hat Text', sans-serif; font-size: 19px; font-weight: 500; color: #EE0000; }
    .slide.slide-content .slide-body { flex: 1; padding: 0 5% 5%; }
    .slide.slide-content h1 { font-family: 'Red Hat Display', sans-serif; font-size: 67px; font-weight: 700; color: #151515; margin-bottom: 0.8em; line-height: 1.1; }
    .slide.slide-content h3 { font-family: 'Red Hat Display', sans-serif; font-size: 27px; font-weight: 600; color: #151515; margin: 1.2em 0 0.6em; }
    .slide.slide-content p { font-family: 'Red Hat Text', sans-serif; font-size: 25px; line-height: 1.6; color: #151515; margin-bottom: 0.8em; }
    .slide.slide-content ul { list-style: none; padding: 0; margin: 0.8em 0; }
    .slide.slide-content ul li { font-family: 'Red Hat Text', sans-serif; font-size: 25px; line-height: 1.6; padding-left: 1.5em; position: relative; margin-bottom: 0.5em; }
    .slide.slide-content ul li::before { content: ''; position: absolute; left: 0; top: 0.6em; width: 6px; height: 6px; background: #EE0000; border-radius: 50%; }
    .slide.slide-content blockquote { border-left: 4px solid #EE0000; padding-left: 1em; margin: 1em 0; font-style: italic; color: #6A6E73; }
    .slide.slide-section { background: linear-gradient(135deg, #151515 0%, #2a2a2a 100%); color: #fff; justify-content: center; align-items: center; text-align: center; }
    .slide.slide-section h1 { font-family: 'Red Hat Display', sans-serif; font-size: 96px; font-weight: 700; }
    .slide.slide-section h2 { font-family: 'Red Hat Text', sans-serif; font-size: 38px; font-weight: 400; color: rgba(255,255,255,0.7); margin-top: 0.5em; }
    .page-number { position: absolute; bottom: 3%; right: 5%; font-family: 'Red Hat Text', sans-serif; font-size: 19px; color: #6A6E73; }
  </style>
</head>
<body>
  ${slideContent}
</body>
</html>`;
}

// Export to PDF using Puppeteer
async function exportToPdf(slideDeck, slides) {
  const puppeteer = await getPuppeteer();
  let browser = null;
  
  try {
    // Use standard dimensions for PDF compatibility
    // 10 inches wide at 96 DPI = 960px viewport, PDF will be 10x5.625 inches for 16:9
    const aspectRatio = slideDeck.aspectRatio || '16:9';
    const [w, h] = aspectRatio.split(':').map(Number);
    const pdfWidthInches = 10;
    const pdfHeightInches = pdfWidthInches / (w / h);
    const viewportWidth = 960;
    const viewportHeight = Math.round(viewportWidth / (w / h));
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: viewportWidth, height: viewportHeight });
    
    // Generate HTML with all slides visible for PDF
    const pdfHtml = generatePdfHtml(slideDeck, slides, viewportWidth, viewportHeight);
    await page.setContent(pdfHtml, { waitUntil: 'networkidle0' });
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    // Wait a bit more for fonts to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const pdfBuffer = await page.pdf({
      width: `${pdfWidthInches}in`,
      height: `${pdfHeightInches}in`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: false
    });
    
    await browser.close();
    browser = null;
    
    return pdfBuffer;
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

// Export individual slides as PNG images
async function exportToPng(slideDeck, slides) {
  const puppeteer = await getPuppeteer();
  let browser = null;
  
  try {
    const aspectRatio = slideDeck.aspectRatio || '16:9';
    const [w, h] = aspectRatio.split(':').map(Number);
    const pageWidth = 1920;
    const pageHeight = Math.round(pageWidth / (w / h));
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: pageWidth, height: pageHeight });
    
    const images = [];
    
    for (let i = 0; i < slides.length; i++) {
      const slideHtml = generateSingleSlideHtml(slideDeck, slides[i], i, pageWidth, pageHeight);
      await page.setContent(slideHtml, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);
      
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
        clip: { x: 0, y: 0, width: pageWidth, height: pageHeight }
      });
      
      images.push({
        index: i + 1,
        filename: `slide-${String(i + 1).padStart(3, '0')}.png`,
        data: screenshot.toString('base64')
      });
    }
    
    await browser.close();
    browser = null;
    
    return images;
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

module.exports = {
  generateStandaloneHtml,
  generatePdfHtml,
  generateSingleSlideHtml,
  exportToPdf,
  exportToPng
};
