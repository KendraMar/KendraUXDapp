// Markdown imports
import { marked } from 'marked';
import TurndownService from 'turndown';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

// Configure turndown for HTML to markdown conversion
export const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

export { marked };
