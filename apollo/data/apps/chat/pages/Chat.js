import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  PageSection,
  Button,
  SearchInput,
  Switch,
  Tooltip
} from '@patternfly/react-core';
import {
  PlusCircleIcon,
  AngleRightIcon,
  OutlinedThumbsUpIcon,
  OutlinedThumbsDownIcon,
  OutlinedCopyIcon,
  PaperPlaneIcon,
  PaperclipIcon,
  MicrophoneIcon,
  CameraIcon,
  TimesIcon,
  CogIcon,
  BarsIcon,
  TrashIcon,
  OutlinedCommentsIcon,
  AngleDownIcon,
  CheckIcon,
  RedoIcon,
  EllipsisVIcon,
  SyncAltIcon
} from '@patternfly/react-icons';
import config from '../../../../data/config.json';

// Import avatar images
import userAvatar from '../../../../src/assets/avatar-user.svg';
import botAvatar from '../../../../src/assets/avatar-bot.svg';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Parse <think>…</think> blocks from AI response content */
const parseThinkBlocks = (content) => {
  if (!content || typeof content !== 'string') {
    return { thinkContent: null, mainContent: content || '' };
  }
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
  const thinkMatches = [];
  let match;
  while ((match = thinkRegex.exec(content)) !== null) {
    thinkMatches.push(match[1].trim());
  }
  const mainContent = content.replace(thinkRegex, '').trim();
  return {
    thinkContent: thinkMatches.length > 0 ? thinkMatches.join('\n\n') : null,
    mainContent: mainContent || '(No response content)'
  };
};

/** Markdown → HTML with rich formatting (code blocks with lang headers, lists, etc.) */
const renderMarkdown = (text) => {
  if (!text) return '';

  // Step 1: Extract fenced code blocks and replace with placeholders
  const codeBlocks = [];
  let processed = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const idx = codeBlocks.length;
    const langLabel = lang || '';
    const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    codeBlocks.push(
      `<div class="apollo-chat__code-block">` +
        (langLabel ? `<div class="apollo-chat__code-header"><span class="apollo-chat__code-lang">${langLabel}</span></div>` : '') +
        `<pre><code>${escapedCode}</code></pre>` +
      `</div>`
    );
    return `\n%%CODEBLOCK_${idx}%%\n`;
  });

  // Step 2: Inline code (protect from further processing)
  const inlineCodes = [];
  processed = processed.replace(/`([^`]+)`/g, (_match, code) => {
    const idx = inlineCodes.length;
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    inlineCodes.push(`<code class="apollo-chat__inline-code">${escaped}</code>`);
    return `%%INLINECODE_${idx}%%`;
  });

  // Step 3: Bold & italic
  processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Step 4: Links
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Step 5: Headings
  processed = processed.replace(/^#### (.+)$/gm, '<h5>$1</h5>');
  processed = processed.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  processed = processed.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  processed = processed.replace(/^# (.+)$/gm, '<h2>$1</h2>');

  // Step 6: Horizontal rules
  processed = processed.replace(/^---$/gm, '<hr/>');

  // Step 7: Blockquotes (merge consecutive lines)
  processed = processed.replace(/(^> .+$\n?)+/gm, (match) => {
    const inner = match.replace(/^> /gm, '').trim();
    return `<blockquote>${inner}</blockquote>`;
  });

  // Step 8: Lists — collect consecutive list items into <ul>/<ol>
  // Unordered
  processed = processed.replace(/(^[*-] .+$\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^[*-] /, '');
      return `<li>${content}</li>`;
    });
    return `<ul>${items.join('')}</ul>`;
  });
  // Ordered
  processed = processed.replace(/(^\d+\. .+$\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^\d+\. /, '');
      return `<li>${content}</li>`;
    });
    return `<ol>${items.join('')}</ol>`;
  });

  // Step 9: Paragraphs — split on double newlines
  const blocks = processed.split(/\n\n+/);
  let html = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    // Don't wrap block-level elements in <p>
    if (/^<(h[2-5]|ul|ol|blockquote|div|hr|pre)/.test(trimmed)) {
      return trimmed;
    }
    if (/^%%CODEBLOCK_\d+%%$/.test(trimmed)) {
      return trimmed;
    }
    // Convert single newlines to <br> within paragraphs
    return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  // Step 10: Restore code block and inline code placeholders
  codeBlocks.forEach((block, idx) => {
    html = html.replace(`%%CODEBLOCK_${idx}%%`, block);
  });
  inlineCodes.forEach((code, idx) => {
    html = html.replace(new RegExp(`%%INLINECODE_${idx}%%`, 'g'), code);
  });

  return html;
};

/** Format timestamp for display */
const formatTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/** Format date compactly for conversation list (e.g. "Jan 23" or "Jan 23, 2025") */
const formatConversationDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' })
  });
};

/** Group conversations by date */
const groupConversationsByDate = (conversations) => {
  const groups = {};
  // Use an array to track insertion order of group keys
  const groupOrder = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Start of this week (Sunday)
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());

  // Start of last week (Sunday before thisWeekStart)
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const addToGroup = (key, conv) => {
    if (!groups[key]) {
      groups[key] = [];
      groupOrder.push(key);
    }
    groups[key].push(conv);
  };

  conversations.forEach(conv => {
    const d = new Date(conv.createdAt || conv.updatedAt);
    if (d >= today) {
      addToGroup('Today', conv);
    } else if (d >= yesterday) {
      addToGroup('Yesterday', conv);
    } else if (d >= thisWeekStart) {
      addToGroup('This Week', conv);
    } else if (d >= lastWeekStart) {
      addToGroup('Last Week', conv);
    } else {
      // Group by month and year
      const monthKey = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      addToGroup(monthKey, conv);
    }
  });

  // Return as an ordered object (keys in insertion order)
  const ordered = {};
  groupOrder.forEach(key => { ordered[key] = groups[key]; });
  return ordered;
};

// Default preferences
const DEFAULT_PREFERENCES = {
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  systemMessage: 'You are a helpful AI assistant.',
  streamResponses: true,
  showThinkBlocks: true
};

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════

/** Collapsible think block */
const ThinkBlock = ({ content }) => {
  if (!content) return null;
  return (
    <details className="apollo-chat__think-block">
      <summary>
        <AngleRightIcon className="think-toggle-icon" />
        Show reasoning
      </summary>
      <div className="apollo-chat__think-block-content">
        {content}
      </div>
    </details>
  );
};

/** Streaming dots indicator */
const StreamingIndicator = () => (
  <div className="apollo-chat__streaming-indicator">
    <span className="apollo-chat__streaming-dot" />
    <span className="apollo-chat__streaming-dot" />
    <span className="apollo-chat__streaming-dot" />
  </div>
);

/** Single message bubble */
const ChatMessage = ({ message, onThumbsUp, onThumbsDown, onCopy, preferences }) => {
  const isUser = message.role === 'user';
  const isBot = message.role === 'bot' || message.role === 'assistant';
  const { thinkContent, mainContent } = isBot
    ? parseThinkBlocks(message.content)
    : { thinkContent: null, mainContent: message.content };

  const [feedback, setFeedback] = useState(message.feedback || null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopy) onCopy(message.id);
  };

  const handleThumbsUp = () => {
    const newFeedback = feedback === 'up' ? null : 'up';
    setFeedback(newFeedback);
    if (onThumbsUp) onThumbsUp(message.id, newFeedback);
  };

  const handleThumbsDown = () => {
    const newFeedback = feedback === 'down' ? null : 'down';
    setFeedback(newFeedback);
    if (onThumbsDown) onThumbsDown(message.id, newFeedback);
  };

  return (
    <div className={`apollo-chat__message apollo-chat__message--${isUser ? 'user' : 'assistant'}`}>
      <div className={`apollo-chat__message-avatar apollo-chat__message-avatar--${isUser ? 'user' : 'bot'}`}>
        {isUser ? (
          <img src={userAvatar} alt="You" />
        ) : (
          <img src={botAvatar} alt="AI" />
        )}
      </div>
      <div className="apollo-chat__message-body">
        <div className="apollo-chat__message-meta">
          <span className="apollo-chat__message-name">{isUser ? 'You' : (message.name || 'AI Assistant')}</span>
          <span>{formatTime(message.timestamp)}</span>
        </div>
        {isBot && preferences?.showThinkBlocks && thinkContent && (
          <ThinkBlock content={thinkContent} />
        )}
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="apollo-chat__message-attachments">
            {message.attachments.map((att, idx) => {
              const isImage = att.mimetype && att.mimetype.startsWith('image/');
              return isImage ? (
                <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="apollo-chat__message-attachment-img-link">
                  <img
                    src={att.url}
                    alt={att.originalName || att.filename}
                    className="apollo-chat__message-attachment-img"
                  />
                </a>
              ) : (
                <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="apollo-chat__message-attachment-file">
                  <PaperclipIcon />
                  <span>{att.originalName || att.filename}</span>
                </a>
              );
            })}
          </div>
        )}
        {message.isStreaming && !mainContent ? (
          <div className="apollo-chat__message-content apollo-chat__message--assistant">
            <StreamingIndicator />
          </div>
        ) : (
          <div
            className="apollo-chat__message-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(mainContent) }}
          />
        )}
        {isBot && !message.isStreaming && (
          <div className="apollo-chat__message-actions">
            <Tooltip content={feedback === 'up' ? 'Remove rating' : 'Good response'}>
              <button
                className={`apollo-chat__message-action-btn ${feedback === 'up' ? 'apollo-chat__message-action-btn--active-up' : ''}`}
                onClick={handleThumbsUp}
                aria-label="Good response"
              >
                <OutlinedThumbsUpIcon />
              </button>
            </Tooltip>
            <Tooltip content={feedback === 'down' ? 'Remove rating' : 'Bad response'}>
              <button
                className={`apollo-chat__message-action-btn ${feedback === 'down' ? 'apollo-chat__message-action-btn--active-down' : ''}`}
                onClick={handleThumbsDown}
                aria-label="Bad response"
              >
                <OutlinedThumbsDownIcon />
              </button>
            </Tooltip>
            <Tooltip content={copied ? 'Copied!' : 'Copy message'}>
              <button
                className="apollo-chat__message-action-btn"
                onClick={handleCopy}
                aria-label="Copy message"
              >
                {copied ? <CheckIcon /> : <OutlinedCopyIcon />}
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

/** Preferences panel (right side) */
const PreferencesPanel = ({ preferences, onChange, isOpen, onClose }) => {
  const handleChange = (key, value) => {
    onChange({ ...preferences, [key]: value });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_PREFERENCES });
  };

  return (
    <div className={`apollo-chat__preferences ${!isOpen ? 'apollo-chat__preferences--collapsed' : ''}`}>
      <div className="apollo-chat__preferences-header">
        <h3>Preferences</h3>
        <Button variant="plain" onClick={onClose} aria-label="Close preferences" size="sm">
          <TimesIcon />
        </Button>
      </div>
      <div className="apollo-chat__preferences-body">
        {/* System Message */}
        <div className="apollo-chat__pref-group">
          <div className="apollo-chat__pref-label">System Message</div>
          <textarea
            className="apollo-chat__pref-textarea"
            value={preferences.systemMessage}
            onChange={(e) => handleChange('systemMessage', e.target.value)}
            rows={4}
            placeholder="Enter a system message to set the AI's behavior..."
          />
          <div className="apollo-chat__pref-description">
            Instructions that define the AI's personality and behavior for this conversation.
          </div>
        </div>

        <div className="apollo-chat__pref-separator" />

        {/* Temperature */}
        <div className="apollo-chat__pref-group">
          <div className="apollo-chat__pref-label">
            Temperature
            <span className="apollo-chat__pref-label-value">{preferences.temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className="apollo-chat__pref-slider"
            min="0"
            max="2"
            step="0.01"
            value={preferences.temperature}
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
          />
          <div className="apollo-chat__pref-description">
            Controls randomness. Lower values make responses more focused and deterministic. Higher values make output more random and creative.
          </div>
        </div>

        {/* Max Tokens */}
        <div className="apollo-chat__pref-group">
          <div className="apollo-chat__pref-label">
            Max Tokens
            <span className="apollo-chat__pref-label-value">{preferences.maxTokens}</span>
          </div>
          <input
            type="range"
            className="apollo-chat__pref-slider"
            min="100"
            max="32000"
            step="100"
            value={preferences.maxTokens}
            onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
          />
          <div className="apollo-chat__pref-description">
            Maximum number of tokens the model can generate in its response.
          </div>
        </div>

        {/* Top P */}
        <div className="apollo-chat__pref-group">
          <div className="apollo-chat__pref-label">
            Top P
            <span className="apollo-chat__pref-label-value">{preferences.topP.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className="apollo-chat__pref-slider"
            min="0"
            max="1"
            step="0.01"
            value={preferences.topP}
            onChange={(e) => handleChange('topP', parseFloat(e.target.value))}
          />
          <div className="apollo-chat__pref-description">
            Nucleus sampling. Only consider tokens with cumulative probability above this threshold.
          </div>
        </div>

        {/* Frequency Penalty */}
        <div className="apollo-chat__pref-group">
          <div className="apollo-chat__pref-label">
            Frequency Penalty
            <span className="apollo-chat__pref-label-value">{preferences.frequencyPenalty.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className="apollo-chat__pref-slider"
            min="-2"
            max="2"
            step="0.01"
            value={preferences.frequencyPenalty}
            onChange={(e) => handleChange('frequencyPenalty', parseFloat(e.target.value))}
          />
          <div className="apollo-chat__pref-description">
            Penalizes tokens based on how frequently they appear in the text so far. Reduces repetition.
          </div>
        </div>

        {/* Presence Penalty */}
        <div className="apollo-chat__pref-group">
          <div className="apollo-chat__pref-label">
            Presence Penalty
            <span className="apollo-chat__pref-label-value">{preferences.presencePenalty.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className="apollo-chat__pref-slider"
            min="-2"
            max="2"
            step="0.01"
            value={preferences.presencePenalty}
            onChange={(e) => handleChange('presencePenalty', parseFloat(e.target.value))}
          />
          <div className="apollo-chat__pref-description">
            Penalizes tokens based on whether they have appeared at all. Encourages the model to discuss new topics.
          </div>
        </div>

        <div className="apollo-chat__pref-separator" />

        {/* Stream Responses Toggle */}
        <div className="apollo-chat__pref-group">
          <div className="apollo-chat__pref-toggle">
            <Switch
              id="stream-toggle"
              label="Stream responses"
              isChecked={preferences.streamResponses}
              onChange={(_event, checked) => handleChange('streamResponses', checked)}
            />
          </div>
          <div className="apollo-chat__pref-description">
            Show the response as it's generated token by token rather than all at once.
          </div>
        </div>

        {/* Show Think Blocks Toggle */}
        <div className="apollo-chat__pref-group">
          <div className="apollo-chat__pref-toggle">
            <Switch
              id="think-toggle"
              label="Show reasoning blocks"
              isChecked={preferences.showThinkBlocks}
              onChange={(_event, checked) => handleChange('showThinkBlocks', checked)}
            />
          </div>
          <div className="apollo-chat__pref-description">
            Show collapsible reasoning blocks from models that support chain-of-thought.
          </div>
        </div>

        <div className="apollo-chat__pref-separator" />

        {/* Reset to defaults */}
        <Button
          variant="secondary"
          className="apollo-chat__pref-reset-btn"
          onClick={handleReset}
          icon={<RedoIcon />}
          size="sm"
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Chat Component
// ═══════════════════════════════════════════════════════════════════════════

const Chat = () => {
  // ─── State ───────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Models & agents
  const [localModels, setLocalModels] = useState([]);
  const [ambientModels, setAmbientModels] = useState([]);
  const [claudeCodeModels, setClaudeCodeModels] = useState([]);
  const [cursorCliModels, setCursorCliModels] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearchFilter, setModelSearchFilter] = useState('');

  // Conversations
  const [conversationsList, setConversationsList] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationSearch, setConversationSearch] = useState('');
  const conversationSessionRef = useRef(null);

  // Cursor sync
  const [cursorSyncStatus, setCursorSyncStatus] = useState(null); // { available, alreadyImported, total }
  const [isSyncingCursor, setIsSyncingCursor] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Panels
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Preferences
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem('apollo-chat-preferences');
      return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : { ...DEFAULT_PREFERENCES };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  });

  // File attachments
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const modelDropdownRef = useRef(null);
  const scrollInstantlyRef = useRef(false);

  // ─── Persist preferences ────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('apollo-chat-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // ─── Auto-scroll to bottom ──────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const behavior = scrollInstantlyRef.current ? 'instant' : 'smooth';
      scrollInstantlyRef.current = false;
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ─── Close model dropdown on outside click ──────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Auto-resize textarea ──────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  // ─── Provider helpers ──────────────────────────────────────────────────
  const getProviderName = useCallback((modelId) => {
    if (!modelId) return 'unknown';
    if (claudeCodeModels.some(m => m.id === modelId)) return 'claude-code';
    if (cursorCliModels.some(m => m.id === modelId)) return 'cursor-cli';
    if (ambientModels.some(m => m.id === modelId)) return 'ambient';
    return 'local';
  }, [claudeCodeModels, cursorCliModels, ambientModels]);

  const isClaudeCodeModel = useCallback((modelId) => {
    return claudeCodeModels.some(m => m.id === modelId);
  }, [claudeCodeModels]);

  const isCursorCliModel = useCallback((modelId) => {
    return cursorCliModels.some(m => m.id === modelId);
  }, [cursorCliModels]);

  const getModelDisplayName = useCallback((modelId) => {
    if (!modelId) return 'Select a model';
    const ambient = ambientModels.find(m => m.id === modelId);
    if (ambient) return ambient.name;
    const claude = claudeCodeModels.find(m => m.id === modelId);
    if (claude) return claude.name;
    const cursor = cursorCliModels.find(m => m.id === modelId);
    if (cursor) return cursor.name;
    return modelId;
  }, [ambientModels, claudeCodeModels, cursorCliModels]);

  // ─── Fetch models & agents on mount ─────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [localRes, ambientRes, claudeRes, cursorRes, agentsRes] = await Promise.all([
          fetch('/api/chat/models').catch(() => ({ ok: false })),
          fetch('/api/ambient/models').catch(() => ({ ok: false })),
          fetch('/api/claudecode/models').catch(() => ({ ok: false })),
          fetch('/api/cursorcli/models').catch(() => ({ ok: false })),
          fetch('/api/agents').catch(() => ({ ok: false }))
        ]);

        if (localRes.ok) {
          const data = await localRes.json();
          if (data.success && data.models) {
            setLocalModels(data.models);
            if (data.currentModel) setSelectedModel(data.currentModel);
          }
        }
        if (ambientRes.ok) {
          const data = await ambientRes.json();
          if (data.success && data.models) setAmbientModels(data.models);
        }
        if (claudeRes.ok) {
          const data = await claudeRes.json();
          if (data.success && data.models) setClaudeCodeModels(data.models);
        }
        if (cursorRes.ok) {
          const data = await cursorRes.json();
          if (data.success && data.models) setCursorCliModels(data.models);
        }
        if (agentsRes.ok) {
          const data = await agentsRes.json();
          if (data.success && data.agents) setAgents(data.agents);
        }
      } catch (error) {
        console.error('Error fetching models/agents:', error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchAll();
  }, []);

  // ─── Fetch conversations from data/conversations/ ──────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations?limit=0');
      const data = await response.json();
      if (data.success && data.conversations) {
        setConversationsList(data.conversations);
        // Select the first one if we don't already have an active one
        if (!activeConversationId && data.conversations.length > 0) {
          const first = data.conversations[0];
          setActiveConversationId(first.id);
          // Load its messages
          const msgRes = await fetch(`/api/conversations/${first.id}`);
          const msgData = await msgRes.json();
          if (msgData.success && msgData.session) {
            scrollInstantlyRef.current = true;
            setMessages(msgData.session.messages || []);
            conversationSessionRef.current = first.id;
            // Restore model from conversation metadata
            if (msgData.session.metadata?.model) {
              setSelectedModel(msgData.session.metadata.model);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ─── Cursor sync ──────────────────────────────────────────────────────
  const checkCursorSync = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations/sync/cursor/status');
      const data = await response.json();
      if (data.success) {
        setCursorSyncStatus({
          available: data.available,
          stale: data.stale || 0,
          alreadyImported: data.alreadyImported,
          total: data.total
        });
      }
    } catch (error) {
      console.error('Error checking Cursor sync status:', error);
    }
  }, []);

  // Check for available Cursor conversations on mount
  useEffect(() => {
    checkCursorSync();
  }, [checkCursorSync]);

  const syncCursorConversations = useCallback(async () => {
    setIsSyncingCursor(true);
    setSyncResult(null);
    try {
      const response = await fetch('/api/conversations/sync/cursor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (data.success) {
        setSyncResult(data);
        // Refresh the conversations list
        loadConversations();
        // Refresh sync status
        checkCursorSync();
      } else {
        setSyncResult({ error: data.error || 'Sync failed' });
      }
    } catch (error) {
      console.error('Error syncing Cursor conversations:', error);
      setSyncResult({ error: error.message });
    } finally {
      setIsSyncingCursor(false);
      // Auto-dismiss result after 8 seconds
      setTimeout(() => setSyncResult(null), 8000);
    }
  }, [loadConversations, checkCursorSync]);

  // ─── Conversation CRUD ─────────────────────────────────────────────────
  const createNewConversation = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'chat',
          model: selectedModel || null,
          provider: getProviderName(selectedModel),
          title: 'New conversation',
          messages: [],
          settings: {
            temperature: preferences.temperature,
            max_tokens: preferences.maxTokens,
            top_p: preferences.topP,
            frequency_penalty: preferences.frequencyPenalty,
            presence_penalty: preferences.presencePenalty,
            system_message: preferences.systemMessage
          }
        })
      });
      const data = await response.json();
      if (data.success && data.session) {
        conversationSessionRef.current = data.session.id;
        setActiveConversationId(data.session.id);
        setMessages([]);
        // Add to the list
        setConversationsList(prev => [{
          id: data.session.id,
          ...data.session.metadata
        }, ...prev]);
        return data.session.id;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
    return null;
  }, [selectedModel, getProviderName, preferences]);

  const selectConversation = useCallback(async (convId) => {
    if (convId === activeConversationId) return;
    try {
      const response = await fetch(`/api/conversations/${convId}`);
      const data = await response.json();
      if (data.success && data.session) {
        setActiveConversationId(convId);
        conversationSessionRef.current = convId;
        scrollInstantlyRef.current = true;
        setMessages(data.session.messages || []);
        // Restore preferences from conversation settings if available
        if (data.session.metadata?.settings) {
          const s = data.session.metadata.settings;
          setPreferences(prev => ({
            ...prev,
            temperature: s.temperature ?? prev.temperature,
            maxTokens: s.max_tokens ?? prev.maxTokens,
            topP: s.top_p ?? prev.topP,
            frequencyPenalty: s.frequency_penalty ?? prev.frequencyPenalty,
            presencePenalty: s.presence_penalty ?? prev.presencePenalty,
            systemMessage: s.system_message ?? prev.systemMessage
          }));
        }
        // Restore model from conversation metadata
        if (data.session.metadata?.model) {
          setSelectedModel(data.session.metadata.model);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, [activeConversationId]);

  const deleteConversation = useCallback(async (convId) => {
    try {
      await fetch(`/api/conversations/${convId}`, { method: 'DELETE' });
      setConversationsList(prev => prev.filter(c => c.id !== convId));
      if (activeConversationId === convId) {
        // Switch to another conversation or create new
        const remaining = conversationsList.filter(c => c.id !== convId);
        if (remaining.length > 0) {
          await selectConversation(remaining[0].id);
        } else {
          await createNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, [activeConversationId, conversationsList, selectConversation, createNewConversation]);

  const updateConversationSession = useCallback(async (title, allMessages) => {
    if (!conversationSessionRef.current) return;
    try {
      await fetch(`/api/conversations/${conversationSessionRef.current}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          messages: allMessages,
          model: selectedModel,
          status: 'active',
          settings: {
            temperature: preferences.temperature,
            max_tokens: preferences.maxTokens,
            top_p: preferences.topP,
            frequency_penalty: preferences.frequencyPenalty,
            presence_penalty: preferences.presencePenalty,
            system_message: preferences.systemMessage
          }
        })
      });
      // Update local list metadata
      setConversationsList(prev => prev.map(c =>
        c.id === conversationSessionRef.current
          ? { ...c, title, model: selectedModel, messageCount: allMessages.length, updatedAt: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }, [selectedModel, preferences]);

  // ─── Send message ──────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text && attachedFiles.length === 0) return;
    if (!selectedModel) {
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Please select a model from the dropdown above before sending a message.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    // Create conversation if none exists
    if (!conversationSessionRef.current) {
      await createNewConversation();
    }

    // Upload attachments to server if any
    let uploadedAttachments = [];
    if (attachedFiles.length > 0) {
      // Ensure conversation exists before uploading
      let uploadConvId = conversationSessionRef.current;
      if (!uploadConvId) {
        uploadConvId = await createNewConversation();
        if (!uploadConvId) {
          console.error('Failed to create conversation for attachments');
          return;
        }
      }

      try {
        const formData = new FormData();
        attachedFiles.forEach(af => formData.append('files', af.file));

        const uploadRes = await fetch(`/api/conversations/${uploadConvId}/attachments`, {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.attachments) {
          uploadedAttachments = uploadData.attachments;
        }
      } catch (uploadErr) {
        console.error('Error uploading attachments:', uploadErr);
      }

      // Revoke preview URLs
      attachedFiles.forEach(af => {
        if (af.previewUrl) URL.revokeObjectURL(af.previewUrl);
      });
    }

    // Build user message
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setAttachedFiles([]);
    setIsLoading(true);

    // Update title based on first user message
    const newTitle = messages.filter(m => m.role === 'user').length === 0
      ? text.substring(0, 60) + (text.length > 60 ? '...' : '')
      : undefined;

    // Save user message
    const titleToUse = newTitle || conversationsList.find(c => c.id === activeConversationId)?.title || 'New conversation';
    updateConversationSession(titleToUse, newMessages);

    // Build API messages
    const apiMessages = [];
    if (preferences.systemMessage) {
      apiMessages.push({ role: 'system', content: preferences.systemMessage });
    }
    apiMessages.push(
      ...messages
        .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'bot')
        .map(m => ({
          role: m.role === 'bot' ? 'assistant' : m.role,
          content: m.content
        })),
      { role: 'user', content: text }
    );

    const botMessageId = `bot-${Date.now()}`;

    // Helper to read SSE stream
    const readStream = async (response, messagesBeforeBot) => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      const streamingMsg = {
        id: botMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true
      };
      setMessages([...messagesBeforeBot, streamingMsg]);
      setIsLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullResponse += data.text;
                setMessages(prev => prev.map(msg =>
                  msg.id === botMessageId
                    ? { ...msg, content: fullResponse }
                    : msg
                ));
              } else if (data.error) {
                fullResponse = `Error: ${data.error}`;
                setMessages(prev => prev.map(msg =>
                  msg.id === botMessageId
                    ? { ...msg, content: fullResponse, isStreaming: false }
                    : msg
                ));
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
      return fullResponse;
    };

    try {
      let aiResponse;

      if (isClaudeCodeModel(selectedModel)) {
        const response = await fetch('/api/claudecode/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: selectedModel,
            conversationId: activeConversationId
          })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }
        aiResponse = await readStream(response, newMessages);

      } else if (isCursorCliModel(selectedModel)) {
        // Use streaming endpoint for Cursor CLI models
        const response = await fetch('/api/cursorcli/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: selectedModel
          })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }
        aiResponse = await readStream(response, newMessages);

      } else {
        // Local / Ambient models (streaming)
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: selectedModel,
            temperature: preferences.temperature,
            max_tokens: preferences.maxTokens,
            top_p: preferences.topP,
            frequency_penalty: preferences.frequencyPenalty,
            presence_penalty: preferences.presencePenalty
          })
        });
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        if (preferences.streamResponses) {
          aiResponse = await readStream(response, newMessages);
        } else {
          // Non-streaming: read the entire response
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.text) fullText += data.text;
                } catch { /* skip */ }
              }
            }
          }
          aiResponse = fullText;
        }
      }

      if (!aiResponse) {
        aiResponse = 'Sorry, I could not generate a response.';
      }

      // Finalize bot message
      const finalBotMessage = {
        id: botMessageId,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...newMessages, finalBotMessage];
      setMessages(updatedMessages);

      // Save to conversation
      updateConversationSession(titleToUse, updatedMessages);

    } catch (error) {
      console.error('Error calling AI model:', error);
      let errorContent;
      if (isClaudeCodeModel(selectedModel)) {
        errorContent = `Error with Claude Code: ${error.message}`;
      } else if (isCursorCliModel(selectedModel)) {
        errorContent = `Error with Cursor CLI: ${error.message}`;
      } else {
        errorContent = `Error connecting to AI model at ${config.ai?.apiUrl || 'unknown'}. Please check that the model server is running.\n\n${error.message}`;
      }
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date().toISOString()
      };
      const messagesWithError = [...newMessages, errorMessage];
      setMessages(messagesWithError);
      updateConversationSession(titleToUse, messagesWithError);
    } finally {
      setIsLoading(false);
    }
  }, [
    inputValue, attachedFiles, selectedModel, messages, activeConversationId,
    preferences, conversationsList, isClaudeCodeModel, isCursorCliModel,
    createNewConversation, updateConversationSession
  ]);

  // ─── Keyboard shortcut for send ────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // ─── File attachment handlers ──────────────────────────────────────────
  const handleFileAttach = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageAttach = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  /** Add files to the attached list, generating preview URLs for images */
  const addFilesToAttachments = useCallback((files) => {
    const enriched = files.map(file => {
      const isImage = file.type && file.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(file) : null;
      return { file, previewUrl, name: file.name, type: file.type, size: file.size };
    });
    setAttachedFiles(prev => [...prev, ...enriched]);
  }, []);

  const handleFilesSelected = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    addFilesToAttachments(files);
    e.target.value = '';
  }, [addFilesToAttachments]);

  const removeAttachedFile = useCallback((index) => {
    setAttachedFiles(prev => {
      const removed = prev[index];
      // Revoke the object URL to free memory
      if (removed && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /** Handle paste events — capture pasted images from clipboard */
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          // Give pasted images a descriptive name
          const ext = file.type.split('/')[1] || 'png';
          const namedFile = new File([file], `pasted-image-${Date.now()}.${ext}`, { type: file.type });
          imageFiles.push(namedFile);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      addFilesToAttachments(imageFiles);
    }
  }, [addFilesToAttachments]);

  // ─── Model selection ───────────────────────────────────────────────────
  const handleModelSelect = useCallback((modelId) => {
    setSelectedModel(modelId);
    setShowModelDropdown(false);
    setModelSearchFilter('');
  }, []);

  // ─── Grouped conversations for sidebar ─────────────────────────────────
  const filteredConversations = useMemo(() => {
    let list = conversationsList;
    if (conversationSearch) {
      const q = conversationSearch.toLowerCase();
      list = list.filter(c => (c.title || '').toLowerCase().includes(q));
    }
    return groupConversationsByDate(list);
  }, [conversationsList, conversationSearch]);

  // ─── Welcome prompts ──────────────────────────────────────────────────
  const welcomePrompts = [
    'Explain quantum computing in simple terms',
    'Write a Python script to sort a list',
    'Help me brainstorm project ideas',
    'What are the best practices for REST APIs?'
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <PageSection
      isFilled
      className="apollo-chat-page-section"
    >
      <div className="apollo-chat">
        {/* ─── Left Sidebar: Conversation History ─────────────────────────── */}
        <div className={`apollo-chat__sidebar ${!sidebarOpen ? 'apollo-chat__sidebar--collapsed' : ''}`}>
          <div className="apollo-chat__sidebar-header">
            <h3>Conversations</h3>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              <Tooltip content={(() => {
                if (!cursorSyncStatus) return 'Sync Cursor conversations';
                const { available, stale } = cursorSyncStatus;
                const parts = [];
                if (available > 0) parts.push(`Import ${available} new`);
                if (stale > 0) parts.push(`update ${stale} changed`);
                if (parts.length > 0) return parts.join(', ') + ` conversation${(available + stale) !== 1 ? 's' : ''}`;
                return 'Sync Cursor conversations';
              })()}>
                <Button
                  variant="plain"
                  onClick={syncCursorConversations}
                  aria-label="Sync Cursor conversations"
                  size="sm"
                  isLoading={isSyncingCursor}
                  isDisabled={isSyncingCursor}
                  style={{ position: 'relative' }}
                >
                  <SyncAltIcon />
                  {cursorSyncStatus && (cursorSyncStatus.available + cursorSyncStatus.stale) > 0 && !isSyncingCursor && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'var(--pf-t--global--color--status--info--default)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '14px',
                      height: '14px',
                      fontSize: '10px',
                      lineHeight: '14px',
                      textAlign: 'center',
                      fontWeight: 600
                    }}>
                      {(() => {
                        const count = cursorSyncStatus.available + cursorSyncStatus.stale;
                        return count > 99 ? '99+' : count;
                      })()}
                    </span>
                  )}
                </Button>
              </Tooltip>
              <Tooltip content="New conversation">
                <Button variant="plain" onClick={createNewConversation} aria-label="New conversation" size="sm">
                  <PlusCircleIcon />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Cursor sync result banner */}
          {syncResult && (
            <div style={{
              padding: '8px 12px',
              margin: '0 8px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              background: syncResult.error
                ? 'var(--pf-t--global--color--status--danger--default)'
                : 'var(--pf-t--global--color--status--success--default)',
              color: '#fff'
            }}>
              {syncResult.error
                ? `Sync failed: ${syncResult.error}`
                : (() => {
                    const parts = [];
                    if (syncResult.imported > 0) parts.push(`Imported ${syncResult.imported}`);
                    if (syncResult.updated > 0) parts.push(`updated ${syncResult.updated}`);
                    if (parts.length === 0) parts.push('No new');
                    return parts.join(', ') + ` conversation${(syncResult.imported || 0) + (syncResult.updated || 0) !== 1 ? 's' : ''} from Cursor`;
                  })()
              }
              {syncResult.skipped > 0 && ` (${syncResult.skipped} skipped)`}
              {syncResult.failed > 0 && ` (${syncResult.failed} failed)`}
            </div>
          )}

          <div className="apollo-chat__sidebar-search">
            <SearchInput
              placeholder="Search conversations..."
              value={conversationSearch}
              onChange={(_event, value) => setConversationSearch(value)}
              onClear={() => setConversationSearch('')}
              aria-label="Search conversations"
            />
          </div>

          <div className="apollo-chat__sidebar-list">
            {isLoadingConversations ? (
              <div className="apollo-chat__empty-sidebar">
                <p>Loading conversations...</p>
              </div>
            ) : Object.keys(filteredConversations).length === 0 ? (
              <div className="apollo-chat__empty-sidebar">
                <OutlinedCommentsIcon style={{ fontSize: '2rem', opacity: 0.4 }} />
                <p>No conversations yet</p>
                <Button variant="link" onClick={createNewConversation} size="sm">
                  Start a new chat
                </Button>
              </div>
            ) : (
              Object.entries(filteredConversations).map(([group, convs]) => (
                <div key={group}>
                  <div className="apollo-chat__sidebar-group-label">{group}</div>
                  {convs.map(conv => (
                    <div
                      key={conv.id}
                      className={`apollo-chat__conversation-item ${conv.id === activeConversationId ? 'apollo-chat__conversation-item--active' : ''}`}
                      onClick={() => selectConversation(conv.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && selectConversation(conv.id)}
                    >
                      <div className="apollo-chat__conversation-item-content">
                        <div className="apollo-chat__conversation-item-title">
                          {conv.title || 'Untitled conversation'}
                        </div>
                        <div className="apollo-chat__conversation-item-meta">
                          {conv.createdAt && <span>{formatConversationDate(conv.createdAt)}</span>}
                          {conv.messageCount != null && <span> &middot; {conv.messageCount} msgs</span>}
                        </div>
                      </div>
                      <div className="apollo-chat__conversation-item-actions">
                        <Tooltip content="Delete">
                          <button
                            className="apollo-chat__message-action-btn"
                            onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                            aria-label="Delete conversation"
                          >
                            <TrashIcon />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── Center: Chat Area ──────────────────────────────────────────── */}
        <div className="apollo-chat__main">
          {/* Header */}
          <div className="apollo-chat__header">
            <div className="apollo-chat__header-left">
              <Tooltip content={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
                <Button
                  variant="plain"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label="Toggle sidebar"
                  size="sm"
                >
                  <BarsIcon />
                </Button>
              </Tooltip>

              {/* Model selector */}
              <div className="apollo-chat__model-selector" ref={modelDropdownRef}>
                <button
                  className="apollo-chat__model-selector-btn"
                  onClick={() => { setShowModelDropdown(!showModelDropdown); setModelSearchFilter(''); }}
                  aria-label="Select model"
                >
                  {isLoadingModels ? 'Loading models...' : getModelDisplayName(selectedModel)}
                  <AngleDownIcon style={{ width: 12, height: 12 }} />
                </button>

                {showModelDropdown && (() => {
                  const q = modelSearchFilter.toLowerCase();
                  const filteredLocal = localModels.filter(m => {
                    const id = m.id || m;
                    return !q || id.toLowerCase().includes(q);
                  });
                  const filteredAmbient = ambientModels.filter(m =>
                    !q || m.id.toLowerCase().includes(q) || (m.name || '').toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q)
                  );
                  const filteredClaude = claudeCodeModels.filter(m =>
                    !q || m.id.toLowerCase().includes(q) || (m.name || '').toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q)
                  );
                  const filteredCursor = cursorCliModels.filter(m =>
                    !q || m.id.toLowerCase().includes(q) || (m.name || '').toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q)
                  );
                  const filteredAgents = agents.filter(a =>
                    !q || a.id.toLowerCase().includes(q) || (a.name || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q)
                  );
                  const totalResults = filteredLocal.length + filteredAmbient.length + filteredClaude.length + filteredCursor.length + filteredAgents.length;
                  let groupIndex = 0;

                  return (
                  <div className="apollo-chat__model-dropdown">
                    {/* Search filter */}
                    <div className="apollo-chat__model-search">
                      <SearchInput
                        placeholder="Search models..."
                        value={modelSearchFilter}
                        onChange={(_event, value) => setModelSearchFilter(value)}
                        onClear={() => setModelSearchFilter('')}
                        aria-label="Filter models"
                      />
                    </div>

                    <div className="apollo-chat__model-dropdown-list">
                    {/* Local Models */}
                    {filteredLocal.length > 0 && (
                      <>
                        {groupIndex++ > 0 && <div className="apollo-chat__model-divider" />}
                        <div className="apollo-chat__model-group-label">Local Models</div>
                        {filteredLocal.map(model => {
                          const id = model.id || model;
                          return (
                            <button
                              key={id}
                              className={`apollo-chat__model-item ${selectedModel === id ? 'apollo-chat__model-item--selected' : ''}`}
                              onClick={() => handleModelSelect(id)}
                            >
                              <div>
                                <div className="apollo-chat__model-item-name">{id}</div>
                              </div>
                              {selectedModel === id && <CheckIcon style={{ marginLeft: 'auto', color: 'var(--pf-t--global--color--brand--default)' }} />}
                            </button>
                          );
                        })}
                      </>
                    )}

                    {/* Ambient AI Models */}
                    {filteredAmbient.length > 0 && (
                      <>
                        {groupIndex++ > 0 && <div className="apollo-chat__model-divider" />}
                        <div className="apollo-chat__model-group-label">Ambient AI</div>
                        {filteredAmbient.map(model => (
                          <button
                            key={model.id}
                            className={`apollo-chat__model-item ${selectedModel === model.id ? 'apollo-chat__model-item--selected' : ''}`}
                            onClick={() => handleModelSelect(model.id)}
                          >
                            <div>
                              <div className="apollo-chat__model-item-name">{model.name}</div>
                              {model.description && <div className="apollo-chat__model-item-desc">{model.description}</div>}
                            </div>
                            {selectedModel === model.id && <CheckIcon style={{ marginLeft: 'auto', color: 'var(--pf-t--global--color--brand--default)' }} />}
                          </button>
                        ))}
                      </>
                    )}

                    {/* Claude Code Models */}
                    {filteredClaude.length > 0 && (
                      <>
                        {groupIndex++ > 0 && <div className="apollo-chat__model-divider" />}
                        <div className="apollo-chat__model-group-label">Claude Code</div>
                        {filteredClaude.map(model => (
                          <button
                            key={model.id}
                            className={`apollo-chat__model-item ${selectedModel === model.id ? 'apollo-chat__model-item--selected' : ''}`}
                            onClick={() => handleModelSelect(model.id)}
                          >
                            <div>
                              <div className="apollo-chat__model-item-name">{model.name}</div>
                              {model.description && <div className="apollo-chat__model-item-desc">{model.description}</div>}
                            </div>
                            {selectedModel === model.id && <CheckIcon style={{ marginLeft: 'auto', color: 'var(--pf-t--global--color--brand--default)' }} />}
                          </button>
                        ))}
                      </>
                    )}

                    {/* Cursor CLI Models */}
                    {filteredCursor.length > 0 && (
                      <>
                        {groupIndex++ > 0 && <div className="apollo-chat__model-divider" />}
                        <div className="apollo-chat__model-group-label">Cursor CLI</div>
                        {filteredCursor.map(model => (
                          <button
                            key={model.id}
                            className={`apollo-chat__model-item ${selectedModel === model.id ? 'apollo-chat__model-item--selected' : ''}`}
                            onClick={() => handleModelSelect(model.id)}
                          >
                            <div>
                              <div className="apollo-chat__model-item-name">{model.name}</div>
                              {model.description && <div className="apollo-chat__model-item-desc">{model.description}</div>}
                            </div>
                            {selectedModel === model.id && <CheckIcon style={{ marginLeft: 'auto', color: 'var(--pf-t--global--color--brand--default)' }} />}
                          </button>
                        ))}
                      </>
                    )}

                    {/* Agents section */}
                    {filteredAgents.length > 0 && (
                      <>
                        {groupIndex++ > 0 && <div className="apollo-chat__model-divider" />}
                        <div className="apollo-chat__model-group-label">Agents</div>
                        {filteredAgents.map(agent => (
                          <button
                            key={agent.id}
                            className="apollo-chat__model-item"
                            onClick={() => {
                              setShowModelDropdown(false);
                              setModelSearchFilter('');
                            }}
                          >
                            <div>
                              <div className="apollo-chat__model-item-name">{agent.name || agent.id}</div>
                              {agent.description && <div className="apollo-chat__model-item-desc">{agent.description}</div>}
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    {/* No results */}
                    {totalResults === 0 && (
                      <div style={{ padding: '12px', textAlign: 'center', color: 'var(--pf-t--global--text--color--subtle)', fontSize: '0.8125rem' }}>
                        {q ? `No models matching "${modelSearchFilter}"` : 'No models available. Check your AI configuration.'}
                      </div>
                    )}
                    </div>
                  </div>
                  );
                })()}
              </div>
            </div>

            <div className="apollo-chat__header-right">
              <Tooltip content={preferencesOpen ? 'Hide preferences' : 'Show preferences'}>
                <Button
                  variant="plain"
                  onClick={() => setPreferencesOpen(!preferencesOpen)}
                  aria-label="Toggle preferences"
                  size="sm"
                >
                  <CogIcon />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Messages */}
          <div className="apollo-chat__messages">
            {messages.length === 0 ? (
              <div className="apollo-chat__welcome">
                <div className="apollo-chat__welcome-icon">
                  <OutlinedCommentsIcon />
                </div>
                <h2>Apollo AI Chat</h2>
                <p>
                  {selectedModel
                    ? `Connected to ${getModelDisplayName(selectedModel)}. Ask me anything to get started.`
                    : 'Select a model from the dropdown above to get started.'}
                </p>
                <div className="apollo-chat__welcome-prompts">
                  {welcomePrompts.map((prompt, i) => (
                    <button
                      key={i}
                      className="apollo-chat__welcome-prompt"
                      onClick={() => {
                        setInputValue(prompt);
                        textareaRef.current?.focus();
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    preferences={preferences}
                    onThumbsUp={(id, fb) => console.log('Thumbs up:', id, fb)}
                    onThumbsDown={(id, fb) => console.log('Thumbs down:', id, fb)}
                    onCopy={(id) => console.log('Copied:', id)}
                  />
                ))}
                {isLoading && (
                  <div className="apollo-chat__message apollo-chat__message--assistant">
                    <div className="apollo-chat__message-avatar apollo-chat__message-avatar--bot">
                      <img src={botAvatar} alt="AI" />
                    </div>
                    <div className="apollo-chat__message-body">
                      <div className="apollo-chat__message-meta">
                        <span className="apollo-chat__message-name">AI Assistant</span>
                      </div>
                      <div className="apollo-chat__message-content">
                        <StreamingIndicator />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="apollo-chat__input-area">
            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
              <div className="apollo-chat__input-files">
                {attachedFiles.map((af, i) => (
                  <div key={i} className={`apollo-chat__input-file-chip ${af.previewUrl ? 'apollo-chat__input-file-chip--image' : ''}`}>
                    {af.previewUrl ? (
                      <img src={af.previewUrl} alt={af.name} className="apollo-chat__input-file-thumb" />
                    ) : (
                      <PaperclipIcon className="apollo-chat__input-file-icon" />
                    )}
                    <span className="apollo-chat__input-file-name">{af.name}</span>
                    <button onClick={() => removeAttachedFile(i)} aria-label={`Remove ${af.name}`}>
                      <TimesIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="apollo-chat__input-container">
              <div className="apollo-chat__input-attachments">
                <Tooltip content="Attach file">
                  <button
                    className="apollo-chat__input-attach-btn"
                    onClick={handleFileAttach}
                    aria-label="Attach file"
                  >
                    <PaperclipIcon />
                  </button>
                </Tooltip>
                <Tooltip content="Attach screenshot">
                  <button
                    className="apollo-chat__input-attach-btn"
                    onClick={handleImageAttach}
                    aria-label="Attach screenshot"
                  >
                    <CameraIcon />
                  </button>
                </Tooltip>
                <Tooltip content="Voice input">
                  <button
                    className="apollo-chat__input-attach-btn"
                    onClick={() => {/* TODO: implement voice recording */}}
                    aria-label="Voice input"
                  >
                    <MicrophoneIcon />
                  </button>
                </Tooltip>
              </div>

              <textarea
                ref={textareaRef}
                className="apollo-chat__textarea"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={selectedModel ? 'Type a message... (Enter to send, Shift+Enter for new line)' : 'Select a model to start chatting...'}
                rows={1}
                disabled={isLoading}
              />

              <Tooltip content="Send message">
                <button
                  className="apollo-chat__send-btn"
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
                  aria-label="Send message"
                >
                  <PaperPlaneIcon />
                </button>
              </Tooltip>
            </div>

            <div className="apollo-chat__footnote">
              AI responses are generated and may contain errors. Verify important information independently.
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,audio/*,.pdf,.txt,.md,.json,.csv,.doc,.docx,.xls,.xlsx,.zip"
              style={{ display: 'none' }}
              onChange={handleFilesSelected}
            />
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFilesSelected}
            />
          </div>
        </div>

        {/* ─── Right Panel: Preferences ───────────────────────────────────── */}
        <PreferencesPanel
          preferences={preferences}
          onChange={setPreferences}
          isOpen={preferencesOpen}
          onClose={() => setPreferencesOpen(false)}
        />
      </div>
    </PageSection>
  );
};

export default Chat;
