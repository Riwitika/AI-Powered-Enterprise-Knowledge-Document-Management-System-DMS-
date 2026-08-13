import { Editor, useEditorState } from '@tiptap/react';
import {
  Undo2,
  Redo2,
  Printer,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link2,
  Table as TableIcon,
  ImageIcon,
  RemoveFormatting,
  Plus,
  Minus,
  IndentIncrease,
  IndentDecrease,
  Quote,
  Minus as HorizontalRuleIcon,
} from 'lucide-react';
import {
  detectFontSizeDisplay,
  getFontSizeStepBase,
} from './fontSizeDetection';
import {
  detectLineSpacing,
  LINE_SPACING_OPTIONS,
  type LineSpacingValue,
} from './LineSpacingExtension';
import {
  detectParagraphSpacing,
  type ParagraphSpacingValue,
} from './ParagraphSpacingExtension';

interface EditorToolbarProps {
  editor: Editor | null;
  zoomLevel: number;
  onSetZoom: (zoom: number) => void;
  onOpenImageUpload: () => void;
  onOpenTableModal: () => void;
  onOpenLinkEditor: () => void;
  customPrompt: (title: string, defaultValue: string, onSubmit: (val: string) => void) => void;
}

const FONT_FAMILIES = [
  { name: 'Arial', val: 'Arial, sans-serif' },
  { name: 'Times New Roman', val: '"Times New Roman", serif' },
  { name: 'Calibri', val: 'Calibri, sans-serif' },
  { name: 'Georgia', val: 'Georgia, serif' },
  { name: 'Verdana', val: 'Verdana, sans-serif' },
  { name: 'Courier New', val: '"Courier New", monospace' },
  { name: 'Comic Sans MS', val: '"Comic Sans MS", cursive' },
  { name: 'Trebuchet MS', val: '"Trebuchet MS", sans-serif' },
  { name: 'Impact', val: 'Impact, sans-serif' },
];

const FONT_SIZES = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '26px', '28px', '32px', '36px', '48px'];

const PARAGRAPH_SPACING_OPTIONS: { label: string; value: ParagraphSpacingValue }[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Compact', value: 'compact' },
  { label: 'Spacious', value: 'spacious' },
];

const TEXT_COLOR_PRESETS = [
  '#000000',
  '#434343',
  '#980000',
  '#ff0000',
  '#ff9900',
  '#ffff00',
  '#38761d',
  '#1155cc',
  '#674ea7',
  '#e06666',
];

const HIGHLIGHT_PRESETS = [
  '#ffff00',
  '#fce5cd',
  '#d9ead3',
  '#cfe2f3',
  '#d9d2e9',
  '#f4cccc',
  '#fff2cc',
  '#ead1dc',
  '#eeeeee',
  '#ffffff',
];

function normalizeHexColor(color?: string | null, fallback = '#000000'): string {
  if (!color) return fallback;
  if (color.startsWith('#')) {
    return color.length === 7 ? color : fallback;
  }
  return fallback;
}

function resolveFontFamilyValue(fontFamily?: string | null): string {
  if (!fontFamily) return 'Arial, sans-serif';
  const exact = FONT_FAMILIES.find((f) => f.val === fontFamily);
  if (exact) return exact.val;
  const byName = FONT_FAMILIES.find(
    (f) => fontFamily.includes(f.name) || f.val.includes(fontFamily),
  );
  return byName?.val ?? fontFamily;
}

type HeadingValue = 'p' | 'h1' | 'h2' | 'h3' | 'h4';

function detectHeading(editor: Editor): HeadingValue {
  if (editor.isActive('heading', { level: 1 })) return 'h1';
  if (editor.isActive('heading', { level: 2 })) return 'h2';
  if (editor.isActive('heading', { level: 3 })) return 'h3';
  if (editor.isActive('heading', { level: 4 })) return 'h4';
  return 'p';
}

type TextAlignValue = 'left' | 'center' | 'right' | 'justify';

function detectTextAlign(editor: Editor): TextAlignValue {
  for (const type of ['paragraph', 'heading', 'blockquote'] as const) {
    if (editor.isActive(type)) {
      const align = editor.getAttributes(type).textAlign as string | undefined;
      if (align === 'center' || align === 'right' || align === 'justify') return align;
    }
  }
  return 'left';
}

function buildFontSizeOptions(currentLabel: string, isMixed: boolean): string[] {
  if (isMixed) return FONT_SIZES;
  if (FONT_SIZES.includes(currentLabel)) return FONT_SIZES;
  return [...FONT_SIZES, currentLabel].sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10),
  );
}

export default function EditorToolbar({
  editor,
  zoomLevel,
  onSetZoom,
  onOpenImageUpload,
  onOpenTableModal,
  onOpenLinkEditor,
  customPrompt: _customPrompt,
}: EditorToolbarProps) {
  const format = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) {
        return {
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isStrike: false,
          isCode: false,
          isLink: false,
          isBulletList: false,
          isOrderedList: false,
          isBlockquote: false,
          heading: 'p' as HeadingValue,
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          fontSizeMixed: false,
          textColor: '#000000',
          highlightColor: '#ffff00',
          hasHighlight: false,
          textAlign: 'left' as TextAlignValue,
          lineSpacing: '',
          paragraphSpacing: 'normal' as ParagraphSpacingValue,
          canIndent: false,
          canOutdent: false,
          canUndo: false,
          canRedo: false,
        };
      }

      const textStyle = ed.getAttributes('textStyle');
      const highlight = ed.getAttributes('highlight');
      const fontSizeDisplay = detectFontSizeDisplay(ed);
      const fontSizeMixed = fontSizeDisplay.kind === 'mixed';
      const fontSize =
        fontSizeDisplay.kind === 'mixed'
          ? '__mixed__'
          : fontSizeDisplay.sizeLabel;

      return {
        isBold: ed.isActive('bold'),
        isItalic: ed.isActive('italic'),
        isUnderline: ed.isActive('underline'),
        isStrike: ed.isActive('strike'),
        isCode: ed.isActive('code'),
        isLink: ed.isActive('link'),
        isBulletList: ed.isActive('bulletList'),
        isOrderedList: ed.isActive('orderedList'),
        isBlockquote: ed.isActive('blockquote'),
        heading: detectHeading(ed),
        fontFamily: resolveFontFamilyValue(textStyle.fontFamily as string | undefined),
        fontSize,
        fontSizeMixed,
        fontSizeLabel:
          fontSizeDisplay.kind === 'mixed' ? 'Mixed' : fontSizeDisplay.sizeLabel,
        textColor: normalizeHexColor(textStyle.color as string | undefined, '#000000'),
        highlightColor: normalizeHexColor(highlight.color as string | undefined, '#ffff00'),
        hasHighlight: ed.isActive('highlight'),
        textAlign: detectTextAlign(ed),
        lineSpacing: detectLineSpacing(ed),
        paragraphSpacing: detectParagraphSpacing(ed),
        canIndent: ed.can().indent(),
        canOutdent: ed.can().outdent(),
        canUndo: ed.can().undo(),
        canRedo: ed.can().redo(),
      };
    },
  });

  if (!editor) return null;

  const handleFontSizeChange = (delta: number) => {
    const base = getFontSizeStepBase(editor);
    const nextNum = Math.max(8, Math.min(96, base + delta));
    editor.chain().focus().setFontSize(`${nextNum}px`).run();
  };

  const fontSizeOptions = buildFontSizeOptions(
    format.fontSizeMixed ? '16px' : format.fontSize,
    format.fontSizeMixed,
  );

  return (
    <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-1 flex items-center gap-1 flex-wrap shrink-0 select-none text-xs">

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!format.canUndo}
        className="p-1 hover:bg-slate-200 disabled:opacity-40 text-slate-600 rounded"
        title="Undo (⌘Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!format.canRedo}
        className="p-1 hover:bg-slate-200 disabled:opacity-40 text-slate-600 rounded"
        title="Redo (⌘Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="p-1 hover:bg-slate-200 text-slate-600 rounded"
        title="Print (⌘P)"
      >
        <Printer className="w-4 h-4" />
      </button>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <select
        value={zoomLevel}
        onChange={(e) => onSetZoom(Number(e.target.value))}
        className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 outline-none cursor-pointer"
        title="Zoom Level"
      >
        <option value={50}>50%</option>
        <option value={75}>75%</option>
        <option value={100}>100%</option>
        <option value={125}>125%</option>
        <option value={150}>150%</option>
      </select>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <select
        value={format.heading}
        onChange={(e) => {
          const val = e.target.value as HeadingValue;
          if (val === 'p') editor.chain().focus().setParagraph().run();
          else if (val === 'h1') editor.chain().focus().setHeading({ level: 1 }).run();
          else if (val === 'h2') editor.chain().focus().setHeading({ level: 2 }).run();
          else if (val === 'h3') editor.chain().focus().setHeading({ level: 3 }).run();
          else if (val === 'h4') editor.chain().focus().setHeading({ level: 4 }).run();
        }}
        className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] font-semibold text-slate-700 outline-none cursor-pointer max-w-[110px]"
        title="Styles"
      >
        <option value="p">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
      </select>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <select
        value={format.fontFamily}
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] font-semibold text-slate-700 outline-none cursor-pointer max-w-[120px]"
        title="Font Family"
        style={{ fontFamily: format.fontFamily }}
      >
        {FONT_FAMILIES.map((font) => (
          <option key={font.name} value={font.val} style={{ fontFamily: font.val }}>
            {font.name}
          </option>
        ))}
      </select>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded px-1 py-0.5">
        <button
          type="button"
          onClick={() => handleFontSizeChange(-1)}
          className="p-0.5 hover:bg-slate-100 rounded text-slate-600"
          title="Decrease font size"
        >
          <Minus className="w-3 h-3" />
        </button>

        <select
          value={format.fontSize}
          onChange={(e) => {
            if (e.target.value !== '__mixed__') {
              editor.chain().focus().setFontSize(e.target.value).run();
            }
          }}
          className="bg-transparent text-[11px] font-bold text-slate-800 outline-none cursor-pointer px-1 text-center min-w-[2.75rem]"
          title="Font Size"
        >
          {format.fontSizeMixed && (
            <option value="__mixed__">Mixed</option>
          )}
          {fontSizeOptions.map((size) => (
            <option key={size} value={size}>
              {parseInt(size, 10)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => handleFontSizeChange(1)}
          className="p-0.5 hover:bg-slate-100 rounded text-slate-600"
          title="Increase font size"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded transition-colors ${format.isBold ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200 text-slate-650'}`}
        title="Bold (⌘B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded transition-colors ${format.isItalic ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200 text-slate-650'}`}
        title="Italic (⌘I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 rounded transition-colors ${format.isUnderline ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200 text-slate-650'}`}
        title="Underline (⌘U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1 rounded transition-colors ${format.isStrike ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200 text-slate-650'}`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1 rounded transition-colors ${format.isCode ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200 text-slate-650'}`}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </button>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <div className="flex items-center gap-1 px-1">
        <div className="flex items-center gap-0.5" title="Text Color">
          <span className="font-extrabold underline text-[11px]" style={{ color: format.textColor }}>A</span>
          <input
            type="color"
            value={format.textColor}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-4 h-4 rounded cursor-pointer border-none bg-transparent p-0"
            title="Text Color"
          />
          <div className="flex items-center gap-0.5 ml-0.5">
            {TEXT_COLOR_PRESETS.slice(0, 5).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => editor.chain().focus().setColor(color).run()}
                className="w-3 h-3 rounded-sm border border-slate-300 shrink-0"
                style={{ backgroundColor: color }}
                title={`Text color ${color}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-0.5" title="Highlight Color">
          <span
            className="px-1 rounded text-[10px] font-bold"
            style={{ backgroundColor: format.hasHighlight ? format.highlightColor : '#fef08a' }}
          >
            H
          </span>
          <input
            type="color"
            value={format.highlightColor}
            onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
            className="w-4 h-4 rounded cursor-pointer border-none bg-transparent p-0"
            title="Highlight Color"
          />
          <div className="flex items-center gap-0.5 ml-0.5">
            {HIGHLIGHT_PRESETS.slice(0, 5).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => editor.chain().focus().setHighlight({ color }).run()}
                className="w-3 h-3 rounded-sm border border-slate-300 shrink-0"
                style={{ backgroundColor: color }}
                title={`Highlight ${color}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <button
        type="button"
        onClick={onOpenLinkEditor}
        className={`p-1 rounded ${format.isLink ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-655'}`}
        title={format.isLink ? 'Edit Link (⌘K)' : 'Insert Link (⌘K)'}
      >
        <Link2 className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onOpenImageUpload}
        className="p-1 hover:bg-slate-200 text-slate-655 rounded"
        title="Upload & Insert Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onOpenTableModal}
        className="p-1 hover:bg-slate-200 text-slate-655 rounded"
        title="Insert Table"
      >
        <TableIcon className="w-4 h-4" />
      </button>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1 rounded ${format.textAlign === 'left' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-655'}`}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1 rounded ${format.textAlign === 'center' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-655'}`}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1 rounded ${format.textAlign === 'right' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-655'}`}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`p-1 rounded ${format.textAlign === 'justify' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-655'}`}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 rounded ${format.isBulletList ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-655'}`}
        title="Bulleted List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 rounded ${format.isOrderedList ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-655'}`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().indent().run()}
        disabled={!format.canIndent}
        className="p-1 hover:bg-slate-200 disabled:opacity-40 text-slate-655 rounded"
        title="Increase indent (Tab in lists)"
      >
        <IndentIncrease className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().outdent().run()}
        disabled={!format.canOutdent}
        className="p-1 hover:bg-slate-200 disabled:opacity-40 text-slate-655 rounded"
        title="Decrease indent (Shift+Tab in lists)"
      >
        <IndentDecrease className="w-4 h-4" />
      </button>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <select
        value={format.lineSpacing || ''}
        onChange={(e) => {
          const val = e.target.value as LineSpacingValue | '';
          if (!val) editor.chain().focus().unsetLineSpacing().run();
          else editor.chain().focus().setLineSpacing(val).run();
        }}
        className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 outline-none cursor-pointer max-w-[72px]"
        title="Line spacing"
      >
        <option value="">Default</option>
        {LINE_SPACING_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={format.paragraphSpacing}
        onChange={(e) => {
          editor.chain().focus().setParagraphSpacing(e.target.value as ParagraphSpacingValue).run();
        }}
        className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 outline-none cursor-pointer max-w-[84px]"
        title="Paragraph spacing"
      >
        {PARAGRAPH_SPACING_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1 rounded ${format.isBlockquote ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-655'}`}
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-1 hover:bg-slate-200 text-slate-655 rounded"
        title="Horizontal line"
      >
        <HorizontalRuleIcon className="w-4 h-4" />
      </button>

      <div className="h-4 w-[1px] bg-slate-200 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().clearFormatting().run()}
        className="p-1 hover:bg-slate-200 text-slate-655 rounded"
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>

    </div>
  );
}
