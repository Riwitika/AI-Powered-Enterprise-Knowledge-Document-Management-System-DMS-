import { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { ExternalLink, Link2, Trash2 } from 'lucide-react';
import { normalizeLinkUrl } from './linkUtils';

interface LinkPopoverProps {
  editor: Editor;
  onClose: () => void;
}

export default function LinkPopover({ editor, onClose }: LinkPopoverProps) {
  const existingHref = editor.getAttributes('link').href as string | undefined;
  const [url, setUrl] = useState(existingHref || 'https://');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUrl(existingHref || 'https://');
    setError(null);
  }, [existingHref]);

  const applyLink = () => {
    const normalized = normalizeLinkUrl(url);
    if (!normalized) {
      setError('Enter a valid http or https URL.');
      return;
    }

    const { empty } = editor.state.selection;
    if (empty && !editor.isActive('link')) {
      setError('Select text to link.');
      return;
    }

    const chain = editor.chain().focus();
    if (editor.isActive('link')) {
      chain.extendMarkRange('link');
    }
    chain.setLink({ href: normalized }).run();
    onClose();
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  };

  const openLink = () => {
    const href = normalizeLinkUrl(url);
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="tiptap-link-popover bg-white border border-slate-200 shadow-xl rounded-lg p-3 w-72">
      <div className="flex items-center gap-1.5 mb-2">
        <Link2 className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-bold text-slate-700">
          {editor.isActive('link') ? 'Edit Link' : 'Insert Link'}
        </span>
      </div>
      <input
        type="url"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            applyLink();
          }
          if (e.key === 'Escape') onClose();
        }}
        placeholder="https://example.com"
        className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-400"
        autoFocus
      />
      {error && <p className="text-[10px] text-red-600 mt-1">{error}</p>}
      <div className="flex items-center gap-1 mt-2">
        <button
          type="button"
          onClick={applyLink}
          className="px-2 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded hover:bg-blue-700"
        >
          Apply
        </button>
        {editor.isActive('link') && (
          <>
            <button
              type="button"
              onClick={openLink}
              className="px-2 py-1 border border-slate-200 text-[11px] rounded hover:bg-slate-50 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> Open
            </button>
            <button
              type="button"
              onClick={removeLink}
              className="px-2 py-1 border border-red-200 text-red-600 text-[11px] rounded hover:bg-red-50 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 ml-auto"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
