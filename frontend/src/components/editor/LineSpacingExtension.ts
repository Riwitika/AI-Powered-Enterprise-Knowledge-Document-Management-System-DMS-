import { Extension } from '@tiptap/core';

export type LineSpacingValue = '1' | '1.15' | '1.5' | '2';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineSpacing: {
      setLineSpacing: (lineHeight: LineSpacingValue) => ReturnType;
      unsetLineSpacing: () => ReturnType;
    };
  }
}

const BLOCK_TYPES = ['paragraph', 'heading', 'blockquote'] as const;

export const LineSpacing = Extension.create({
  name: 'lineSpacing',

  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_TYPES],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineSpacing:
        (lineHeight: LineSpacingValue) =>
        ({ state, dispatch, chain }) => {
          const { from, to } = state.selection;
          if (from === to) {
            for (const type of BLOCK_TYPES) {
              if (chain().focus().updateAttributes(type, { lineHeight }).run()) return true;
            }
            return false;
          }

          const tr = state.tr;
          let modified = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (BLOCK_TYPES.includes(node.type.name as (typeof BLOCK_TYPES)[number])) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight });
              modified = true;
            }
          });

          if (modified && dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        },

      unsetLineSpacing:
        () =>
        ({ state, dispatch, chain }) => {
          const { from, to } = state.selection;
          if (from === to) {
            for (const type of BLOCK_TYPES) {
              if (chain().focus().updateAttributes(type, { lineHeight: null }).run()) return true;
            }
            return false;
          }

          const tr = state.tr;
          let modified = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (BLOCK_TYPES.includes(node.type.name as (typeof BLOCK_TYPES)[number])) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight: null });
              modified = true;
            }
          });

          if (modified && dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        },
    };
  },
});

export const LINE_SPACING_OPTIONS: { label: string; value: LineSpacingValue }[] = [
  { label: '1.0', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: '2.0', value: '2' },
];

export function detectLineSpacing(editor: {
  getAttributes: (name: string) => Record<string, unknown>;
  isActive: (name: string) => boolean;
}): string {
  for (const type of BLOCK_TYPES) {
    if (editor.isActive(type)) {
      const lh = editor.getAttributes(type).lineHeight as string | undefined;
      if (lh) return lh;
    }
  }
  return '';
}
