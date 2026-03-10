import React from 'react';
import {
  Tooltip
} from '@patternfly/react-core';
import {
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOlIcon,
  CodeIcon
} from '@patternfly/react-icons';

// Editor Toolbar Component
const EditorToolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const toolbarButtonStyle = (isActive) => ({
    padding: '0.375rem 0.5rem',
    minWidth: '32px',
    background: isActive ? 'var(--pf-v6-global--active-color--100)' : 'transparent',
    color: isActive ? 'var(--pf-v6-global--Color--light-100)' : 'var(--pf-v6-global--Color--100)',
    border: '1px solid var(--pf-v6-global--BorderColor--100)',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  });

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl || 'https://');

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div style={{
      display: 'flex',
      gap: '0.25rem',
      padding: '0.5rem',
      background: 'var(--pf-v6-global--BackgroundColor--100)',
      borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
      flexWrap: 'wrap'
    }}>
      <Tooltip content="Bold (Ctrl+B)">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={toolbarButtonStyle(editor.isActive('bold'))}
        >
          <BoldIcon />
        </button>
      </Tooltip>

      <Tooltip content="Italic (Ctrl+I)">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={toolbarButtonStyle(editor.isActive('italic'))}
        >
          <ItalicIcon />
        </button>
      </Tooltip>

      <Tooltip content="Strikethrough">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={toolbarButtonStyle(editor.isActive('strike'))}
        >
          <span style={{ textDecoration: 'line-through', fontWeight: 'bold' }}>S</span>
        </button>
      </Tooltip>

      <div style={{ width: '1px', background: 'var(--pf-v6-global--BorderColor--100)', margin: '0 0.25rem' }} />

      <Tooltip content="Link">
        <button
          type="button"
          onClick={handleLink}
          style={toolbarButtonStyle(editor.isActive('link'))}
        >
          <LinkIcon />
        </button>
      </Tooltip>

      <div style={{ width: '1px', background: 'var(--pf-v6-global--BorderColor--100)', margin: '0 0.25rem' }} />

      <Tooltip content="Heading 1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={toolbarButtonStyle(editor.isActive('heading', { level: 1 }))}
        >
          <strong>H1</strong>
        </button>
      </Tooltip>

      <Tooltip content="Heading 2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={toolbarButtonStyle(editor.isActive('heading', { level: 2 }))}
        >
          <strong>H2</strong>
        </button>
      </Tooltip>

      <Tooltip content="Heading 3">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={toolbarButtonStyle(editor.isActive('heading', { level: 3 }))}
        >
          <strong>H3</strong>
        </button>
      </Tooltip>

      <div style={{ width: '1px', background: 'var(--pf-v6-global--BorderColor--100)', margin: '0 0.25rem' }} />

      <Tooltip content="Bullet List">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={toolbarButtonStyle(editor.isActive('bulletList'))}
        >
          <ListIcon />
        </button>
      </Tooltip>

      <Tooltip content="Numbered List">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={toolbarButtonStyle(editor.isActive('orderedList'))}
        >
          <ListOlIcon />
        </button>
      </Tooltip>

      <div style={{ width: '1px', background: 'var(--pf-v6-global--BorderColor--100)', margin: '0 0.25rem' }} />

      <Tooltip content="Code">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          style={toolbarButtonStyle(editor.isActive('code'))}
        >
          <CodeIcon />
        </button>
      </Tooltip>

      <Tooltip content="Code Block">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          style={toolbarButtonStyle(editor.isActive('codeBlock'))}
        >
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{'{}'}</span>
        </button>
      </Tooltip>

      <Tooltip content="Blockquote">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={toolbarButtonStyle(editor.isActive('blockquote'))}
        >
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>"</span>
        </button>
      </Tooltip>

      <div style={{ width: '1px', background: 'var(--pf-v6-global--BorderColor--100)', margin: '0 0.25rem' }} />

      <Tooltip content="Horizontal Rule">
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          style={toolbarButtonStyle(false)}
        >
          <span style={{ fontWeight: 'bold' }}>—</span>
        </button>
      </Tooltip>
    </div>
  );
};

export default EditorToolbar;
