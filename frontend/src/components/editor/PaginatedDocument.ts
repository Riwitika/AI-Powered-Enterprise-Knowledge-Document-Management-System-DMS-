import Document from '@tiptap/extension-document';

/**
 * Restricts the document root to page nodes only.
 * Prevents orphan block nodes from appearing in the grey workspace gap.
 */
export const PaginatedDocument = Document.extend({
  content: 'page+',
});
