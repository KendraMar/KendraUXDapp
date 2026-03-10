import { Mark } from '@tiptap/core';

/**
 * TipTap mark extension for highlighting text that has discussion threads attached.
 * Renders a colored background span with a data attribute linking to the thread ID.
 */
const CommentHighlight = Mark.create({
  name: 'commentHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      threadId: {
        default: null,
        parseHTML: element => element.getAttribute('data-thread-id'),
        renderHTML: attributes => {
          if (!attributes.threadId) return {};
          return { 'data-thread-id': attributes.threadId };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-thread-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', {
      ...HTMLAttributes,
      class: 'comment-highlight',
      style: 'background-color: rgba(255, 212, 59, 0.3); border-bottom: 2px solid rgba(255, 170, 0, 0.6); cursor: pointer; padding: 1px 0; transition: background-color 0.15s ease;',
    }, 0];
  },
});

export default CommentHighlight;
