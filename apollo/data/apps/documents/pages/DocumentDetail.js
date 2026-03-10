import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Content,
  Flex,
  FlexItem,
  Button,
  EmptyState,
  EmptyStateBody,
  Spinner,
  TextInput,
  Tooltip,
  Alert,
  AlertActionCloseButton,
  Label,
  Tabs,
  Tab,
  TabTitleText,
  Split,
  SplitItem,
  Badge
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  HistoryIcon,
  CheckCircleIcon,
  SyncAltIcon,
  SaveIcon,
  EditIcon,
  CodeIcon,
  ColumnsIcon,
  OutlinedCommentsIcon,
  CommentIcon
} from '@patternfly/react-icons';

// TipTap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

import EditorToolbar from './components/EditorToolbar';
import DocumentTags from './components/DocumentTags';
import RevisionModal from './components/RevisionModal';
import DiscussionsSidebar from './components/DiscussionsSidebar';
import CommentHighlight from './components/CommentHighlight';
import { marked, turndownService } from './utils';

// ---- Anchor resolution: word-boundary-aware matching ----

// Compute bigram (Sorensen-Dice) similarity between two strings (0..1).
function bigramSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;

  const bigramsA = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigramsA.set(bg, (bigramsA.get(bg) || 0) + 1);
  }

  const bigramsB = new Map();
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    bigramsB.set(bg, (bigramsB.get(bg) || 0) + 1);
  }

  let intersection = 0;
  for (const [bg, countA] of bigramsA) {
    intersection += Math.min(countA, bigramsB.get(bg) || 0);
  }

  const total = (a.length - 1) + (b.length - 1);
  return (2 * intersection) / total;
}

// Compute word-level overlap ratio (0..1): how many of the anchor words appear in the candidate.
function wordOverlap(candidate, anchorText) {
  const anchorWords = anchorText.toLowerCase().split(/\s+/).filter(Boolean);
  const candidateWords = candidate.toLowerCase().split(/\s+/).filter(Boolean);
  if (anchorWords.length === 0) return 0;

  // Count how many anchor words appear in the candidate (order-insensitive but preserving count)
  const candidateBag = new Map();
  for (const w of candidateWords) candidateBag.set(w, (candidateBag.get(w) || 0) + 1);

  let matched = 0;
  for (const w of anchorWords) {
    const count = candidateBag.get(w) || 0;
    if (count > 0) {
      matched++;
      candidateBag.set(w, count - 1);
    }
  }

  // Ratio: matched words / total anchor words, penalised if candidate has many extra words
  const recall = matched / anchorWords.length;
  const precision = candidateWords.length > 0 ? matched / candidateWords.length : 0;
  // F1-like harmonic mean
  if (recall + precision === 0) return 0;
  return (2 * recall * precision) / (recall + precision);
}

// Score context (prefix/suffix) similarity at a position
function scoreContext(fullText, matchStart, matchEnd, prefix, suffix) {
  let score = 0;
  if (prefix) {
    const before = fullText.substring(Math.max(0, matchStart - prefix.length), matchStart);
    score += bigramSimilarity(before, prefix);
  }
  if (suffix) {
    const after = fullText.substring(matchEnd, matchEnd + suffix.length);
    score += bigramSimilarity(after, suffix);
  }
  return score; // 0..2
}

// Find all word boundary positions in a string
function wordBoundaries(text) {
  const boundaries = [0];
  for (let i = 0; i < text.length; i++) {
    // A boundary is right after a whitespace-to-non-whitespace transition
    if (i > 0 && /\s/.test(text[i - 1]) && /\S/.test(text[i])) {
      boundaries.push(i);
    }
  }
  // Also add word-end positions (for end boundary)
  const ends = [text.length];
  for (let i = 0; i < text.length; i++) {
    if (/\S/.test(text[i]) && (i + 1 >= text.length || /\s/.test(text[i + 1]))) {
      ends.push(i + 1);
    }
  }
  return { starts: boundaries, ends: [...new Set(ends)].sort((a, b) => a - b) };
}

// Convert a plain-text offset range to ProseMirror positions
function plainTextToProseMirrorPos(doc, startOffset, endOffset) {
  let charCount = 0;
  let fromPos = null;
  let toPos = null;

  doc.descendants((node, pos) => {
    if (fromPos !== null && toPos !== null) return false;

    if (node.isText) {
      const nodeStart = charCount;
      const nodeEnd = charCount + node.text.length;

      if (fromPos === null && startOffset >= nodeStart && startOffset <= nodeEnd) {
        fromPos = pos + (startOffset - nodeStart);
      }
      if (toPos === null && endOffset >= nodeStart && endOffset <= nodeEnd) {
        toPos = pos + (endOffset - nodeStart);
      }

      charCount += node.text.length;
    } else if (node.isBlock && charCount > 0) {
      charCount += 1; // block separator in getText()
    }
  });

  if (fromPos !== null && toPos !== null && fromPos < toPos) {
    return { from: fromPos, to: toPos };
  }
  return null;
}

/**
 * Find the best location in the editor for a discussion anchor.
 *
 * Uses word-boundary-aware candidate generation so that the highlight always
 * snaps to whole words. Candidates are scored by a combination of:
 *   - Word overlap (do the same words appear?)
 *   - Bigram similarity (character-level fuzzy match)
 *   - Prefix/suffix context match (is the surrounding text correct?)
 *   - Proximity to the stored character offsets (minor tiebreaker)
 *
 * This handles: exact match, word deletion inside anchor, word insertion,
 * word replacement, and text shifting due to edits elsewhere.
 */
function findAnchorInEditor(editor, anchorText, prefix, suffix, startOffset, endOffset) {
  if (!editor || !anchorText) return null;

  const doc = editor.state.doc;
  const fullText = editor.getText();
  if (!fullText) return null;

  // --- Quick path: exact text match ---
  {
    let searchIdx = 0;
    let best = null;
    while (searchIdx < fullText.length) {
      const idx = fullText.indexOf(anchorText, searchIdx);
      if (idx === -1) break;

      const ctx = scoreContext(fullText, idx, idx + anchorText.length, prefix, suffix);
      const score = 100 + ctx; // exact match always scores very high
      if (!best || score > best.score) {
        best = { start: idx, end: idx + anchorText.length, score };
      }
      searchIdx = idx + 1;
    }
    if (best) {
      return plainTextToProseMirrorPos(doc, best.start, best.end);
    }
  }

  // --- Fuzzy path: word-boundary candidate search ---
  const anchorWords = anchorText.split(/\s+/).filter(Boolean);
  const anchorWordCount = anchorWords.length;
  if (anchorWordCount === 0) return null;

  // Get word boundaries from the document text
  const { starts: wordStarts, ends: wordEnds } = wordBoundaries(fullText);

  // Determine the search region: either near stored position or the full document
  let regionStart = 0;
  let regionEnd = fullText.length;
  const hasStoredPos = startOffset != null && endOffset != null && startOffset >= 0;

  // For efficiency, first search near the stored position, then expand if needed
  const searchPasses = [];
  if (hasStoredPos) {
    // Focused region: ±200 chars around stored position
    searchPasses.push({
      start: Math.max(0, startOffset - 200),
      end: Math.min(fullText.length, endOffset + 200),
      posBonus: 0.05 // tiny tiebreaker for proximity
    });
  }
  // Global fallback
  searchPasses.push({ start: 0, end: fullText.length, posBonus: 0 });

  let bestMatch = null;

  for (const pass of searchPasses) {
    // If we already have a strong match from a focused pass, skip global
    if (bestMatch && bestMatch.score > 0.7) break;

    // Filter word starts/ends within the search region
    const regionWordStarts = wordStarts.filter(s => s >= pass.start && s < pass.end);
    const regionWordEnds = wordEnds.filter(e => e > pass.start && e <= pass.end);

    // Try different numbers of words: same count, ±1, ±2 words
    const wordCounts = [
      anchorWordCount,
      Math.max(1, anchorWordCount - 1),
      anchorWordCount + 1,
      Math.max(1, anchorWordCount - 2),
      anchorWordCount + 2
    ];
    const uniqueCounts = [...new Set(wordCounts)];

    // Build a quick lookup from word-start position to its index in wordStarts
    const wordStartIndex = new Map();
    wordStarts.forEach((s, i) => wordStartIndex.set(s, i));

    for (const startIdx of regionWordStarts) {
      // For each word start position, try different span lengths (by word count)
      const startWordIdx = wordStartIndex.get(startIdx);
      if (startWordIdx == null) continue;

      for (const numWords of uniqueCounts) {
        // Find the end position: the end of the (startWordIdx + numWords - 1)th word
        const endWordIdx = startWordIdx + numWords - 1;
        if (endWordIdx >= wordStarts.length) continue;

        // The end of the last word in this span
        const lastWordStart = wordStarts[endWordIdx];
        // Find the word end for this last word
        const candidateEnd = wordEnds.find(e => e > lastWordStart) || fullText.length;
        const candidateStart = startIdx;

        if (candidateEnd <= candidateStart) continue;
        if (candidateEnd > pass.end + 50) continue; // allow slight overshoot

        const candidate = fullText.substring(candidateStart, candidateEnd);

        // Skip very dissimilar lengths (more than 2x difference)
        if (candidate.length > anchorText.length * 2.5 || candidate.length < anchorText.length * 0.3) continue;

        // Score this candidate
        const wordScore = wordOverlap(candidate, anchorText); // 0..1
        const charScore = bigramSimilarity(candidate, anchorText); // 0..1
        const ctxScore = scoreContext(fullText, candidateStart, candidateEnd, prefix, suffix); // 0..2

        // Combined score: word overlap matters most, character similarity second, context third
        const score = (wordScore * 0.45) + (charScore * 0.30) + (ctxScore * 0.20) + pass.posBonus;

        if (score > 0.35 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { start: candidateStart, end: candidateEnd, score };
        }
      }
    }
  }

  if (!bestMatch) return null;

  return plainTextToProseMirrorPos(doc, bestMatch.start, bestMatch.end);
}

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [saveMessage, setSaveMessage] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // View mode state
  const [activeTab, setActiveTab] = useState('rich'); // 'rich', 'markdown', 'split'
  const [markdown, setMarkdown] = useState('');
  const [hasMarkdownChanges, setHasMarkdownChanges] = useState(false);

  // Revision history state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [revisionContent, setRevisionContent] = useState(null);
  const [isRestoringRevision, setIsRestoringRevision] = useState(false);

  // Discussion state
  const [discussions, setDiscussions] = useState([]);
  const [discussionsPanelOpen, setDiscussionsPanelOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [selectionForComment, setSelectionForComment] = useState(null); // { text, prefix, suffix, from, to, rect }
  const [newCommentText, setNewCommentText] = useState('');
  const [isCreatingComment, setIsCreatingComment] = useState(false);

  // Auto-save refs
  const saveTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef('');
  const metadataSaveTimeoutRef = useRef(null);
  const markdownSaveTimeoutRef = useRef(null);
  const editorContainerRef = useRef(null);

  // Yjs document and provider
  const ydoc = useMemo(() => new Y.Doc(), []);
  const [provider, setProvider] = useState(null);

  // Generate rendered HTML from markdown for preview/split view
  const renderedHtml = useMemo(() => {
    try {
      return marked(markdown);
    } catch (err) {
      console.error('Markdown parsing error:', err);
      return '<p>Error rendering markdown</p>';
    }
  }, [markdown]);

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Disable built-in history, use Yjs
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      CommentHighlight,
    ],
    editorProps: {
      attributes: {
        class: 'document-editor-content',
      },
      handleClick: (view, pos, event) => {
        // Check if user clicked on a comment highlight
        const target = event.target;
        if (target && target.closest && target.closest('.comment-highlight')) {
          const highlightEl = target.closest('.comment-highlight');
          const threadId = highlightEl.getAttribute('data-thread-id');
          if (threadId) {
            setActiveThreadId(threadId);
            setDiscussionsPanelOpen(true);
            return true;
          }
        }
        return false;
      },
    },
  }, [ydoc]);

  // Fetch document data
  useEffect(() => {
    fetchDocument();
  }, [id]);

  // Set up WebSocket connection for collaboration (optional - for multi-user sync)
  useEffect(() => {
    if (!document) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname;
    const wsPort = process.env.NODE_ENV === 'development' ? '3001' : window.location.port;
    const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}`;

    const wsProvider = new WebsocketProvider(
      wsUrl,
      `documents-${id}`,
      ydoc,
      { connect: true }
    );

    wsProvider.on('status', ({ status }) => {
      console.log('WebSocket status:', status);
      setConnectionStatus(status);
    });

    wsProvider.on('sync', (isSynced) => {
      console.log('Document synced:', isSynced);
      if (isSynced) {
        setConnectionStatus('connected');
      }
    });

    setProvider(wsProvider);

    return () => {
      wsProvider.disconnect();
      wsProvider.destroy();
    };
  }, [document, id, ydoc]);

  // Initialize editor content and markdown from document
  useEffect(() => {
    if (document && editor) {
      // Initialize content if editor is empty and document has content
      if (editor.isEmpty && document.content) {
        console.log(`[DocumentSave] Initializing editor content from document (${document.content.length} chars)`);
        // Convert markdown to HTML for TipTap
        const htmlContent = marked(document.content);
        editor.commands.setContent(htmlContent);
        lastSavedContentRef.current = document.content;
        setMarkdown(document.content);
      } else if (!editor.isEmpty) {
        // Editor already has content, convert to markdown for sync
        const currentHtml = editor.getHTML();
        const currentMarkdown = turndownService.turndown(currentHtml);
        lastSavedContentRef.current = currentMarkdown;
        setMarkdown(currentMarkdown);
      }

      // Listen for editor content changes and trigger auto-save
      const handleEditorUpdate = ({ editor: updatedEditor }) => {
        const currentHtml = updatedEditor.getHTML();
        const currentMarkdown = turndownService.turndown(currentHtml);
        // Only save if content actually changed
        if (currentMarkdown !== lastSavedContentRef.current) {
          const charDiff = currentMarkdown.length - lastSavedContentRef.current.length;
          console.log(`[DocumentSave] Editor content updated - new length: ${currentMarkdown.length}, change: ${charDiff >= 0 ? '+' : ''}${charDiff} chars`);
          // Sync markdown state for split view
          setMarkdown(currentMarkdown);
          scheduleContentSave(currentMarkdown);
        }
      };

      editor.on('update', handleEditorUpdate);

      return () => {
        console.log(`[DocumentSave] Cleaning up editor update listener`);
        editor.off('update', handleEditorUpdate);
      };
    }
  }, [document, editor, scheduleContentSave]);

  // Handle markdown changes from raw editor or split view
  const handleMarkdownChange = useCallback((newMarkdown) => {
    setMarkdown(newMarkdown);
    setHasMarkdownChanges(true);
    
    // Debounced auto-save for markdown
    if (markdownSaveTimeoutRef.current) {
      clearTimeout(markdownSaveTimeoutRef.current);
    }
    markdownSaveTimeoutRef.current = setTimeout(() => {
      console.log(`[DocumentSave] Markdown auto-save timeout fired`);
      autoSaveDocument(title, tags, newMarkdown, false);
      setHasMarkdownChanges(false);
    }, 2000);
  }, [autoSaveDocument, title, tags]);

  // Sync markdown to TipTap when switching back to rich editor
  const syncMarkdownToEditor = useCallback(() => {
    if (editor && hasMarkdownChanges) {
      const htmlContent = marked(markdown);
      editor.commands.setContent(htmlContent);
      setHasMarkdownChanges(false);
    }
  }, [editor, markdown, hasMarkdownChanges]);

  // Handle tab change
  const handleTabChange = (tabKey) => {
    // If switching TO rich editor, sync markdown changes
    if (tabKey === 'rich' && activeTab !== 'rich') {
      syncMarkdownToEditor();
    }
    // If switching FROM rich editor, sync editor to markdown
    if (activeTab === 'rich' && tabKey !== 'rich' && editor) {
      const currentHtml = editor.getHTML();
      const currentMarkdown = turndownService.turndown(currentHtml);
      setMarkdown(currentMarkdown);
    }
    setActiveTab(tabKey);
  };

  // Keyboard shortcut for manual save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.log(`[DocumentSave] Keyboard shortcut Ctrl/Cmd+S detected`);
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleManualSave]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${id}`);
      const data = await response.json();
      if (data.success) {
        setDocument(data.document);
        setTitle(data.document.title || 'Untitled');
        setTags(data.document.tags || []);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to load document');
      setLoading(false);
    }
  };

  // ---- Discussion functions ----

  const fetchDiscussions = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${id}/discussions`);
      const data = await response.json();
      if (data.success) {
        setDiscussions(data.discussions);
      }
    } catch (err) {
      console.error('Error fetching discussions:', err);
    }
  }, [id]);

  // Fetch discussions when document loads
  useEffect(() => {
    if (document) {
      fetchDiscussions();
    }
  }, [document, fetchDiscussions]);

  // Apply comment highlights to the editor when discussions change
  const applyCommentHighlights = useCallback(() => {
    if (!editor || !discussions.length) return;

    // Get the plain text content from the editor
    const editorText = editor.getText();
    if (!editorText) return;

    // Remove all existing comment highlights first
    const { tr } = editor.state;
    const markType = editor.schema.marks.commentHighlight;
    if (!markType) return;

    // We need to build a transaction that removes old marks and adds new ones
    editor.chain().command(({ tr, state }) => {
      // Remove all existing commentHighlight marks
      state.doc.descendants((node, pos) => {
        if (node.isText) {
          node.marks.forEach(mark => {
            if (mark.type.name === 'commentHighlight') {
              tr.removeMark(pos, pos + node.nodeSize, markType);
            }
          });
        }
      });
      return true;
    }).run();

    // Now add highlights for open discussions
    discussions
      .filter(thread => thread.status !== 'resolved')
      .forEach(thread => {
        if (!thread.anchor?.text) return;

        const anchorText = thread.anchor.text;
        const matchPos = findAnchorInEditor(editor, anchorText, thread.anchor.prefix, thread.anchor.suffix, thread.anchor.startOffset, thread.anchor.endOffset);

        if (matchPos !== null) {
          editor.chain().command(({ tr }) => {
            tr.addMark(
              matchPos.from,
              matchPos.to,
              markType.create({ threadId: thread.id })
            );
            return true;
          }).run();
        }
      });
  }, [editor, discussions]);

  // Re-apply highlights when discussions or editor content changes
  useEffect(() => {
    if (editor && discussions.length > 0) {
      // Small delay to let the editor settle
      const timer = setTimeout(applyCommentHighlights, 500);
      return () => clearTimeout(timer);
    }
  }, [discussions, applyCommentHighlights]);

  // Detect text selection in the editor for adding comments
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = ({ editor: updatedEditor }) => {
      const { from, to, empty } = updatedEditor.state.selection;

      if (empty || to - from < 2) {
        // No meaningful selection
        if (!isCreatingComment) {
          setSelectionForComment(null);
        }
        return;
      }

      // Get the selected text
      const selectedText = updatedEditor.state.doc.textBetween(from, to, ' ');
      if (!selectedText.trim()) {
        if (!isCreatingComment) {
          setSelectionForComment(null);
        }
        return;
      }

      // Get surrounding context for anchor (use longer prefix/suffix for better matching)
      const fullText = updatedEditor.getText();
      const textBefore = updatedEditor.state.doc.textBetween(Math.max(0, from - 60), from, ' ');
      const textAfter = updatedEditor.state.doc.textBetween(to, Math.min(updatedEditor.state.doc.content.size, to + 60), ' ');

      // Compute plain-text character offsets for position-based anchoring
      let charCount = 0;
      let plainFrom = null;
      let plainTo = null;
      updatedEditor.state.doc.descendants((node, pos) => {
        if (plainFrom !== null && plainTo !== null) return false;
        if (node.isText) {
          const nodeStart = charCount;
          const nodeEnd = charCount + node.text.length;
          if (plainFrom === null && from >= pos && from <= pos + node.text.length) {
            plainFrom = nodeStart + (from - pos);
          }
          if (plainTo === null && to >= pos && to <= pos + node.text.length) {
            plainTo = nodeStart + (to - pos);
          }
          charCount += node.text.length;
        } else if (node.isBlock && charCount > 0) {
          charCount += 1;
        }
      });

      // Get the bounding rect of the selection for positioning the floating button
      const { view } = updatedEditor;
      const coords = view.coordsAtPos(from);
      const endCoords = view.coordsAtPos(to);
      const editorRect = view.dom.getBoundingClientRect();

      setSelectionForComment({
        text: selectedText,
        prefix: textBefore,
        suffix: textAfter,
        from,
        to,
        startOffset: plainFrom,
        endOffset: plainTo,
        rect: {
          top: coords.top - editorRect.top,
          left: endCoords.right - editorRect.left + 8,
          bottom: endCoords.bottom - editorRect.top
        }
      });
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, isCreatingComment]);

  const handleCreateDiscussion = async () => {
    if (!selectionForComment || !newCommentText.trim()) return;

    setIsCreatingComment(true);
    try {
      const response = await fetch(`/api/documents/${id}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anchor: {
            text: selectionForComment.text,
            prefix: selectionForComment.prefix,
            suffix: selectionForComment.suffix,
            startOffset: selectionForComment.startOffset,
            endOffset: selectionForComment.endOffset
          },
          content: newCommentText.trim(),
          author: 'You'
        })
      });
      const data = await response.json();
      if (data.success) {
        await fetchDiscussions();
        setActiveThreadId(data.thread.id);
        setDiscussionsPanelOpen(true);
        setNewCommentText('');
        setSelectionForComment(null);
        setIsCreatingComment(false);
        // Reapply highlights after a brief delay
        setTimeout(applyCommentHighlights, 300);
      }
    } catch (err) {
      console.error('Error creating discussion:', err);
      setIsCreatingComment(false);
    }
  };

  const handleResolveThread = async (threadId) => {
    try {
      await fetch(`/api/documents/${id}/discussions/${threadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      });
      await fetchDiscussions();
    } catch (err) {
      console.error('Error resolving thread:', err);
    }
  };

  const handleReopenThread = async (threadId) => {
    try {
      await fetch(`/api/documents/${id}/discussions/${threadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open' })
      });
      await fetchDiscussions();
    } catch (err) {
      console.error('Error reopening thread:', err);
    }
  };

  const handleDeleteThread = async (threadId) => {
    try {
      await fetch(`/api/documents/${id}/discussions/${threadId}`, {
        method: 'DELETE'
      });
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
      }
      await fetchDiscussions();
    } catch (err) {
      console.error('Error deleting thread:', err);
    }
  };

  const handleAddReply = async (threadId, content) => {
    try {
      await fetch(`/api/documents/${id}/discussions/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, author: 'You' })
      });
      await fetchDiscussions();
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const handleDeleteComment = async (threadId, commentId) => {
    try {
      await fetch(`/api/documents/${id}/discussions/${threadId}/comments/${commentId}`, {
        method: 'DELETE'
      });
      await fetchDiscussions();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Auto-save document (metadata and/or content)
  const autoSaveDocument = useCallback(async (newTitle, newTags, content = null, isManual = false) => {
    const saveType = isManual ? 'MANUAL' : 'AUTO';
    console.log(`[DocumentSave] ${saveType} save initiated for document ${id}`);
    console.log(`[DocumentSave] ${saveType} - Title: "${newTitle}", Tags: [${newTags.join(', ')}], Content length: ${content !== null ? content.length : 'unchanged'}`);
    
    setAutoSaveStatus('saving');
    const startTime = Date.now();
    
    try {
      const payload = { title: newTitle, tags: newTags };
      if (content !== null) {
        payload.content = content;
      }
      
      console.log(`[DocumentSave] ${saveType} - Sending PUT request to /api/documents/${id}`);
      
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (data.success) {
        console.log(`[DocumentSave] ${saveType} save SUCCESS in ${duration}ms`);
        console.log(`[DocumentSave] ${saveType} - Server saved at: ${data.savedAt || 'unknown'}`);
        setDocument(data.document);
        setLastSavedAt(new Date(data.savedAt || Date.now()));
        if (content !== null) {
          lastSavedContentRef.current = content;
        }
        setAutoSaveStatus('saved');
        
        // Show save message for manual saves
        if (isManual) {
          setSaveMessage({ type: 'success', text: 'Document saved successfully' });
          setTimeout(() => setSaveMessage(null), 3000);
        }
      } else {
        console.error(`[DocumentSave] ${saveType} save FAILED - Server returned error:`, data.error);
        setAutoSaveStatus('unsaved');
        if (isManual) {
          setSaveMessage({ type: 'danger', text: data.error || 'Failed to save document' });
        }
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`[DocumentSave] ${saveType} save ERROR after ${duration}ms:`, err);
      console.error(`[DocumentSave] ${saveType} - Error details:`, err.message, err.stack);
      setAutoSaveStatus('unsaved');
      if (isManual) {
        setSaveMessage({ type: 'danger', text: 'Failed to save document' });
      }
    }
  }, [id]);

  // Schedule content auto-save (debounced)
  const scheduleContentSave = useCallback((content) => {
    console.log(`[DocumentSave] Content changed - scheduling auto-save in 2000ms`);
    if (saveTimeoutRef.current) {
      console.log(`[DocumentSave] Clearing previous auto-save timeout`);
      clearTimeout(saveTimeoutRef.current);
    }
    setAutoSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => {
      console.log(`[DocumentSave] Auto-save timeout fired - executing save`);
      autoSaveDocument(title, tags, content, false);
    }, 2000);
  }, [autoSaveDocument, title, tags]);

  // Schedule metadata auto-save
  const scheduleMetadataSave = useCallback((newTitle, newTags) => {
    console.log(`[DocumentSave] Metadata changed - scheduling auto-save in 1500ms`);
    if (metadataSaveTimeoutRef.current) {
      console.log(`[DocumentSave] Clearing previous metadata save timeout`);
      clearTimeout(metadataSaveTimeoutRef.current);
    }
    metadataSaveTimeoutRef.current = setTimeout(() => {
      console.log(`[DocumentSave] Metadata auto-save timeout fired - executing save`);
      autoSaveDocument(newTitle, newTags, null, false);
    }, 1500);
  }, [autoSaveDocument]);

  // Manual save - immediately saves the current document state
  const handleManualSave = useCallback(() => {
    console.log(`[DocumentSave] Manual save triggered by user`);
    
    // Cancel any pending auto-saves
    if (saveTimeoutRef.current) {
      console.log(`[DocumentSave] Cancelling pending content auto-save`);
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (metadataSaveTimeoutRef.current) {
      console.log(`[DocumentSave] Cancelling pending metadata auto-save`);
      clearTimeout(metadataSaveTimeoutRef.current);
      metadataSaveTimeoutRef.current = null;
    }
    if (markdownSaveTimeoutRef.current) {
      console.log(`[DocumentSave] Cancelling pending markdown auto-save`);
      clearTimeout(markdownSaveTimeoutRef.current);
      markdownSaveTimeoutRef.current = null;
    }
    
    // Get current content as markdown
    let currentContent = '';
    if (activeTab === 'rich' && editor) {
      // Convert TipTap HTML to markdown
      const currentHtml = editor.getHTML();
      currentContent = turndownService.turndown(currentHtml);
      console.log(`[DocumentSave] Manual save - got markdown from editor: ${currentContent.length} chars`);
    } else {
      // Use markdown state directly
      currentContent = markdown;
      console.log(`[DocumentSave] Manual save - using markdown state: ${currentContent.length} chars`);
    }
    console.log(`[DocumentSave] Manual save - content preview: "${currentContent.substring(0, 100)}${currentContent.length > 100 ? '...' : ''}"`);
    
    // Save immediately with manual flag
    autoSaveDocument(title, tags, currentContent, true);
    setHasMarkdownChanges(false);
  }, [autoSaveDocument, title, tags, editor, activeTab, markdown]);

  const handleTitleChange = (value) => {
    setTitle(value);
    scheduleMetadataSave(value, tags);
  };

  const handleTagsChange = (newTags) => {
    setTags(newTags);
    scheduleMetadataSave(title, newTags);
  };

  // Fetch revision history
  const fetchRevisions = async () => {
    setRevisionsLoading(true);
    try {
      const response = await fetch(`/api/documents/${id}/revisions`);
      const data = await response.json();
      if (data.success) {
        setRevisions(data.revisions);
      }
    } catch (err) {
      console.error('Error fetching revisions:', err);
    } finally {
      setRevisionsLoading(false);
    }
  };

  // Fetch a specific revision's content
  const fetchRevisionContent = async (revisionId) => {
    try {
      const response = await fetch(`/api/documents/${id}/revisions/${revisionId}`);
      const data = await response.json();
      if (data.success) {
        setRevisionContent(data.revision);
      }
    } catch (err) {
      console.error('Error fetching revision content:', err);
    }
  };

  // Handle revision selection
  const handleRevisionSelect = (revisionId) => {
    setSelectedRevision(revisionId);
    fetchRevisionContent(revisionId);
  };

  // Restore a revision
  const handleRestoreRevision = async () => {
    if (!selectedRevision) return;
    
    setIsRestoringRevision(true);
    try {
      const response = await fetch(`/api/documents/${id}/revisions/${selectedRevision}/restore`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setSaveMessage({ type: 'success', text: 'Revision restored successfully' });
        setTimeout(() => setSaveMessage(null), 3000);
        setIsRevisionModalOpen(false);
        setSelectedRevision(null);
        setRevisionContent(null);
        // Reload the document
        fetchDocument();
      } else {
        setSaveMessage({ type: 'danger', text: data.error || 'Failed to restore revision' });
      }
    } catch (err) {
      console.error('Error restoring revision:', err);
      setSaveMessage({ type: 'danger', text: 'Failed to restore revision' });
    } finally {
      setIsRestoringRevision(false);
    }
  };

  // Create a manual snapshot
  const handleCreateSnapshot = async () => {
    try {
      const response = await fetch(`/api/documents/${id}/revisions`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        fetchRevisions();
        setSaveMessage({ type: 'success', text: 'Snapshot created' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error creating snapshot:', err);
    }
  };

  // Open revision modal
  const handleOpenRevisionHistory = () => {
    setIsRevisionModalOpen(true);
    fetchRevisions();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (metadataSaveTimeoutRef.current) {
        clearTimeout(metadataSaveTimeoutRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (markdownSaveTimeoutRef.current) {
        clearTimeout(markdownSaveTimeoutRef.current);
      }
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading document...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error || !document) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <Title headingLevel="h2" size="lg">Document Not Found</Title>
          <EmptyStateBody>{error || 'The document could not be found.'}</EmptyStateBody>
          <Button variant="primary" onClick={() => navigate('/documents')}>
            Back to Documents
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  const openDiscussionCount = discussions.filter(t => t.status !== 'resolved').length;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden' 
    }}>
      {/* Header */}
      <PageSection variant="light" style={{ flexShrink: 0, paddingBottom: '0.5rem' }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Button variant="plain" onClick={() => navigate('/documents')}>
              <ArrowLeftIcon />
            </Button>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <TextInput
              type="text"
              aria-label="Document title"
              value={title}
              onChange={(e, value) => handleTitleChange(value)}
              style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                border: 'none',
                background: 'transparent',
                padding: 0,
                width: '100%'
              }}
            />
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              {/* Auto-save Status */}
              <FlexItem>
                <Tooltip content={
                  autoSaveStatus === 'saved' 
                    ? `Auto-saved${lastSavedAt ? ` at ${lastSavedAt.toLocaleTimeString()}` : ''}`
                    : autoSaveStatus === 'saving' 
                    ? 'Saving changes...'
                    : 'Unsaved changes'
                }>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    color: autoSaveStatus === 'saved' 
                      ? 'var(--pf-v6-global--success-color--100)' 
                      : 'var(--pf-v6-global--Color--200)',
                    fontSize: '0.875rem'
                  }}>
                    {autoSaveStatus === 'saving' ? (
                      <>
                        <Spinner size="sm" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon />
                        <span>Saved</span>
                      </>
                    )}
                  </span>
                </Tooltip>
              </FlexItem>

              {/* Connection Status */}
              <FlexItem>
                <Tooltip content={
                  connectionStatus === 'connected' ? 'Connected - Changes sync in real-time' :
                  connectionStatus === 'connecting' ? 'Connecting...' :
                  'Disconnected - Changes will sync when reconnected'
                }>
                  <Label
                    color={connectionStatus === 'connected' ? 'green' : connectionStatus === 'connecting' ? 'orange' : 'red'}
                    icon={<SyncAltIcon />}
                    isCompact
                  >
                    {connectionStatus === 'connected' ? 'Synced' : 
                     connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
                  </Label>
                </Tooltip>
              </FlexItem>

              {/* Manual Save Button */}
              <FlexItem>
                <Tooltip content="Save document now (Ctrl+S)">
                  <Button
                    variant="primary"
                    icon={<SaveIcon />}
                    onClick={handleManualSave}
                    isDisabled={autoSaveStatus === 'saving'}
                  >
                    Save
                  </Button>
                </Tooltip>
              </FlexItem>

              {/* Revision History Button */}
              <FlexItem>
                <Button
                  variant="secondary"
                  icon={<HistoryIcon />}
                  onClick={handleOpenRevisionHistory}
                >
                  History
                </Button>
              </FlexItem>

              {/* Discussions Toggle Button */}
              <FlexItem>
                <Tooltip content={discussionsPanelOpen ? 'Close discussions' : 'Open discussions'}>
                  <Button
                    variant={discussionsPanelOpen ? 'primary' : 'secondary'}
                    icon={<OutlinedCommentsIcon />}
                    onClick={() => setDiscussionsPanelOpen(!discussionsPanelOpen)}
                    style={{ position: 'relative' }}
                  >
                    Discuss
                    {openDiscussionCount > 0 && (
                      <Badge
                        isRead={false}
                        style={{
                          marginLeft: '6px'
                        }}
                      >
                        {openDiscussionCount}
                      </Badge>
                    )}
                  </Button>
                </Tooltip>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Tags Section */}
      <PageSection variant="light" style={{ flexShrink: 0, paddingTop: 0, paddingBottom: '0.5rem' }}>
        <DocumentTags tags={tags} onTagsChange={handleTagsChange} />
        <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.5rem' }}>
          Created {formatDate(document.created)} • Last modified {formatDate(document.modified)}
        </Content>
      </PageSection>

      {/* Save Alert */}
      {saveMessage && (
        <PageSection style={{ flexShrink: 0, paddingTop: 0, paddingBottom: 0 }}>
          <Alert
            variant={saveMessage.type}
            isInline
            title={saveMessage.text}
            actionClose={<AlertActionCloseButton onClose={() => setSaveMessage(null)} />}
          />
        </PageSection>
      )}

      {/* View Mode Tabs */}
      <PageSection variant="light" style={{ flexShrink: 0, paddingTop: 0, paddingBottom: 0 }}>
        <Tabs activeKey={activeTab} onSelect={(e, k) => handleTabChange(k)}>
          <Tab eventKey="rich" title={<TabTitleText><EditIcon /> Rich Editor</TabTitleText>} />
          <Tab eventKey="markdown" title={<TabTitleText><CodeIcon /> Raw Markdown</TabTitleText>} />
          <Tab eventKey="split" title={<TabTitleText><ColumnsIcon /> Split View</TabTitleText>} />
        </Tabs>
      </PageSection>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
        {/* Main editor area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Rich Editor Mode */}
        {activeTab === 'rich' && (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            margin: '1rem',
            border: '1px solid var(--pf-v6-global--BorderColor--100)',
            borderRadius: '8px',
            background: 'var(--pf-v6-global--BackgroundColor--100)',
            position: 'relative'
          }}>
            <EditorToolbar editor={editor} />
            <div
              ref={editorContainerRef}
              style={{ 
                flex: 1, 
                overflow: 'auto',
                padding: '1.5rem',
                position: 'relative'
              }}
            >
              <EditorContent 
                editor={editor} 
                style={{
                  minHeight: '100%'
                }}
              />

              {/* Floating "Add Comment" button when text is selected */}
              {selectionForComment && !isCreatingComment && activeTab === 'rich' && (
                <div style={{
                  position: 'absolute',
                  top: `${selectionForComment.rect.top}px`,
                  left: `${Math.min(selectionForComment.rect.left, 50)}px`,
                  transform: 'translateX(calc(100%))',
                  zIndex: 100
                }}>
                  <Tooltip content="Start a discussion on this text">
                    <Button
                      variant="primary"
                      isSmall
                      icon={<CommentIcon />}
                      onClick={() => setIsCreatingComment(true)}
                      style={{
                        borderRadius: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        padding: '4px 12px',
                        fontSize: '12px'
                      }}
                    >
                      Comment
                    </Button>
                  </Tooltip>
                </div>
              )}

              {/* New comment creation popover */}
              {isCreatingComment && selectionForComment && (
                <div style={{
                  position: 'absolute',
                  top: `${selectionForComment.rect.top}px`,
                  right: '0',
                  width: '300px',
                  zIndex: 200,
                  background: 'var(--pf-v6-global--BackgroundColor--100)',
                  border: '1px solid var(--pf-v6-global--BorderColor--100)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  padding: '0.75rem'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--pf-v6-global--Color--200)',
                    fontStyle: 'italic',
                    padding: '4px 8px',
                    background: 'var(--pf-v6-global--BackgroundColor--200)',
                    borderRadius: '4px',
                    borderLeft: '3px solid var(--pf-v6-global--primary-color--100)',
                    marginBottom: '0.5rem',
                    maxHeight: '3em',
                    overflow: 'hidden'
                  }}>
                    "{selectionForComment.text.slice(0, 80)}{selectionForComment.text.length > 80 ? '...' : ''}"
                  </div>
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleCreateDiscussion();
                      }
                      if (e.key === 'Escape') {
                        setIsCreatingComment(false);
                        setNewCommentText('');
                      }
                    }}
                    placeholder="Write a comment... (Ctrl+Enter to submit)"
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '8px',
                      border: '1px solid var(--pf-v6-global--BorderColor--100)',
                      borderRadius: '6px',
                      background: 'var(--pf-v6-global--BackgroundColor--100)',
                      color: 'var(--pf-v6-global--Color--100)',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--pf-v6-global--Color--200)', marginTop: '4px', marginBottom: '8px' }}>
                    Supports <strong>**bold**</strong>, <em>*italic*</em>, <code>`code`</code>
                  </div>
                  <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
                    <FlexItem>
                      <Button
                        variant="link"
                        isSmall
                        onClick={() => { setIsCreatingComment(false); setNewCommentText(''); }}
                      >
                        Cancel
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button
                        variant="primary"
                        isSmall
                        onClick={handleCreateDiscussion}
                        isDisabled={!newCommentText.trim()}
                      >
                        Comment
                      </Button>
                    </FlexItem>
                  </Flex>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw Markdown Mode */}
        {activeTab === 'markdown' && (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            margin: '1rem'
          }}>
            <textarea
              value={markdown}
              onChange={(e) => handleMarkdownChange(e.target.value)}
              style={{
                flex: 1,
                width: '100%',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                padding: '1.5rem',
                background: 'var(--pf-v6-global--BackgroundColor--100)',
                color: 'var(--pf-v6-global--Color--100)',
                border: '1px solid var(--pf-v6-global--BorderColor--100)',
                borderRadius: '8px',
                resize: 'none',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              placeholder="Write your document in markdown..."
              aria-label="Document markdown editor"
            />
            <div style={{ 
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--pf-v6-global--BackgroundColor--200)',
              borderRadius: '4px',
              color: 'var(--pf-v6-global--Color--200)',
              fontSize: '12px'
            }}>
              <strong>Markdown Tips:</strong>{' '}
              <code style={{ background: 'var(--pf-v6-global--BackgroundColor--100)', padding: '2px 6px', borderRadius: '3px' }}># Heading</code>{' '}
              <code style={{ background: 'var(--pf-v6-global--BackgroundColor--100)', padding: '2px 6px', borderRadius: '3px' }}>**bold**</code>{' '}
              <code style={{ background: 'var(--pf-v6-global--BackgroundColor--100)', padding: '2px 6px', borderRadius: '3px' }}>*italic*</code>{' '}
              <code style={{ background: 'var(--pf-v6-global--BackgroundColor--100)', padding: '2px 6px', borderRadius: '3px' }}>- list item</code>{' '}
              <code style={{ background: 'var(--pf-v6-global--BackgroundColor--100)', padding: '2px 6px', borderRadius: '3px' }}>[link](url)</code>{' '}
              <code style={{ background: 'var(--pf-v6-global--BackgroundColor--100)', padding: '2px 6px', borderRadius: '3px' }}>`code`</code>
            </div>
          </div>
        )}

        {/* Split View Mode */}
        {activeTab === 'split' && (
          <Split style={{ flex: 1, overflow: 'hidden', margin: '1rem' }}>
            <SplitItem style={{ width: '50%', display: 'flex', flexDirection: 'column', paddingRight: '0.5rem' }}>
              <div style={{ 
                marginBottom: '0.5rem', 
                fontSize: '12px', 
                fontWeight: 600,
                color: 'var(--pf-v6-global--Color--200)',
                textTransform: 'uppercase'
              }}>
                Markdown Source
              </div>
              <textarea
                value={markdown}
                onChange={(e) => handleMarkdownChange(e.target.value)}
                style={{
                  flex: 1,
                  width: '100%',
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  padding: '1rem',
                  background: 'var(--pf-v6-global--BackgroundColor--100)',
                  color: 'var(--pf-v6-global--Color--100)',
                  border: '1px solid var(--pf-v6-global--BorderColor--100)',
                  borderRadius: '8px',
                  resize: 'none',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                placeholder="Write your document in markdown..."
                aria-label="Document markdown editor"
              />
            </SplitItem>
            <SplitItem style={{ width: '50%', display: 'flex', flexDirection: 'column', paddingLeft: '0.5rem' }}>
              <div style={{ 
                marginBottom: '0.5rem', 
                fontSize: '12px', 
                fontWeight: 600,
                color: 'var(--pf-v6-global--Color--200)',
                textTransform: 'uppercase'
              }}>
                Preview
              </div>
              <div 
                className="markdown-preview"
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '1.5rem',
                  background: 'var(--pf-v6-global--BackgroundColor--100)',
                  border: '1px solid var(--pf-v6-global--BorderColor--100)',
                  borderRadius: '8px'
                }}
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </SplitItem>
          </Split>
        )}
        </div>

        {/* Discussions Sidebar Panel */}
        {discussionsPanelOpen && (
          <div style={{
            width: '360px',
            flexShrink: 0,
            borderLeft: '1px solid var(--pf-v6-global--BorderColor--100)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <DiscussionsSidebar
              documentId={id}
              discussions={discussions}
              activeThreadId={activeThreadId}
              onSelectThread={(threadId) => {
                setActiveThreadId(threadId);
                // Try to scroll to the highlighted text in the editor
                if (editor) {
                  const thread = discussions.find(t => t.id === threadId);
                  if (thread?.anchor?.text) {
                    const matchPos = findAnchorInEditor(editor, thread.anchor.text, thread.anchor.prefix, thread.anchor.suffix, thread.anchor.startOffset, thread.anchor.endOffset);
                    if (matchPos) {
                      editor.chain().focus().setTextSelection(matchPos.from).run();
                      // Scroll the editor to the position
                      const { view } = editor;
                      const coords = view.coordsAtPos(matchPos.from);
                      if (editorContainerRef.current) {
                        const containerRect = editorContainerRef.current.getBoundingClientRect();
                        const scrollTop = editorContainerRef.current.scrollTop + (coords.top - containerRect.top) - 100;
                        editorContainerRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
                      }
                    }
                  }
                }
              }}
              onResolveThread={handleResolveThread}
              onReopenThread={handleReopenThread}
              onDeleteThread={handleDeleteThread}
              onAddReply={handleAddReply}
              onDeleteComment={handleDeleteComment}
              onClose={() => setDiscussionsPanelOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Editor Styles */}
      <style>{`
        .document-editor-content {
          outline: none;
          min-height: 100%;
        }

        .document-editor-content > * + * {
          margin-top: 0.75em;
        }

        .document-editor-content h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .document-editor-content h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .document-editor-content h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .document-editor-content p {
          line-height: 1.6;
        }

        .document-editor-content ul,
        .document-editor-content ol {
          padding-left: 1.5rem;
        }

        .document-editor-content li {
          margin: 0.25rem 0;
        }

        .document-editor-content code {
          background: var(--pf-v6-global--BackgroundColor--200);
          padding: 0.125rem 0.25rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }

        .document-editor-content pre {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          font-family: monospace;
        }

        .document-editor-content pre code {
          background: none;
          padding: 0;
          color: inherit;
        }

        .document-editor-content blockquote {
          border-left: 4px solid var(--pf-v6-global--BorderColor--100);
          padding-left: 1rem;
          margin-left: 0;
          color: var(--pf-v6-global--Color--200);
          font-style: italic;
        }

        .document-editor-content hr {
          border: none;
          border-top: 2px solid var(--pf-v6-global--BorderColor--100);
          margin: 1.5rem 0;
        }

        .document-editor-content a,
        .document-editor-content .editor-link {
          color: var(--pf-v6-global--link--Color);
          text-decoration: underline;
        }

        .document-editor-content a:hover,
        .document-editor-content .editor-link:hover {
          color: var(--pf-v6-global--link--Color--hover);
        }

        .document-editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--pf-v6-global--Color--200);
          pointer-events: none;
          height: 0;
        }

        /* ProseMirror placeholder */
        .ProseMirror p.is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--pf-v6-global--Color--200);
          pointer-events: none;
          height: 0;
        }

        /* Markdown Preview Styles */
        .markdown-preview {
          line-height: 1.6;
        }

        .markdown-preview > * + * {
          margin-top: 0.75em;
        }

        .markdown-preview h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          padding-bottom: 0.3rem;
          border-bottom: 1px solid var(--pf-v6-global--BorderColor--100);
        }

        .markdown-preview h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .markdown-preview h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .markdown-preview h4 {
          font-size: 1.1rem;
          font-weight: bold;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .markdown-preview p {
          margin-bottom: 0.75rem;
        }

        .markdown-preview ul,
        .markdown-preview ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .markdown-preview li {
          margin: 0.25rem 0;
        }

        .markdown-preview li > ul,
        .markdown-preview li > ol {
          margin-top: 0.25rem;
          margin-bottom: 0;
        }

        .markdown-preview code {
          background: var(--pf-v6-global--BackgroundColor--200);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-family: Monaco, Menlo, "Ubuntu Mono", Consolas, monospace;
          font-size: 0.9em;
        }

        .markdown-preview pre {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          font-family: Monaco, Menlo, "Ubuntu Mono", Consolas, monospace;
          margin: 1rem 0;
        }

        .markdown-preview pre code {
          background: none;
          padding: 0;
          color: inherit;
          font-size: 0.875rem;
        }

        .markdown-preview blockquote {
          border-left: 4px solid var(--pf-v6-global--primary-color--100);
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          color: var(--pf-v6-global--Color--200);
          font-style: italic;
        }

        .markdown-preview hr {
          border: none;
          border-top: 2px solid var(--pf-v6-global--BorderColor--100);
          margin: 1.5rem 0;
        }

        .markdown-preview a {
          color: var(--pf-v6-global--link--Color);
          text-decoration: underline;
        }

        .markdown-preview a:hover {
          color: var(--pf-v6-global--link--Color--hover);
        }

        .markdown-preview img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }

        .markdown-preview table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }

        .markdown-preview th,
        .markdown-preview td {
          border: 1px solid var(--pf-v6-global--BorderColor--100);
          padding: 0.5rem 0.75rem;
          text-align: left;
        }

        .markdown-preview th {
          background: var(--pf-v6-global--BackgroundColor--200);
          font-weight: 600;
        }

        .markdown-preview tr:nth-child(even) {
          background: var(--pf-v6-global--BackgroundColor--200);
        }

        .markdown-preview input[type="checkbox"] {
          margin-right: 0.5rem;
        }

        .markdown-preview .task-list-item {
          list-style: none;
          margin-left: -1.5rem;
        }

        /* Comment highlight styles */
        .comment-highlight {
          background-color: rgba(255, 212, 59, 0.3) !important;
          border-bottom: 2px solid rgba(255, 170, 0, 0.6) !important;
          cursor: pointer !important;
          padding: 1px 0;
          transition: background-color 0.15s ease;
          border-radius: 2px;
        }

        .comment-highlight:hover {
          background-color: rgba(255, 212, 59, 0.55) !important;
        }

        .comment-highlight.active {
          background-color: rgba(255, 170, 0, 0.4) !important;
          border-bottom-color: rgba(255, 140, 0, 0.8) !important;
        }
      `}</style>

      {/* Revision History Modal */}
      <RevisionModal
        isOpen={isRevisionModalOpen}
        onClose={() => {
          setIsRevisionModalOpen(false);
          setSelectedRevision(null);
          setRevisionContent(null);
        }}
        revisions={revisions}
        revisionsLoading={revisionsLoading}
        selectedRevision={selectedRevision}
        revisionContent={revisionContent}
        onRevisionSelect={handleRevisionSelect}
        onRestoreRevision={handleRestoreRevision}
        onCreateSnapshot={handleCreateSnapshot}
        isRestoringRevision={isRestoringRevision}
      />
    </div>
  );
};

export default DocumentDetail;
