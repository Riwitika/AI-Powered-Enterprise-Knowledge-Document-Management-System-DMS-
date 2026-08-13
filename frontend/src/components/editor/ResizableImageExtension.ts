import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageNodeView from './ImageNodeView';
import {
  IMAGE_SPACING_MARGIN,
  type ImageAlign,
  type ImageBorderStyle,
  type ImageSpacing,
} from './imageConstants';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setImageAlign: (align: ImageAlign) => ReturnType;
      setImageBorder: (options: {
        borderStyle?: ImageBorderStyle;
        borderWidth?: string;
        borderColor?: string;
      }) => ReturnType;
      setImageRadius: (borderRadius: string) => ReturnType;
      setImageSpacing: (spacing: ImageSpacing) => ReturnType;
      replaceImageSrc: (src: string) => ReturnType;
    };
  }
}

function parseStylePx(value?: string | null): string | null {
  if (!value) return null;
  const match = value.match(/([\d.]+)/);
  return match ? match[1] : null;
}

export const ResizableImage = Image.extend({
  name: 'image',

  inline: false,
  group: 'block',
  draggable: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src'),
        renderHTML: (attributes) => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute('alt'),
        renderHTML: (attributes) => {
          if (!attributes.alt) return {};
          return { alt: attributes.alt };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('title'),
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { title: attributes.title };
        },
      },
      width: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute('width') || parseStylePx(element.style.width),
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          const w = String(attributes.width).replace(/px$/, '');
          return { width: w, style: `width: ${w}px` };
        },
      },
      height: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute('height') || parseStylePx(element.style.height),
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          const h = String(attributes.height).replace(/px$/, '');
          return { height: h, style: `height: ${h}px` };
        },
      },
      align: {
        default: 'center',
        parseHTML: (element) =>
          element.getAttribute('data-align') ||
          element.parentElement?.getAttribute('data-align') ||
          'center',
        renderHTML: (attributes) => {
          const align = (attributes.align as ImageAlign) || 'center';
          return { 'data-align': align };
        },
      },
      borderStyle: {
        default: 'none',
        parseHTML: (element) => element.getAttribute('data-border-style') || 'none',
        renderHTML: (attributes) => {
          const style = (attributes.borderStyle as ImageBorderStyle) || 'none';
          if (style === 'none') return {};
          return { 'data-border-style': style };
        },
      },
      borderWidth: {
        default: '0',
        parseHTML: (element) => element.getAttribute('data-border-width') || '0',
        renderHTML: (attributes) => {
          const width = attributes.borderWidth as string;
          if (!width || width === '0') return {};
          return { 'data-border-width': width };
        },
      },
      borderColor: {
        default: '#000000',
        parseHTML: (element) => element.getAttribute('data-border-color') || '#000000',
        renderHTML: (attributes) => {
          const color = attributes.borderColor as string;
          if (!color || color === '#000000') return {};
          return { 'data-border-color': color };
        },
      },
      borderRadius: {
        default: '0',
        parseHTML: (element) => element.getAttribute('data-border-radius') || '0',
        renderHTML: (attributes) => {
          const radius = attributes.borderRadius as string;
          if (!radius || radius === '0') return {};
          return { 'data-border-radius': radius };
        },
      },
      spacing: {
        default: 'medium',
        parseHTML: (element) =>
          (element.getAttribute('data-spacing') as ImageSpacing) || 'medium',
        renderHTML: (attributes) => {
          const spacing = (attributes.spacing as ImageSpacing) || 'medium';
          if (spacing === 'medium') return {};
          return { 'data-spacing': spacing };
        },
      },
      layoutReady: {
        default: false,
        parseHTML: () => false,
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const align = (HTMLAttributes['data-align'] as ImageAlign) || 'center';
    const spacing = (HTMLAttributes['data-spacing'] as ImageSpacing) || 'medium';
    const borderStyle = (HTMLAttributes['data-border-style'] as ImageBorderStyle) || 'none';
    const borderWidth = HTMLAttributes['data-border-width'] as string | undefined;
    const borderColor = HTMLAttributes['data-border-color'] as string | undefined;
    const borderRadius = HTMLAttributes['data-border-radius'] as string | undefined;

    const styles: string[] = [];
    if (HTMLAttributes.width) styles.push(`width: ${HTMLAttributes.width}px`);
    if (HTMLAttributes.height) styles.push(`height: ${HTMLAttributes.height}px`);
    if (borderStyle !== 'none' && borderWidth && borderWidth !== '0') {
      styles.push(`border: ${borderWidth}px ${borderStyle} ${borderColor || '#000000'}`);
    }
    if (borderRadius && borderRadius !== '0') styles.push(`border-radius: ${borderRadius}`);
    const margin = IMAGE_SPACING_MARGIN[spacing] ?? IMAGE_SPACING_MARGIN.medium;
    styles.push(`margin-top: ${margin}`, `margin-bottom: ${margin}`);
    styles.push('max-width: 100%', 'height: auto', 'display: inline-block');

    const {
      'data-align': _a,
      'data-spacing': _s,
      'data-border-style': _bs,
      'data-border-width': _bw,
      'data-border-color': _bc,
      'data-border-radius': _br,
      layoutReady: _lr,
      ...rest
    } = HTMLAttributes;

    return [
      'div',
      { 'data-type': 'image-wrapper', 'data-align': align, style: `text-align: ${align};` },
      ['img', { ...rest, style: styles.join('; ') }],
    ];
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-wrapper"] img',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const wrapper = element.closest('[data-type="image-wrapper"]');
          return {
            src: element.getAttribute('src'),
            alt: element.getAttribute('alt'),
            align: wrapper?.getAttribute('data-align') || element.getAttribute('data-align'),
            borderStyle: element.getAttribute('data-border-style'),
            borderWidth: element.getAttribute('data-border-width'),
            borderColor: element.getAttribute('data-border-color'),
            borderRadius: element.getAttribute('data-border-radius'),
            spacing: element.getAttribute('data-spacing'),
            width: element.getAttribute('width') || parseStylePx(element.style.width),
            height: element.getAttribute('height') || parseStylePx(element.style.height),
          };
        },
      },
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          if (element.closest('[data-type="image-wrapper"]')) return false;
          return {
            src: element.getAttribute('src'),
            alt: element.getAttribute('alt'),
            width: element.getAttribute('width') || parseStylePx(element.style.width),
            height: element.getAttribute('height') || parseStylePx(element.style.height),
          };
        },
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageAlign:
        (align) =>
        ({ commands }) =>
          commands.updateAttributes('image', { align }),
      setImageBorder:
        (options) =>
        ({ commands }) =>
          commands.updateAttributes('image', options),
      setImageRadius:
        (borderRadius) =>
        ({ commands }) =>
          commands.updateAttributes('image', { borderRadius }),
      setImageSpacing:
        (spacing) =>
        ({ commands }) =>
          commands.updateAttributes('image', { spacing }),
      replaceImageSrc:
        (src) =>
        ({ commands }) =>
          commands.updateAttributes('image', { src, layoutReady: false }),
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        if (editor.isActive('image')) {
          return editor.commands.deleteSelection();
        }
        return false;
      },
      Delete: ({ editor }) => {
        if (editor.isActive('image')) {
          return editor.commands.deleteSelection();
        }
        return false;
      },
    };
  },
});
