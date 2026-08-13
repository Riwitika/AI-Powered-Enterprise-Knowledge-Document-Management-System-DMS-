import { Extension } from '@tiptap/core';

export type ParagraphSpacingValue = 'normal' | 'compact' | 'spacious';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphSpacing: {
      setParagraphSpacing: (spacing: ParagraphSpacingValue) => ReturnType;
      unsetParagraphSpacing: () => ReturnType;
    };
  }
}

const SPACING_MARGIN: Record<ParagraphSpacingValue, string> = {
  normal: '0.5rem 0',
  compact: '0.25rem 0',
  spacious: '1rem 0',
};

const BLOCK_TYPES = ['paragraph', 'heading'] as const;

export const ParagraphSpacing = Extension.create({
  name: 'paragraphSpacing',

  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_TYPES],
        attributes: {
          paragraphSpacing: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-paragraph-spacing'),
            renderHTML: (attributes) => {
              const spacing = attributes.paragraphSpacing as ParagraphSpacingValue | null;
              if (!spacing || spacing === 'normal') return {};
              return {
                'data-paragraph-spacing': spacing,
                style: `margin: ${SPACING_MARGIN[spacing]}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setParagraphSpacing:
        (spacing: ParagraphSpacingValue) =>
        ({ state, dispatch, chain }) => {
          const { from, to } = state.selection;
          const value = spacing === 'normal' ? null : spacing;

          if (from === to) {
            for (const type of BLOCK_TYPES) {
              if (chain().focus().updateAttributes(type, { paragraphSpacing: value }).run()) {
                return true;
              }
            }
            return false;
          }

          const tr = state.tr;
          let modified = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (BLOCK_TYPES.includes(node.type.name as (typeof BLOCK_TYPES)[number])) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, paragraphSpacing: value });
              modified = true;
            }
          });

          if (modified && dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        },

      unsetParagraphSpacing:
        () =>
        ({ commands }) => {
          return commands.setParagraphSpacing('normal');
        },
    };
  },
});

export function detectParagraphSpacing(editor: {
  getAttributes: (name: string) => Record<string, unknown>;
  isActive: (name: string) => boolean;
}): ParagraphSpacingValue {
  for (const type of BLOCK_TYPES) {
    if (editor.isActive(type)) {
      const spacing = editor.getAttributes(type).paragraphSpacing as ParagraphSpacingValue | undefined;
      if (spacing) return spacing;
    }
  }
  return 'normal';
}
