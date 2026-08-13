import { Editor } from '@tiptap/react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Replace,
} from 'lucide-react';
import {
  IMAGE_BORDER_STYLES,
  IMAGE_BORDER_WIDTHS,
  IMAGE_RADIUS_OPTIONS,
  type ImageAlign,
  type ImageBorderStyle,
  type ImageSpacing,
} from './imageConstants';

interface ImageToolbarProps {
  editor: Editor;
  onReplace: () => void;
}

export default function ImageToolbar({ editor, onReplace }: ImageToolbarProps) {
  if (!editor.isActive('image')) return null;

  const attrs = editor.getAttributes('image');
  const align = (attrs.align as ImageAlign) || 'center';
  const borderStyle = (attrs.borderStyle as ImageBorderStyle) || 'none';
  const borderWidth = String(attrs.borderWidth ?? '0');
  const borderColor = (attrs.borderColor as string) || '#000000';
  const borderRadius = (attrs.borderRadius as string) || '0';
  const spacing = (attrs.spacing as ImageSpacing) || 'medium';
  const width = attrs.width ? `${attrs.width}px` : 'auto';
  const height = attrs.height ? `${attrs.height}px` : 'auto';

  return (
    <div className="tiptap-image-toolbar flex items-center gap-1 flex-wrap bg-white border border-slate-200 shadow-lg rounded-lg px-2 py-1.5 text-[11px]">
      <span className="font-semibold text-slate-500 px-1">{width} × {height}</span>
      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      <button
        type="button"
        title="Align left"
        onClick={() => editor.chain().focus().setImageAlign('left').run()}
        className={`p-1 rounded ${align === 'left' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        title="Align center"
        onClick={() => editor.chain().focus().setImageAlign('center').run()}
        className={`p-1 rounded ${align === 'center' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        title="Align right"
        onClick={() => editor.chain().focus().setImageAlign('right').run()}
        className={`p-1 rounded ${align === 'right' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
      >
        <AlignRight className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      <select
        title="Border style"
        value={borderStyle}
        onChange={(e) =>
          editor.chain().focus().setImageBorder({ borderStyle: e.target.value as ImageBorderStyle }).run()
        }
        className="border border-slate-200 rounded px-1 py-0.5"
      >
        {IMAGE_BORDER_STYLES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        title="Border width"
        value={borderWidth}
        onChange={(e) =>
          editor.chain().focus().setImageBorder({ borderWidth: e.target.value }).run()
        }
        className="border border-slate-200 rounded px-1 py-0.5 w-12"
      >
        {IMAGE_BORDER_WIDTHS.map((w) => (
          <option key={w} value={w}>{w}px</option>
        ))}
      </select>

      <input
        type="color"
        title="Border color"
        value={borderColor}
        onChange={(e) =>
          editor.chain().focus().setImageBorder({ borderColor: e.target.value }).run()
        }
        className="w-6 h-6 border-none p-0 cursor-pointer"
      />

      <select
        title="Corner radius"
        value={borderRadius}
        onChange={(e) => editor.chain().focus().setImageRadius(e.target.value).run()}
        className="border border-slate-200 rounded px-1 py-0.5"
      >
        {IMAGE_RADIUS_OPTIONS.map((r) => (
          <option key={r} value={r}>{r === '0' ? '0' : r}</option>
        ))}
      </select>

      <select
        title="Spacing"
        value={spacing}
        onChange={(e) =>
          editor.chain().focus().setImageSpacing(e.target.value as ImageSpacing).run()
        }
        className="border border-slate-200 rounded px-1 py-0.5"
      >
        <option value="none">None</option>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      <button
        type="button"
        title="Replace image"
        onClick={onReplace}
        className="p-1 rounded hover:bg-slate-100 text-slate-600"
      >
        <Replace className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        title="Delete image"
        onClick={() => editor.chain().focus().deleteSelection().run()}
        className="p-1 rounded hover:bg-red-50 text-red-600"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
