import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { Node as PMNode } from '@tiptap/pm/model';
import { PAGE_CONTENT_HEIGHT } from './pageGeometry';

export interface AutoPaginationOptions {
  pageHeight: number;
}

const paginationKey = new PluginKey('autoPagination');

function isPageEmpty(pageNode: PMNode): boolean {
  if (pageNode.childCount === 0) return true;
  if (pageNode.childCount === 1) {
    const first = pageNode.firstChild;
    if (first?.type.name === 'paragraph' && first.content.size === 0 && first.marks.length === 0) {
      return true;
    }
  }
  return false;
}

function collectPages(doc: PMNode, pageType: PMNode['type']) {
  const pages: { node: PMNode; pos: number }[] = [];
  doc.nodesBetween(0, doc.content.size, (node, pos, parent) => {
    if (node.type === pageType && parent.type.name === 'doc') {
      pages.push({ node, pos });
      return false;
    }
  });
  return pages;
}

function getRelativeOffsetBottom(element: HTMLElement, container: HTMLElement): number | null {
  if (!container.contains(element)) return null;
  let top = 0;
  let el: HTMLElement | null = element;
  while (el && el !== container) {
    top += el.offsetTop;
    el = el.parentElement;
  }
  return top + element.offsetHeight;
}

function measureChildBottom(
  view: EditorView,
  pagePos: number,
  childOffsetInPage: number,
): number | null {
  const childPos = pagePos + 1 + childOffsetInPage;
  const pageDom = view.nodeDOM(pagePos);
  const childDom = view.nodeDOM(childPos);
  if (!(pageDom instanceof HTMLElement) || !(childDom instanceof HTMLElement)) {
    return null;
  }
  return getRelativeOffsetBottom(childDom, pageDom);
}

function unwrapNestedPages(state: EditorState): Transaction | null {
  const { doc, schema } = state;
  const pageType = schema.nodes.page;
  if (!pageType) return null;

  const pages = collectPages(doc, pageType);
  for (const { node: pageNode, pos: pagePos } of pages) {
    let childOffset = 0;
    for (let i = 0; i < pageNode.childCount; i++) {
      const child = pageNode.child(i);
      if (child.type === pageType) {
        const nestedPos = pagePos + 1 + childOffset;
        const innerStart = nestedPos + 1;
        const innerEnd = nestedPos + child.nodeSize - 1;
        const slice = doc.slice(innerStart, innerEnd);
        const tr = state.tr.replaceWith(nestedPos, nestedPos + child.nodeSize, slice.content);
        return tr;
      }
      childOffset += child.nodeSize;
    }
  }
  return null;
}

function buildStructuralTransaction(state: EditorState): Transaction | null {
  const nested = unwrapNestedPages(state);
  if (nested) return nested;

  const { doc, schema } = state;
  const pageType = schema.nodes.page;
  if (!pageType) return null;

  const orphans: { pos: number; size: number }[] = [];
  doc.nodesBetween(0, doc.content.size, (node, pos, parent) => {
    if (parent.type.name === 'doc' && node.type !== pageType) {
      orphans.push({ pos, size: node.nodeSize });
      return false;
    }
  });

  if (orphans.length > 0) {
    const tr = state.tr;
    const startPos = orphans[0].pos;
    const last = orphans[orphans.length - 1];
    const endPos = last.pos + last.size;
    const slice = doc.slice(startPos, endPos);
    const pageContent =
      slice.content.size > 0 ? slice.content : schema.nodes.paragraph.create(null);
    const page = pageType.create(null, pageContent);
    return tr.replaceWith(startPos, endPos, page);
  }

  if (doc.childCount === 0) {
    const tr = state.tr;
    const page = pageType.create(null, schema.nodes.paragraph.create());
    return tr.insert(0, page);
  }

  return null;
}

function runLayoutPass(view: EditorView, contentHeight: number): boolean {
  const { state } = view;
  const { doc, schema } = state;
  const pageType = schema.nodes.page;
  const pageBreakType = schema.nodes.pageBreak;
  if (!pageType) return false;

  const pages = collectPages(doc, pageType);
  if (pages.length === 0) return false;

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const { node: pageNode, pos: pagePos } = pages[pIdx];
    const children: { node: PMNode; offset: number; size: number }[] = [];
    pageNode.forEach((child, offset) => {
      children.push({ node: child, offset, size: child.nodeSize });
    });

    const breakIdx = children.findIndex((c) => pageBreakType && c.node.type === pageBreakType);
    if (breakIdx !== -1 && breakIdx < children.length - 1) {
      const tr = state.tr;
      const splitChild = children[breakIdx + 1];
      const splitPos = pagePos + 1 + splitChild.offset;
      const endPos = pagePos + pageNode.nodeSize - 1;
      if (splitPos < endPos) {
        const slice = doc.slice(splitPos, endPos);
        tr.delete(splitPos, endPos);
        if (pIdx + 1 < pages.length) {
          tr.insert(pages[pIdx + 1].pos + 1, slice.content);
        } else {
          tr.insert(tr.doc.content.size, pageType.create(null, slice.content));
        }
        view.dispatch(tr);
        return true;
      }
    }

    if (children.length > 0) {
      let overflowIdx = -1;
      for (let cIdx = 0; cIdx < children.length; cIdx++) {
        const bottom = measureChildBottom(view, pagePos, children[cIdx].offset);
        if (bottom !== null && bottom > contentHeight + 1) {
          overflowIdx = cIdx;
          break;
        }
      }

      if (overflowIdx > 0) {
        const tr = state.tr;
        const splitChild = children[overflowIdx];
        const splitPos = pagePos + 1 + splitChild.offset;
        const endPos = pagePos + pageNode.nodeSize - 1;
        if (splitPos < endPos) {
          const slice = doc.slice(splitPos, endPos);
          tr.delete(splitPos, endPos);
          if (pIdx + 1 < pages.length) {
            tr.insert(pages[pIdx + 1].pos + 1, slice.content);
          } else {
            tr.insert(tr.doc.content.size, pageType.create(null, slice.content));
          }
          view.dispatch(tr);
          return true;
        }
      }
    }

    if (pIdx + 1 < pages.length && children.length > 0) {
      const nextPage = pages[pIdx + 1];
      if (nextPage.node.childCount > 0) {
        const firstNext = nextPage.node.firstChild!;
        if (pageBreakType && firstNext.type === pageBreakType) continue;
        if (nextPage.node.attrs.manualBreakBefore) continue;

        const lastChild = children[children.length - 1];
        const usedBottom = measureChildBottom(view, pagePos, lastChild.offset);
        const firstNextBottom = measureChildBottom(view, nextPage.pos, 0);
        if (usedBottom === null || firstNextBottom === null) continue;

        const freeSpace = contentHeight - usedBottom;

        if (firstNextBottom > 0 && firstNextBottom <= freeSpace - 4) {
          const tr = state.tr;
          const pullPos = nextPage.pos + 1;
          const pullSize = firstNext.nodeSize;
          const slice = doc.slice(pullPos, pullPos + pullSize);
          tr.delete(pullPos, pullPos + pullSize);
          tr.insert(pagePos + pageNode.nodeSize - 1, slice.content);
          view.dispatch(tr);
          return true;
        }
      }
    }
  }

  if (pages.length > 1) {
    for (let i = pages.length - 1; i >= 1; i--) {
      const { node, pos } = pages[i];
      if (isPageEmpty(node)) {
        view.dispatch(state.tr.delete(pos, pos + node.nodeSize));
        return true;
      }
    }
  }

  return false;
}

function paginateUntilStable(view: EditorView, contentHeight: number, maxPasses = 24) {
  let pass = 0;
  const run = () => {
    if (pass >= maxPasses) return;
    pass += 1;
    const changed = runLayoutPass(view, contentHeight);
    if (changed) {
      requestAnimationFrame(run);
    }
  };
  run();
}

export const AutoPagination = Extension.create<AutoPaginationOptions>({
  name: 'autoPagination',

  addOptions() {
    return {
      pageHeight: PAGE_CONTENT_HEIGHT,
    };
  },

  addProseMirrorPlugins() {
    const contentHeight = this.options.pageHeight;
    let rafId: number | null = null;
    let layoutRunning = false;

    const scheduleLayout = (view: EditorView) => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (layoutRunning) return;
        layoutRunning = true;
        paginateUntilStable(view, contentHeight);
        layoutRunning = false;
      });
    };

    return [
      new Plugin({
        key: paginationKey,
        appendTransaction(transactions, _oldState, newState) {
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;
          return buildStructuralTransaction(newState);
        },
        view(view) {
          scheduleLayout(view);
          return {
            update(v, prevState) {
              if (prevState && v.state.doc.eq(prevState.doc)) return;
              scheduleLayout(v);
            },
            destroy() {
              if (rafId !== null) cancelAnimationFrame(rafId);
            },
          };
        },
      }),
    ];
  },
});
