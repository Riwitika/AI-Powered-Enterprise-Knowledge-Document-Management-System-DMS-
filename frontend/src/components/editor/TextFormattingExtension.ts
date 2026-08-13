import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    clearFormatting: {
      /** Remove inline character formatting while preserving block structure. */
      clearFormatting: () => ReturnType;
    };
  }
}

export const TextFormatting = Extension.create({
  name: 'textFormatting',

  addCommands() {
    return {
      clearFormatting:
        () =>
        ({ chain, state }) => {
          const { empty } = state.selection;
          if (empty) return false;

          return chain()
            .focus()
            .unsetAllMarks()
            .unsetFontSize()
            .unsetColor()
            .unsetFontFamily()
            .unsetHighlight()
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});
