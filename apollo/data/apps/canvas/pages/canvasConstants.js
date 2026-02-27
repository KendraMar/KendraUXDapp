// Node colors from JSON Canvas spec
export const NODE_COLORS = [
  { id: '1', name: 'Red', value: '#fb464c' },
  { id: '2', name: 'Orange', value: '#e9973f' },
  { id: '3', name: 'Yellow', value: '#e0de71' },
  { id: '4', name: 'Green', value: '#44cf6e' },
  { id: '5', name: 'Cyan', value: '#53dfdd' },
  { id: '6', name: 'Purple', value: '#a882ff' }
];

export const EDGE_COLORS = [
  { id: '1', name: 'Red', value: '#fb464c' },
  { id: '2', name: 'Orange', value: '#e9973f' },
  { id: '3', name: 'Yellow', value: '#e0de71' },
  { id: '4', name: 'Green', value: '#44cf6e' },
  { id: '5', name: 'Cyan', value: '#53dfdd' },
  { id: '6', name: 'Purple', value: '#a882ff' }
];

export const DEFAULT_NODE_WIDTH = 250;
export const DEFAULT_NODE_HEIGHT = 120;
export const DEFAULT_STICKY_WIDTH = 200;
export const DEFAULT_STICKY_HEIGHT = 200;
export const DEFAULT_DRAWING_STROKE_WIDTH = 2;
export const DEFAULT_DRAWING_COLOR = '#e0e0e0';
export const GRID_SIZE = 20;
export const SNAP_DISTANCE = 40; // Distance in canvas units to trigger snap
export const DRAWING_MIN_DISTANCE = 3; // Min distance between captured points

// Canvas background themes
export const CANVAS_THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark',
    canvasBg: '#1a1a1a',
    gridColor: 'rgba(255,255,255,0.03)',
    nodeTextColor: '#e0e0e0',
    nodeBg: '#252525',
    nodeBorder: '#444',
    statusBarBg: 'rgba(0,0,0,0.7)',
    statusBarText: '#888',
    edgeColor: '#666',
    sidebarBg: '#1e1e1e',
    sidebarBorder: '#333',
    editingTextColor: '#e0e0e0',
    editingCaretColor: '#0066cc',
    emojiButtonBg: '#2a2a2a',
    emojiButtonBorder: '#555',
    reactionBg: 'rgba(255,255,255,0.1)',
    reactionBorder: 'rgba(255,255,255,0.15)',
    reactionText: '#e0e0e0',
    linkColor: '#4da6ff',
    groupColorFallback: '#555',
    placeholderText: '#888'
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint',
    canvasBg: '#0a2e5c',
    gridColor: 'rgba(100,180,255,0.12)',
    nodeTextColor: '#c8ddf5',
    nodeBg: 'rgba(15,50,100,0.85)',
    nodeBorder: 'rgba(100,180,255,0.35)',
    statusBarBg: 'rgba(5,20,50,0.8)',
    statusBarText: 'rgba(150,190,230,0.7)',
    edgeColor: 'rgba(100,180,255,0.5)',
    sidebarBg: '#072348',
    sidebarBorder: 'rgba(100,180,255,0.2)',
    editingTextColor: '#c8ddf5',
    editingCaretColor: '#5ba3f5',
    emojiButtonBg: '#0f3a6e',
    emojiButtonBorder: 'rgba(100,180,255,0.3)',
    reactionBg: 'rgba(100,180,255,0.15)',
    reactionBorder: 'rgba(100,180,255,0.25)',
    reactionText: '#c8ddf5',
    linkColor: '#7bb8f5',
    groupColorFallback: 'rgba(100,180,255,0.4)',
    placeholderText: 'rgba(150,190,230,0.5)'
  },
  light: {
    id: 'light',
    name: 'Light',
    canvasBg: '#f5f5f5',
    gridColor: 'rgba(0,0,0,0.06)',
    nodeTextColor: '#1a1a1a',
    nodeBg: '#ffffff',
    nodeBorder: '#d0d0d0',
    statusBarBg: 'rgba(255,255,255,0.9)',
    statusBarText: '#666',
    edgeColor: '#999',
    sidebarBg: '#ffffff',
    sidebarBorder: '#e0e0e0',
    editingTextColor: '#1a1a1a',
    editingCaretColor: '#0066cc',
    emojiButtonBg: '#f0f0f0',
    emojiButtonBorder: '#ccc',
    reactionBg: 'rgba(0,0,0,0.06)',
    reactionBorder: 'rgba(0,0,0,0.1)',
    reactionText: '#333',
    linkColor: '#0066cc',
    groupColorFallback: '#aaa',
    placeholderText: '#999'
  },
  draft: {
    id: 'draft',
    name: 'Draft',
    canvasBg: '#f0e8d8',
    gridColor: 'rgba(160,140,100,0.12)',
    nodeTextColor: '#3a3225',
    nodeBg: 'rgba(245,238,222,0.9)',
    nodeBorder: 'rgba(160,140,100,0.4)',
    statusBarBg: 'rgba(60,50,35,0.75)',
    statusBarText: 'rgba(200,185,155,0.8)',
    edgeColor: 'rgba(120,105,75,0.6)',
    sidebarBg: '#e8ddc8',
    sidebarBorder: 'rgba(160,140,100,0.3)',
    editingTextColor: '#3a3225',
    editingCaretColor: '#8b7355',
    emojiButtonBg: '#ddd2bc',
    emojiButtonBorder: 'rgba(160,140,100,0.4)',
    reactionBg: 'rgba(160,140,100,0.15)',
    reactionBorder: 'rgba(160,140,100,0.25)',
    reactionText: '#3a3225',
    linkColor: '#6b5c45',
    groupColorFallback: 'rgba(160,140,100,0.5)',
    placeholderText: 'rgba(120,105,75,0.5)'
  },
  graph: {
    id: 'graph',
    name: 'Graph Paper',
    canvasBg: '#fafcfa',
    gridColor: 'rgba(80,160,80,0.12)',
    nodeTextColor: '#1a2a1a',
    nodeBg: 'rgba(255,255,255,0.95)',
    nodeBorder: 'rgba(80,160,80,0.35)',
    statusBarBg: 'rgba(240,248,240,0.9)',
    statusBarText: '#668866',
    edgeColor: 'rgba(80,160,80,0.5)',
    sidebarBg: '#f0f5f0',
    sidebarBorder: 'rgba(80,160,80,0.2)',
    editingTextColor: '#1a2a1a',
    editingCaretColor: '#4a8a4a',
    emojiButtonBg: '#e8f0e8',
    emojiButtonBorder: 'rgba(80,160,80,0.3)',
    reactionBg: 'rgba(80,160,80,0.1)',
    reactionBorder: 'rgba(80,160,80,0.2)',
    reactionText: '#2a3a2a',
    linkColor: '#3a7a3a',
    groupColorFallback: 'rgba(80,160,80,0.4)',
    placeholderText: 'rgba(80,130,80,0.5)'
  }
};

export const DEFAULT_CANVAS_THEME = 'dark';

// Grid style options
export const GRID_STYLES = {
  lines: {
    id: 'lines',
    name: 'Lines',
    description: 'Standard grid lines'
  },
  wide: {
    id: 'wide',
    name: 'Wide Lines',
    description: 'Wider spaced grid lines'
  },
  dots: {
    id: 'dots',
    name: 'Dots',
    description: 'Dot grid pattern'
  },
  cross: {
    id: 'cross',
    name: 'Crosses',
    description: 'Small cross markers'
  },
  none: {
    id: 'none',
    name: 'None',
    description: 'No background pattern'
  }
};

export const DEFAULT_GRID_STYLE = 'lines';

// Generate unique ID
export const generateId = () => Math.random().toString(36).substr(2, 16);

// Tool modes for the sidebar
export const TOOL_MODES = {
  SELECT: 'select',
  TEXT: 'text',
  STICKY: 'sticky',
  DRAW: 'draw',
  IMAGE: 'image',
  LINK: 'link',
  GROUP: 'group'
};

// Emoji data for the picker (no dependencies)
export const EMOJI_CATEGORIES = [
  {
    id: 'recent',
    name: 'Recently Used',
    emojis: [] // populated from localStorage
  },
  {
    id: 'smileys',
    name: 'Smileys',
    emojis: [
      { emoji: '😀', keywords: ['grinning', 'happy', 'smile'] },
      { emoji: '😃', keywords: ['smiley', 'happy'] },
      { emoji: '😄', keywords: ['smile', 'happy', 'laugh'] },
      { emoji: '😁', keywords: ['grin', 'happy'] },
      { emoji: '😅', keywords: ['sweat', 'smile', 'relief'] },
      { emoji: '😂', keywords: ['joy', 'laugh', 'tears'] },
      { emoji: '🤣', keywords: ['rofl', 'laugh'] },
      { emoji: '😊', keywords: ['blush', 'happy', 'smile'] },
      { emoji: '😇', keywords: ['innocent', 'angel', 'halo'] },
      { emoji: '🙂', keywords: ['slightly', 'smile'] },
      { emoji: '😉', keywords: ['wink'] },
      { emoji: '😍', keywords: ['heart', 'eyes', 'love'] },
      { emoji: '🥰', keywords: ['love', 'hearts', 'adore'] },
      { emoji: '😘', keywords: ['kiss', 'love'] },
      { emoji: '😎', keywords: ['cool', 'sunglasses'] },
      { emoji: '🤔', keywords: ['thinking', 'hmm', 'wonder'] },
      { emoji: '🤨', keywords: ['raised', 'eyebrow', 'skeptical'] },
      { emoji: '😐', keywords: ['neutral', 'blank'] },
      { emoji: '😑', keywords: ['expressionless'] },
      { emoji: '😶', keywords: ['mouthless', 'silent'] },
      { emoji: '🙄', keywords: ['eye', 'roll'] },
      { emoji: '😏', keywords: ['smirk'] },
      { emoji: '😮', keywords: ['open', 'mouth', 'surprised'] },
      { emoji: '😱', keywords: ['scream', 'shock', 'fear'] },
      { emoji: '😴', keywords: ['sleep', 'zzz'] },
      { emoji: '🤯', keywords: ['mind', 'blown', 'explode'] },
      { emoji: '🥳', keywords: ['party', 'celebrate'] },
      { emoji: '😬', keywords: ['grimace', 'awkward'] },
      { emoji: '🤗', keywords: ['hug', 'hugging'] },
      { emoji: '🫡', keywords: ['salute'] }
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures',
    emojis: [
      { emoji: '👍', keywords: ['thumbs', 'up', 'yes', 'good', 'like'] },
      { emoji: '👎', keywords: ['thumbs', 'down', 'no', 'bad', 'dislike'] },
      { emoji: '👏', keywords: ['clap', 'applause', 'bravo'] },
      { emoji: '🙌', keywords: ['raised', 'hands', 'hooray', 'celebration'] },
      { emoji: '🤝', keywords: ['handshake', 'deal', 'agree'] },
      { emoji: '✌️', keywords: ['peace', 'victory'] },
      { emoji: '🤞', keywords: ['crossed', 'fingers', 'luck'] },
      { emoji: '💪', keywords: ['muscle', 'strong', 'flex'] },
      { emoji: '👋', keywords: ['wave', 'hello', 'bye'] },
      { emoji: '🫶', keywords: ['heart', 'hands', 'love'] },
      { emoji: '👀', keywords: ['eyes', 'look', 'see'] },
      { emoji: '🧠', keywords: ['brain', 'smart', 'think'] },
      { emoji: '🙏', keywords: ['pray', 'please', 'thanks'] },
      { emoji: '✋', keywords: ['hand', 'stop', 'high five'] },
      { emoji: '🤙', keywords: ['call', 'shaka', 'hang loose'] },
      { emoji: '👆', keywords: ['point', 'up'] },
      { emoji: '👇', keywords: ['point', 'down'] },
      { emoji: '👉', keywords: ['point', 'right'] },
      { emoji: '👈', keywords: ['point', 'left'] },
      { emoji: '🫰', keywords: ['snap', 'fingers', 'money'] }
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts & Symbols',
    emojis: [
      { emoji: '❤️', keywords: ['red', 'heart', 'love'] },
      { emoji: '🧡', keywords: ['orange', 'heart'] },
      { emoji: '💛', keywords: ['yellow', 'heart'] },
      { emoji: '💚', keywords: ['green', 'heart'] },
      { emoji: '💙', keywords: ['blue', 'heart'] },
      { emoji: '💜', keywords: ['purple', 'heart'] },
      { emoji: '🖤', keywords: ['black', 'heart'] },
      { emoji: '🤍', keywords: ['white', 'heart'] },
      { emoji: '💯', keywords: ['hundred', 'perfect', 'score'] },
      { emoji: '🔥', keywords: ['fire', 'hot', 'lit'] },
      { emoji: '⭐', keywords: ['star', 'favorite'] },
      { emoji: '🌟', keywords: ['glowing', 'star', 'sparkle'] },
      { emoji: '✨', keywords: ['sparkles', 'magic', 'new'] },
      { emoji: '💡', keywords: ['lightbulb', 'idea'] },
      { emoji: '⚡', keywords: ['lightning', 'fast', 'zap'] },
      { emoji: '🎯', keywords: ['target', 'bullseye', 'goal'] },
      { emoji: '✅', keywords: ['check', 'done', 'yes', 'complete'] },
      { emoji: '❌', keywords: ['cross', 'no', 'wrong', 'delete'] },
      { emoji: '⚠️', keywords: ['warning', 'caution', 'alert'] },
      { emoji: '❓', keywords: ['question', 'what', 'ask'] },
      { emoji: '💬', keywords: ['speech', 'bubble', 'comment'] },
      { emoji: '📌', keywords: ['pin', 'pushpin', 'important'] },
      { emoji: '🏷️', keywords: ['tag', 'label'] },
      { emoji: '🔗', keywords: ['link', 'chain', 'connect'] },
      { emoji: '🚀', keywords: ['rocket', 'launch', 'fast', 'ship'] }
    ]
  },
  {
    id: 'objects',
    name: 'Objects',
    emojis: [
      { emoji: '📝', keywords: ['memo', 'note', 'write'] },
      { emoji: '📎', keywords: ['paperclip', 'attach'] },
      { emoji: '📁', keywords: ['folder', 'file'] },
      { emoji: '📊', keywords: ['chart', 'graph', 'data'] },
      { emoji: '📈', keywords: ['trending', 'up', 'growth'] },
      { emoji: '📉', keywords: ['trending', 'down', 'decline'] },
      { emoji: '🗓️', keywords: ['calendar', 'date', 'schedule'] },
      { emoji: '⏰', keywords: ['alarm', 'clock', 'time'] },
      { emoji: '🔔', keywords: ['bell', 'notification', 'alert'] },
      { emoji: '🔑', keywords: ['key', 'password', 'unlock'] },
      { emoji: '🔒', keywords: ['lock', 'secure', 'private'] },
      { emoji: '🔓', keywords: ['unlock', 'open'] },
      { emoji: '🛠️', keywords: ['tools', 'wrench', 'hammer', 'build'] },
      { emoji: '⚙️', keywords: ['gear', 'settings', 'config'] },
      { emoji: '🧪', keywords: ['test', 'tube', 'experiment'] },
      { emoji: '🎨', keywords: ['palette', 'art', 'design', 'color'] },
      { emoji: '💻', keywords: ['laptop', 'computer', 'code'] },
      { emoji: '📱', keywords: ['phone', 'mobile'] },
      { emoji: '🎉', keywords: ['party', 'celebrate', 'tada'] },
      { emoji: '🏆', keywords: ['trophy', 'winner', 'achievement'] }
    ]
  },
  {
    id: 'nature',
    name: 'Nature',
    emojis: [
      { emoji: '🌈', keywords: ['rainbow', 'colors'] },
      { emoji: '☀️', keywords: ['sun', 'sunny', 'bright'] },
      { emoji: '🌙', keywords: ['moon', 'night', 'crescent'] },
      { emoji: '⛅', keywords: ['cloud', 'sun', 'weather'] },
      { emoji: '🌊', keywords: ['wave', 'ocean', 'water'] },
      { emoji: '🌸', keywords: ['flower', 'cherry', 'blossom'] },
      { emoji: '🌿', keywords: ['herb', 'leaf', 'plant', 'nature'] },
      { emoji: '🌲', keywords: ['tree', 'evergreen', 'pine'] },
      { emoji: '🐛', keywords: ['bug', 'insect'] },
      { emoji: '🦋', keywords: ['butterfly'] },
      { emoji: '🐶', keywords: ['dog', 'puppy'] },
      { emoji: '🐱', keywords: ['cat', 'kitten'] },
      { emoji: '🦊', keywords: ['fox'] },
      { emoji: '🐻', keywords: ['bear'] },
      { emoji: '🦄', keywords: ['unicorn', 'magic'] }
    ]
  },
  {
    id: 'food',
    name: 'Food & Drink',
    emojis: [
      { emoji: '☕', keywords: ['coffee', 'hot', 'drink'] },
      { emoji: '🍕', keywords: ['pizza', 'food'] },
      { emoji: '🍔', keywords: ['burger', 'hamburger', 'food'] },
      { emoji: '🍩', keywords: ['donut', 'doughnut', 'sweet'] },
      { emoji: '🍰', keywords: ['cake', 'dessert', 'sweet'] },
      { emoji: '🧁', keywords: ['cupcake', 'sweet'] },
      { emoji: '🍺', keywords: ['beer', 'drink', 'cheers'] },
      { emoji: '🥂', keywords: ['champagne', 'cheers', 'toast'] },
      { emoji: '🍎', keywords: ['apple', 'red', 'fruit'] },
      { emoji: '🥑', keywords: ['avocado', 'fruit'] }
    ]
  }
];
