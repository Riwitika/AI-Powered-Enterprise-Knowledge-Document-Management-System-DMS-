import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockIndent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const MAX_INDENT = 4;
const BLOCK_TYPES = ['paragraph', 'heading'] as const;

export const BlockIndent = Extension.create({
  name: 'blockIndent',

  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_TYPES],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const data = element.getAttribute('data-indent');
              if (data) return parseInt(data, 10) || 0;
              const ml = element.style.marginLeft;
              if (!ml) return 0;
              const em = ml.match(/([\d.]+)em/);
              return em ? Math.round(parseFloat(em[1]) / 2) : 0;
            },
            renderHTML: (attributes) => {
              const level = (attributes.indent as number) || 0;
              if (level <= 0) return {};
              return {
                'data-indent': String(level),
                style: `margin-left: ${level * 2}em`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ editor, chain }) => {
          if (editor.can().sinkListItem('listItem')) {
            return chain().focus().sinkListItem('listItem').run();
          }

          for (const type of BLOCK_TYPES) {
            if (!editor.isActive(type)) continue;
            const current = (editor.getAttributes(type).indent as number) || 0;
            if (current >= MAX_INDENT) return false;
            return chain().focus().updateAttributes(type, { indent: current + 1 }).run();
          }
          return false;
        },

      outdent:
        () =>
        ({ editor, chain }) => {
          if (editor.can().liftListItem('listItem')) {
            return chain().focus().liftListItem('listItem').run();
          }

          for (const type of BLOCK_TYPES) {
            if (!editor.isActive(type)) continue;
            const current = (editor.getAttributes(type).indent as number) || 0;
            if (current <= 0) return false;
            const next = current - 1 <= 0 ? 0 : current - 1;
            return chain().focus().updateAttributes(type, { indent: next }).run();
          }
          return false;
        },
    };
  },
});
