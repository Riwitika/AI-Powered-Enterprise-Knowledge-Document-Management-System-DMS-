import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    page: {
      insertPage: () => ReturnType;
    };
  }
}

export const Page = Node.create({
  name: 'page',
  // Must NOT be in the generic `block` group — otherwise pages can nest inside pages.
  group: 'pageContainer',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      manualBreakBefore: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-manual-break-before') === 'true',
        renderHTML: (attributes) =>
          attributes.manualBreakBefore ? { 'data-manual-break-before': 'true' } : {},
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="page"]' },
      { tag: 'div.tiptap-page-sheet' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'page',
        class: 'tiptap-page-sheet',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertPage:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              content: [
                {
                  type: 'paragraph',
                },
              ],
            })
            .run();
        },
    };
  },
});
