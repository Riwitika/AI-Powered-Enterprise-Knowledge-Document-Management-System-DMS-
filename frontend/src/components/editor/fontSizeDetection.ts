import type { Editor } from '@tiptap/react';

export const DEFAULT_FONT_SIZE_PX = 16;

/** Effective px sizes for heading levels without an explicit font-size mark. */
export const HEADING_FONT_SIZE_PX: Record<number, number> = {
  1: 26,
  2: 20,
  3: 18,
  4: 16,
};

export type FontSizeDisplay =
  | { kind: 'single'; sizePx: number; sizeLabel: string }
  | { kind: 'mixed' }
  | { kind: 'default'; sizePx: number; sizeLabel: string };

export function parseFontSizePx(value?: string | null): number | null {
  if (!value) return null;
  const match = String(value).match(/([\d.]+)/);
  if (!match) return null;
  return Math.round(parseFloat(match[1]));
}

function effectiveSizeForTextNode(
  editor: Editor,
  pos: number,
  textNode: { marks: readonly { type: { name: string }; attrs: Record<string, unknown> }[] },
): number {
  const textStyleMark = textNode.marks.find((m) => m.type.name === 'textStyle');
  const explicit = parseFontSizePx(textStyleMark?.attrs.fontSize as string | undefined);
  if (explicit) return explicit;

  const $pos = editor.state.doc.resolve(pos);
  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    if (node.type.name === 'heading') {
      return HEADING_FONT_SIZE_PX[node.attrs.level as number] ?? DEFAULT_FONT_SIZE_PX;
    }
  }
  return DEFAULT_FONT_SIZE_PX;
}

/**
 * Derive toolbar font-size display from live ProseMirror selection state.
 */
export function detectFontSizeDisplay(editor: Editor): FontSizeDisplay {
  const { state } = editor;
  const { from, to, empty } = state.selection;

  if (empty) {
    const textStyle = editor.getAttributes('textStyle');
    const explicit = parseFontSizePx(textStyle.fontSize as string | undefined);
    if (explicit) {
      return { kind: 'single', sizePx: explicit, sizeLabel: `${explicit}px` };
    }

    const $from = state.selection.$from;
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d);
      if (node.type.name === 'heading') {
        const px = HEADING_FONT_SIZE_PX[node.attrs.level as number] ?? DEFAULT_FONT_SIZE_PX;
        return { kind: 'default', sizePx: px, sizeLabel: `${px}px` };
      }
    }

    return {
      kind: 'default',
      sizePx: DEFAULT_FONT_SIZE_PX,
      sizeLabel: `${DEFAULT_FONT_SIZE_PX}px`,
    };
  }

  const sizes = new Set<number>();
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText) return;
    sizes.add(effectiveSizeForTextNode(editor, pos, node));
  });

  if (sizes.size === 0) {
    return {
      kind: 'default',
      sizePx: DEFAULT_FONT_SIZE_PX,
      sizeLabel: `${DEFAULT_FONT_SIZE_PX}px`,
    };
  }

  if (sizes.size > 1) {
    return { kind: 'mixed' };
  }

  const sizePx = [...sizes][0];
  const textStyle = editor.getAttributes('textStyle');
  const hasExplicit = !!parseFontSizePx(textStyle.fontSize as string | undefined);

  if (hasExplicit) {
    return { kind: 'single', sizePx, sizeLabel: `${sizePx}px` };
  }

  return { kind: 'default', sizePx, sizeLabel: `${sizePx}px` };
}

/** Numeric size used for +/- stepping from the current selection. */
export function getFontSizeStepBase(editor: Editor): number {
  const display = detectFontSizeDisplay(editor);
  if (display.kind === 'mixed') {
    const { from, to } = editor.state.selection;
    const sizes = new Set<number>();
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isText) sizes.add(effectiveSizeForTextNode(editor, pos, node));
    });
    return sizes.size > 0 ? Math.max(...sizes) : DEFAULT_FONT_SIZE_PX;
  }
  return display.sizePx;
}
