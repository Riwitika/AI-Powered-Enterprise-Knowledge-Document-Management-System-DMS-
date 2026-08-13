import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { TextSelection } from '@tiptap/pm/state';
import { Fragment } from '@tiptap/pm/model';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import type { ResolvedPos } from '@tiptap/pm/model';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

const pageBreakKey = new PluginKey('pageBreakResolver');

function findPageDepth($pos: ResolvedPos): number {
  for (let d = $pos.depth; d > 0; d--) {
    if ($pos.node(d).type.name === 'page') return d;
  }
  return -1;
}

function ensurePageHasBlock(
  tr: Transaction,
  pageStart: number,
  pageType: EditorState['schema']['nodes']['page'],
  paragraphType: EditorState['schema']['nodes']['paragraph'],
) {
  const pageNode = tr.doc.nodeAt(pageStart);
  if (pageNode?.type === pageType && pageNode.childCount === 0) {
    tr.insert(pageStart + 1, paragraphType.create());
  }
}

/** Split the containing page at `splitPos` and move trailing content onto a new page. */
export function splitPageAtCursor(state: EditorState, splitPos: number): Transaction | null {
  const { doc, schema } = state;
  const pageType = schema.nodes.page;
  const paragraphType = schema.nodes.paragraph;
  if (!pageType || !paragraphType) return null;

  const $pos = doc.resolve(splitPos);
  const pageDepth = findPageDepth($pos);
  if (pageDepth === -1) return null;

  const pageStart = $pos.before(pageDepth);
  const pageEnd = $pos.after(pageDepth);
  const contentEnd = pageEnd - 1;

  const tr = state.tr;
  const slice = doc.slice(splitPos, contentEnd);

  if (splitPos < contentEnd) {
    tr.delete(splitPos, contentEnd);
  }

  const mappedPageStart = tr.mapping.map(pageStart);
  ensurePageHasBlock(tr, mappedPageStart, pageType, paragraphType);

  const newContent =
    slice.content.size > 0 ? slice.content : Fragment.from(paragraphType.create());
  const newPage = pageType.create({ manualBreakBefore: true }, newContent);

  const insertPos = tr.mapping.map(pageEnd);
  tr.insert(insertPos, newPage);

  const newPageContentStart = insertPos + 1;
  tr.setSelection(TextSelection.near(tr.doc.resolve(newPageContentStart), 1));

  return tr;
}

/** Convert legacy inline pageBreak nodes into real page boundaries. */
function resolveInlinePageBreaks(state: EditorState): Transaction | null {
  const { doc, schema } = state;
  const pageBreakType = schema.nodes.pageBreak;
  const pageType = schema.nodes.page;
  const paragraphType = schema.nodes.paragraph;
  if (!pageBreakType || !pageType || !paragraphType) return null;

  let breakPos: number | null = null;
  let pageStart = -1;
  let pageEnd = -1;

  doc.descendants((node, pos) => {
    if (node.type !== pageBreakType) return;
    const $pos = doc.resolve(pos);
    const depth = findPageDepth($pos);
    if (depth === -1) return;
    breakPos = pos;
    pageStart = $pos.before(depth);
    pageEnd = $pos.after(depth);
    return false;
  });

  if (breakPos === null || pageStart === -1) return null;

  const breakNode = doc.nodeAt(breakPos)!;
  const contentEnd = pageEnd - 1;
  const afterBreakStart = breakPos + breakNode.nodeSize;
  const slice = doc.slice(afterBreakStart, contentEnd);

  const tr = state.tr;
  tr.delete(breakPos, contentEnd);

  const mappedPageStart = tr.mapping.map(pageStart);
  ensurePageHasBlock(tr, mappedPageStart, pageType, paragraphType);

  const newContent =
    slice.content.size > 0 ? slice.content : Fragment.from(paragraphType.create());
  const newPage = pageType.create({ manualBreakBefore: true }, newContent);

  const insertPos = tr.mapping.map(pageEnd);
  tr.insert(insertPos, newPage);

  return tr;
}

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  selectable: false,
  draggable: false,
  atom: true,

  parseHTML() {
    return [
      { tag: 'div[data-type="page-break"]' },
      { tag: 'hr[data-type="page-break"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'page-break',
        'data-manual-page-break': 'true',
      }),
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ state, dispatch }) => {
          const tr = splitPageAtCursor(state, state.selection.from);
          if (!tr || !dispatch) return false;
          dispatch(tr);
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
      'Ctrl-Enter': () => this.editor.commands.setPageBreak(),
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pageBreakKey,
        appendTransaction(transactions, _oldState, newState) {
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;
          return resolveInlinePageBreaks(newState);
        },
      }),
    ];
  },
});
